import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  blockElement,
  createTempDeck,
  slideHtml,
  slideHtmlWithoutDimensions,
  textElement,
  writeDeck,
} from "../../tests/helpers/deck-fixtures";
import { type VerifyIssue, createVerifyIssue, verifyDeck } from "./verify-deck";

const decks: Array<{ cleanup: () => void }> = [];

function createDeck() {
  const deck = createTempDeck();
  decks.push(deck);
  return deck.root;
}

function issueCodes(issues: VerifyIssue[]) {
  return issues.map((issue) => issue.code);
}

afterEach(() => {
  for (const deck of decks.splice(0)) {
    deck.cleanup();
  }
});

describe("verifyDeck core verifier", () => {
  test("missing deck path returns structure.missing-deck", () => {
    const deck = path.join(createDeck(), "missing");
    const result = verifyDeck(deck);

    expect(result.ok).toBe(false);
    expect(issueCodes(result.issues)).toContain("structure.missing-deck");
  });

  test("missing deck.html returns structure.missing-deck", () => {
    const deck = createDeck();
    const result = verifyDeck(deck);

    expect(result.ok).toBe(false);
    expect(issueCodes(result.issues)).toContain("structure.missing-deck");
  });

  test("invalid deck html returns structure.invalid-deck", () => {
    const deck = createDeck();
    fs.writeFileSync(path.join(deck, "deck.html"), "<html><body>bad</body></html>");

    const result = verifyDeck(deck);

    expect(result.ok).toBe(false);
    expect(issueCodes(result.issues)).toContain("structure.invalid-deck");
  });

  test("empty deck returns structure.empty-deck", () => {
    const deck = createDeck();
    fs.writeFileSync(
      path.join(deck, "deck.html"),
      '<!DOCTYPE html><html><body><slides title="Deck"></slides></body></html>'
    );

    const result = verifyDeck(deck);

    expect(result.ok).toBe(false);
    expect(issueCodes(result.issues)).toContain("structure.empty-deck");
  });

  test("invalid data-editable values return structure.invalid-editable", () => {
    const deck = createDeck();
    writeDeck(deck, [
      {
        id: "slide-1",
        html: slideHtml('<div data-editable="shape" data-editor-id="shape-1">Bad</div>'),
      },
    ]);

    const result = verifyDeck(deck);

    expect(result.ok).toBe(false);
    expect(issueCodes(result.issues)).toContain("structure.invalid-editable");
  });

  test('invalid data-group="true" usage returns structure.invalid-group', () => {
    const deck = createDeck();
    writeDeck(deck, [
      {
        id: "slide-1",
        html: slideHtml(
          '<h1 data-editable="text" data-group="true" data-editor-id="text-1">Bad</h1>'
        ),
      },
    ]);

    const result = verifyDeck(deck);

    expect(result.ok).toBe(false);
    expect(issueCodes(result.issues)).toContain("structure.invalid-group");
  });

  test("static overflow catches explicit auto and scroll values", () => {
    const deck = createDeck();
    writeDeck(deck, [
      {
        id: "slide-1",
        html: slideHtml(
          `${textElement("text-1", "Auto", "overflow:auto")}${blockElement(
            "block-1",
            "Scroll",
            "left:300px;overflow-y:scroll"
          )}`
        ),
      },
    ]);

    const result = verifyDeck(deck);

    expect(result.ok).toBe(false);
    expect(issueCodes(result.issues).filter((code) => code === "overflow.static")).toHaveLength(2);
  });

  test("data-allow-overflow on an element or ancestor exempts static overflow issues", () => {
    const deck = createDeck();
    writeDeck(deck, [
      {
        id: "slide-1",
        html: slideHtml(
          `<section data-allow-overflow="true">${textElement(
            "text-1",
            "Allowed",
            "overflow:auto"
          )}</section>${blockElement(
            "block-1",
            "Allowed",
            'left:300px;overflow:scroll" data-allow-overflow="true'
          )}`
        ),
      },
    ]);

    const result = verifyDeck(deck);

    expect(result.ok).toBe(true);
    expect(issueCodes(result.issues)).not.toContain("overflow.static");
  });

  test("static mode reports static checks only", () => {
    const deck = createDeck();
    writeDeck(deck, [{ id: "slide-1" }]);

    const result = verifyDeck(deck, { mode: "static" });

    expect(result.mode).toBe("static");
    expect(result.checks).toEqual(["structure", "static-overflow"]);
    expect(result.ok).toBe(true);
  });

  test("complete mode merges structural, static, and rendered issues in one array", () => {
    const deck = createDeck();
    writeDeck(deck, [
      {
        id: "slide-1",
        html: slideHtml(textElement("text-1", "Hello"), "overflow:scroll"),
      },
    ]);
    const renderedIssue = createVerifyIssue(
      "error",
      "overflow.element-bounds",
      "editable element renders outside slide bounds",
      { slideId: "slide-1", selector: '[data-editor-id="text-1"]' }
    );

    const result = verifyDeck(deck, { mode: "complete", renderedIssues: [renderedIssue] });

    expect(result.mode).toBe("complete");
    expect(result.checks).toEqual(["structure", "static-overflow", "rendered-overflow"]);
    expect(issueCodes(result.issues)).toEqual(
      expect.arrayContaining(["overflow.static", "overflow.element-bounds"])
    );
  });

  test("summary counts and ok are derived only from issue severity", () => {
    const deck = createDeck();
    writeDeck(deck, [{ id: "slide-1" }]);
    const resultWithWarning = verifyDeck(deck);

    expect(resultWithWarning.ok).toBe(true);
    expect(resultWithWarning.summary).toEqual({ errorCount: 0, warningCount: 0 });

    fs.writeFileSync(
      path.join(deck, "deck.html"),
      '<!DOCTYPE html><html><body><slides title="Deck"><slide id="slide-1" title="One"><main data-slide-root="true" data-editor-id="slide-root"><div data-editable="bad" data-editor-id="bad-1">Bad</div></main></slide></slides></body></html>'
    );
    const resultWithError = verifyDeck(deck);

    expect(resultWithError.ok).toBe(false);
    expect(resultWithError.summary.errorCount).toBe(1);
    expect(resultWithError.summary.warningCount).toBe(0);
  });
});
