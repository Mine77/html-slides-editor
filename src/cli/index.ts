#!/usr/bin/env node

import process from "node:process";
import { Command, CommanderError, InvalidArgumentError } from "commander/esm.mjs";
import { registerFeedbackCommand } from "./commands/feedback";
import { registerDefaultOpen, registerOpenCommand } from "./commands/open";
import { registerVerifyCommand } from "./commands/verify";
import { registerViewCommand } from "./commands/view";

function createProgram() {
  const program = new Command();

  program
    .name("starry-slides")
    .description("Local-first CLI for verifying, previewing, and opening HTML slide decks.")
    .helpCommand("help [command]")
    .showHelpAfterError()
    .allowExcessArguments(false)
    .configureOutput({
      writeOut: (str) => process.stdout.write(str),
      writeErr: (str) => process.stderr.write(str),
    });

  registerDefaultOpen(program);
  registerOpenCommand(program);
  registerVerifyCommand(program);
  registerViewCommand(program);
  registerFeedbackCommand(program);

  return program;
}

async function main() {
  const program = createProgram();
  await program.parseAsync(process.argv);
}

main().catch((error) => {
  if (error instanceof CommanderError || error instanceof InvalidArgumentError) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = error.exitCode ?? 1;
    return;
  }

  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
