# HTML Slides Editor Context

## Purpose

`html-slides-editor` edits HTML slides directly in the browser without converting them into a proprietary document model.

The product rule is simple: HTML stays the source of truth.

## Working Agreement

Every implementation task is only complete when the full verification command passes:

- `pnpm verify`

`pnpm verify` currently runs:

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`

Run it before closing a task, even for small UI fixes or document changes that affect product workflow expectations.

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
- when a change is considered complete, the default expectation is that `pnpm verify` has been run successfully

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

## Roadmap Draft

This roadmap is a working draft for the next editor milestones. It reflects the
current direction:

- prioritize editor tools and editor interactions before broader persistence or collaboration work
- ship editing features as vertical slices
- for each slice, build the core tool first, then the editor interaction, then the regression coverage
- keep mutation logic and operation semantics in `packages/core`
- keep transient interaction state and UI behavior in `packages/editor`

Current implementation status:

- text double-click editing is partially implemented
- local undo/redo for committed text edits is implemented
- the style inspector currently reads computed CSS but does not edit styles yet
- layout editing primitives exist only in early utility form and are not yet a full user workflow

Planned sequence:

1. Finish and harden text editing as the first complete editing slice.
2. Add CSS property editing for a selected editable element.
3. Add layout editing based on drag-and-drop interactions.

Each slice should follow the same delivery order:

1. add or extend a reusable core operation and HTML write-back tool in `packages/core`
2. add or extend unit tests in `packages/core`
3. wire the operation into editor interaction flows in `packages/editor`
4. add or extend E2E regression coverage for the user-visible behavior
5. keep `pnpm verify` passing before closing the slice

### Milestone 1: Text Editing Completion

Goal:

- make text editing the reference implementation for the editor operation pipeline

Scope:

- keep double-click to enter text editing
- keep commit and cancel behavior stable
- harden selection, focus, and history edge cases
- confirm HTML write-back remains the source of truth after every committed text edit

Exit criteria:

- text editing behaves predictably across click, double-click, blur, Enter, and Escape flows
- committed text changes always update `htmlSource`
- undo and redo remain correct after repeated text edits
- regression coverage exists for both happy paths and protection paths

### Milestone 2: CSS Property Editing

Goal:

- allow editing CSS properties for a selected editable element without breaking the HTML-first model

Scope:

- define a first supported set of editable CSS properties
- apply CSS changes to the selected element through core operations
- write updated styles back into slide HTML
- expose a basic inspector-driven interaction model in the editor

Likely first property groups:

- spacing and box model
- typography
- color and background
- border and radius
- size and positioning where safe

Exit criteria:

- a selected editable element can change supported CSS properties through the editor UI
- CSS edits participate in the same undo/redo model as text edits
- the supported property set is explicit and testable
- regression coverage protects against wrong-target edits and data loss

### Milestone 3: Layout Editing

Goal:

- support layout changes through direct manipulation while preserving predictable HTML write-back

Scope:

- start with drag-and-drop driven layout adjustment for selected editable elements
- define which layout moves are allowed in the first version
- translate stage-space drag interactions into stable slide-space updates
- reuse shared geometry and operation logic from `packages/core`

Questions to resolve during this milestone:

- whether the first layout model updates `transform`, positional properties, or another constrained layout representation
- which editable element types can move in v1
- how snapping, bounds, and collision rules should work

Exit criteria:

- dragging a supported element produces a persisted layout change
- the first layout interaction model is constrained enough to be predictable
- layout operations can be undone and redone
- E2E coverage protects against wrong-target drags and drift between stage and persisted HTML

## Todo List Draft

### Now

- [ ] treat text editing as milestone 1 and finish the remaining product polish around the current implementation
- [ ] document the exact acceptance scope for text editing v1
- [ ] identify any missing text-editing protection tests in E2E
- [ ] identify whether `packages/core` needs a broader operation shape before CSS and layout work begin

### Next

- [ ] define the first CSS property editing scope, including the supported property whitelist
- [ ] design a core CSS mutation API that updates one selected editable element at a time
- [ ] add unit tests for CSS write-back, inversion, and history behavior
- [ ] design the first inspector interaction model for CSS edits
- [ ] add E2E regression coverage for CSS property editing

### After That

- [ ] define the first layout editing model and its constraints
- [ ] decide the persisted representation for layout moves in HTML
- [ ] add core layout operations and geometry tests
- [ ] add editor drag-and-drop interactions for supported elements
- [ ] add E2E regression coverage for layout editing

### Cross-Cutting Rules For New Editing Features

- [ ] every user-triggered state-changing interaction should have at least one happy-path regression test
- [ ] every user-triggered state-changing interaction should have at least one protection test
- [ ] core editing behavior should be validated with focused unit tests before wiring UI
- [ ] new editing features should reuse the shared history pipeline instead of inventing feature-local history models
- [ ] completed work should end with a successful `pnpm verify` run unless the user explicitly agrees to a narrower check
- [ ] any change to editing architecture, persistence semantics, collaboration direction, or package boundaries should trigger an ADR review

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
