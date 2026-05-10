import type { Command } from "commander/esm.mjs";
import { resolveViewSelection, runView } from "./action";

export function registerViewCommand(program: Command) {
  const getRawArgs = () => process.argv.slice(2);

  program
    .command("view")
    .argument("[deck]", "deck path")
    .option("--slide <slide-id>", "render exactly one slide by id")
    .option("--all", "render every slide in the deck")
    .option("--out-dir <directory>", "write previews to a specific directory")
    .option("--static", "invalid for view; kept to produce a helpful error")
    .description("Render preview images for a deck.")
    .action(
      async (
        deckPath: string | undefined,
        options: { slide?: string; all?: boolean; outDir?: string; static?: boolean }
      ) => {
        const normalizedOptions = resolveViewSelection(getRawArgs(), options);
        await runView(deckPath, normalizedOptions);
      }
    );
}
