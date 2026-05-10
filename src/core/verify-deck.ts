import fs from "node:fs";
import path from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";
import { parseDeckDocument } from "./slide-document";
import { SELECTOR_ATTR, SLIDE_ROOT_ATTR } from "./slide-contract";

export type VerifyMode = "static" | "complete";
export type VerifyCheck = "structure" | "static-overflow" | "rendered-overflow";

export interface VerifyIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  slideId?: string;
  selector?: string;
  details?: Record<string, unknown>;
}

export interface VerifySummary {
  errorCount: number;
  warningCount: number;
}

export interface VerifyResult {
  ok: boolean;
  deck: string;
  mode: VerifyMode;
  checks: VerifyCheck[];
  issues: VerifyIssue[];
  summary: VerifySummary;
}

export interface VerifyDeckSourceResult {
  deck: string;
  deckFilePath: string;
  slides: VerifyDeckSlideSource[];
  issues: VerifyIssue[];
}

export interface VerifyDeckSlideSource {
  index: number;
  id: string;
  title?: string;
  hidden?: boolean;
  htmlSource: string;
}

export function createVerifyIssue(
  severity: VerifyIssue["severity"],
  code: string,
  message: string,
  details?: VerifyIssue["details"]
): VerifyIssue {
  const slideId = typeof details?.slideId === "string" ? details.slideId : undefined;
  const selector = typeof details?.selector === "string" ? details.selector : undefined;

  return {
    severity,
    code,
    message,
    ...(slideId ? { slideId } : {}),
    ...(selector ? { selector } : {}),
    ...(details ? { details } : {}),
  };
}

function issue(
  severity: VerifyIssue["severity"],
  code: string,
  message: string,
  details?: VerifyIssue["details"]
): VerifyIssue {
  return createVerifyIssue(severity, code, message, details);
}

function parseDeckDocumentWithNodeFallback(
  html: string,
  options: { primaryFileName?: string } = {}
): ReturnType<typeof parseDeckDocument> {
  if (typeof DOMParser !== "undefined") {
    return parseDeckDocument(html, options);
  }

  const globalScope = globalThis as unknown as Record<string, unknown>;
  const window = new JSDOM("").window;
  const originalGlobals = {
    DOMParser: globalScope.DOMParser,
    HTMLElement: globalScope.HTMLElement,
    HTMLImageElement: globalScope.HTMLImageElement,
    HTMLVideoElement: globalScope.HTMLVideoElement,
  };

  try {
    globalScope.DOMParser = window.DOMParser;
    globalScope.HTMLElement = window.HTMLElement;
    globalScope.HTMLImageElement = window.HTMLImageElement;
    globalScope.HTMLVideoElement = window.HTMLVideoElement;
    return parseDeckDocument(html, options);
  } finally {
    globalScope.DOMParser = originalGlobals.DOMParser;
    globalScope.HTMLElement = originalGlobals.HTMLElement;
    globalScope.HTMLImageElement = originalGlobals.HTMLImageElement;
    globalScope.HTMLVideoElement = originalGlobals.HTMLVideoElement;
  }
}

function validateSlideHtml(_filePath: string, slideId: string, html: string): VerifyIssue[] {
  const dom = new JSDOM(html, { virtualConsole: new VirtualConsole() });
  const { document } = dom.window;
  const issues: VerifyIssue[] = [];

  const roots = Array.from(document.querySelectorAll<HTMLElement>(`[${SLIDE_ROOT_ATTR}]`));
  if (roots.length === 0) {
    issues.push(
      issue("error", "structure.missing-root", "missing required slide root", {
        slideId,
      })
    );
  }
  if (roots.length > 1) {
    issues.push(
      issue("error", "structure.multiple-roots", "found multiple slide roots", {
        slideId,
      })
    );
  }

  const root = roots[0] ?? null;
  if (root) {
    if (!root.getAttribute("data-slide-width")) {
      issues.push(
        issue(
          "warning",
          "structure.missing-width",
          "missing data-slide-width, default 1920 will be assumed",
          { slideId }
        )
      );
    }
    if (!root.getAttribute("data-slide-height")) {
      issues.push(
        issue(
          "warning",
          "structure.missing-height",
          "missing data-slide-height, default 1080 will be assumed",
          { slideId }
        )
      );
    }
  }

  const editableNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-editable]"));
  if (editableNodes.length === 0) {
    issues.push(
      issue("warning", "structure.empty-slide", "slide contains no editable nodes", {
        slideId,
      })
    );
  }

  for (const node of editableNodes) {
    const editableType = node.getAttribute("data-editable") ?? "";
    if (!["text", "image", "block"].includes(editableType)) {
      issues.push(
        issue(
          "error",
          "structure.invalid-editable",
          `invalid data-editable value "${editableType}" on <${node.tagName.toLowerCase()}>`,
          {
            slideId,
            selector: node.getAttribute(SELECTOR_ATTR) ?? undefined,
          }
        )
      );
    }

    if (node.getAttribute("data-group") === "true" && editableType !== "block") {
      issues.push(
        issue(
          "error",
          "structure.invalid-group",
          'data-group="true" is only allowed on block editables',
          {
            slideId,
            selector: node.getAttribute(SELECTOR_ATTR) ?? undefined,
          }
        )
      );
    }
  }

  return issues;
}

function allowsOverflow(node: HTMLElement): boolean {
  return Boolean(node.closest('[data-allow-overflow="true"]'));
}

function validateStaticOverflow(_filePath: string, slideId: string, html: string): VerifyIssue[] {
  const dom = new JSDOM(html, { virtualConsole: new VirtualConsole() });
  const { document } = dom.window;
  const issues: VerifyIssue[] = [];
  const candidates = [
    document.querySelector<HTMLElement>(`[${SLIDE_ROOT_ATTR}]`),
    ...Array.from(document.querySelectorAll<HTMLElement>("[data-editable]")),
  ].filter((node): node is HTMLElement => Boolean(node));

  for (const node of candidates) {
    if (allowsOverflow(node)) {
      continue;
    }

    const overflow = node.style.overflow.trim().toLowerCase();
    const overflowX = node.style.overflowX.trim().toLowerCase();
    const overflowY = node.style.overflowY.trim().toLowerCase();
    const hasExplicitOverflow =
      ["auto", "scroll"].includes(overflow) ||
      ["auto", "scroll"].includes(overflowX) ||
      ["auto", "scroll"].includes(overflowY);

    if (!hasExplicitOverflow) {
      continue;
    }

    issues.push(
      issue("error", "overflow.static", "explicit scrolling overflow is not allowed", {
        slideId,
        selector: node.getAttribute(SELECTOR_ATTR) ?? undefined,
      })
    );
  }

  return issues;
}

export function loadVerifyDeckSource(deckPath: string): VerifyDeckSourceResult {
  const resolvedPath = path.resolve(process.cwd(), deckPath);
  const deckStat = fs.existsSync(resolvedPath) ? fs.statSync(resolvedPath) : null;
  const deck =
    deckStat?.isFile() && resolvedPath.endsWith(".html")
      ? path.dirname(resolvedPath)
      : resolvedPath;
  const deckFilePath =
    deckStat?.isFile() && resolvedPath.endsWith(".html")
      ? resolvedPath
      : path.join(deck, "deck.html");
  const issues: VerifyIssue[] = [];

  if (!deckStat && !fs.existsSync(deck)) {
    return {
      deck,
      deckFilePath,
      slides: [],
      issues: [issue("error", "structure.missing-deck", "deck path does not exist")],
    };
  }

  if (!fs.existsSync(deckFilePath)) {
    return {
      deck,
      deckFilePath,
      slides: [],
      issues: [issue("error", "structure.missing-deck", "deck.html does not exist")],
    };
  }

  const html = fs.readFileSync(deckFilePath, "utf8");
  const parsedDeck = parseDeckDocumentWithNodeFallback(html, {
    primaryFileName: path.basename(deckFilePath),
  });
  if (!parsedDeck) {
    return {
      deck,
      deckFilePath,
      slides: [],
      issues: [
        issue(
          "error",
          "structure.invalid-deck",
          "deck.html must contain a valid <slides>/<slide> document"
        ),
      ],
    };
  }

  const slides = parsedDeck.slides.map((slide, index) => ({
    index,
    id: slide.id,
    title: slide.title,
    hidden: slide.hidden === true,
    htmlSource: slide.htmlSource,
  }));

  if (slides.length === 0) {
    issues.push(
      issue("error", "structure.empty-deck", "deck.html must include at least one <slide>")
    );
  }

  for (const slide of slides) {
    issues.push(...validateSlideHtml(deckFilePath, slide.id, slide.htmlSource));
    issues.push(...validateStaticOverflow(deckFilePath, slide.id, slide.htmlSource));
  }

  return {
    deck,
    deckFilePath,
    slides,
    issues,
  };
}

export function createVerifyResult({
  deck,
  mode,
  checks,
  issues,
}: {
  deck: string;
  mode: VerifyMode;
  checks: VerifyCheck[];
  issues: VerifyIssue[];
}): VerifyResult {
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;

  return {
    ok: errorCount === 0,
    deck,
    mode,
    checks,
    issues,
    summary: {
      errorCount,
      warningCount,
    },
  };
}

export function verifyDeck(
  deckPath: string,
  options: { mode?: VerifyMode; renderedIssues?: VerifyIssue[] } = {}
): VerifyResult {
  const source = loadVerifyDeckSource(deckPath);
  const mode = options.mode ?? "static";
  const renderedIssues = mode === "complete" ? (options.renderedIssues ?? []) : [];
  const issues = [...source.issues, ...renderedIssues];
  return createVerifyResult({
    deck: source.deck,
    mode,
    checks:
      mode === "complete"
        ? ["structure", "static-overflow", "rendered-overflow"]
        : ["structure", "static-overflow"],
    issues,
  });
}
