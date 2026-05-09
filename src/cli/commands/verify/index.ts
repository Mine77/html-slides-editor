import type { Command } from "commander/esm.mjs";
import { runVerify } from "./action";

export function registerVerifyCommand(program: Command) {
  program
    .command("verify")
    .argument("[deck]", "deck path")
    .option("--static", "skip rendered overflow checks")
    .description("Verify a deck and print JSON results.")
    .action(async (deckPath: string | undefined, options: { static?: boolean }) => {
      await runVerify(deckPath, options.static ? "static" : "complete");
    });
}
