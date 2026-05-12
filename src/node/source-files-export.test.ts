import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createTempDeck, writeDeck } from "../../tests/helpers/deck-fixtures";
import { exportSourceFiles } from "./source-files-export";

const decks: Array<{ cleanup: () => void }> = [];

function createDeck() {
  const deck = createTempDeck("starry-slides-source-files-");
  decks.push(deck);
  return deck.root;
}

afterEach(() => {
  for (const deck of decks.splice(0)) {
    deck.cleanup();
  }
});

describe("source files export runtime", () => {
  test("packages deck source files into a zip archive", async () => {
    const deck = createDeck();
    writeDeck(deck, [
      { file: "slides/01.html", title: "One", html: "<html><body>One</body></html>" },
      { file: "slides/02.html", title: "Two", html: "<html><body>Two</body></html>" },
    ]);
    fs.mkdirSync(path.join(deck, ".starry-slides", "export"), { recursive: true });
    fs.writeFileSync(path.join(deck, ".starry-slides", "export", "deck.html"), "ignore me");
    const outFile = path.join(deck, "deck-source-files.zip");

    const result = await exportSourceFiles({ deckPath: deck, outFile });
    const contents = fs.readFileSync(outFile);

    expect(result.path).toBe(outFile);
    expect(result.files).toEqual(["manifest.json", "slides/01.html", "slides/02.html"]);
    expect(contents.subarray(0, 4).toString("binary")).toBe("PK\u0003\u0004");
    expect(contents.includes(Buffer.from("manifest.json", "utf8"))).toBe(true);
    expect(contents.includes(Buffer.from("slides/01.html", "utf8"))).toBe(true);
    expect(contents.includes(Buffer.from("slides/02.html", "utf8"))).toBe(true);
    expect(contents.includes(Buffer.from(".starry-slides/export/deck.html", "utf8"))).toBe(false);
  });
});
