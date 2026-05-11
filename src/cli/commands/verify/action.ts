import { type VerifyResult, createVerifyResult, verifyDeck } from "../../../core/verify-deck";
import { resolveDeckPath } from "../../../node/deck-source";
import { verifyRenderedOverflow } from "../../../node/view-renderer";

function writeJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export async function runVerify(deckPathArg: string | undefined) {
  const deckPath = resolveDeckPath(deckPathArg);
  const sourceResult = verifyDeck(deckPath);
  if (!sourceResult.ok) {
    writeJson(sourceResult);
    process.exitCode = 1;
    return;
  }

  let renderedIssues;
  try {
    renderedIssues = await verifyRenderedOverflow(deckPath);
  } catch {
    renderedIssues = [];
  }

  const result = createVerifyResult({
    deck: sourceResult.deck,
    checks: ["structure", "css", "static-overflow", "rendered-overflow"],
    issues: sourceResult.issues,
    renderedIssues,
  });
  writeJson(result);
  if (!result.ok) {
    process.exitCode = 1;
  }
}
