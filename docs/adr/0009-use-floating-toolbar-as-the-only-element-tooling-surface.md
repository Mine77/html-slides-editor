# ADR-0009: Use Floating Toolbar as the only element tooling surface

- Status: accepted
- Date: 2026-05-06

## Context

ADR-0006 chose a shared element tooling model rendered in two mutually exclusive
forms: Floating Toolbar mode and Tool Panel mode. The implementation path proved
too complex for the current editor direction because it doubles interaction
surfaces, parity tests, state transitions, and mode-switching behavior.

## Decision

The editor will use the **Floating Toolbar** as the only active element tooling
surface. The **Sidebar Tool Panel** is removed from the active editor model
rather than maintained as a second form of the same controls.

The shared feature model introduced for toolbar controls may remain useful, but
it should serve the Floating Toolbar directly instead of preserving a
floating-vs-panel mode split.

The **Context Menu** remains as a secondary shortcut surface. Commands such as
Group, Ungroup, Layer, Align, and Distribute should be discoverable from the
Floating Toolbar and also available from the Context Menu when relevant.
Keyboard-first selection commands such as Delete and Duplicate may stay out of
the Floating Toolbar while remaining available through keyboard shortcuts and
the Context Menu.

This establishes the command surface split:

- Floating Toolbar: primary discoverable surface for element tooling, including
  style, attributes, grouping, layer, alignment, distribution, and rotation
- Context Menu: secondary shortcut surface for relevant selection commands
- Keyboard: primary path for keyboard-first commands such as Delete and
  Duplicate

Delete and Duplicate should remain visible in the Context Menu but do not need
Floating Toolbar entries.

## Consequences

Future element editing work should add controls to the Floating Toolbar or its
dropdown panels. Reintroducing a side inspector later requires a new decision
with a distinct purpose; it should not silently revive ADR-0006's mode switch.

Context Menu actions must reuse the same editor/core operation path as toolbar
and keyboard actions. The Context Menu should not become the only visible entry
point for layout, grouping, or arrangement tooling.

The Context Menu implementation should use an existing menu primitive. Prefer
an installed shadcn/Radix ContextMenu component. If the project does not yet
have one, consult the shadcn/Radix registry or official docs and add the
primitive before implementing behavior. Do not hand-write full menu focus,
keyboard navigation, outside-click, and ARIA behavior unless no suitable
primitive exists.

### Object clipboard

First-version object Cut, Copy, and Paste use an editor-local clipboard, not the
system clipboard. Copy stores selected editable element HTML, layout/style
state, and metadata needed to paste with new element ids. Cut copies and removes
the original selection as undoable editor operations. Paste inserts cloned
editable elements into the current slide and preserves multi-selection relative
positions.

The editor-local clipboard is for object selections. Text editing state keeps
using native browser text editing semantics for text Cut, Copy, and Paste.
Cross-tab, cross-application, and cross-deck object clipboard support are
outside the first version.
