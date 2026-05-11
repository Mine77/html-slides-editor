# ADR-0026: Adopt V1 deck contract and track CLI and editor refactors

- Status: proposed
- Date: 2026-05-11

## Context

The Starry Slides deck contract has been rewritten into a simpler V1 form.

This updated contract is now the single source of truth for deck structure,
manifest structure, per-slide HTML structure, root-node behavior, editable
markers, and grouping semantics.

At this stage, the main problem is no longer defining the contract. The main
problem is implementation alignment.

The current CLI and editor behavior still reflects older assumptions, while the
contract has already moved to the new V1 model.

This ADR exists to record that contract change and to make the follow-up
implementation work explicit.

## Decision

Starry Slides adopts the current V1 deck contract as the only deck contract.

From this point onward:

- CLI verification should validate decks against this V1 contract
- CLI preview and open flows should interpret decks through this V1 contract
- editor parsing should read decks through this V1 contract
- editor operations should preserve and write back decks in this V1 contract

This ADR does not introduce a second contract.

Its purpose is to record that the contract has changed and to identify which
implementation areas must now be updated.

## V1 Contract Areas Now Considered Decided

The current contract now defines these points:

- a deck is a directory with `manifest.json` and slide HTML files
- `deckTitle` is required
- `description` is required
- `manifest.slides[*].title` is required
- `generatedAt` may be omitted in authored source
- each slide HTML file uses `body` as the slide root
- root size is defined only by direct fixed numeric `width` and `height` on
  `body`
- omitted root size defaults to `1920 x 1080`
- any other sizing method is treated as not specified
- root overflow is forbidden
- editable elements use `data-editable`
- editable identity uses `data-editable-id`
- grouping semantics are expressed structurally through `data-editable="block"`

## Consequences

This decision changes the implementation target for both the CLI and the
editor.

That means:

- old parsing and verification assumptions must be updated
- old editable-id naming must be updated
- tests must be rewritten to match the new contract
- editor write-back must preserve the new V1 structure

## Non-goals

This ADR does not define the exact code patch for each subsystem.

This ADR also does not try to preserve old contract assumptions as part of the
new specification.

## Implementation Plan

### Documentation

- [x] Rewrite `skills/starry-slides/references/STARRY-SLIDES-CONTRACT.md`
- [x] Simplify `skills/starry-slides/SKILL.md`
- [x] Add `skills/starry-slides/references/STARRY-SLIDES-CLI-USAGE.md`
- [x] Keep the contract examples and wording aligned with V1 behavior

### CLI refactors

- [ ] Update manifest loading and validation to require `deckTitle`
- [ ] Update manifest loading and validation to require `description`
- [ ] Update manifest loading and validation to require per-slide `title`
- [ ] Update root discovery so verification starts from `body`
- [ ] Update root sizing logic so it reads direct fixed numeric CSS width and
  height from `body`
- [ ] Apply the default root size `1920 x 1080` when direct size is omitted
- [ ] Treat indirect root sizing methods as unspecified
- [ ] Treat root overflow as a verification failure
- [ ] Rename verification and preview support from `data-editor-id` to
  `data-editable-id`
- [ ] Update view rendering and preview generation to follow the V1 root model
- [ ] Decide and implement the write-back flow for `generatedAt`
- [ ] Rewrite CLI tests and verification tests to match the V1 contract

### Editor refactors

- [ ] Update slide parsing so the editor uses `body` as the slide root
- [ ] Update editor document modeling to follow the V1 root size rules
- [ ] Apply the default root size `1920 x 1080` when direct size is omitted
- [ ] Rename editable identity handling from `data-editor-id` to
  `data-editable-id`
- [ ] Update selection logic to use the new editable identity name
- [ ] Update write-back so edited decks preserve the V1 contract
- [ ] Remove old group-marker assumptions from editor logic
- [ ] Make group and ungroup behavior depend on structural block composition
- [ ] Review resize, movement, and geometry logic against the V1 root and block
  rules
- [ ] Rewrite editor tests to match the V1 contract

### E2E refactors

- [ ] Update the regression deck generator so it writes manifest fields that
  match the V1 contract, including `deckTitle` and `description`
- [ ] Update generated regression slide HTML so it uses the V1 root model with
  `body` as the slide root
- [ ] Update generated regression slide HTML so editable identity uses
  `data-editable-id`
- [ ] Remove old root-marker assumptions from E2E fixtures and fixture helpers
- [ ] Update Playwright helpers that currently query the old slide root or old
  editable-id naming
- [ ] Update Playwright specs that currently target `data-editor-id`
- [ ] Update presenter-mode E2E assertions so slide-root checks use the V1
  `body` model
- [ ] Update E2E regression content that still depends on old group-marker
  behavior
- [ ] Update `docs/e2e.md` so the documented coverage matrix matches the new V1
  contract assumptions
- [ ] Update local development docs and deck-generation guidance where they
  still describe old sample-deck assumptions
- [ ] Rebuild the sample and regression decks used by E2E so they become valid
  V1 decks
- [ ] Re-run and fix `pnpm test:e2e` against the V1 contract

### Shared follow-up

- [ ] Update any shared core parsing utilities that still assume old root or id
  conventions
- [ ] Review preview/export paths for V1 contract alignment
- [ ] Review existing ADRs that mention old grouping or old slide-root
  assumptions

## Verification

- [ ] CLI `verify` reports results according to the V1 contract
- [ ] CLI `view` renders previews according to the V1 contract
- [ ] CLI `open` only opens decks that satisfy the V1 contract
- [ ] Editor can open, edit, and write back decks that follow the V1 contract
- [ ] Contract examples, CLI behavior, and editor behavior all agree
