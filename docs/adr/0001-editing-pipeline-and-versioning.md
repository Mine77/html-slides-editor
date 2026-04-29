# ADR-0001: Editing pipeline and versioning strategy

- Status: accepted
- Date: 2026-04-30

## Context

The project is moving from selection-only interactions into real editing, starting with direct text editing inside rendered HTML slides.

That introduces a shared problem for all future editing features:

- user interactions must update the live visual result
- those edits must be written back into the source HTML
- the system will later need undo/redo, save checkpoints, and version history
- the project may later support collaboration, but collaboration is not required for the first editing milestone

Two approaches were considered too early as the primary foundation:

- using `Yjs` immediately to track all editing operations
- using `Git` directly as the mechanism for tracking every edit

These solve different layers of the problem and should not be treated as direct substitutes.

## Decision

The editor will use a layered editing pipeline:

1. User interactions produce editor operations.
2. Operations update in-memory slide state.
3. The updated state is written back into the slide's `htmlSource`.
4. History/version systems consume those operations or resulting snapshots as a separate layer.

The first implementation should use a minimal operation model, starting with text edits such as:

- `text.update`

The initial text editing milestone should support:

- double-click to enter WYSIWYG text editing for a text-marked element
- commit edited text back into `htmlSource`
- local operation/history support as the basis for future undo/redo

The project will not use `Git` as the live editing transport.

The project will not require `Yjs` for the first editing milestone.

## Consequences

Benefits:

- editing logic stays independent from long-term version storage
- future editing features can share one write-back pipeline
- Git can be added later for checkpoint/version history without reshaping the editor core
- Yjs can be added later for real-time collaboration without redefining the document model first

Costs:

- the project must define and maintain an explicit operation schema
- the first version needs a serializer/write-back path for HTML updates
- history exists in a custom local form before any external collaboration or versioning layer is added

## Alternatives considered

### Use Yjs as the first editing foundation

Rejected for now.

Reason:

- useful for collaboration, but too much complexity for the first local editing milestone
- would couple early editor architecture to a collaboration layer before the single-user model is stable

### Use Git to track every edit directly

Rejected for now.

Reason:

- Git is well suited to file-level snapshots and checkpoints
- Git is not well suited to modeling live per-edit UI interactions as the editor's primary state channel
