---
description: HTML contract for Starry Slides single-file decks
version: 1
---

# Slides Contract

This document defines the HTML contract for Starry Slides.

The same deck file should be usable by both product runtimes and agent tooling:

- the editor/presenter runtime can load and parse the file, and also can edit and write it back to the file
- AI agents can verify it and generate previews from it with supported CLI tooling


## Overview

A deck is one self-contained HTML file plus optional supporting assets.

```text
single-file.html
├── <slides>
│   ├── <slide> ... </slide>
│   └── <slide> ... </slide>
├── <runtime-style>   runtime CSS, inline or load from a remote URL
├── <runtime-script>   runtime JS, inline or load from a remote URL
└── assets     assets, inline BASE64 or load from a remote URL
```

The contract is based on two custom tags:

- `<slides>` is the deck root and carries deck-level properties
- `<slide>` is one presentation page and carries slide-level properties

Runtime code is responsible for interpreting these custom tags and turning them into editing or presentation behavior.

## `<slides>`

`<slides>` is the root container for the deck. It defines deck-level metadata
and default sizing for child slides.

| Property       | Required | Type                     | Default         | Description                                                                     |
| -------------- | -------- | ------------------------ | --------------- | ------------------------------------------------------------------------------- |
| `title`        | no       | string                   | `Untitled deck` | Human-readable title for the deck.                                              |
| `description`  | no       | string                   | empty           | Description or summary of the deck.                                             |
| `generated-at` | no       | ISO-8601 datetime string | empty           | Timestamp for when the deck was generated.                                      |
| `width`        | no       | positive integer         | `1920`          | Default slide width used by child `<slide>` tags when they do not override it.  |
| `height`       | no       | positive integer         | `1080`          | Default slide height used by child `<slide>` tags when they do not override it. |

## `<slide>`

`<slide>` represents one slide page. It carries slide-level metadata, layout
configuration, and the authored slide content itself.

Editing support is determined by a contract-level tag whitelist. Elements in the
supported tag list are currently editable. Elements outside the list are
currently treated as non-editable authored content.

`data-editable` is not part of this contract and must not appear in authored
deck HTML.

| Property       | Required | Type              | Default | Description                                                           |
| -------------- | -------- | ----------------- | ------- | --------------------------------------------------------------------- |
| `id`           | yes      | string            | none    | Stable identifier for the slide.                                      |
| `title`        | yes      | string            | none    | Human-readable slide title.                                           |
| `slide-hidden` | no       | `true` or `false` | `false` | Visibility flag for runtimes that support hidden slides.              |
| `archetype`    | no       | string            | empty   | Optional archetype hint such as `title`, `comparison`, or `timeline`. |
| `notes`        | no       | string            | empty   | Optional presenter or authoring notes.                                |

## Editable Tags

These tags are currently supported as editable elements inside `<slide>`.

### Text Editables

`a`, `b`, `blockquote`, `caption`, `cite`, `code`, `dd`, `dt`, `em`,
`figcaption`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `i`, `label`, `li`, `mark`,
`p`, `pre`, `small`, `span`, `strong`, `td`, `th`, `time`

### Block Editables

`article`, `aside`, `button`, `details`, `dialog`, `div`, `dl`, `figure`,
`footer`, `form`, `header`, `main`, `nav`, `ol`, `section`, `summary`, `table`,
`tbody`, `tfoot`, `thead`, `tr`, `ul`

### Image Editables

`canvas`, `img`, `svg`, `video`

## Non-Editable Tags

Any tag not listed in the editable tag whitelist is currently non-editable.

This includes:

- custom elements not explicitly added to the whitelist
- structural wrapper elements outside the whitelist
- metadata/runtime tags such as `<script>`, `<style>`, `<link>`, and `<meta>`

## Group Semantics

`data-group="true"` is runtime metadata for block grouping and is only valid on
supported block-editable tags.

## Runtime

The deck file may load runtime code in either of these ways:

- remote loading through normal HTML tags such as `<script src="...">` and
  `<link rel="stylesheet" href="...">`
- inline loading through normal HTML `<script>` and `<style>` tags embedded in
  the document

Once the runtime code is loaded, it should automatically discover and interpret
the `<slides>` and `<slide>` tags in the document.

Presenter mode and Editor mode may be provided by the same runtime bundle. 

The contract only requires that the loaded runtime can recognize the document structure and bootstrap the supported mode behavior.

## Asset Sources

Asset source handling is also expressed through normal HTML semantics.

Asset elements such as `<img>` or `<video>` may point to:

- remote URLs
- relative local paths
- inline data URLs such as base64-encoded media

The runtime should use whatever src the authored document provides.
