---
name: starry-slides
description: Generate contract-compatible HTML slide decks for Starry Slides, but only after the `starry-slides` CLI has been installed and verified as available. Use when the user wants to create or edit a deck source file, verify it with the CLI, preview slides, or open a valid deck in the Starry Slides editor.
---

# Starry Slides

## Goal

Create or edit contract-compatible slide deck files that follow
`references/STARRY-SLIDES-CONTRACT.md`. For deck structure, authored HTML
requirements, and manifest details, always use the contract as the source of
truth.

## CLI Usage

For installation steps, supported commands, command purposes, and output
examples, see [STARRY-SLIDES-CLI-USAGE.md](references/STARRY-SLIDES-CLI-USAGE.md).

## Workflow

1. Before generating, editing, previewing, verifying, or opening any deck, install the `starry-slides` CLI if it is not already present by following [STARRY-SLIDES-CLI-USAGE.md](references/STARRY-SLIDES-CLI-USAGE.md).Treat a successful `starry-slides --help` run as the minimum check.
2. Understand the user's slide context before generating anything. Use [REQUIREMENTS-DISCOVERY-INTERVIEW.md](references/REQUIREMENTS-DISCOVERY-INTERVIEW.md) to gather missing context, ask only the highest-signal questions, and consolidate the result into a brief before you generate.
3. Generate or edit the deck package so it satisfies [STARRY-SLIDES-CONTRACT.md](references/STARRY-SLIDES-CONTRACT.md).
4. Open the deck with:

```bash
starry-slides open <deck>
```

## Hints

- After generation, you can use `starry-slides verify <deck>` to check whether the deck satisfies the contract.
- To preview generated slides, use `starry-slides view <deck> --all` or `starry-slides view <deck> --slide <manifest-file>`.
