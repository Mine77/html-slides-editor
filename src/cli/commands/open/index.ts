import type { Command } from "commander/esm.mjs";
import { runOpen } from "./action";

export function registerOpenCommand(program: Command) {
  program
    .command("open")
    .argument("[deck]", "deck path")
    .description("Open the editor after complete verification.")
    .action(async (deckPath: string | undefined) => {
      await runOpen(deckPath);
    });
}

export function registerDefaultOpen(program: Command) {
  program.argument("[deck]", "deck path").action(async (deckPath: string | undefined) => {
    await runOpen(deckPath);
  });
}
