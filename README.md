# Starry Slides

Starry Slides is a headless, agent-native slide workflow: bring any prompt,
reference material, design direction, theme, or slide skill; generate
Contract-compatible HTML slides; then edit and present them without leaving the
source format.

The product rule is simple: **HTML stays the source of truth**. Starry Slides
does not provide preset templates or a proprietary slide model. It defines the
generated slide format and provides the tools around that format: editing,
presentation, validation, saving, and future extensions.

## Why This Exists

Most slide tools start from templates or treat AI output as something to export,
flatten, or rebuild in a closed editor format. Starry Slides takes the opposite
path:

- users and agents provide the context: topic, documents, brand guidance,
  `design.md`, existing themes, other slide skills, or any useful reference
- agents generate normal deck packages with `manifest.json`, `slides/`, and
  optional `assets/`
- Starry Slides only requires a small HTML Contract so generated slides can be
  understood by tools
- the editor reads the generated HTML, lets a human revise it manually, and
  writes edits back to the same slide files

That makes the deck inspectable, versionable, testable, and still easy to edit
after generation.

## Core Ideas

### Manual Editing

Prompt-only editing is not enough for many slide workflows. People still need to
click into a deck and directly adjust wording, layout, visual details, and
presentation structure. Starry Slides keeps generated slides editable by marking
the intended text, image, and block elements in HTML.

### Headless Generation

Starry Slides is headless by design. It does not prescribe a visual system,
template catalog, or fixed content model. A user can combine their own context,
design notes, brand language, themes, existing slide skills, and generated assets
as long as the output satisfies the Starry Slides Contract.

## Product Shape

Starry Slides currently has two main pieces.

```text
starry-slides-skill
  + user prompt, files, references, style constraints
  -> generated deck package

Starry Slides Editor
  + generated deck package
  -> browser editing, saving, validation, regression coverage
```

### Starry Slides Skill

`skills/starry-slides-skill` is the agent-facing entry point. Use it when an
agent needs to create, validate, normalize, install, or open a deck for editing.

The skill owns:

- the generated deck workflow
- the editable HTML Contract references
- validation, annotation, manifest, install, open, and feedback scripts
- the rule that agents use bundled protocol tools instead of inventing ad hoc
  deck formats

### Starry Slides Editor

`packages/editor` contains the React editor package, exported as
`@starry-slides/editor`.

The editor owns:

- manifest-driven deck loading
- slide parsing and Contract helpers
- history-backed slide operations
- iframe-based slide rendering
- element selection and overlays
- double-click text editing
- CSS-backed toolbar and sidebar controls
- block movement, resizing, and snap guides
- thumbnails and Playwright regression fixtures

`apps/web` is the local Vite host that composes the editor and loads the current
generated deck.

## What Works Today

The current repo is a local-first product build. It can:

- generate the regression/sample deck used by the app
- validate and annotate Contract-compatible HTML slides
- build a `manifest.json` for a slide directory
- open the browser editor against `apps/web/public/sample-slides/`
- edit marked text directly in the slide iframe
- select editable text, image, and block elements
- update supported CSS properties through the floating toolbar or side panel
- move and resize supported block/text elements with snapping
- undo and redo committed editor operations
- save edited generated slides back to disk in the local dev server
- run unit, build, lint, and browser regression checks through `pnpm verify`

This is not yet a hosted collaboration product. The app expects an installed or
generated deck; it does not maintain a fallback deck.

## Quick Start

Install dependencies:

```bash
pnpm install
```

Generate the default editable deck:

```bash
pnpm editor:e2e:generate-deck
```

Start the local editor:

```bash
pnpm dev
```

`pnpm dev` starts the web app and serves the deck from:

```text
apps/web/public/sample-slides/
```

The app loads:

```text
apps/web/public/sample-slides/manifest.json
```

Local edits are saved back into that generated deck while the dev server is
running.

## Common Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm lint:fix
pnpm format
pnpm test
pnpm test:e2e
pnpm verify
```

`pnpm verify` is the full local gate:

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:e2e
```

The browser regression suite uses a temporary ignored deck in
`.e2e-test-slides/`. Normal development uses the long-lived app deck in
`apps/web/public/sample-slides/`.

## Generate Or Install A Deck

A Starry Slides deck package should look like this:

```text
my-deck/
  manifest.json
  slides/
    01-title.html
    02-agenda.html
    03-content.html
  assets/
    hero.png
```

Useful protocol commands:

```bash
pnpm starry:contract:validate -- --input path/to/deck
pnpm starry:contract:annotate -- --input path/to/deck
pnpm starry:contract:manifest -- --input-dir path/to/deck/slides --deck-title "My Deck"
pnpm starry:open
```

To refresh the app's default deck from the editor regression generator:

```bash
pnpm editor:e2e:generate-deck
```

## Slide Contract

Each slide is a standalone HTML document. The editor looks for DOM attributes,
not a particular CSS framework.

Minimum slide root:

```html
<main
  data-slide-root="true"
  data-slide-width="1920"
  data-slide-height="1080"
  data-editor-id="slide-root"
>
  <h1 data-editable="text" data-editor-id="text-1">Slide title</h1>
  <p data-editable="text" data-editor-id="text-2">Slide body</p>
  <img data-editable="image" data-editor-id="image-1" src="./assets/hero.png" alt="" />
  <section data-editable="block" data-editor-id="block-1">
    <p data-editable="text" data-editor-id="text-3">Movable group</p>
  </section>
</main>
```

Required:

- exactly one `data-slide-root="true"` element per slide
- editable text marked with `data-editable="text"`
- replaceable images marked with `data-editable="image"`
- selectable or movable containers marked with `data-editable="block"`

Recommended:

- `data-slide-width="1920"` and `data-slide-height="1080"` on the root
- stable `data-editor-id` values on the root and editable elements
- `data-archetype`, `data-style-pack`, `data-role`, and `data-group` where they
  help generation and editing tools preserve intent

The full v1 Contract lives in
`skills/starry-slides-skill/references/contract-protocol/contract-v1.md`.

## Repository Guide

```text
apps/
  web/                         React + Vite editor host
    public/sample-slides/      App default generated deck
    src/use-slides-data.ts     Manifest loading and local save integration

docs/
  adr/                         Architecture decision records
  roadmap/                     Milestone plans linked from ROADMAP.md

packages/
  editor/                      Editor package, core slide helpers, regression suite
    e2e/                       Playwright tests, fixtures, and deck generator
    src/components/            Editor shell, toolbar, side panel, canvas, UI
    src/hooks/                 Selection, editing, keyboard, block manipulation
    src/lib/core/              Contract, parser, history, operations, import helpers

skills/
  starry-slides-skill/         Agent-facing deck workflow and protocol tools
  slides-style-pack-starter/   Starter visual-layer package
```

## For Agents

Start here before making changes:

1. Read `CONTEXT-MAP.md`.
2. Read the relevant package context:
   - `packages/editor/CONTEXT.md` for editor UI and interactions.
   - `apps/web/CONTEXT.md` for app loading and save behavior.
3. Read `docs/adr/README.md` and relevant ADRs before changing architecture,
   persistence, collaboration, package boundaries, history, or editor pipeline
   semantics.
4. For deck generation work, use `skills/starry-slides-skill/SKILL.md` and its
   bundled scripts.
5. Before closing implementation work, run `pnpm verify` unless the change is
   documentation-only or the user explicitly asks for a narrower check.

Agent rules that matter in this repo:

- do not introduce a proprietary slide document model
- do not bypass `@starry-slides/editor` core operations for committed edits
- do not invent alternate deck install locations
- do not add extra persistent deck copies beyond the app default deck and the
  ignored e2e working deck
- keep generated slides Contract-compatible and validate them with the bundled
  tools

## Architecture Decisions

Important current decisions:

- ADR-0001: editing pipeline and versioning strategy
- ADR-0003: Tailwind and shadcn/ui for editor UI
- ADR-0005: two-subject architecture for Starry Slides Skill and Editor
- ADR-0006: shared toolbar model for element tooling
- ADR-0007: only two generated deck copies

The ADR index is `docs/adr/README.md`.

## Roadmap

Product planning lives in `ROADMAP.md`, with milestone details in:

- `docs/roadmap/milestone-1-foundation.md`
- `docs/roadmap/milestone-2-editing-release.md`
- `docs/roadmap/milestone-3-agent-productization.md`

## License

[AGPL-3.0-only](./LICENSE)
