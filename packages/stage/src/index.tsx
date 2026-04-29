import {
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_WIDTH,
  type SlideModel,
  type StageRect,
  elementRectToStageRect,
} from "@html-slides-editor/core";
import { useSlidesData } from "@html-slides-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

interface SelectionOverlay extends StageRect {
  elementId: string;
}

interface CssPropertyRow {
  name: string;
  value: string;
}

const INSPECTED_CSS_PROPERTIES = [
  "position",
  "display",
  "width",
  "height",
  "top",
  "right",
  "bottom",
  "left",
  "margin",
  "padding",
  "font-size",
  "font-weight",
  "line-height",
  "font-family",
  "letter-spacing",
  "text-transform",
  "color",
  "background",
  "background-color",
  "border",
  "border-radius",
  "box-shadow",
  "opacity",
  "transform",
  "text-align",
] as const;

function collectCssProperties(element: HTMLElement): CssPropertyRow[] {
  const styles = window.getComputedStyle(element);

  return INSPECTED_CSS_PROPERTIES.map((name) => ({
    name,
    value: styles.getPropertyValue(name).trim(),
  })).filter((row) => row.value.length > 0);
}

function SlidesEditorStage() {
  const { slides: loadedSlides, sourceLabel } = useSlidesData();
  const [slides, setSlides] = useState<SlideModel[]>(loadedSlides);
  const [activeSlideId, setActiveSlideId] = useState(loadedSlides[0]?.id ?? "");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectionOverlay, setSelectionOverlay] = useState<SelectionOverlay | null>(null);
  const [inspectedStyles, setInspectedStyles] = useState<CssPropertyRow[]>([]);
  const [inspectedLabel, setInspectedLabel] = useState("slide root");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageViewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setSlides(loadedSlides);
    setActiveSlideId(loadedSlides[0]?.id ?? "");
  }, [loadedSlides]);

  const activeSlide = useMemo(
    () => slides.find((slide) => slide.id === activeSlideId) ?? slides[0],
    [activeSlideId, slides]
  );

  const selectedElement = activeSlide?.elements.find((element) => element.id === selectedElementId);

  useEffect(() => {
    setSelectedElementId(activeSlide?.elements[0]?.id ?? null);
  }, [activeSlide?.elements]);

  useEffect(() => {
    const viewport = stageViewportRef.current;
    if (!viewport) {
      return;
    }

    const updateViewport = () => {
      const rect = viewport.getBoundingClientRect();
      setViewportSize({ width: rect.width, height: rect.height });
    };

    updateViewport();

    const observer = new ResizeObserver(() => {
      updateViewport();
    });
    observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!activeSlide) {
    return <div className="hse-empty">No slides loaded.</div>;
  }

  const slideWidth = activeSlide.width || DEFAULT_SLIDE_WIDTH;
  const slideHeight = activeSlide.height || DEFAULT_SLIDE_HEIGHT;
  const stageScale = Math.min(
    viewportSize.width > 0 ? viewportSize.width / slideWidth : 1,
    viewportSize.height > 0 ? viewportSize.height / slideHeight : 1
  );
  const safeScale = Number.isFinite(stageScale) && stageScale > 0 ? stageScale : 1;
  const scaledWidth = slideWidth * safeScale;
  const scaledHeight = slideHeight * safeScale;
  const offsetX = Math.max((viewportSize.width - scaledWidth) / 2, 0);
  const offsetY = Math.max((viewportSize.height - scaledHeight) / 2, 0);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    const doc = iframe.contentDocument;
    if (!doc) {
      return;
    }

    doc.open();
    doc.write(activeSlide.htmlSource);
    doc.close();

    doc.onclick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        setSelectedElementId(null);
        return;
      }

      const editableTarget = target.closest("[data-editable][data-editor-id]");
      if (!editableTarget) {
        setSelectedElementId(null);
      }
    };

    const nodes = Array.from(doc.querySelectorAll<HTMLElement>("[data-editable][data-editor-id]"));
    for (const node of nodes) {
      node.style.cursor = "pointer";
      node.onclick = (event) => {
        event.stopPropagation();
        const id = node.getAttribute("data-editor-id");
        if (id) {
          setSelectedElementId(id);
        }
      };
    }
  }, [activeSlide]);

  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) {
      setSelectionOverlay(null);
      setInspectedStyles([]);
      setInspectedLabel("slide root");
      return;
    }

    const rootNode = doc.querySelector<HTMLElement>(activeSlide.rootSelector);
    const inspectedNode = selectedElementId
      ? doc.querySelector<HTMLElement>(`[data-editor-id="${selectedElementId}"]`)
      : rootNode;

    if (!inspectedNode) {
      setSelectionOverlay(null);
      setInspectedStyles([]);
      setInspectedLabel("slide root");
      return;
    }

    setInspectedStyles(collectCssProperties(inspectedNode));
    setInspectedLabel(
      selectedElement
        ? `${selectedElement.type} · ${selectedElement.tagName}`
        : rootNode?.tagName.toLowerCase() || "slide root"
    );

    if (!selectedElementId || !rootNode) {
      setSelectionOverlay(null);
      return;
    }

    const elementRect = inspectedNode.getBoundingClientRect();
    const rootRect = rootNode.getBoundingClientRect();

    setSelectionOverlay({
      elementId: selectedElementId,
      ...elementRectToStageRect(elementRect, rootRect, {
        scale: safeScale,
        offsetX,
        offsetY,
        slideWidth,
        slideHeight,
      }),
    });
  }, [
    activeSlide,
    selectedElement,
    selectedElementId,
    safeScale,
    offsetX,
    offsetY,
    slideWidth,
    slideHeight,
  ]);

  return (
    <div className="hse-shell">
      <aside className="hse-sidebar">
        <div className="hse-slide-list">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              className={
                slide.id === activeSlide.id ? "hse-slide-card is-active" : "hse-slide-card"
              }
              onClick={() => setActiveSlideId(slide.id)}
              type="button"
              aria-label={`Slide ${index + 1}`}
            >
              <div className="hse-slide-thumb">
                <div
                  className="hse-slide-thumb-surface"
                  style={{
                    width: `${slide.width || DEFAULT_SLIDE_WIDTH}px`,
                    height: `${slide.height || DEFAULT_SLIDE_HEIGHT}px`,
                    transform: `scale(${160 / (slide.width || DEFAULT_SLIDE_WIDTH)})`,
                  }}
                >
                  <iframe
                    title={`Thumbnail ${index + 1}`}
                    className="hse-slide-thumb-iframe"
                    srcDoc={slide.htmlSource}
                    tabIndex={-1}
                  />
                </div>
                <span className="hse-slide-number">#{index + 1}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="hse-main">
        <section className="hse-stage-panel" ref={stageViewportRef}>
          <h1 className="hse-stage-title">{sourceLabel}</h1>
          <div
            className="hse-stage-frame"
            style={{
              width: `${slideWidth}px`,
              height: `${slideHeight}px`,
              left: `${offsetX}px`,
              top: `${offsetY}px`,
              transform: `scale(${safeScale})`,
            }}
          >
            <iframe ref={iframeRef} title={activeSlide.title} className="hse-slide-iframe" />
          </div>
          {selectionOverlay ? (
            <div
              className="hse-selection-overlay"
              style={{
                left: `${selectionOverlay.x}px`,
                top: `${selectionOverlay.y}px`,
                width: `${selectionOverlay.width}px`,
                height: `${selectionOverlay.height}px`,
              }}
            >
              <div className="hse-selection-label">{selectedElement?.type || "element"}</div>
            </div>
          ) : null}
        </section>

        <section className="hse-inspector-panel">
          <div className="hse-panel-header">
            <span className="hse-panel-kicker">Styles</span>
            <h2>{inspectedLabel}</h2>
          </div>

          <div className="hse-style-list">
            {inspectedStyles.map((property) => (
              <div className="hse-style-row" key={property.name}>
                <span className="hse-style-name">{property.name}</span>
                <code className="hse-style-value">{property.value}</code>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export { SlidesEditorStage };
