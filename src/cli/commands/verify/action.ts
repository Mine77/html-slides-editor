import { type VerifyResult, createVerifyResult, verifyDeck } from "../../../core/verify-deck";
import { resolveDeckPath } from "../../../node/deck-source";
import { verifyRenderedOverflow } from "../../../node/view-renderer";

function writeJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function runStaticVerify(deckPath: string): Promise<VerifyResult> {
  return verifyDeck(deckPath, { mode: "static" });
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

export async function runVerify(deckPathArg: string | undefined, mode: "static" | "complete") {
  const deckPath = resolveDeckPath(deckPathArg);
  const result =
    mode === "static" ? await runStaticVerify(deckPath) : await runCompleteVerify(deckPath);
  writeJson(result);
  if (!result.ok) {
    process.exitCode = 1;
  }
}
