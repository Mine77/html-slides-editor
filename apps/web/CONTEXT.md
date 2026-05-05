# Web App Context

## Purpose

`apps/web` owns app composition and runtime loading behavior for the editor.

Shared roadmap lives in
[ROADMAP.md](/Users/haichao/code/starry-slides/ROADMAP.md).

This package is responsible for:

- loading slide data for the browser app
- composing the editor package into the application shell
- enforcing generated-deck loading policy
- surfacing app-level loading and error states

## Content Sources

The app loads its default sample deck from:

- `apps/web/public/sample-slides/manifest.json`

`@starry-slides/editor` provides import helpers for reading manifest-driven decks.

Editor e2e runs use an ignored temporary deck in `.e2e-test-slides/`.
That directory is served only when the Vite process runs with
`STARRY_SLIDES_DECK_SOURCE=e2e`. Normal `pnpm dev` serves
`apps/web/public/sample-slides/`.

The app does not maintain a fallback deck. Sample slides or an installed deck are required.

## Package Boundary

`apps/web` owns:

- app composition
- generated-deck loading policy
- runtime integration with `@starry-slides/editor`

`apps/web` does not own:

- reusable parsing or mutation logic
- reusable editing operations
- editor interaction semantics

If a change redefines these responsibilities, update the ADRs.
