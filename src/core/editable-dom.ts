import {
  type EditableType,
  SELECTOR_ATTR,
  SLIDE_ROOT_ATTR,
} from "./slide-contract";

const TEXT_EDITABLE_TAGS = [
  "a",
  "b",
  "blockquote",
  "caption",
  "cite",
  "code",
  "dd",
  "dt",
  "em",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "i",
  "label",
  "li",
  "mark",
  "p",
  "pre",
  "small",
  "span",
  "strong",
  "td",
  "th",
  "time",
] as const;

const BLOCK_EDITABLE_TAGS = [
  "article",
  "aside",
  "button",
  "details",
  "dialog",
  "div",
  "dl",
  "figure",
  "footer",
  "form",
  "header",
  "main",
  "nav",
  "ol",
  "section",
  "summary",
  "table",
  "tbody",
  "tfoot",
  "thead",
  "tr",
  "ul",
] as const;

const IMAGE_EDITABLE_TAGS = ["canvas", "img", "svg", "video"] as const;

const TEXT_EDITABLE_TAG_SET = new Set<string>(TEXT_EDITABLE_TAGS);
const BLOCK_EDITABLE_TAG_SET = new Set<string>(BLOCK_EDITABLE_TAGS);
const IMAGE_EDITABLE_TAG_SET = new Set<string>(IMAGE_EDITABLE_TAGS);

export const SUPPORTED_TEXT_EDITABLE_TAGS = [...TEXT_EDITABLE_TAGS];
export const SUPPORTED_BLOCK_EDITABLE_TAGS = [...BLOCK_EDITABLE_TAGS];
export const SUPPORTED_IMAGE_EDITABLE_TAGS = [...IMAGE_EDITABLE_TAGS];
export const SUPPORTED_EDITABLE_TAGS = [
  ...SUPPORTED_TEXT_EDITABLE_TAGS,
  ...SUPPORTED_BLOCK_EDITABLE_TAGS,
  ...SUPPORTED_IMAGE_EDITABLE_TAGS,
];
const SUPPORTED_EDITABLE_TAG_SET = new Set<string>(SUPPORTED_EDITABLE_TAGS);

function getNormalizedTagName(node: Element): string {
  return node.tagName.toLowerCase();
}

function isHtmlElementLike(node: Element | null): node is HTMLElement {
  return Boolean(
    node &&
      node.nodeType === 1 &&
      typeof node.tagName === "string" &&
      typeof node.getAttribute === "function" &&
      typeof node.hasAttribute === "function"
  );
}

export function getEditableElementType(node: Element | null): EditableType | null {
  if (!isHtmlElementLike(node)) {
    return null;
  }

  const tagName = getNormalizedTagName(node);
  if (node.getAttribute("data-group") === "true") {
    return BLOCK_EDITABLE_TAG_SET.has(tagName) ? "group" : null;
  }

  if (IMAGE_EDITABLE_TAG_SET.has(tagName)) {
    return "image";
  }
  if (TEXT_EDITABLE_TAG_SET.has(tagName)) {
    return "text";
  }
  if (BLOCK_EDITABLE_TAG_SET.has(tagName)) {
    return "block";
  }

  return null;
}

export function isEditableElement(node: Element | null): boolean {
  return getEditableElementType(node) !== null;
}

export function isBlockEditableElement(node: Element | null): boolean {
  const type = getEditableElementType(node);
  return type === "block" || type === "group";
}

export function isTextEditableElement(node: Element | null): boolean {
  return getEditableElementType(node) === "text";
}

export function isImageEditableElement(node: Element | null): boolean {
  return getEditableElementType(node) === "image";
}

export function isGroupEditableElement(node: Element | null): boolean {
  return getEditableElementType(node) === "group";
}

export function hasEditableSelector(node: Element | null): node is HTMLElement {
  return Boolean(
    isHtmlElementLike(node) &&
      node.hasAttribute(SELECTOR_ATTR) &&
      !node.hasAttribute(SLIDE_ROOT_ATTR) &&
      isEditableElement(node)
  );
}

export function getClosestEditableElement(target: Element | null): HTMLElement | null {
  let current: Element | null = target;
  while (current) {
    if (hasEditableSelector(current)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

export function queryEditableElements(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(`[${SELECTOR_ATTR}]`)).filter(
    hasEditableSelector
  );
}

export function isSupportedEditableTagName(tagName: string): boolean {
  return SUPPORTED_EDITABLE_TAG_SET.has(tagName.toLowerCase());
}
