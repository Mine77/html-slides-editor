import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createTempDeck } from "../../tests/helpers/deck-fixtures";
import { createDeckRuntimeMiddleware } from "./deck-runtime-middleware";

const decks: Array<{ cleanup: () => void }> = [];

function createDeck() {
  const deck = createTempDeck("starry-slides-middleware-");
  decks.push(deck);
  return deck.root;
}

function createRequest(body: string): http.IncomingMessage {
  const request = new http.IncomingMessage(null as never);
  Object.defineProperty(request, "method", { value: "POST" });
  Object.defineProperty(request, "url", { value: "/__editor/save-generated-deck" });
  const chunks = [Buffer.from(body)];
  request[Symbol.asyncIterator] = async function* () {
    for (const chunk of chunks) {
      yield chunk;
    }
  };
  return request;
}

function createResponse() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let body = "";
  const response = {
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
    end(value?: string) {
      body = value ?? "";
    },
    get statusCode() {
      return statusCode;
    },
    set statusCode(value: number) {
      statusCode = value;
    },
  } as unknown as http.ServerResponse;

  return {
    response,
    getBody: () => body,
    getStatus: () => statusCode,
    getHeader: (name: string) => headers.get(name),
  };
}

afterEach(() => {
  for (const deck of decks.splice(0)) {
    deck.cleanup();
  }
});

describe("deck runtime middleware", () => {
  test("save route writes a single deck.html payload when deckHtml is provided", async () => {
    const deck = createDeck();
    const middleware = createDeckRuntimeMiddleware({
      runtimeDeckDir: deck,
      previewDeckDir: deck,
      saveTargetDirs: [deck],
    });
    const request = createRequest(
      JSON.stringify({
        clientLoadedAt: Date.now(),
        deckHtml: "<!DOCTYPE html><html><body><slides title=\"Deck\"><slide id=\"slide-1\" title=\"One\"></slide></slides></body></html>",
      })
    );
    const { response, getStatus, getBody } = createResponse();

    middleware.handlePreviewRequest(request, response, () => {});
    await new Promise((resolve) => {
      const poll = () => {
        if (getBody()) {
          resolve(undefined);
          return;
        }
        setTimeout(poll, 10);
      };
      poll();
    });

    expect(getStatus()).toBe(200);
    expect(JSON.parse(getBody())).toEqual({ ok: true });
    expect(fs.readFileSync(path.join(deck, "deck.html"), "utf8")).toContain("<slides");
  });
});
