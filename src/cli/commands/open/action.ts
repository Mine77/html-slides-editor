import { type VerifyResult, createVerifyResult, verifyDeck } from "../../../core/verify-deck";
import { resolveDeckPath } from "../../../node/deck-source";
import { startEditorServer } from "../../../node/editor-server";
import { openBrowser } from "../../../node/open-browser";
import { findAvailablePort } from "../../../node/ports";
import { verifyRenderedOverflow } from "../../../node/view-renderer";

function writeJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function runCompleteVerify(deckPath: string): Promise<VerifyResult> {
  const staticResult = verifyDeck(deckPath, { mode: "static" });
  if (!staticResult.ok) {
    return createVerifyResult({
      deck: staticResult.deck,
      mode: "complete",
      checks: ["structure", "static-overflow", "rendered-overflow"],
      issues: staticResult.issues,
    });
  }

  const renderedIssues = await verifyRenderedOverflow(deckPath);
  return verifyDeck(deckPath, {
    mode: "complete",
    renderedIssues,
  });
}

export async function runOpen(deckPathArg: string | undefined) {
  const deckPath = resolveDeckPath(deckPathArg);
  const result = await runCompleteVerify(deckPath);
  if (!result.ok) {
    writeJson(result);
    process.exitCode = 1;
    return;
  }

  const port = await findAvailablePort(Number(process.env.PORT ?? 5173));
  const url = `http://127.0.0.1:${port}/`;
  if (process.env.STARRY_SLIDES_TEST_STUB_OPEN === "1") {
    console.error(`Opening Starry Slides at ${url}`);
    console.error(`Editor startup stub: STARRY_SLIDES_DECK_DIR=${deckPath}`);
    return;
  }

  const server = await startEditorServer({ deckPath, port });
  const closeServer = () => {
    void server.close().finally(() => process.exit(0));
  };

  console.error(`Opening Starry Slides at ${url}`);
  console.error("Press Ctrl+C to stop the editor server.");
  setTimeout(() => openBrowser(url), 750);
  process.on("SIGINT", closeServer);
  process.on("SIGTERM", closeServer);
}
