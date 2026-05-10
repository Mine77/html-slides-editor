![](assets/readme-banner.png)
# Starry Slides

Starry Slides is an agentic editor for slides and presentations using HTML as the source file.

The project mainly contains 3 parts:
- `starry-slides` CLI - serve as the tools for agent to preview, verify and open the generated slides HTML file 
- Starry Slide Editor - a WYSIWYG editor for editing your slides HTML file 
- `/starry-slides` Skill - a skill for teaching your agent to generate HTML file that meet the requirements of the `STARRY-SLIDES-CONTRACT.md`.

The project is currently under development and has not made a release version yet. Please stay tuned for future progress.

## CLI Quick Start

Install the CLI globally:

```bash
npm install -g starry-slides
```

Use it to verify, preview, and open decks:

```bash
starry-slides verify <deck>
starry-slides view <deck> --all
starry-slides open <deck>
```

- `verify` checks whether a deck HTML file follows the contract and prints JSON results.
- `view` renders preview images for one slide or the whole deck.
- `open` runs verification first, then opens the deck in the editor when it passes.

## Documentation

- [Roadmap](./docs/roadmap/README.md): roadmap of progress and future plans 
- [Development guide](./docs/development.md): repo layout, local commands, tests,
  and implementation boundaries.
- [Contributing guide](./docs/contributing.md): expectations for changes,
  verification, and review.
- [Slide Contract guide](./skills/starry-slides/reference/STARRY-SLIDES-CONTRACT.md): deck package shape and
  required HTML attributes.
- [Repository context](./CONTEXT.md): repo rules, boundaries, testing
  expectations, and shared terminology.
- [Architecture decisions](./docs/adr/): accepted ADRs and ADR template.

## License

Starry Slides is licensed under [MIT License](./LICENSE).
