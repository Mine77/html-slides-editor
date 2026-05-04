import {
  type AttributeUpdateOperation,
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_WIDTH,
  type ElementInsertOperation,
  type ElementRemoveOperation,
  SELECTOR_ATTR,
  type SlideModel,
  type StyleUpdateOperation,
  createElementPlacement,
  createUniqueElementId,
  getSlideElementHtml,
  getSlideInlineStyleValue,
  updateSlideElementHtmlIds,
} from "@starry-slides/core";
import { useRef, useState } from "react";
import { EditorHeader } from "./components/editor-header";
import { SidebarToolPanel } from "./components/sidebar-tool-panel";
import { SlideSidebar } from "./components/slide-sidebar";
import { StageCanvas } from "./components/stage-canvas";
import { TooltipProvider } from "./components/ui/tooltip";
import { useBlockManipulation } from "./hooks/use-block-manipulation";
import { useEditorKeyboardShortcuts } from "./hooks/use-editor-keyboard-shortcuts";
import { useIframeTextEditing } from "./hooks/use-iframe-text-editing";
import { useSlideHistory } from "./hooks/use-slide-history";
import { useSlideInspector } from "./hooks/use-slide-inspector";
import { useSlideThumbnails } from "./hooks/use-slide-thumbnails";
import { useStageViewport } from "./hooks/use-stage-viewport";

export interface SlidesEditorProps {
  slides: SlideModel[];
  deckTitle?: string;
  sourceLabel: string;
  isSaving?: boolean;
  onSlidesChange?: (slides: SlideModel[]) => void;
}

function SlidesEditor({
  slides: loadedSlides,
  deckTitle,
  sourceLabel,
  isSaving = false,
  onSlidesChange,
}: SlidesEditorProps) {
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const {
    slides,
    activeSlide,
    activeSlideId,
    undoDepth,
    redoDepth,
    setActiveSlideId,
    commitOperation,
    runUndo,
    runRedo,
  } = useSlideHistory(loadedSlides, {
    onSlidesChange,
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageViewportRef = useRef<HTMLDivElement>(null);
  const selectionOverlayRef = useRef<HTMLDivElement>(null);
  const thumbnails = useSlideThumbnails(slides);
  const {
    selectedElementId,
    selectedElementIds,
    isEditingText,
    setSelectedElementId,
    setSelectedElementIds,
    beginTextEditing,
    clearSelection,
  } = useIframeTextEditing({
    activeSlide,
    iframeRef,
    onCommitOperation: commitOperation,
  });

  const selectedElement = activeSlide?.elements.find((element) => element.id === selectedElementId);
  const resolvedDeckTitle = deckTitle?.trim() || "Untitled deck";

  const slideWidth = activeSlide?.width || DEFAULT_SLIDE_WIDTH;
  const slideHeight = activeSlide?.height || DEFAULT_SLIDE_HEIGHT;
  const { scale, offsetX, offsetY } = useStageViewport({
    stageViewportRef,
    slideWidth,
    slideHeight,
  });
  const { selectedStageRect, selectionOverlay, selectionLabel, inspectedStyles } =
    useSlideInspector({
      iframeRef,
      activeSlide,
      selectedElement,
      selectedElementIds,
      scale,
      offsetX,
      offsetY,
      slideWidth,
      slideHeight,
    });
  const selectedInlineStyleValues: Record<string, string> =
    activeSlide && selectedElementId
      ? {
          transform: getInlineStyleValue(activeSlide, selectedElementId, "transform"),
          zIndex: getInlineStyleValue(activeSlide, selectedElementId, "z-index"),
        }
      : {};
  const {
    manipulationOverlay,
    isManipulating,
    suppressBackgroundClear,
    beginMove,
    beginResize,
    beginRotate,
  } = useBlockManipulation({
    activeSlide,
    selectedElement,
    selectedElementId,
    selectedElementIds,
    selectedStageRect,
    iframeRef,
    stageGeometry: {
      scale,
      offsetX,
      offsetY,
      slideWidth,
      slideHeight,
    },
    isEditingText,
    onCommitOperation: commitOperation,
  });
  const unifiedSelectionOverlay = manipulationOverlay?.selectionBounds ?? selectionOverlay;
  const unifiedSelectionLabel = manipulationOverlay
    ? selectedElement?.type || selectionLabel
    : selectionLabel;
  const isSelectionOverlayInteractive = Boolean(manipulationOverlay);

  function commitStyleChange(propertyName: string, nextValue: string) {
    if (!activeSlide) {
      return;
    }

    const targetElementId = selectedElementId ?? "slide-root";
    const previousValue = getInlineStyleValue(activeSlide, targetElementId, propertyName);
    const normalizedNextValue = nextValue.trim();

    if (previousValue === normalizedNextValue) {
      return;
    }

    const operation: StyleUpdateOperation = {
      type: "style.update",
      slideId: activeSlide.id,
      elementId: targetElementId,
      propertyName,
      previousValue,
      nextValue: normalizedNextValue,
      timestamp: Date.now(),
    };

    commitOperation(operation);
  }

  function commitAttributeChange(attributeName: string, nextValue: string) {
    if (!activeSlide) {
      return;
    }

    const targetElementId = selectedElementId ?? "slide-root";
    const previousValue = getHtmlAttributeValue(activeSlide, targetElementId, attributeName);
    const normalizedNextValue = nextValue.trim();

    if (previousValue === normalizedNextValue) {
      return;
    }

    const operation: AttributeUpdateOperation = {
      type: "attribute.update",
      slideId: activeSlide.id,
      elementId: targetElementId,
      attributeName,
      previousValue,
      nextValue: normalizedNextValue,
      timestamp: Date.now(),
    };

    commitOperation(operation);
  }

  function createRemoveOperation(elementId: string): ElementRemoveOperation | null {
    if (!activeSlide) {
      return null;
    }

    const html = getSlideElementHtml(activeSlide.htmlSource, elementId);
    const placement = createElementPlacement(activeSlide.htmlSource, elementId);

    if (!html || !placement) {
      return null;
    }

    return {
      type: "element.remove",
      slideId: activeSlide.id,
      elementId,
      ...placement,
      html,
      timestamp: Date.now(),
    };
  }

  function deleteSelectedElement() {
    if (!activeSlide || !selectedElementIds.length) {
      return;
    }

    const operations = selectedElementIds
      .map((elementId) => createRemoveOperation(elementId))
      .filter((operation): operation is ElementRemoveOperation => Boolean(operation));

    if (!operations.length) {
      return;
    }

    commitOperation(
      operations.length === 1
        ? operations[0]
        : {
            type: "operation.batch",
            slideId: activeSlide.id,
            operations,
            timestamp: Date.now(),
          }
    );
    setSelectedElementIds([]);
  }

  function duplicateSelectedElement() {
    if (!activeSlide || !selectedElementIds.length) {
      return;
    }

    let htmlSource = activeSlide.htmlSource;
    const nextElementIds: string[] = [];
    const operations = selectedElementIds
      .map((elementId) => {
        const html = getSlideElementHtml(htmlSource, elementId);
        const placement = createElementPlacement(htmlSource, elementId);
        if (!html || !placement) {
          return null;
        }

        const nextElementId = createUniqueElementId(htmlSource, `${elementId}-copy`);
        const copiedHtml = updateSlideElementHtmlIds(
          html,
          createIdMapForCopiedElement(html, elementId, nextElementId)
        );

        htmlSource = `${htmlSource}\n<!-- ${nextElementId} reserved -->`;
        nextElementIds.push(nextElementId);

        const operation: ElementInsertOperation = {
          type: "element.insert" as const,
          slideId: activeSlide.id,
          elementId: nextElementId,
          parentElementId: placement.parentElementId,
          previousSiblingElementId: elementId,
          nextSiblingElementId: placement.nextSiblingElementId,
          html: copiedHtml,
          timestamp: Date.now(),
        };
        return operation;
      })
      .filter((operation): operation is ElementInsertOperation => Boolean(operation));

    if (!operations.length) {
      return;
    }

    commitOperation(
      operations.length === 1
        ? operations[0]
        : {
            type: "operation.batch",
            slideId: activeSlide.id,
            operations,
            timestamp: Date.now(),
          }
    );
    setSelectedElementIds(nextElementIds);
  }

  useEditorKeyboardShortcuts({
    activeSlide,
    selectedElementIds,
    iframeRef,
    slideWidth,
    slideHeight,
    isEditingText,
    canUndo: undoDepth > 0,
    canRedo: redoDepth > 0,
    onCommitOperation: commitOperation,
    onSelectElementIds: setSelectedElementIds,
    onUndo: runUndo,
    onRedo: runRedo,
  });

  if (!activeSlide) {
    return <div className="grid min-h-screen place-items-center">No slides loaded.</div>;
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <EditorHeader
          deckTitle={resolvedDeckTitle}
          sourceLabel={sourceLabel}
          isSaving={isSaving}
          isInspectorOpen={isInspectorOpen}
          onToggleInspector={() => {
            setIsInspectorOpen((currentValue) => !currentValue);
          }}
        />

        <div className="flex min-h-0 flex-auto gap-3 overflow-hidden max-[1200px]:block">
          <SlideSidebar
            slides={slides}
            activeSlideId={activeSlide.id}
            slideCount={slides.length}
            thumbnails={thumbnails}
            onSelectSlide={(slideId) => {
              setActiveSlideId(slideId);
              setSelectedElementId(null);
            }}
          />

          <main className="flex min-h-0 min-w-0 flex-auto overflow-visible max-[1200px]:block">
            <StageCanvas
              slideWidth={slideWidth}
              slideHeight={slideHeight}
              offsetX={offsetX}
              offsetY={offsetY}
              scale={scale}
              selectionOverlay={unifiedSelectionOverlay}
              toolbarKey={
                selectedElementIds.length
                  ? `${activeSlide.id}:${selectedElementIds.join(",")}`
                  : null
              }
              inspectedStyles={inspectedStyles}
              inlineStyleValues={selectedInlineStyleValues}
              isSelectionOverlayInteractive={isSelectionOverlayInteractive}
              isEditingText={isEditingText}
              manipulationOverlay={manipulationOverlay}
              iframeRef={iframeRef}
              stageViewportRef={stageViewportRef}
              selectionOverlayRef={selectionOverlayRef}
              isManipulating={isManipulating}
              onSelectionOverlayMouseDown={(event) => {
                if (!selectedElementIds.length) {
                  return;
                }

                beginMove({
                  clientX: event.clientX,
                  clientY: event.clientY,
                  preventDefault: () => event.preventDefault(),
                  stopPropagation: () => event.stopPropagation(),
                });
              }}
              onResizeHandleMouseDown={(corner, event) => {
                if (selectedElementIds.length !== 1) {
                  return;
                }

                beginResize(corner, {
                  clientX: event.clientX,
                  clientY: event.clientY,
                  preventDefault: () => event.preventDefault(),
                  stopPropagation: () => event.stopPropagation(),
                });
              }}
              onRotateHandleMouseDown={(event) => {
                if (selectedElementIds.length !== 1) {
                  return;
                }

                beginRotate({
                  clientX: event.clientX,
                  clientY: event.clientY,
                  preventDefault: () => event.preventDefault(),
                  stopPropagation: () => event.stopPropagation(),
                });
              }}
              onSelectionOverlayDoubleClick={() => {
                if (
                  selectedElementIds.length === 1 &&
                  selectedElement?.type === "text" &&
                  selectedElementId
                ) {
                  beginTextEditing(selectedElementId);
                }
              }}
              onBackgroundClick={() => {
                if (!suppressBackgroundClear) {
                  clearSelection();
                }
              }}
              onStyleChange={commitStyleChange}
              onDeleteSelection={deleteSelectedElement}
            />
            <SidebarToolPanel
              inspectedStyles={inspectedStyles}
              isEditingText={isEditingText}
              isOpen={isInspectorOpen}
              canEditStyles={Boolean(activeSlide)}
              selectedElementType={selectedElement?.type ?? "block"}
              selectedElementLabel={selectedElementId ? unifiedSelectionLabel : "slide"}
              attributeValues={{
                name: getHtmlAttributeValue(
                  activeSlide,
                  selectedElementId ?? "slide-root",
                  "data-editor-name"
                ),
                locked: getHtmlAttributeValue(
                  activeSlide,
                  selectedElementId ?? "slide-root",
                  "data-editor-locked"
                ),
                altText: getHtmlAttributeValue(
                  activeSlide,
                  selectedElementId ?? "slide-root",
                  "alt"
                ),
                ariaLabel: getHtmlAttributeValue(
                  activeSlide,
                  selectedElementId ?? "slide-root",
                  "aria-label"
                ),
                clickAction: getHtmlAttributeValue(
                  activeSlide,
                  selectedElementId ?? "slide-root",
                  "data-click-action"
                ),
                linkUrl: getHtmlAttributeValue(
                  activeSlide,
                  selectedElementId ?? "slide-root",
                  "data-link-url"
                ),
                targetSlide: getHtmlAttributeValue(
                  activeSlide,
                  selectedElementId ?? "slide-root",
                  "data-target-slide"
                ),
              }}
              selectedElementId={selectedElementId}
              onStyleChange={commitStyleChange}
              onAttributeChange={commitAttributeChange}
              onDuplicateSelection={duplicateSelectedElement}
              onDeleteSelection={deleteSelectedElement}
            />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

function getInlineStyleValue(slide: SlideModel, elementId: string, propertyName: string) {
  return getSlideInlineStyleValue(slide, elementId, propertyName);
}

function getHtmlAttributeValue(slide: SlideModel, elementId: string, attributeName: string) {
  if (typeof DOMParser === "undefined") {
    return "";
  }

  const doc = new DOMParser().parseFromString(slide.htmlSource, "text/html");
  const node = doc.querySelector<HTMLElement>(`[${SELECTOR_ATTR}="${elementId}"]`);
  return node?.getAttribute(attributeName)?.trim() ?? "";
}

function createIdMapForCopiedElement(html: string, sourceElementId: string, nextElementId: string) {
  const idMap: Record<string, string> = {
    [sourceElementId]: nextElementId,
  };

  if (typeof DOMParser === "undefined") {
    return idMap;
  }

  const doc = new DOMParser().parseFromString(`<template>${html}</template>`, "text/html");
  const root = doc.querySelector("template")?.content.firstElementChild;
  if (!(root instanceof HTMLElement)) {
    return idMap;
  }

  for (const node of root.querySelectorAll<HTMLElement>(`[${SELECTOR_ATTR}]`)) {
    const currentId = node.getAttribute(SELECTOR_ATTR);
    if (currentId) {
      idMap[currentId] = `${nextElementId}-${currentId}`;
    }
  }

  return idMap;
}

export { SlidesEditor };
