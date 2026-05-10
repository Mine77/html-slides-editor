import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createTempDeck, writeDeck } from "../../tests/helpers/deck-fixtures";
import { exportPdf } from "./pdf-export";

const decks: Array<{ cleanup: () => void }> = [];

function createDeck() {
  const deck = createTempDeck("starry-slides-pdf-");
  decks.push(deck);
  return deck.root;
}

afterEach(() => {
  for (const deck of decks.splice(0)) {
    deck.cleanup();
  }
});

vi.setConfig({ testTimeout: 15000 });

function expectPdfFile(filePath: string) {
  expect(fs.existsSync(filePath)).toBe(true);
  const contents = fs.readFileSync(filePath);
  expect(contents.subarray(0, 8).toString("utf8")).toBe("%PDF-1.4");
  expect(contents.length).toBeGreaterThan(1000);
}

describe("PDF export runtime", () => {
  test("exports every slide by default", async () => {
    const deck = createDeck();
    writeDeck(deck, [
      { id: "slide-one", title: "One" },
      { id: "slide-two", title: "Two" },
    ]);
    const outFile = path.join(deck, "deck.pdf");

    const result = await exportPdf({ deckPath: deck, outFile });

    expect(result.mode).toBe("all");
    expect(result.slides.map((slide) => slide.slideId)).toEqual(["slide-one", "slide-two"]);
    expect(result.path).toBe(outFile);
    expectPdfFile(outFile);
  });

  test("exports a selected subset in requested order", async () => {
    const deck = createDeck();
    writeDeck(deck, [
      { id: "slide-one", title: "One" },
      { id: "slide-two", title: "Two" },
      { id: "slide-three", title: "Three" },
    ]);
    const outFile = path.join(deck, "subset.pdf");

    const result = await exportPdf({
      deckPath: deck,
      outFile,
      selection: {
        mode: "slides",
        slideIds: ["slide-three", "slide-one"],
      },
    });

    expect(result.mode).toBe("slides");
    expect(result.slides.map((slide) => slide.slideId)).toEqual(["slide-three", "slide-one"]);
    expectPdfFile(outFile);
  });

  test("rejects non-exact slide selections before writing output", async () => {
    const deck = createDeck();
    writeDeck(deck, [{ id: "slide-one", title: "One" }]);
    const outFile = path.join(deck, "missing.pdf");

    await expect(
      exportPdf({
        deckPath: deck,
        outFile,
        selection: { mode: "slide", slideId: "missing" },
      })
    ).rejects.toThrow("--slide must match a slide id exactly: missing");
    expect(fs.existsSync(outFile)).toBe(false);
  });
});
