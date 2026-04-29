# HTML Slides Editor Context

## Purpose

`html-slides-editor` is a monorepo for generating and editing HTML slides without converting them into a proprietary document model.

The product goal is to keep HTML as the source of truth while still supporting interactive editing in the browser.

## System Shape

The repo is organized as one product with a small set of package boundaries:

- `apps/web`: the Vite app that hosts the editor UI
- `packages/core`: slide contract, HTML parsing, selector normalization, and source update helpers
- `packages/react`: React-side data loading and bindings for slides
- `packages/stage`: editor stage UI, selection overlays, thumbnails, and style inspection
- `skills/html-slides-generator`: local generator that produces standalone slide decks and syncs the latest output into the app

## Core Model

The central domain object is the `SlideModel` from `packages/core`.

`SlideModel` represents one editable slide with:

- a stable `id`
- a human-facing `title`
- the full `htmlSource`
- a `rootSelector`
- slide `width` and `height`
- a list of editable `elements`

Editable elements are discovered from HTML markers, not from a separate document schema.

## Source Of Truth

The source of truth for a slide is its HTML, stored as `htmlSource`.

The editor may derive runtime state from that HTML, but product decisions should preserve the rule that edits eventually write back into HTML rather than diverging into a separate proprietary model.

This is reinforced by `ADR-0001`.

## Slide Contract

Slides are expected to follow these invariants:

- exactly one slide root marked with `data-slide-root="true"`
- the slide root carries `data-slide-width` and `data-slide-height`
- editable content is marked with `data-editable="text"`, `data-editable="image"`, or `data-editable="block"`
- editor targeting uses `data-editor-id`

`packages/core` normalizes some of this contract by:

- promoting `.slide-container` to a slide root when needed
- filling in default dimensions
- adding stable `data-editor-id` values for editable nodes

When changing parsing or write-back behavior, treat these attributes as product-level contracts, not incidental implementation details.

## Current Editing Direction

The current editor is moving from selection and inspection toward direct editing.

The accepted architectural direction is:

1. user interaction produces editor operations
2. operations update in-memory slide state
3. updated state writes back into `htmlSource`
4. history or versioning layers sit on top of that pipeline

For the authoritative wording and constraints, read `docs/adr/0001-editing-pipeline-and-versioning.md` before changing editing architecture.

## Generated Decks

The web app prefers generated content from `apps/web/public/generated/current/manifest.json`.

If no generated deck exists, the app falls back to built-in sample slides.

This means there are two common content sources during development:

- generated decks synced by `pnpm generate:slides`
- built-in sample slides used as a fallback

Changes to loading behavior should preserve that fallback path unless a newer ADR says otherwise.

## Package Responsibilities

Use these boundaries when adding code:

- put parsing, normalization, HTML mutation, and slide-contract logic in `packages/core`
- put React data-loading hooks and app-facing bindings in `packages/react`
- put stage presentation, selection UI, inspector UI, and thumbnail rendering in `packages/stage`
- keep `apps/web` thin; it should compose the editor rather than own core editing logic

If a change redefines these boundaries, add or update an ADR.

## Terms To Use

Prefer these repo terms in issues, ADRs, tests, and code comments:

- `slide`: one HTML slide and its derived runtime model
- `slide root`: the element marked by `data-slide-root`
- `editable element`: an element marked by `data-editable`
- `htmlSource`: the persisted HTML string for a slide
- `stage`: the visual editing canvas/UI
- `generated deck`: slides produced by the local generator and loaded from `public/generated/current`

Avoid introducing new synonyms for these concepts unless the project deliberately renames them.

## ADR Triggers

Consult `docs/adr/` before changing:

- editing architecture
- HTML write-back or persistence behavior
- undo/redo, checkpoints, or version history
- collaboration model
- package boundaries or major module responsibilities

If a change in those areas introduces a new decision or contradicts an accepted ADR, update the ADR set as part of the same work.
