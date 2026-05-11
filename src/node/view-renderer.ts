import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  type VerifyDeckSlideSource,
  type VerifyIssue,
  createVerifyIssue,
  loadVerifyDeckSource,
} from "../core/verify-deck";
import { isEditableElement } from "../core";

type PlaywrightPage = import("@playwright/test").Page;
type ChromiumLauncher = typeof import("@playwright/test").chromium;

export interface RenderedSlide {
  index: number;
  id: string;
  title?: string;
  hidden?: boolean;
  filePath?: string;
}

export interface PreviewRender {
  index: number;
  slideId: string;
  title?: string;
  file: string;
  path: string;
  width: number;
  height: number;
  scale: 1;
}

export interface PreviewManifest {
  deck: string;
  mode: "single" | "all";
  outputDir: string;
  slides: PreviewRender[];
}

interface OverflowMeasurement {
  code: string;
  selector?: string;
  message: string;
  details: Record<string, unknown>;
}

export function getDeckSlides(deckPath: string): RenderedSlide[] {
  const source = loadVerifyDeckSource(deckPath);
  return source.slides.map((slide) => ({
    index: slide.index,
    id: slide.id,
    ...(slide.title ? { title: slide.title } : {}),
    ...(slide.hidden ? { hidden: slide.hidden } : {}),
  }));
}

export async function verifyRenderedOverflow(deckPath: string): Promise<VerifyIssue[]> {
  const source = loadVerifyDeckSource(deckPath);
  const slides = source.slides;
  if (slides.length === 0) {
    return [];
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "starry-slides-render-"));
  const chromium = await loadChromium();
  const browser = await chromium.launch({ headless: true });
  try {
    const issues: VerifyIssue[] = [];
    const page = await browser.newPage();

    for (const slide of slides) {
      await loadSlide(page, materializeRenderableSlide(slide, source.deck, tempDir));
      const measurements = await measureOverflow(page);
      for (const measurement of measurements) {
        issues.push(
          createVerifyIssue("error", measurement.code, measurement.message, {
            slideId: slide.id,
            selector: measurement.selector,
            ...measurement.details,
          })
        );
      }
    }

    return issues;
  } finally {
    await browser.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

export async function renderPreviewManifest({
  deckPath,
  slideId,
  outDir,
}: {
  deckPath: string;
  slideId?: string;
  outDir?: string;
}): Promise<PreviewManifest> {
  const deck = path.resolve(process.cwd(), deckPath);
  const source = loadVerifyDeckSource(deck);
  const slides = source.slides;
  const selectedSlides = slideId ? slides.filter((slide) => slide.id === slideId) : slides;

  if (slideId && selectedSlides.length === 0) {
    throw new Error(`--slide must match a slide id exactly: ${slideId}`);
  }

  const outputDir = outDir
    ? path.resolve(process.cwd(), outDir)
    : path.join(source.deck, ".starry-slides", "view");
  clearPreviewOutput(outputDir);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "starry-slides-view-"));
  const chromium = await loadChromium();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const renders: PreviewRender[] = [];

    for (const slide of selectedSlides) {
      const { width, height } = await loadSlide(
        page,
        materializeRenderableSlide(slide, source.deck, tempDir)
      );
      const file = `${previewFileStem(slide.id)}.png`;
      const imagePath = path.join(outputDir, file);
      await page.screenshot({
        path: imagePath,
        clip: { x: 0, y: 0, width, height },
      });
      renders.push({
        index: slide.index,
        slideId: slide.id,
        ...(slide.title ? { title: slide.title } : {}),
        file,
        path: imagePath,
        width,
        height,
        scale: 1,
      });
    }

    return {
      deck,
      mode: slideId ? "single" : "all",
      outputDir,
      slides: renders,
    };
  } finally {
    await browser.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function loadSlide(
  page: PlaywrightPage,
  filePath: string
): Promise<{ width: number; height: number }> {
  await page.goto(pathToFileURL(filePath).href, { waitUntil: "load" });
  const root = page.locator('[data-slide-root="true"]');
  const size = {
    width: Number((await root.getAttribute("data-slide-width")) || 1920),
    height: Number((await root.getAttribute("data-slide-height")) || 1080),
  };
  await page.setViewportSize(size);
  await page.evaluate("document.fonts ? document.fonts.ready : Promise.resolve()");
  return size;
}

export function materializeRenderableSlide(
  slide: VerifyDeckSlideSource,
  deckDir: string,
  tempDir: string
): string {
  const filePath = path.join(
    tempDir,
    `${String(slide.index + 1).padStart(2, "0")}-${previewFileStem(slide.id)}.html`
  );
  fs.writeFileSync(filePath, injectBaseHref(slide.htmlSource, deckDir), "utf8");
  return filePath;
}

function injectBaseHref(html: string, deckDir: string): string {
  if (/<base\b/i.test(html)) {
    return html;
  }

  const deckHref = pathToFileURL(deckDir.endsWith(path.sep) ? deckDir : `${deckDir}${path.sep}`).href;
  return html.replace(/<head([^>]*)>/i, `<head$1><base href="${deckHref}">`);
}

async function measureOverflow(page: PlaywrightPage): Promise<OverflowMeasurement[]> {
  return page.evaluate<OverflowMeasurement[]>(`(() => {
    const root = document.querySelector('[data-slide-root="true"]');
    if (!root) {
      return [];
    }

    const roundRect = (rect) => ({
      left: Math.round(rect.left * 100) / 100,
      top: Math.round(rect.top * 100) / 100,
      right: Math.round(rect.right * 100) / 100,
      bottom: Math.round(rect.bottom * 100) / 100,
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100,
    });
    const selectorFor = (node) =>
      node.getAttribute("data-editor-id")
        ? '[data-editor-id="' + node.getAttribute("data-editor-id") + '"]'
        : node.tagName.toLowerCase();
    const hasAllowedOverflow = (node) =>
      Boolean(node.closest('[data-allow-overflow="true"]'));
    const rootRect = root.getBoundingClientRect();
    const measurements = [];
    const tolerance = 1;

    if (!hasAllowedOverflow(root)) {
      const rootOverflowX = root.scrollWidth - root.clientWidth;
      const rootOverflowY = root.scrollHeight - root.clientHeight;
      if (rootOverflowX > tolerance || rootOverflowY > tolerance) {
        measurements.push({
          code: "overflow.slide",
          selector: selectorFor(root),
          message: "slide root has rendered overflow",
          details: {
            rootScrollWidth: root.scrollWidth,
            rootClientWidth: root.clientWidth,
            rootScrollHeight: root.scrollHeight,
            rootClientHeight: root.clientHeight,
          },
        });
      }
    }

    const body = document.body;
    if (body && !hasAllowedOverflow(body) && !hasAllowedOverflow(root)) {
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;
      const bodyOverflowX = Math.max(
        document.documentElement.scrollWidth,
        body.scrollWidth
      ) - viewportWidth;
      const bodyOverflowY = Math.max(
        document.documentElement.scrollHeight,
        body.scrollHeight
      ) - viewportHeight;

      if (bodyOverflowX > tolerance || bodyOverflowY > tolerance) {
        measurements.push({
          code: "overflow.slide",
          selector: "body",
          message: "document body has rendered overflow",
          details: {
            bodyScrollWidth: body.scrollWidth,
            bodyScrollHeight: body.scrollHeight,
            documentScrollWidth: document.documentElement.scrollWidth,
            documentScrollHeight: document.documentElement.scrollHeight,
            viewportWidth,
            viewportHeight,
          },
        });
      }
    }

    for (const node of Array.from(document.querySelectorAll("[data-editor-id]")).filter(
      isEditableElement
    )) {
      if (hasAllowedOverflow(node)) {
        continue;
      }

      const rect = node.getBoundingClientRect();
      if (
        rect.left < rootRect.left - tolerance ||
        rect.top < rootRect.top - tolerance ||
        rect.right > rootRect.right + tolerance ||
        rect.bottom > rootRect.bottom + tolerance
      ) {
        measurements.push({
          code: "overflow.element-bounds",
          selector: selectorFor(node),
          message: "editable element renders outside slide bounds",
          details: {
            elementRect: roundRect(rect),
            slideRect: roundRect(rootRect),
          },
        });
      }

      const overflowX = node.scrollWidth - node.clientWidth;
      const overflowY = node.scrollHeight - node.clientHeight;
      if (hasConstrainedContentBox(node) && (overflowX > tolerance || overflowY > tolerance)) {
        measurements.push({
          code: "overflow.element-content",
          selector: selectorFor(node),
          message: "editable element content has rendered overflow",
          details: {
            elementRect: roundRect(rect),
            scrollWidth: node.scrollWidth,
            clientWidth: node.clientWidth,
            scrollHeight: node.scrollHeight,
            clientHeight: node.clientHeight,
          },
        });
      }
    }

    return measurements;

    function hasConstrainedContentBox(node) {
      const style = window.getComputedStyle(node);
      const overflowValues = [
        style.overflow,
        style.overflowX,
        style.overflowY,
      ];
      const clipsOverflow = overflowValues.some((value) =>
        ["hidden", "clip", "auto", "scroll"].includes(value)
      );
      const hasExplicitBox =
        style.position === "absolute" ||
        style.position === "fixed" ||
        style.display === "block" ||
        style.display === "inline-block" ||
        style.display === "inline-flex" ||
        style.display === "flex" ||
        style.display === "grid" ||
        style.maxWidth !== "none" ||
        style.maxHeight !== "none" ||
        node.style.width ||
        node.style.height ||
        node.style.maxWidth ||
        node.style.maxHeight;

      return clipsOverflow && hasExplicitBox;
    }
  })()`);
}

async function loadChromium(): Promise<ChromiumLauncher> {
  const require = createRequire(import.meta.url);
  const playwright = require("@playwright/test") as typeof import("@playwright/test");
  return playwright.chromium;
}

function clearPreviewOutput(outputDir: string) {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
}

function previewFileStem(slideId: string): string {
  const safeName = slideId.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/\.html?$/i, "");
  let hash = 0;
  for (let index = 0; index < slideId.length; index += 1) {
    hash = (hash * 31 + slideId.charCodeAt(index)) >>> 0;
  }
  return `${safeName}-${hash.toString(16).padStart(8, "0")}`;
}
