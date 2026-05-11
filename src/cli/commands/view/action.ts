import { verifyDeck } from "../../../core/verify-deck";
import { resolveDeckPath } from "../../../node/deck-source";
import { renderPreviewManifest } from "../../../node/view-renderer";

function writeJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function resolveViewSelection(argv: string[], options: { slide?: string; all?: boolean }) {
  let lastMode: "slide" | "all" | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--all") {
      lastMode = "all";
      continue;
    }
    if (arg === "--slide") {
      lastMode = "slide";
      index += 1;
    }
  }

  if (lastMode === "all") {
    return {
      ...options,
      all: true,
      slide: undefined,
    };
  }

  if (lastMode === "slide") {
    return {
      ...options,
      all: false,
    };
  }

  return options;
}

export async function runView(
  deckPathArg: string | undefined,
  options: { slide?: string; all?: boolean; outDir?: string }
) {
  if (!options.slide && !options.all) {
    throw new Error("view requires either --slide <slide-id> or --all");
  }

  const deckPath = resolveDeckPath(deckPathArg);
  const sourceResult = verifyDeck(deckPath);
  if (!sourceResult.ok) {
    writeJson(sourceResult);
    process.exitCode = 1;
    return;
  }

  const manifest = await renderPreviewManifest({
    deckPath,
    slideId: options.all ? undefined : options.slide,
    outDir: options.outDir,
  });
  writeJson(manifest);
}
