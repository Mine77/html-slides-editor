// @vitest-environment jsdom

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { DEFAULT_SLIDE_HEIGHT, DEFAULT_SLIDE_WIDTH, loadDeckDocument } from "./index";

const regressionDeckConfig = JSON.parse(
  fs.readFileSync(
    path.resolve(import.meta.dirname, "../../e2e/fixtures/regression-deck/config.json"),
    "utf8"
  )
) as {
  topic: string;
  points: string[];
  heroKicker: string;
};

describe("generated deck import", () => {
  test("loadDeckDocument parses the generated single-file deck contract", async () => {
    const workspaceRoot = path.resolve(import.meta.dirname, "../..");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hse-generated-deck-"));
    const outputRoot = path.join(tempRoot, "generated");
    const appOutputRoot = path.join(tempRoot, "synced");

    execFileSync(
      "node",
      [
        path.join(workspaceRoot, "e2e/tools/prepare-regression-deck.mjs"),
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

    const deckPath = path.join(outputRoot, "deck.html");
    const deckUrl = new URL(`file://${deckPath}`);
    const fetchImpl: typeof fetch = async () =>
      new Response(fs.readFileSync(deckPath, "utf8"), {
        status: 200,
        headers: { "content-type": "text/html" },
      });

    const deck = await loadDeckDocument({
      deckUrl: deckUrl.toString(),
      fetchImpl,
    });

    expect(deck?.metadata.title).toBe(regressionDeckConfig.topic);
    expect(deck?.slides).toHaveLength(16);
    expect(deck?.slides[0]?.title).toBe(regressionDeckConfig.topic);
    expect(deck?.slides[0]?.width).toBe(DEFAULT_SLIDE_WIDTH);
    expect(deck?.slides[0]?.height).toBe(DEFAULT_SLIDE_HEIGHT);
    expect(
      deck?.slides[0]?.elements.some((element) => element.content === regressionDeckConfig.heroKicker)
    ).toBe(true);
    expect(
      deck?.slides[1]?.elements.some((element) => element.content === regressionDeckConfig.points[0])
    ).toBe(true);
    expect(fs.existsSync(deckPath)).toBe(true);

    fs.rmSync(tempRoot, { recursive: true, force: true });
  });
});
