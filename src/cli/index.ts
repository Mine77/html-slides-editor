#!/usr/bin/env node

import { Command, CommanderError, InvalidArgumentError } from "commander/esm.mjs";
import { registerDefaultOpen, registerOpenCommand } from "./commands/open";
import { registerVerifyCommand } from "./commands/verify";
import { registerViewCommand } from "./commands/view";

function createProgram() {
  const program = new Command();

  program
    .name("starry-slides")
    .description(
      "CLI for Starry Slides, an agentic editor for HTML-first slides and presentations. Use this CLI to open, view, and verify your slides directly from the command line."
    )
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
