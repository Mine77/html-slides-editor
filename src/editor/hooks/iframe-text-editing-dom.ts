import {
  SELECTOR_ATTR,
  getClosestEditableElement,
  isGroupEditableElement,
  isTextEditableElement,
  queryEditableElements,
} from "../../core";

const EDITING_TEXT_STYLE_ID = "hse-editing-text-style";
const EDITING_TEXT_STYLE = `
html:not([data-hse-allow-native-selection]),
html:not([data-hse-allow-native-selection]) body,
html:not([data-hse-allow-native-selection]) [data-editor-id] {
  user-select: none;
  -webkit-user-select: none;
}

[data-hse-editing="true"] {
  outline: none !important;
  box-shadow: none !important;
  overflow: visible;
  caret-color: currentColor;
  white-space: pre-wrap;
  user-select: text;
  -webkit-user-select: text;
}

[data-hse-editing="true"]:focus,
[data-hse-editing="true"]:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

body[data-hse-group-scope] [data-editor-id] {
  transition: opacity 120ms ease, filter 120ms ease;
}

body[data-hse-group-scope] [data-editor-id][data-hse-outside-group-scope="true"] {
  opacity: 0.28;
  filter: blur(1.5px);
}

body[data-hse-group-scope] [data-editor-id][data-hse-active-group-scope="true"] {
  outline: 1px solid rgba(15, 23, 42, 0.22);
  outline-offset: 4px;
}
`;

export function getEditableSelectionTarget(target: Element): HTMLElement | null {
  return getClosestEditableElement(target);
}

export function getDeepestEditableElementFromPoint(
  doc: Document,
  x: number,
  y: number,
  activeGroupScopeId: string | null
): HTMLElement | null {
  const pointedElement = doc.elementFromPoint(x, y);
  if (!pointedElement) {
    return null;
  }

  return getEditableSelectionTargetInScope(pointedElement, activeGroupScopeId);
}

export function getOutermostSelectedAncestorFromPoint(
  doc: Document,
  x: number,
  y: number,
  activeGroupScopeId: string | null,
  selectedElementIds: string[]
): HTMLElement | null {
  const pointedElement = doc.elementFromPoint(x, y);
  if (!pointedElement) {
    return null;
  }

  const editableTarget = getEditableSelectionTargetInScope(pointedElement, activeGroupScopeId);
  if (!editableTarget) {
    return null;
  }

  const selectedIdSet = new Set(selectedElementIds);
  let current: HTMLElement | null = editableTarget;
  let selectedAncestor: HTMLElement | null = null;

  while (current) {
    const currentId = current.getAttribute(SELECTOR_ATTR);
    if (
      current.matches(`[${SELECTOR_ATTR}]`) &&
      currentId &&
      selectedIdSet.has(currentId)
    ) {
      selectedAncestor = current;
    }
    current = current.parentElement;
  }

  return selectedAncestor;
}

export function applyGroupScopeFocus(doc: Document, activeGroupScopeId: string | null): void {
  const editableNodes = queryEditableElements(doc);
  for (const node of editableNodes) {
    node.removeAttribute("data-hse-active-group-scope");
    node.removeAttribute("data-hse-outside-group-scope");
  }

  if (!activeGroupScopeId) {
    doc.body.removeAttribute("data-hse-group-scope");
    return;
  }

  doc.body.setAttribute("data-hse-group-scope", activeGroupScopeId);
  const group = doc.querySelector<HTMLElement>(`[${SELECTOR_ATTR}="${activeGroupScopeId}"]`);
  if (!group || !isGroupEditableElement(group)) {
    doc.body.removeAttribute("data-hse-group-scope");
    return;
  }
  const activeGroup = group;
  activeGroup.setAttribute("data-hse-active-group-scope", "true");
  for (const node of editableNodes) {
    if (node !== activeGroup && !activeGroup.contains(node)) {
      node.setAttribute("data-hse-outside-group-scope", "true");
    }
  }
}

export function getEditableSelectionTargetInScope(
  target: Element,
  activeGroupScopeId: string | null
): HTMLElement | null {
  const editableTarget = getEditableSelectionTarget(target);
  if (!editableTarget) {
    return null;
  }

  if (!activeGroupScopeId) {
    let current: HTMLElement | null = editableTarget;
    let outermostGroup: HTMLElement | null = null;
    while (current) {
      if (current.matches(`[${SELECTOR_ATTR}]`) && isGroupEditableElement(current)) {
        outermostGroup = current;
      }
      current = current.parentElement;
    }

    if (outermostGroup) {
      return outermostGroup;
    }
    return editableTarget;
  }

  const activeGroup = editableTarget.closest<HTMLElement>(`[${SELECTOR_ATTR}="${activeGroupScopeId}"]`);

  return activeGroup && isGroupEditableElement(activeGroup) ? editableTarget : null;
}

export function getClosestTextEditableSelectionTargetInScope(
  target: Element,
  activeGroupScopeId: string | null
): HTMLElement | null {
  let current: HTMLElement | null =
    target.nodeType === target.ELEMENT_NODE ? (target as HTMLElement) : target.parentElement;

  while (current) {
    const editableTarget = getEditableSelectionTargetInScope(current, activeGroupScopeId);
    if (editableTarget && isTextEditableElement(editableTarget)) {
      return editableTarget;
    }
    current = current.parentElement;
  }

  return null;
}

export function ensureEditingTextStyle(doc: Document): void {
  if (doc.getElementById(EDITING_TEXT_STYLE_ID)) {
    return;
  }

  const style = doc.createElement("style");
  style.id = EDITING_TEXT_STYLE_ID;
  style.textContent = EDITING_TEXT_STYLE;
  doc.head.appendChild(style);
}

export function setNativeTextSelectionEnabled(doc: Document, enabled: boolean): void {
  doc.documentElement.toggleAttribute("data-hse-allow-native-selection", enabled);
}

export function selectEditableNodeEnd(editableNode: HTMLElement): void {
  const selection = editableNode.ownerDocument.getSelection();
  const range = editableNode.ownerDocument.createRange();
  range.selectNodeContents(editableNode);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function getEditableTextTargetFromPoint(
  doc: Document,
  point: { x: number; y: number },
  activeScopeId: string | null
): HTMLElement | null {
  const candidates = Array.from(
    doc.querySelectorAll<HTMLElement>(`[${SELECTOR_ATTR}]`)
  ).filter(
    (candidate) =>
      isTextEditableElement(candidate) &&
      getEditableSelectionTargetInScope(candidate, activeScopeId) === candidate
  );
  const directHit = candidates.find((candidate) => {
    const rect = candidate.getBoundingClientRect();
    return (
      point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
    );
  });

  if (directHit) {
    return directHit;
  }

  const nearest = candidates
    .map((candidate) => {
      const rect = candidate.getBoundingClientRect();
      const clampedX = Math.min(Math.max(point.x, rect.left), rect.right);
      const clampedY = Math.min(Math.max(point.y, rect.top), rect.bottom);
      return {
        candidate,
        distance: Math.hypot(point.x - clampedX, point.y - clampedY),
      };
    })
    .sort((left, right) => left.distance - right.distance)[0];

  return nearest && nearest.distance <= 24 ? nearest.candidate : null;
}
