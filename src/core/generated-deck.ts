import {
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_WIDTH,
  type ImportedDeckDocument,
} from "./slide-contract";
import { parseDeckDocument } from "./slide-document";

export interface LoadDeckDocumentOptions {
  deckUrl: string;
  fetchImpl?: typeof fetch;
  requestInit?: RequestInit;
}

export async function loadDeckDocument({
  deckUrl,
  fetchImpl,
  requestInit,
}: LoadDeckDocumentOptions): Promise<ImportedDeckDocument | null> {
  const activeFetch = fetchImpl ?? globalThis.fetch;
  if (!activeFetch) {
    throw new Error("loadDeckDocument requires a fetch implementation.");
  }

  const response = await activeFetch(deckUrl, {
    cache: "no-store",
    ...requestInit,
  });
  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const parsed = parseDeckDocument(html, {
    primaryFileName: new URL(response.url || deckUrl).pathname.split("/").pop() || undefined,
  });
  return parsed;
}
