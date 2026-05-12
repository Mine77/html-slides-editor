import type { Command } from "commander/esm.mjs";
import { runFeedback } from "./action";

export function registerFeedbackCommand(program: Command) {
  program
    .command("feedback")
    .description("Send feedback about Starry Slides.")
    .option("--category <category>", "feedback category: bug, ux, feature, or docs")
    .option("--summary <summary>", "short feedback summary")
    .option("--description <description>", "feedback details")
    .option("--surface <surface>", "feedback surface: cli, editor, or skill", "cli")
    .option("--endpoint <url>", "feedback backend URL")
    .option("--json", "print a JSON result", true)
    .option("--dry-run", "print the payload without sending")
    .action(async (options) => {
      await runFeedback(options);
    });
}
