import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_WIDTH,
  applySlideOperation,
  ensureEditableSelectors,
  invertSlideOperation,
  parseSlide,
  updateSlideText,
} from "./index";

describe("ensureEditableSelectors", () => {
  test("adds stable data-editor-id values to slide root and editable nodes", () => {
    const html = `<!DOCTYPE html>
<html lang="en">
  <body>
    <div class="slide-container">
      <h1 data-editable="text">Title</h1>
      <p data-editable="text">Body</p>
      <div data-editable="block"><span data-editable="text">Nested</span></div>
    </div>
  </body>
</html>`;

    const normalizedHtml = ensureEditableSelectors(html);
    const doc = new DOMParser().parseFromString(normalizedHtml, "text/html");
    const root = doc.querySelector('[data-slide-root="true"]');
    const ids = Array.from(doc.querySelectorAll("[data-editable]")).map((node) =>
      node.getAttribute("data-editor-id")
    );

    expect(root?.getAttribute("data-editor-id")).toBe("slide-root");
    expect(root?.getAttribute("data-slide-width")).toBe(String(DEFAULT_SLIDE_WIDTH));
    expect(root?.getAttribute("data-slide-height")).toBe(String(DEFAULT_SLIDE_HEIGHT));
    expect(ids).toEqual(["text-1", "text-2", "block-3", "text-4"]);
  });

  test("preserves existing data-editor-id values", () => {
    const html = `<!DOCTYPE html>
<html lang="en">
  <body>
    <div class="slide-container" data-slide-root="true" data-editor-id="custom-root">
      <h1 data-editable="text" data-editor-id="hero-title">Title</h1>
      <p data-editable="text">Body</p>
    </div>
  </body>
</html>`;

    const normalizedHtml = ensureEditableSelectors(html);
    const doc = new DOMParser().parseFromString(normalizedHtml, "text/html");
    const ids = Array.from(doc.querySelectorAll("[data-editable]")).map((node) =>
      node.getAttribute("data-editor-id")
    );

    expect(doc.querySelector('[data-slide-root="true"]')?.getAttribute("data-editor-id")).toBe(
      "custom-root"
    );
    expect(ids).toEqual(["hero-title", "text-2"]);
  });
});

describe("updateSlideText", () => {
  test("writes updated text back into htmlSource using data-editor-id targeting", () => {
    const html = ensureEditableSelectors(`<!DOCTYPE html>
<html lang="en">
  <body>
    <div class="slide-container" data-slide-root="true">
      <h1 data-editable="text">Original heading</h1>
      <p data-editable="text">Original body</p>
    </div>
  </body>
</html>`);

    const updatedHtml = updateSlideText(html, "text-2", "Updated body");
    const doc = new DOMParser().parseFromString(updatedHtml, "text/html");

    expect(doc.querySelector('[data-editor-id="text-1"]')?.textContent).toBe("Original heading");
    expect(doc.querySelector('[data-editor-id="text-2"]')?.textContent).toBe("Updated body");
  });
});

describe("slide operations", () => {
  test("applySlideOperation updates the matching slide html and parsed elements", () => {
    const originalSlide = parseSlide(
      `<!DOCTYPE html>
<html lang="en">
  <body>
    <div class="slide-container" data-slide-root="true">
      <h1 data-editable="text">Before</h1>
      <p data-editable="text">Unchanged</p>
    </div>
  </body>
</html>`,
      "slide-a"
    );

    const updatedSlide = applySlideOperation(originalSlide, {
      type: "text.update",
      slideId: originalSlide.id,
      elementId: "text-1",
      previousText: "Before",
      nextText: "After",
      timestamp: 1,
    });

    expect(updatedSlide.htmlSource).toContain("After");
    expect(updatedSlide.elements.find((element) => element.id === "text-1")?.content).toBe("After");
    expect(updatedSlide.elements.find((element) => element.id === "text-2")?.content).toBe(
      "Unchanged"
    );
  });

  test("invertSlideOperation pairs correctly with text.update and reverses applySlideOperation", () => {
    const originalSlide = parseSlide(
      `<!DOCTYPE html>
<html lang="en">
  <body>
    <div class="slide-container" data-slide-root="true">
      <h1 data-editable="text">Before</h1>
    </div>
  </body>
</html>`,
      "slide-a"
    );

    const operation = {
      type: "text.update" as const,
      slideId: originalSlide.id,
      elementId: "text-1",
      previousText: "Before",
      nextText: "After",
      timestamp: 1,
    };

    const updatedSlide = applySlideOperation(originalSlide, operation);
    const restoredSlide = applySlideOperation(updatedSlide, invertSlideOperation(operation));

    expect(invertSlideOperation(operation)).toMatchObject({
      previousText: "After",
      nextText: "Before",
    });
    expect(restoredSlide.htmlSource).toBe(originalSlide.htmlSource);
    expect(restoredSlide.elements.find((element) => element.id === "text-1")?.content).toBe(
      "Before"
    );
  });
});

describe("generated slide contract", () => {
  test("parseSlide returns editor-compatible metadata for generated slides", () => {
    const workspaceRoot = path.resolve(import.meta.dirname, "../../..");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hse-generated-"));
    const outputRoot = path.join(tempRoot, "generated");
    const appOutputRoot = path.join(tempRoot, "synced");

    execFileSync(
      "node",
      [
        path.join(workspaceRoot, "skills/html-slides-generator/generate-slides.mjs"),
        "--topic",
        "Contract Deck",
        "--summary",
        "Contract summary",
        "--points",
        "Point A|Point B|Point C",
        "--out-dir",
        outputRoot,
        "--app-out-dir",
        appOutputRoot,
      ],
      {
        cwd: workspaceRoot,
        stdio: "pipe",
      }
    );

    const manifest = JSON.parse(fs.readFileSync(path.join(outputRoot, "manifest.json"), "utf8")) as {
      topic: string;
      slides: Array<{ file: string; title: string }>;
    };
    const firstSlideHtml = fs.readFileSync(path.join(outputRoot, manifest.slides[0].file), "utf8");
    const firstSlide = parseSlide(firstSlideHtml, "generated-slide-1");
    const secondSlideHtml = fs.readFileSync(path.join(outputRoot, manifest.slides[1].file), "utf8");
    const secondSlide = parseSlide(secondSlideHtml, "generated-slide-2");

    expect(manifest.slides).toHaveLength(3);

    expect(firstSlide.id).toBe("generated-slide-1");
    expect(firstSlide.width).toBe(DEFAULT_SLIDE_WIDTH);
    expect(firstSlide.height).toBe(DEFAULT_SLIDE_HEIGHT);
    expect(firstSlide.rootSelector).toBe('[data-editor-id="slide-root"]');
    expect(firstSlide.elements.map((element) => `${element.id}:${element.type}`)).toEqual([
      "text-1:text",
      "text-2:text",
      "text-3:text",
      "block-4:block",
      "text-5:text",
      "text-6:text",
    ]);
    expect(firstSlide.elements.find((element) => element.id === "text-1")?.content).toBe(
      "Generated Slide Deck"
    );
    expect(firstSlide.elements.find((element) => element.id === "block-4")?.tagName).toBe("div");

    expect(secondSlide.elements.find((element) => element.id === "block-2")?.type).toBe("block");
    expect(secondSlide.elements.find((element) => element.id === "text-4")?.content).toBe(
      "Point A"
    );

    fs.rmSync(tempRoot, { recursive: true, force: true });
  });
});
