import {
  DEFAULT_DECK_TITLE,
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_WIDTH,
  type DeckMetadata,
  type EditableElement,
  type EditableType,
  type ImportedDeckDocument,
  type PersistedSlideRecord,
  SELECTOR_ATTR,
  SLIDE_ROOT_ATTR,
  SLIDE_TAG,
  SLIDES_TAG,
  type SlideModel,
  createElementId,
  getSlideElementSelector,
  normalizeSlideId,
  parseBooleanAttribute,
  parseDimension,
} from "./slide-contract";
import { getEditableElementType, hasEditableSelector, isEditableElement } from "./editable-dom";
import { parseHtmlDocument, serializeHtmlDocument } from "./slide-html-document";

function cloneDocument(doc: Document): Document | null {
  return parseHtmlDocument(serializeHtmlDocument(doc));
}

function createDefaultDeckMetadata(): DeckMetadata {
  return {
    title: DEFAULT_DECK_TITLE,
    description: "",
    generatedAt: "",
    width: DEFAULT_SLIDE_WIDTH,
    height: DEFAULT_SLIDE_HEIGHT,
  };
}

function ensureSlidesRoot(doc: Document): HTMLElement | null {
  const root = doc.querySelector<HTMLElement>(SLIDES_TAG);
  if (!root) {
    return null;
  }

  if (!root.getAttribute("title")) {
    root.setAttribute("title", DEFAULT_DECK_TITLE);
  }
  if (!root.getAttribute("width")) {
    root.setAttribute("width", String(DEFAULT_SLIDE_WIDTH));
  }
  if (!root.getAttribute("height")) {
    root.setAttribute("height", String(DEFAULT_SLIDE_HEIGHT));
  }

  return root;
}

function classifyEditableType(node: HTMLElement): EditableType {
  return getEditableElementType(node) ?? "block";
}

function createUniqueNodeSelectorId(
  node: HTMLElement,
  index: number,
  usedIds: Set<string>
): string {
  const existingId = node.getAttribute(SELECTOR_ATTR)?.trim();
  if (existingId) {
    usedIds.add(existingId);
    return existingId;
  }

  const type = classifyEditableType(node);
  const normalizedType = type === "group" ? "block" : type;
  let candidateId = createElementId(index, normalizedType);
  if (!usedIds.has(candidateId)) {
    usedIds.add(candidateId);
    return candidateId;
  }

  let suffix = index + 2;
  while (usedIds.has(`${candidateId}-${suffix}`)) {
    suffix += 1;
  }

  candidateId = `${candidateId}-${suffix}`;
  usedIds.add(candidateId);
  return candidateId;
}

function isEditableNode(node: HTMLElement, slideRoot: HTMLElement): boolean {
  if (node === slideRoot) {
    return false;
  }

  return isEditableElement(node);
}

function ensureEditableSelectorsInSlideRoot(slideRoot: HTMLElement) {
  if (!slideRoot.getAttribute(SELECTOR_ATTR)) {
    slideRoot.setAttribute(SELECTOR_ATTR, "slide-root");
  }

  const usedIds = new Set<string>([slideRoot.getAttribute(SELECTOR_ATTR) || "slide-root"]);
  for (const node of Array.from(slideRoot.querySelectorAll<HTMLElement>(`[${SELECTOR_ATTR}]`))) {
    const existingId = node.getAttribute(SELECTOR_ATTR)?.trim();
    if (existingId) {
      usedIds.add(existingId);
    }
  }
  const editableNodes = Array.from(slideRoot.querySelectorAll<HTMLElement>("*")).filter((node) =>
    isEditableNode(node, slideRoot)
  );

  editableNodes.forEach((node, index) => {
    if (!node.getAttribute(SELECTOR_ATTR)) {
      node.setAttribute(SELECTOR_ATTR, createUniqueNodeSelectorId(node, index, usedIds));
      return;
    }

    createUniqueNodeSelectorId(node, index, usedIds);
  });
}

function findSlideCanvasRoot(slideElement: HTMLElement): HTMLElement {
  const authoredRoot =
    slideElement.querySelector<HTMLElement>(`[${SLIDE_ROOT_ATTR}]`) ??
    slideElement.querySelector<HTMLElement>(".slide-container");
  if (authoredRoot) {
    authoredRoot.setAttribute(SLIDE_ROOT_ATTR, "true");
    if (!authoredRoot.getAttribute("data-slide-width")) {
      authoredRoot.setAttribute(
        "data-slide-width",
        slideElement.getAttribute("width") ||
          slideElement.parentElement?.getAttribute("width") ||
          String(DEFAULT_SLIDE_WIDTH)
      );
    }
    if (!authoredRoot.getAttribute("data-slide-height")) {
      authoredRoot.setAttribute(
        "data-slide-height",
        slideElement.getAttribute("height") ||
          slideElement.parentElement?.getAttribute("height") ||
          String(DEFAULT_SLIDE_HEIGHT)
      );
    }
    return authoredRoot;
  }

  const wrapper = slideElement.ownerDocument.createElement("div");
  wrapper.className = "slide-container";
  wrapper.setAttribute(SLIDE_ROOT_ATTR, "true");
  wrapper.setAttribute(
    "data-slide-width",
    slideElement.getAttribute("width") ||
      slideElement.parentElement?.getAttribute("width") ||
      String(DEFAULT_SLIDE_WIDTH)
  );
  wrapper.setAttribute(
    "data-slide-height",
    slideElement.getAttribute("height") ||
      slideElement.parentElement?.getAttribute("height") ||
      String(DEFAULT_SLIDE_HEIGHT)
  );
  while (slideElement.firstChild) {
    wrapper.append(slideElement.firstChild);
  }
  slideElement.append(wrapper);
  return wrapper;
}

function createSlideDocumentHtml(
  slideElement: HTMLElement,
  deckMeta: DeckMetadata,
  slideWidth: number,
  slideHeight: number
): string {
  const localDoc = slideElement.ownerDocument.implementation.createHTMLDocument(
    slideElement.getAttribute("title") || deckMeta.title || DEFAULT_DECK_TITLE
  );
  const clonedHeadNodes = Array.from(slideElement.ownerDocument.head.childNodes).map((node) =>
    localDoc.importNode(node, true)
  );
  localDoc.head.replaceChildren(...clonedHeadNodes);

  const slideClone = slideElement.cloneNode(true);
  if (!(slideClone instanceof HTMLElement)) {
    return "<!DOCTYPE html><html><head></head><body></body></html>";
  }

  const slideRoot = findSlideCanvasRoot(slideClone);
  const slideHeadNodes = Array.from(slideClone.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      child !== slideRoot &&
      ["style", "link", "script", "meta", "title"].includes(child.tagName.toLowerCase())
  );
  slideRoot.setAttribute("data-slide-width", String(slideWidth));
  slideRoot.setAttribute("data-slide-height", String(slideHeight));
  ensureEditableSelectorsInSlideRoot(slideRoot);
  if (slideHeadNodes.length > 0) {
    localDoc.head.append(...slideHeadNodes.map((node) => localDoc.importNode(node, true)));
  }
  localDoc.body.replaceChildren(slideRoot);
  return serializeHtmlDocument(localDoc);
}

function collectEditableElements(doc: Document): EditableElement[] {
  const root = doc.querySelector<HTMLElement>(`[${SLIDE_ROOT_ATTR}]`);
  if (!root) {
    return [];
  }

  const editableNodes = Array.from(root.querySelectorAll<HTMLElement>(`[${SELECTOR_ATTR}]`)).filter(
    (node) => node !== root && isEditableElement(node)
  );

  return editableNodes.map((node, index) => {
    const type = classifyEditableType(node);
    const selectorValue = node.getAttribute(SELECTOR_ATTR) || createElementId(index, type);

    return {
      id: selectorValue,
      selector: getSlideElementSelector(selectorValue),
      type,
      content:
        node instanceof HTMLImageElement || node instanceof HTMLVideoElement
          ? node.getAttribute("src") || ""
          : node.textContent || "",
      tagName: node.tagName.toLowerCase(),
    };
  });
}

function readDeckMetadata(root: HTMLElement): DeckMetadata {
  return {
    title: root.getAttribute("title")?.trim() || DEFAULT_DECK_TITLE,
    description: root.getAttribute("description")?.trim() || "",
    generatedAt: root.getAttribute("generated-at")?.trim() || "",
    width: parseDimension(root.getAttribute("width"), DEFAULT_SLIDE_WIDTH),
    height: parseDimension(root.getAttribute("height"), DEFAULT_SLIDE_HEIGHT),
  };
}

function readSlideAttributes(slideElement: HTMLElement): PersistedSlideRecord {
  return {
    id: slideElement.getAttribute("id")?.trim() || "",
    title: slideElement.getAttribute("title")?.trim() || "",
    hidden: parseBooleanAttribute(slideElement.getAttribute("slide-hidden")),
    archetype: slideElement.getAttribute("archetype")?.trim() || "",
    notes: slideElement.getAttribute("notes")?.trim() || "",
    innerHtml: slideElement.innerHTML,
  };
}

function toSlideModel(
  slideRecord: PersistedSlideRecord,
  slideElement: HTMLElement,
  deckMeta: DeckMetadata
): SlideModel {
  const slideId = slideRecord.id || `slide-${Array.from(slideElement.parentElement?.children || []).indexOf(slideElement) + 1}`;
  const slideWidth = parseDimension(
    slideElement.getAttribute("width"),
    deckMeta.width || DEFAULT_SLIDE_WIDTH
  );
  const slideHeight = parseDimension(
    slideElement.getAttribute("height"),
    deckMeta.height || DEFAULT_SLIDE_HEIGHT
  );
  const htmlSource = createSlideDocumentHtml(slideElement, deckMeta, slideWidth, slideHeight);
  const slideDoc = parseHtmlDocument(htmlSource);
  const root = slideDoc?.querySelector<HTMLElement>(`[${SLIDE_ROOT_ATTR}]`) ?? null;
  const title =
    slideRecord.title ||
    slideDoc?.querySelector("h1, h2, title")?.textContent?.trim() ||
    `Slide ${slideId}`;

  return {
    id: normalizeSlideId(slideId),
    title,
    htmlSource,
    rootSelector: root?.getAttribute(SELECTOR_ATTR)
      ? `[${SELECTOR_ATTR}="${root.getAttribute(SELECTOR_ATTR)}"]`
      : `[${SLIDE_ROOT_ATTR}]`,
    width: slideWidth,
    height: slideHeight,
    elements: slideDoc ? collectEditableElements(slideDoc) : [],
    hidden: slideRecord.hidden,
    archetype: slideRecord.archetype || undefined,
    notes: slideRecord.notes || undefined,
  };
}

export function ensureEditableSelectors(html: string): string {
  const doc = parseHtmlDocument(html);
  if (!doc) {
    return html;
  }

  const slidesRoot = ensureSlidesRoot(doc);
  if (!slidesRoot) {
    return html;
  }

  for (const slideElement of Array.from(slidesRoot.children)) {
    if (!(slideElement instanceof HTMLElement) || slideElement.tagName.toLowerCase() !== SLIDE_TAG) {
      continue;
    }
    const slideRoot = findSlideCanvasRoot(slideElement);
    ensureEditableSelectorsInSlideRoot(slideRoot);
  }

  return serializeHtmlDocument(doc);
}

export function parseDeckDocument(
  html: string,
  options: { primaryFileName?: string } = {}
): ImportedDeckDocument | null {
  const normalizedHtml = ensureEditableSelectors(html);
  const doc = parseHtmlDocument(normalizedHtml);
  if (!doc) {
    return null;
  }

  const slidesRoot = ensureSlidesRoot(doc);
  if (!slidesRoot) {
    return null;
  }

  const metadata = readDeckMetadata(slidesRoot);
  const slides = Array.from(slidesRoot.children).flatMap((child) => {
    if (!(child instanceof HTMLElement) || child.tagName.toLowerCase() !== SLIDE_TAG) {
      return [];
    }

    return [toSlideModel(readSlideAttributes(child), child, metadata)];
  });

  return {
    metadata,
    htmlSource: normalizedHtml,
    slides,
    ...(options.primaryFileName ? { primaryFileName: options.primaryFileName } : {}),
  };
}

export function parseSlide(html: string, slideId = "slide-1"): SlideModel {
  const doc = parseHtmlDocument(html);
  if (!doc) {
    return {
      id: slideId,
      title: "Untitled Slide",
      htmlSource: html,
      rootSelector: `[${SLIDE_ROOT_ATTR}]`,
      width: DEFAULT_SLIDE_WIDTH,
      height: DEFAULT_SLIDE_HEIGHT,
      elements: [],
    };
  }

  const localDoc = cloneDocument(doc);
  const workingDoc = localDoc ?? doc;
  const root = workingDoc.querySelector<HTMLElement>(`[${SLIDE_ROOT_ATTR}]`);

  if (!root) {
    return {
      id: slideId,
      title: "Untitled Slide",
      htmlSource: html,
      rootSelector: `[${SLIDE_ROOT_ATTR}]`,
      width: DEFAULT_SLIDE_WIDTH,
      height: DEFAULT_SLIDE_HEIGHT,
      elements: [],
    };
  }

  if (!root.getAttribute("data-slide-width")) {
    root.setAttribute("data-slide-width", String(DEFAULT_SLIDE_WIDTH));
  }
  if (!root.getAttribute("data-slide-height")) {
    root.setAttribute("data-slide-height", String(DEFAULT_SLIDE_HEIGHT));
  }

  ensureEditableSelectorsInSlideRoot(root);
  const normalizedHtml = serializeHtmlDocument(workingDoc);
  const normalizedDoc = parseHtmlDocument(normalizedHtml) ?? workingDoc;
  const normalizedRoot = normalizedDoc.querySelector<HTMLElement>(`[${SLIDE_ROOT_ATTR}]`) ?? root;
  const firstHeading = normalizedDoc.querySelector("h1, h2, title");
  const title = firstHeading?.textContent?.trim() || `Slide ${slideId}`;

  return {
    id: normalizeSlideId(slideId),
    title,
    htmlSource: normalizedHtml,
    rootSelector: normalizedRoot.getAttribute(SELECTOR_ATTR)
      ? `[${SELECTOR_ATTR}="${normalizedRoot.getAttribute(SELECTOR_ATTR)}"]`
      : `[${SLIDE_ROOT_ATTR}]`,
    width: parseDimension(normalizedRoot.getAttribute("data-slide-width"), DEFAULT_SLIDE_WIDTH),
    height: parseDimension(normalizedRoot.getAttribute("data-slide-height"), DEFAULT_SLIDE_HEIGHT),
    elements: collectEditableElements(normalizedDoc),
  };
}

export function serializeDeckDocument({
  metadata,
  slides,
  originalHtmlSource,
}: {
  metadata: DeckMetadata;
  slides: SlideModel[];
  originalHtmlSource?: string;
}): string {
  const baseDoc =
    (originalHtmlSource ? parseHtmlDocument(originalHtmlSource) : null) ??
    parseHtmlDocument(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /></head><body><${SLIDES_TAG}></${SLIDES_TAG}></body></html>`
    );
  if (!baseDoc) {
    return originalHtmlSource || "";
  }

  let slidesRoot = ensureSlidesRoot(baseDoc);
  if (!slidesRoot) {
    slidesRoot = baseDoc.createElement(SLIDES_TAG);
    baseDoc.body.prepend(slidesRoot);
  }

  slidesRoot.setAttribute("title", metadata.title || DEFAULT_DECK_TITLE);
  if (metadata.description) {
    slidesRoot.setAttribute("description", metadata.description);
  } else {
    slidesRoot.removeAttribute("description");
  }
  if (metadata.generatedAt) {
    slidesRoot.setAttribute("generated-at", metadata.generatedAt);
  } else {
    slidesRoot.removeAttribute("generated-at");
  }
  slidesRoot.setAttribute("width", String(metadata.width || DEFAULT_SLIDE_WIDTH));
  slidesRoot.setAttribute("height", String(metadata.height || DEFAULT_SLIDE_HEIGHT));

  const nextSlides = slides.map((slide) => {
    const slideDoc = parseHtmlDocument(slide.htmlSource);
    const slideRoot = slideDoc?.querySelector<HTMLElement>(`[${SLIDE_ROOT_ATTR}]`);
    const slideHeadNodes =
      slideDoc?.head
        ? Array.from(slideDoc.head.children).filter((child) =>
            ["style", "link", "script", "meta", "title"].includes(child.tagName.toLowerCase())
          )
        : [];
    const slideElement = baseDoc.createElement(SLIDE_TAG);
    slideElement.setAttribute("id", slide.id);
    slideElement.setAttribute("title", slide.title);
    if (slide.hidden === true) {
      slideElement.setAttribute("slide-hidden", "true");
    }
    if (slide.archetype) {
      slideElement.setAttribute("archetype", slide.archetype);
    }
    if (slide.notes) {
      slideElement.setAttribute("notes", slide.notes);
    }
    if (slide.width && slide.width !== metadata.width) {
      slideElement.setAttribute("width", String(slide.width));
    }
    if (slide.height && slide.height !== metadata.height) {
      slideElement.setAttribute("height", String(slide.height));
    }

    if (slideHeadNodes.length > 0) {
      slideElement.append(...slideHeadNodes.map((node) => baseDoc.importNode(node, true)));
    }

    if (slideRoot) {
      slideElement.append(baseDoc.importNode(slideRoot, true));
    } else if (slideDoc?.body) {
      slideElement.innerHTML = slideDoc.body.innerHTML;
    } else {
      slideElement.innerHTML = slide.htmlSource;
    }

    return slideElement;
  });

  slidesRoot.replaceChildren(...nextSlides);
  return serializeHtmlDocument(baseDoc);
}

export function querySlideElement<T extends Element = HTMLElement>(
  doc: ParentNode,
  elementId: string
): T | null {
  return doc.querySelector<T>(getSlideElementSelector(elementId));
}

export function getSlideInlineStyleValue(
  slide: SlideModel,
  elementId: string,
  propertyName: string
): string {
  const doc = parseHtmlDocument(slide.htmlSource);
  if (!doc) {
    return "";
  }

  const node = querySlideElement<HTMLElement>(doc, elementId);
  return node?.style.getPropertyValue(propertyName).trim() || "";
}
