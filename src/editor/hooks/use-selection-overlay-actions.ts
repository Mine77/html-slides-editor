import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import { type EditableElement, SELECTOR_ATTR } from "../../core";
import type { ResizeHandleCorner } from "../lib/block-snap-types";
import { getScopedTextTargetAtPoint } from "../lib/editor-selection-structure";
import type { PointerStartLike } from "./block-manipulation-types";

interface OverlayPointerDown {
  clientX: number;
  clientY: number;
  additive: boolean;
  targetElementId: string | null;
}

interface UseSelectionOverlayActionsOptions {
  selectedElementId: string | null;
  selectedElementIds: string[];
  selectedElement: EditableElement | undefined;
  activeGroupScopeId: string | null;
  isSelectedElementLocked: boolean;
  suppressBackgroundClear: boolean;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  overlayPointerDownRef: RefObject<OverlayPointerDown | null>;
  onToolbarSuppressedChange: (suppressed: boolean) => void;
  onPointerPreselectionUpdate: (clientX: number, clientY: number) => string | null;
  onPointerSelectionRetarget: (clientX: number, clientY: number, additive: boolean) => void;
  onSelectionContextMenuOpen: (clientX: number, clientY: number) => void;
  onBeginMove: (event: PointerStartLike, targetElementId?: string) => void;
  onBeginResize: (corner: ResizeHandleCorner, event: PointerStartLike) => void;
  onBeginRotate: (event: PointerStartLike) => void;
  onBeginTextEditing: (elementId: string) => void;
  onBeginGroupEditingScope: (elementId: string) => void;
  onClearSelection: () => void;
}

function useSelectionOverlayActions({
  selectedElementId,
  selectedElementIds,
  selectedElement,
  activeGroupScopeId,
  isSelectedElementLocked,
  suppressBackgroundClear,
  iframeRef,
  overlayPointerDownRef,
  onToolbarSuppressedChange,
  onPointerPreselectionUpdate,
  onPointerSelectionRetarget,
  onSelectionContextMenuOpen,
  onBeginMove,
  onBeginResize,
  onBeginRotate,
  onBeginTextEditing,
  onBeginGroupEditingScope,
  onClearSelection,
}: UseSelectionOverlayActionsOptions) {
  return {
    onSelectionOverlayMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !selectedElementIds.length) {
        return;
      }

      if (isSelectedElementLocked) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      onToolbarSuppressedChange(true);
      const additive = event.shiftKey || event.metaKey || event.ctrlKey;
      const targetElementId = onPointerPreselectionUpdate(event.clientX, event.clientY);
      overlayPointerDownRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        additive,
        targetElementId,
      };

      if (targetElementId && targetElementId !== selectedElementId) {
        event.stopPropagation();
        return;
      }

      if (targetElementId && targetElementId === selectedElementId) {
        event.stopPropagation();
      }

      onBeginMove({
        clientX: event.clientX,
        clientY: event.clientY,
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation(),
      });
    },
    onSelectionOverlayMouseMove: (event: ReactMouseEvent<HTMLDivElement>) => {
      if (isSelectedElementLocked) {
        return;
      }

      const pointerDown = overlayPointerDownRef.current;
      onPointerPreselectionUpdate(event.clientX, event.clientY);
      if (!pointerDown || pointerDown.targetElementId === selectedElementId) {
        return;
      }

      const deltaX = event.clientX - pointerDown.clientX;
      const deltaY = event.clientY - pointerDown.clientY;
      if (Math.hypot(deltaX, deltaY) <= 4) {
        return;
      }

      overlayPointerDownRef.current = null;
      onPointerSelectionRetarget(pointerDown.clientX, pointerDown.clientY, pointerDown.additive);
      onBeginMove(
        {
          clientX: pointerDown.clientX,
          clientY: pointerDown.clientY,
          preventDefault: () => event.preventDefault(),
          stopPropagation: () => event.stopPropagation(),
        },
        pointerDown.targetElementId ?? undefined
      );
    },
    onSelectionOverlayContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onSelectionContextMenuOpen(event.clientX, event.clientY);
    },
    onSelectionOverlayMouseUp: (event: ReactMouseEvent<HTMLDivElement>) => {
      if (isSelectedElementLocked) {
        overlayPointerDownRef.current = null;
        onToolbarSuppressedChange(false);
        return;
      }

      const pointerDown = overlayPointerDownRef.current;
      overlayPointerDownRef.current = null;
      onToolbarSuppressedChange(false);
      if (!pointerDown) {
        return;
      }

      const deltaX = event.clientX - pointerDown.clientX;
      const deltaY = event.clientY - pointerDown.clientY;
      if (Math.hypot(deltaX, deltaY) > 4) {
        return;
      }

      onPointerSelectionRetarget(event.clientX, event.clientY, pointerDown.additive);
    },
    onResizeHandleMouseDown: (
      corner: ResizeHandleCorner,
      event: ReactMouseEvent<HTMLButtonElement>
    ) => {
      if (!selectedElementIds.length) {
        return;
      }

      onBeginResize(corner, {
        clientX: event.clientX,
        clientY: event.clientY,
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation(),
      });
    },
    onRotateHandleMouseDown: (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (selectedElementIds.length !== 1) {
        return;
      }

      onBeginRotate({
        clientX: event.clientX,
        clientY: event.clientY,
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation(),
      });
    },
    onSelectionOverlayDoubleClick: (event: ReactMouseEvent<HTMLDivElement>) => {
      if (activeGroupScopeId && iframeRef.current?.contentDocument) {
        const iframeRect = iframeRef.current.getBoundingClientRect();
        const doc = iframeRef.current.contentDocument;
        const iframeScaleX = iframeRect.width / iframeRef.current.clientWidth || 1;
        const iframeScaleY = iframeRect.height / iframeRef.current.clientHeight || 1;
        const scopedEditable = getScopedTextTargetAtPoint(doc, activeGroupScopeId, {
          x: (event.clientX - iframeRect.left) / iframeScaleX,
          y: (event.clientY - iframeRect.top) / iframeScaleY,
        });

        const scopedElementId = scopedEditable?.getAttribute(SELECTOR_ATTR);
        if (scopedElementId) {
          onBeginTextEditing(scopedElementId);
          return;
        }
      }

      if (
        selectedElementIds.length === 1 &&
        selectedElement?.type === "text" &&
        selectedElementId
      ) {
        onBeginTextEditing(selectedElementId);
        return;
      }

      if (
        selectedElementIds.length === 1 &&
        selectedElement?.type === "group" &&
        selectedElementId
      ) {
        onBeginGroupEditingScope(selectedElementId);
      }
    },
    onBackgroundClick: () => {
      if (!suppressBackgroundClear) {
        onClearSelection();
      }
    },
  };
}

export { useSelectionOverlayActions };
