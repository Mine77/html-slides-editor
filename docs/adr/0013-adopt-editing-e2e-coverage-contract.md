# ADR-0013: Adopt editing E2E coverage contract

- Status: proposed
- Date: 2026-05-06

## Context

The editor has enough interaction surface that unit tests alone no longer prove
release readiness. Recent ADR-0009 work exposed gaps between what the product
promises and what the E2E suite actually verifies: several tests assert that
controls are visible, but not that the corresponding edit operation commits,
writes back to slide HTML, updates selection state, and participates correctly
in undo/redo.

For editing features, "100% E2E coverage" does not mean line coverage. It means
every supported user-facing edit path has at least one browser-level test for
the complete behavior contract:

- the entry point is present in the correct surface
- the command can be invoked by the intended user gesture
- the slide DOM changes as expected
- the editor model and persisted HTML remain consistent
- selection/focus/tooling state updates correctly
- undo and redo restore exact prior and next states when the command is
  undoable
- invalid or irrelevant states do not expose or execute the command

This ADR complements ADR-0001's editing pipeline, ADR-0009's command surface
split, and ADR-0010's group model. It does not replace unit tests for core
operation reducers or HTML transformation helpers.

## Decision

Adopt an editing E2E coverage contract for all editor-facing mutation features.
New editing work is not complete until its E2E coverage proves the contract
across the surfaces that expose the feature.

The E2E suite must cover editing behavior by capability, not just by component.
If a command is exposed through multiple surfaces, each surface needs an E2E
entry-path test, and at least one shared behavior assertion must prove all paths
reach the same operation semantics.

### Required coverage categories

#### Selection and editing modes

E2E must cover:

- selecting text, block, nested text, group, and multi-selection targets
- clearing selection from the stage background
- entering and leaving text editing by double-click, Enter, Escape, blur, and
  outside click where supported
- toolbar and manipulation chrome visibility across selected, dragging,
  resizing, rotating, text-editing, and group-editing states
- commands being unavailable when text editing should use native browser
  behavior

Current coverage is partially present in:

- `e2e/tests/selection.spec.ts`
- `e2e/tests/editor-chrome.spec.ts`
- `e2e/tests/text-editing.spec.ts`
- `e2e/tests/text-editing-history.spec.ts`
- `e2e/tests/block-manipulation.spec.ts`

Known gaps:

- text-editing Cut, Copy, and Paste isolation from Object Clipboard is not
  explicitly covered
- selection and command behavior after switching slides is thinly covered
- toolbar suppression during rotation is not explicitly covered

#### Floating Toolbar controls

Every Floating Toolbar control that commits a style, attribute, or operation
must have an E2E test that invokes the control and verifies the resulting slide
HTML or inline style.

Required style and attribute coverage:

- typography: font family, font size, weight, style, underline,
  strikethrough, line height, text alignment
- appearance: text color, background color, border, border radius, shadow
- layout: width, height, opacity, rotation
- attributes: lock state, link URL, alt text, ARIA label
- custom CSS property add/update/remove behavior

Current coverage is partially present in:

- `e2e/tests/floating-toolbar.spec.ts`

Known gaps:

- underline and strikethrough are not covered
- text color is not covered separately from background color
- box shadow is not covered
- lock state, link URL, alt text, and ARIA label are not covered
- rotation is covered only for setting a non-zero value; clearing rotation and
  preserving existing translate are not covered
- custom CSS removal or overwriting an existing custom property is not covered

#### Arrangement, layout, and organization commands

Every arrangement command must be tested as a real operation, not just as a
visible menu item.

Required coverage:

- Floating Toolbar layer order: bring to front, bring forward, send backward,
  send to back
- Floating Toolbar align to slide: left, horizontal center, right, top,
  vertical center, bottom
- Floating Toolbar distribute: horizontal and vertical distribution for three
  or more selected elements
- Floating Toolbar group and ungroup
- keyboard layer shortcuts
- drag, resize, and rotate manipulation handles
- snap guide behavior during drag and resize where supported

Current coverage is partially present in:

- `e2e/tests/floating-toolbar.spec.ts`
- `e2e/tests/keyboard-and-multiselect.spec.ts`
- `e2e/tests/block-manipulation.spec.ts`

Known gaps:

- Floating Toolbar layer, align, and distribute commands are mostly tested for
  visibility, not effect
- Floating Toolbar ungroup is not covered as an invoked operation
- rotate handle behavior is not covered by E2E
- group rotation or group-specific layout operations are not covered

#### Context Menu commands

Context Menu is a secondary shortcut surface under ADR-0009. It must not be
only visually present; commands must execute correctly.

Required coverage:

- opening the Context Menu from a selected element and multi-selection
- Context Menu Duplicate and Delete visibility and behavior
- Context Menu Group and Ungroup visibility and behavior
- Context Menu Layer, Align, and Distribute visibility and behavior
- disabled or absent commands in irrelevant states, such as Ungroup for a
  normal block
- keyboard navigation and dismissal behavior provided by the Radix/shadcn
  primitive where product-critical

Current coverage:

- no dedicated Context Menu E2E coverage exists.

Known gaps:

- all Context Menu behavior listed above is missing.

#### Keyboard editing commands

Keyboard-first commands need direct tests because they bypass visible toolbar
controls.

Required coverage:

- Delete and Backspace remove selected objects and undo restores them
- Duplicate shortcut duplicates selected objects and selects the duplicate
- object Cut, Copy, and Paste for single and multi-selection
- repeated paste offset and clamping inside slide bounds
- arrow-key movement with normal, Shift, and Alt step sizes
- Escape behavior across selected, text-editing, and group-editing states
- undo and redo stack behavior after keyboard commands

Current coverage is partially present in:

- `e2e/tests/keyboard-and-multiselect.spec.ts`
- `e2e/tests/text-editing-history.spec.ts`
- `e2e/tests/block-manipulation.spec.ts`

Known gaps:

- Duplicate shortcut is not directly covered
- Delete key and Backspace are not both covered across platforms
- Alt-step keyboard movement is not covered
- keyboard commands after group selection are thinly covered

#### Object Clipboard and native text clipboard split

ADR-0009 requires object clipboard behavior to be editor-local while text
editing keeps native browser semantics.

Required coverage:

- object Copy does not write to the system clipboard
- object Paste uses the editor-local Object Clipboard
- object Cut is undoable as copy plus remove
- object Paste creates new element ids and preserves multi-selection relative
  positions
- object Paste selects the inserted objects
- object Paste with an empty Object Clipboard is a no-op
- text-editing Cut, Copy, and Paste operate inside the active text element and
  do not mutate object selection or Object Clipboard state

Current coverage is partially present in:

- `e2e/tests/keyboard-and-multiselect.spec.ts`
- `e2e/tests/text-editing.spec.ts`

Known gaps:

- empty Object Clipboard paste no-op is not covered
- native text clipboard isolation is not explicitly covered
- new id assertions for pasted nested editable children are not explicit

#### Persistence, write-back, and history

Any command that mutates slide content must prove persistence and history
behavior at the highest practical level.

Required coverage:

- inline style and attribute mutations are written to the generated HTML source
  when the editor persists changes
- insert, remove, group, ungroup, layout, text, style, and attribute operations
  are undoable and redoable
- operation batches, such as multi-select delete or paste, undo as one user
  action
- refreshing or reopening the editor preserves committed generated-deck edits
  where the feature claims persistence

Current coverage is partially present in:

- `e2e/tests/text-editing.spec.ts`
- `e2e/tests/text-editing-history.spec.ts`
- `e2e/tests/keyboard-and-multiselect.spec.ts`
- unit tests under `src/core/`

Known gaps:

- toolbar style and attribute edits are not consistently verified after refresh
- grouping, ungrouping, arrangement, and object clipboard persistence after
  refresh are not covered
- redo coverage is stronger for text edits than for object/layout operations

### Coverage acceptance rules

An editing feature is considered E2E-covered only when:

- each supported surface has an invocation test
- at least one test verifies the actual DOM/model effect
- undo and redo are covered for undoable mutations
- irrelevant states hide, disable, or no-op the command as designed
- tests use stable user-facing selectors or `data-testid` hooks, not fragile CSS
  structure
- the test name states the user behavior and expected result

Visibility-only tests are allowed for chrome presence, but they do not count as
operation coverage.

## Implementation Plan

1. Create an E2E coverage matrix document or checklist that maps editor
   capabilities to test files, test names, surfaces, and remaining gaps. This
   may live in `docs/` or near `e2e/tests/`.
2. Add Context Menu E2E tests first, because ADR-0009 currently has no direct
   Context Menu behavior coverage.
3. Add Floating Toolbar operation-effect tests for Layer, Align, Distribute,
   Group, Ungroup, and missing style/attribute controls.
4. Add keyboard tests for Duplicate, Delete key parity, Alt-step movement, and
   group-selection keyboard behavior.
5. Add Object Clipboard isolation tests for empty paste and native text
   Cut/Copy/Paste behavior.
6. Add persistence and undo/redo tests for non-text editing commands that
   currently only have immediate DOM assertions.
7. Keep core operation unit tests for exact HTML transformation edge cases, but
   do not count them as substitutes for user-facing E2E coverage.

Affected paths:

- `e2e/tests/floating-toolbar.spec.ts`
- `e2e/tests/keyboard-and-multiselect.spec.ts`
- `e2e/tests/block-manipulation.spec.ts`
- `e2e/tests/selection.spec.ts`
- `e2e/tests/editor-chrome.spec.ts`
- `e2e/tests/text-editing.spec.ts`
- `e2e/tests/text-editing-history.spec.ts`
- `e2e/tests/helpers.ts`
- `src/editor/components/context-menu.tsx`
- `src/editor/components/floating-toolbar.tsx`
- `src/editor/hooks/use-editor-keyboard-shortcuts.ts`
- `src/core/slide-operations.ts`

## Verification

- [ ] A coverage matrix exists and lists every supported editing command and
      surface.
- [ ] Context Menu commands have E2E behavior tests, not only visibility tests.
- [ ] Floating Toolbar style, attribute, and operation controls have E2E tests
      that assert actual committed effects.
- [ ] Keyboard-first commands have direct E2E tests.
- [ ] Object Clipboard and native text clipboard behavior are explicitly
      separated by E2E tests.
- [ ] Undo and redo are covered for every undoable editing operation category.
- [ ] Persistence after refresh is covered for representative text, style,
      attribute, layout, grouping, and object clipboard mutations.
- [ ] `pnpm exec playwright test` passes for the full E2E suite before this ADR
      can be accepted.

## Consequences

Editing features will take longer to mark complete, because every user-facing
operation must include browser-level coverage. The payoff is that ADR-level
product promises can be verified mechanically instead of relying on manual
smoke testing.

The E2E suite will grow. Tests should be organized by editing capability and
should use helpers for repeated setup, but helpers must not hide the behavior
being verified.

Some currently passing tests will need to be strengthened. In particular,
visibility assertions for command menus should be paired with operation-effect
assertions.

## Alternatives considered

### Keep current ad hoc E2E coverage

Rejected. The current suite catches many regressions, but it leaves major
operation surfaces, especially Context Menu and arrangement commands, without
behavior coverage.

### Rely on unit tests for operation correctness

Rejected as the only strategy. Core unit tests are necessary for exact HTML
transformation behavior, but they do not prove event wiring, focus state,
selection state, browser layout, or persistence from the actual editor UI.

### Require visual snapshot coverage for every edit

Rejected for now. Visual checks are useful for layout regressions, but the
primary editing contract is semantic: operation invocation, DOM/model mutation,
selection state, history, and persistence. Visual regression testing can be
added later as a separate decision.
