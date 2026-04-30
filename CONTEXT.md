# HTML Slides Editor Context

## Purpose

`html-slides-editor` edits HTML slides directly in the browser without converting them into a proprietary document model.

The product rule is simple: HTML stays the source of truth.

## Working Agreement

Every implementation task is only complete when both commands pass:

- `pnpm lint`
- `pnpm build`

Run both before closing a task, even for small UI fixes.

## Testing Expectations

Default rule: any user-triggered interaction that changes editor state, selection state,
editing state, history state, or persisted document content should add or update tests.

Use this coverage bar:

- each interaction feature should have at least one happy-path test
- each interaction feature should have at least one protection test for misfire, data loss, or unwanted state changes
- each bug fix should add a regression test when there is a reasonable seam

Choose the narrowest useful test layer:

- browser tests for end-to-end interaction flows
- `packages/core` tests for parsing, operations, HTML write-back, and inversion logic
- pure visual or copy-only changes do not require tests unless they touch a critical interaction

Current browser regression policy:

- `pnpm test:e2e` must generate a fresh deck with `skills/html-slides-generator`
- the app must load that generated deck through the normal manifest import path
- E2E coverage should prefer this generated-deck path over sample-slide-only shortcuts

## Core Domain

The central object is `SlideModel` in `packages/core`:

- `id`
- `title`
- `htmlSource`
- `rootSelector`
- `width` / `height`
- `elements`

`htmlSource` is the persisted slide state. Runtime state may be derived from it, but edits must write back into HTML.

## Slide Contract

Slides must preserve these attributes:

- one slide root marked with `data-slide-root="true"`
- root dimensions via `data-slide-width` and `data-slide-height`
- editable nodes marked with `data-editable="text" | "image" | "block"`
- stable editor targeting through `data-editor-id`

Treat these as product contracts, not incidental DOM details.

## Editing Direction

Per ADR-0001, editing follows this pipeline:

1. user interaction produces editor operations
2. operations update in-memory slide state
3. updated state writes back into `htmlSource`
4. history/versioning layers sit on top

The shared document history model is part of `packages/core`, so user-driven UI edits and future agent-driven edits can use the same undo/redo semantics.

For editing architecture changes, read [docs/adr/0001-editing-pipeline-and-versioning.md](/Users/haichao/code/html-slides-editor/docs/adr/0001-editing-pipeline-and-versioning.md) first.

## Content Sources

The app prefers generated decks from `apps/web/public/generated/current/manifest.json`.

`packages/core` provides import helpers for reading manifest-driven decks.

The app does not maintain a sample-slide fallback. A generated deck is required.

## Package Boundaries

- `packages/core`: parsing, normalization, HTML mutation, slide contract, reusable slide import helpers, document operations, shared history state/reducer
- `packages/editor`: editor UI, overlays, inspector, thumbnails, editing interactions, transient UI session state; consumes core APIs
- `apps/web`: app composition and generated-deck loading policy

If a change redefines these responsibilities, update the ADRs.

## Preferred Terms

Use these repo terms consistently:

- `slide`
- `slide root`
- `editable element`
- `htmlSource`
- `editor`
- `generated deck`

## ADR Triggers

Check `docs/adr/` before changing:

- editing architecture
- HTML write-back or persistence
- undo/redo, checkpoints, or version history
- collaboration model
- package boundaries
