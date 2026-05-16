# Product Integration Reference

This document explains how a product repository should use the Starry Slides
open-source packages.

## Purpose

- reuse the slide-domain logic and editor UI from the open-source repo
- keep product concerns such as auth, billing, workspace storage, and remote
  rendering outside the shared OSS packages
- preserve the ability to swap local rendering for server-side rendering later

## Public Components

Use these OSS packages as the only supported integration surface:

```ts
import { ... } from "@starrykit/slides-core";
import { SlidesEditor } from "@starrykit/slides-editor";
```

- `@starrykit/slides-core`
  - slide contract parsing and validation
  - document/history/operation logic
  - export planning and selection rules
  - render planning data

- `@starrykit/slides-editor`
  - the React editor UI
  - slide canvas, selection, toolbar, sidebar, and history UI
  - host-driven callbacks for save, export, agent actions, and deck switching

- `starry-slides`
  - keep this only as the open-source CLI/runtime package for local use
  - do not make the product app depend on its local CLI/server implementation

## Product Module Mapping

### Workspace

Use product-owned persistence for deck lists, folders, metadata, sharing state,
and version history.

Use `slides-core` only for reading and writing slide HTML and for applying
editor operations to deck data.

### Editor Page

Embed `SlidesEditor` inside the product editor route.

The host should provide:

- current slides
- deck title
- save callbacks
- export callbacks
- agent action callbacks
- loading and saving state

The editor should not own auth, billing, workspace navigation, or database
access.

### Agent Workflow

Use `slides-core` for:

- validating generated or modified slide HTML
- resolving selection scopes
- applying structured edit operations when possible
- planning exports or previews before execution

Use the product backend for:

- calling the model provider
- storing prompts, proposals, and audit records
- approving or rejecting changes
- persisting accepted results

### Preview and Export

Keep the planning contract in `slides-core`, but execute rendering in the
product backend.

Recommended flow:

1. product UI requests a preview or export
2. backend uses `slides-core` to resolve the requested slides and render plan
3. backend renders with its own worker or executor
4. backend stores the result and returns an API response to the UI

This lets the product replace the open-source local renderer with a server-side
executor without changing editor state management or export semantics.

### Upload and Asset Handling

Use product-owned storage for uploaded images, source files, generated assets,
and deck snapshots.

Use `slides-core` only to normalize paths, validate contract rules, and preserve
the HTML-first deck model.

## Recommended Integration Pattern

```ts
import { validateDeck, planPdfExport } from "@starrykit/slides-core";
import { SlidesEditor } from "@starrykit/slides-editor";

const result = validateDeck(deckHtml);
const plan = planPdfExport({ slides, selection });
```

- keep all product-specific I/O outside the OSS packages
- pass data into the editor as props, not as hidden globals
- keep remote rendering and local rendering interchangeable behind a product
  service boundary

## What Not to Depend On

- local CLI process spawning
- browser launcher internals
- file-system deck mounts
- Playwright or Chromium runtime details
- root-package private modules under `src/`
- product auth or billing logic inside OSS packages

## Upgrade Model

- pin OSS packages by SemVer
- update `slides-core` and `slides-editor` together when an API change affects
  both
- treat `starry-slides` as a compatibility and runtime package, not as the
  product app's architecture foundation

