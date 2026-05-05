# Starry Slides

A monorepo for generating and editing HTML slides without converting them into a proprietary document model.

Previously known as **HTML Slides Editor**.

Idea docs:

- [idea.en.md](./idea.en.md)
- [idea.zh.md](./idea.zh.md)

## Workspace

```text
apps/
  web/                         React + Vite editor host
    public/sample-slides/      App default sample deck loaded by pnpm dev
    src/
      use-slides-data.ts       Loads sample slides and saves edits in dev/e2e
docs/
  adr/                         Architecture decision records
  roadmap/                     Split milestone plans linked from ROADMAP.md
packages/
  editor/                      Editor package, slide contract, and regression suite
    e2e/
      fixtures/                Stable editor regression deck inputs
      tests/                   Playwright specs and helpers
      tools/                   Regression deck generator and reset scripts
    src/
      components/              Editor shell, toolbar, side panel, canvas, shadcn UI
      hooks/                   Selection, manipulation, keyboard, editing hooks
      lib/
        core/                  Slide contract, parser, history, and operations
        block-snap-*           Snap guide and target helpers
        element-tool-*         Shared element tool model and commit helpers
skills/
  starry-slides-skill/         Agent-facing deck workflow and protocol tools
  slides-style-pack-starter/   Starter style pack package
```

## Development

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the local editor host and opens the generated deck from
`apps/web/public/sample-slides/`. That directory is the App's long-lived
default deck copy.

Other useful commands:

```bash
pnpm verify
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm editor:e2e:generate-deck
pnpm prepare:regression-deck
```

`pnpm verify` is the full local gate: lint, unit tests, build, and Playwright e2e.

`pnpm test:e2e` runs the browser regression suite from `packages/editor/e2e/tests`.
The Playwright config runs tests with one worker because the suite shares a generated
deck reset/save cycle. Before the browser starts, it prepares a fresh temporary
regression deck in `.e2e-test-slides/`, serves that deck for the e2e
run, and resets it from an in-memory startup snapshot between tests.

`pnpm editor:e2e:generate-deck` regenerates the same e2e deck and syncs it into
`apps/web/public/sample-slides/` so normal `pnpm dev` starts from the current
regression fixture.

The regression deck module exists to keep tests stable even if the skill surface
evolves. The repo intentionally keeps only two deck copies: the ignored e2e
working copy in `.e2e-test-slides/` and the App default copy in
`apps/web/public/sample-slides/`.

## Generate Slides

The agent-facing generator workflow lives in `skills/starry-slides-skill`. A deck
package should contain `manifest.json`, `slides/`, and optional `assets/`.

Useful skill tool commands:

```bash
pnpm starry:contract:validate -- --input path/to/slides
pnpm starry:contract:annotate -- --input path/to/slides
pnpm starry:contract:manifest -- --input-dir path/to/slides --deck-title "My Deck"
pnpm starry:open
```

To generate the editor regression fixture directly:

```bash
pnpm editor:e2e:generate-deck
```

Generated or installed decks are synced to `apps/web/public/sample-slides/`
when the command is meant to update the App default deck.
The app loads `apps/web/public/sample-slides/manifest.json` through the editor
package import helper. A generated deck is required for the app to render slides.

## Editor Package

`packages/editor` now owns both the interactive editor and the slide-domain helpers
used by the app:

- `src/lib/core/` parses generated decks, enforces the slide contract, and applies
  history-backed slide operations.
- `src/components/` renders the editor shell, floating toolbar, sidebar tool panel,
  stage canvas, overlays, and local UI primitives.
- `src/hooks/` owns interaction state for selection, text editing, keyboard
  shortcuts, block manipulation, and viewport behavior.
- `e2e/` keeps Playwright tests, fixtures, and generator tools together with the
  editor package.

## Protocol Skill

The repo includes a headless slide protocol workflow in `skills/starry-slides-skill`.

It contains:

- `SKILL.md` for agent-facing usage
- `references/contract-protocol/contract-v1.md` for the single editable-slide protocol
- `references/contract-protocol/archetypes.md` for fixed v1 page forms
- `references/contract-protocol/specimen-deck.json` for canonical sample content
- `tools/contract-protocol/*.mjs` for validation, annotation, style-pack creation,
  and manifest generation
- `tools/install-current-deck.mjs` and `tools/open-editor.mjs` for local delivery

Useful commands:

```bash
pnpm starry:contract:create-style-pack -- --out-dir generated/my-style-pack
pnpm starry:contract:validate -- --input skills/slides-style-pack-starter/template/slices
pnpm starry:contract:annotate -- --input path/to/slides
pnpm starry:contract:manifest -- --input-dir skills/slides-style-pack-starter/template/slices --deck-title "Starter Minimal"
```

## Style Pack Starter

`skills/slides-style-pack-starter` is the first v1 visual-layer package.

It does not define a new protocol. Instead, it demonstrates how one style pack:

- implements the fixed v1 archetypes
- uses the shared specimen content forms
- keeps protocol markers embedded in every slice

## Slide Contract

Each slide must follow this contract:

- exactly one slide root marked with `data-slide-root="true"`
- the root must include `data-slide-width="1920"` and `data-slide-height="1080"`
- editable content must use `data-editable="text"`, `data-editable="image"`, or `data-editable="block"`

Example:

```html
<div
  class="slide-container"
  data-slide-root="true"
  data-slide-width="1920"
  data-slide-height="1080"
>
  <h1 data-editable="text">Slide title</h1>
  <p data-editable="text">Slide body</p>
</div>
```

## License

[AGPL-3.0-only](./LICENSE)
