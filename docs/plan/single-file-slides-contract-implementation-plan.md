# Single-File Slides Contract Implementation Plan

Status:

- Proposed

Related decision:

- [ADR-0026: Replace manifest decks with a single-file custom-tag slide contract](../adr/0026-adopt-single-file-html-deck-contract.md)

Goal:

- Migrate Starry Slides from the current manifest-plus-multi-file deck format to
  the single-file `<slides>` / `<slide>` contract defined in
  [slides-contract.md](../slides-contract.md).

Planning principles:

- Change the deepest seams first so outer layers can reuse one core contract
  parser and serializer.
- Keep `src/core` browser-safe.
- Do not introduce a second proprietary persistence format.
- Move runtime integration details out of tag properties and keep them in normal
  HTML `<script>`, `<link>`, and `<style>` usage.

## Sequence

### Step 1: Finalize the contract document

Outcome:

- `docs/slides-contract.md` is stable enough to guide implementation.

Tasks:

- confirm the `<slides>` properties we will support in v1
- confirm the `<slide>` properties we will support in v1
- confirm runtime loading and asset-source sections are descriptive only and not
  tag-property definitions
- remove any remaining docs that describe `manifest.json`, per-slide HTML
  files, `data-slide-root`, or `data-editable` as part of the primary format

Primary files:

- `docs/slides-contract.md`
- `docs/development.md`
- `docs/contributing.md`
- `README.md`

### Step 2: Introduce a core deck-document model

Outcome:

- one core module can parse, inspect, and serialize a full deck HTML document

Tasks:

- replace manifest-oriented deck types in `src/core/slide-contract.ts`
- define a deck-document type that includes:
  - deck metadata from `<slides>`
  - ordered slide records from direct child `<slide>` elements
  - raw source HTML for full-document write-back
- update `src/core/index.ts` exports for the new seam
- add narrow unit tests for parsing and serialization

Primary files:

- `src/core/slide-contract.ts`
- `src/core/index.ts`
- new or updated core tests

### Step 3: Rewrite HTML parsing and write-back helpers

Outcome:

- core parsing no longer depends on `data-slide-root="true"` or
  `data-editable`

Tasks:

- update `src/core/generated-deck.ts` so it loads one HTML document instead of
  a manifest plus slide files
- update `src/core/slide-document.ts` to parse from `<slide>` elements
- update `src/core/slide-html-document.ts` so it can replace or mutate one
  `<slide>` inside the parent `<slides>` document
- remove assumptions that `SlideModel.sourceFile` is the persistence location

Primary files:

- `src/core/generated-deck.ts`
- `src/core/slide-document.ts`
- `src/core/slide-html-document.ts`
- related core tests

### Step 4: Redefine editable discovery

Outcome:

- editor-facing slide parsing derives editable candidates from normal HTML
  descendants inside `<slide>`

Tasks:

- stop using `data-editable` as the contract-level filter for editable nodes
- define element classification rules for:
  - text-like elements
  - media elements
  - layout/container elements
- derive stable internal element ids during parsing when authored markers are
  absent
- update tests that currently assume authored `data-editable` markers

Primary files:

- `src/core/slide-document.ts`
- `src/core/slide-operations-helpers.ts`
- `src/editor` hooks and helpers that depend on editable discovery
- related tests

### Step 5: Move deck operations to document-order semantics

Outcome:

- create, duplicate, delete, hide, rename, and reorder all operate on slide ids
  and document order instead of file paths

Tasks:

- remove per-slide output file synthesis from deck operations
- update history and reducers to work on slide ids and ordered deck state
- ensure deck mutations produce one updated deck document for persistence

Primary files:

- `src/core/deck-slide-operations.ts`
- `src/core/history.ts`
- `src/core/slide-operation-reducer.ts`
- related tests

### Step 6: Migrate editor load/save

Outcome:

- the editor reads and writes one HTML deck file

Tasks:

- update `src/editor/app/use-slides-data.ts` to fetch one deck HTML document
- replace `/deck/manifest.json` assumptions with a single deck payload
- replace per-slide save payloads with one serialized deck document
- keep editor state as ordered slides plus deck metadata, but flush through the
  core serializer

Primary files:

- `src/editor/app/use-slides-data.ts`
- `src/node/deck-runtime-middleware.ts`
- editor tests and E2E tests

### Step 7: Migrate runtime preview, export, and CLI

Outcome:

- preview, verify, PDF export, and HTML export all consume the same core
  single-file deck seam

Tasks:

- update `src/node/view-renderer.ts` to derive slide order, title, hidden
  state, and size from the parsed `<slides>` document
- update `src/node/pdf-export.ts` to consume ordered slide records from the new
  seam
- update `src/node/html-export.ts` to consume the single-file source instead of
  manifest traversal
- update CLI commands to target the new deck format

Primary files:

- `src/node/view-renderer.ts`
- `src/node/pdf-export.ts`
- `src/node/html-export.ts`
- `src/cli/commands/open/action.ts`
- `src/cli/commands/view/action.ts`
- `src/cli/commands/verify/action.ts`
- node and CLI tests

### Step 8: Align presenter and editor runtimes

Outcome:

- both runtimes discover the same deck shape from `<slides>` and `<slide>`

Tasks:

- remove runtime bootstrap assumptions tied to manifest entries or standalone
  slide files
- ensure runtime bootstrapping works with ordinary HTML script and style
  loading
- confirm Presenter and Editor bootstrapping paths both discover the same deck
  document shape

Primary files:

- `src/editor/components/presenter-view.tsx`
- `src/core/html-export.ts`
- any runtime bootstrap code touched during implementation

### Step 9: Rewrite fixtures and tests

Outcome:

- automated coverage proves the new deck contract instead of the old one

Tasks:

- rewrite `tests/helpers/deck-fixtures.ts` to emit one HTML deck file
- rewrite `e2e/tools/generate-regression-deck.mjs` to generate a single custom
  tag document
- update core tests that currently assert manifest-driven behavior
- update node and CLI tests that currently assert manifest paths and slide files
- update E2E tests that currently read `/deck/manifest.json`
- update `docs/e2e.md` if the documented coverage inventory changes

Primary files:

- `tests/helpers/deck-fixtures.ts`
- `e2e/tools/generate-regression-deck.mjs`
- relevant core, node, CLI, and E2E tests
- `docs/e2e.md`

## Suggested issue breakdown

These are the recommended implementation slices to track as separate issues or
work items.

1. Contract and docs cleanup
   - Finish `docs/slides-contract.md`
   - Remove old manifest-first documentation references

2. Core deck-document types and serializer
   - Add the single-file deck-document seam in `src/core`
   - Add parse and serialize coverage

3. Core slide parsing and editable discovery
   - Parse `<slide>` content
   - Replace contract-level `data-editable` assumptions

4. Deck operations and history migration
   - Remove `sourceFile`-driven deck mutation behavior
   - Rebase deck operations onto slide ids and document order

5. Editor load/save migration
   - Fetch and save one deck HTML file
   - Replace manifest-oriented middleware payloads

6. Runtime preview and CLI migration
   - Move verify/view/open onto the new seam
   - Update preview and export behavior

7. Presenter/editor runtime alignment
   - Ensure both runtimes discover `<slides>` and `<slide>` consistently

8. Fixtures, tests, and E2E migration
   - Rewrite deck fixtures and regression generators
   - Update coverage and docs

## Validation checklist

- [ ] One HTML deck file can be parsed into ordered slides plus deck metadata
- [ ] One edited slide can be written back into the parent deck document
- [ ] Editor save writes a single deck HTML artifact
- [ ] Verify/view/export flows no longer depend on `manifest.json`
- [ ] Runtime bootstrap does not depend on custom-tag source properties
- [ ] Existing coverage has been migrated to the single-file contract
