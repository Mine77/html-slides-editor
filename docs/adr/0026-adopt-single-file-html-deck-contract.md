# ADR-0026: Replace manifest decks with a single-file custom-tag slide contract

- Status: accepted
- Date: 2026-05-10

## Context

Starry Slides currently treats a deck as a manifest-addressable package:

- `manifest.json` stores deck metadata and slide ordering
- each slide is persisted as its own HTML file
- editor load/save, CLI verify, CLI view, preview rendering, PDF export, and
  HTML export all depend on that multi-file structure

This has turned deck persistence into a shallow seam. Callers need direct
knowledge of manifest shape, slide file paths, hidden-slide metadata, and which
files must be writable for editor operations to succeed.

The next contract needs to simplify that seam:

- one HTML file should be the persisted source of truth for the whole deck
- deck metadata should live in the HTML document, not in a separate manifest
- slide boundaries should be represented by custom tags inside the document, not
  by filesystem boundaries
- runtime loading should happen through normal HTML CSS and JS integration, not
  through contract properties on the custom tags
- asset sources should remain ordinary HTML sources such as remote URLs,
  relative local paths, or inline data URLs

The existing codebase already constrains how this work must land:

- ADR-0001 keeps HTML as the persisted source of truth
- ADR-0007 limits generated deck copies and favors editing the active deck
  artifact in place
- ADR-0011 makes the CLI contract agent-facing and machine-readable
- ADR-0016 keeps planning and browser-safe logic in `src/core`, while file IO
  stays in `src/node`
- ADR-0021 already proves that presenter behavior can be hosted inside one HTML
  document

## Goals

This refactor has the following goals:

1. replace the manifest-plus-multi-file deck contract with one HTML deck file
2. make [STARRY-SLIDES-CONTRACT.md](../../skills/starry-slides/reference/STARRY-SLIDES-CONTRACT.md)
   the only normative source for the new `<slides>` and `<slide>` contract
3. remove the contract requirement for `manifest.json`,
   `data-slide-root="true"`, and per-element `data-editable` markers
4. make all content inside `<slide>` editable by default, with editor behavior
   determined by element type rather than explicit editable markers
5. keep runtime behavior concerns separate from the tag contract so mode choice
   and runtime loading are handled by the loaded runtime, not by `<slides>` or
   `<slide>` properties
6. narrow persistence and permission handling around one primary HTML file plus
   optional supporting assets

## Decision

Adopt a single-file HTML deck contract built around custom tags.

The contract definition itself must live in
[STARRY-SLIDES-CONTRACT.md](../../skills/starry-slides/reference/STARRY-SLIDES-CONTRACT.md).
This ADR does not duplicate the full tag schema. Instead, implementation must
rewrite that contract document so it becomes the source of truth for:

- one `<slides>` root per document
- one or more `<slide>` children inside that root
- deck metadata moved from `manifest.json` onto `<slides>` or `<slide>`
  properties
- all supported properties on `<slides>` and `<slide>`
- runtime loading behavior for remote and inline JS/CSS
- asset loading behavior for remote and inline assets
- default editability of all descendants inside `<slide>`

Implementation must treat the new contract as a replacement, not an additive
side format. Product code should follow the rewritten contract document instead
of preserving manifest-first behavior as the primary path.

## Final Result

After implementation:

1. a deck persists as one HTML file containing `<slides>` and `<slide>` tags
2. the editor loads that one file, parses the custom tags and their
   properties, edits the resulting internal model, and writes the same format
   back out
3. CLI verify, CLI view, preview rendering, PDF export, and HTML export derive
   deck structure from the single HTML file
4. runtime loading and asset source behavior are documented separately from tag
   properties and continue to use normal HTML integration patterns
5. the loaded runtime is responsible for deciding how Presenter mode and Editor
   mode are bootstrapped for a given product context
6. runtime loading and asset handling are represented by the contract
   defined in `skills/starry-slides/reference/STARRY-SLIDES-CONTRACT.md`

Implementation planning for this decision lives in
[single-file-slides-contract-implementation-plan.md](../plan/single-file-slides-contract-implementation-plan.md).

## Verification

- [x] `skills/starry-slides/reference/STARRY-SLIDES-CONTRACT.md` defines the new single-file contract through
      `<slides>` and `<slide>` and no longer describes `manifest.json` as part
      of the primary deck format
- [x] a valid deck can be loaded from one HTML file containing `<slides>` and
      `<slide>`
- [x] editor save writes one deck HTML file instead of coordinating manifest and
      per-slide file writes
- [x] deck metadata previously stored in `manifest.json` is represented through
      `<slides>` and `<slide>` properties
- [x] slide descendants are editable without contract-level `data-editable`
      markers
- [x] verify, view, preview, PDF export, and HTML export all read the new deck
      structure successfully
- [x] runtime loading happens through ordinary HTML CSS and JS integration
      rather than through `<slides>` or `<slide>` source properties
- [x] asset sources continue to work through ordinary HTML element attributes
      such as `src`
- [x] runtime loading and asset handling respect the modes documented in
      `skills/starry-slides/reference/STARRY-SLIDES-CONTRACT.md`

## Consequences

- Product persistence becomes easier to reason about because one HTML document
  owns both deck metadata and slide content.
- The implementation will touch nearly every persistence-facing seam in core,
  node, editor, CLI, and tests.
- The old manifest-first contract should no longer shape new code once this ADR
  is implemented.
