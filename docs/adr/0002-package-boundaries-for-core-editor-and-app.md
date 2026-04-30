# ADR-0002: Package boundaries for core, editor, and app

- Status: accepted
- Date: 2026-04-30

## Context

The initial workspace split introduced three packages:

- `packages/core`
- `packages/react`
- `packages/stage`

In practice, `packages/react` only handled slide loading and React state for the app. That created two problems:

- slide import behavior was not reusable outside React components
- product-specific deck loading concerns leaked into reusable packages

The project also needs a cleaner separation for future automation work. The app will keep serving human-driven editing flows, while future AI agents may call core editing methods directly without going through the editor UI.

ADR-0001 already established that editing flows should be based on reusable operations and HTML write-back. The package layout should reinforce that same direction.

## Decision

The workspace will use these package boundaries:

1. `packages/core` provides reusable slide parsing, normalization, import, and mutation methods.
2. `packages/editor` provides the interactive editor UI and calls core methods to apply edits.
3. `apps/web` owns app composition and generated-deck loading policy.

As part of this decision:

- `packages/stage` is renamed to `packages/editor`
- `packages/react` is removed
- manifest-driven slide import moves into `packages/core` as a reusable helper
- the app stops maintaining a built-in sample-slide fallback

## Consequences

Benefits:

- core APIs are reusable by the web app, future automation flows, and non-React callers
- the editor package has a narrower responsibility as the manual editing UI
- product-specific loading policy stays in the app
- the app and E2E suite both exercise the same generated-deck import path

Costs:

- the app now owns a small amount of React loading code
- package rename requires updates across imports, workspace scripts, and docs

## Non-goals

This decision does not:

- define the future AI agent interface in detail
- add a persistence backend beyond current manifest and sample loading
- change ADR-0001's editing pipeline or operation model

## Implementation Plan

- **Affected paths**: `packages/core/src/index.ts`, `packages/editor/`, `apps/web/src/`, `package.json`, `README.md`, `CONTEXT.md`, `docs/adr/README.md`
- **Core changes**: expose a manifest import helper that returns parsed `SlideModel[]` and preserves manifest titles
- **Editor changes**: accept `slides` and `sourceLabel` as props; do not fetch decks or define sample slides internally
- **App changes**: load generated decks through core helpers and surface an error state when no generated deck is available
- **Removal**: delete `packages/react`
- **Naming**: replace `stage package` references with `editor package` where they refer to package/module boundaries

## Verification

- [ ] `packages/core` exports manifest-driven slide import helpers without depending on React
- [ ] `packages/editor` no longer imports from `@html-slides-editor/react`
- [ ] `apps/web` renders generated decks through the new boundaries
- [ ] the workspace builds successfully after removing `packages/react`
- [ ] existing editor interaction tests still pass
