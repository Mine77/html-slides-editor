<div align="center">

# HTML Slides Editor

**The Best Editor for AI Agent Generated Slides.**

<p>
  <a href="./idea.en.md">Project Idea</a>
  ·
  <a href="./idea.zh.md">项目方案（中文）</a>
</p>

</div>

## Overview

HTML Slides Editor is a project built around a simple belief: if modern presentation tools increasingly render slides as HTML, with the help of AI, then HTML itself should be a first-class format for creation and editing.

The project is centered on a two-part workflow:

- Generate a beautiful slides with AI agents
- edit those slides visually without converting them into a proprietary document model
- (futuer) present the slides

### Design Principles

- HTML stays the source of truth
- editing should be visual, but not format-locking
- output should remain portable and inspectable
- the system should work well with AI generation, not against it

## Why It Exists

There is no strong open source answer today for directly editing arbitrary AI-generated HTML slides in a WYSIWYG workflow.

Most existing slide editors fall into one of two camps:

- they produce polished output, but lock editing into a private internal format
- they stay close to the web platform, but do not provide a serious visual editing model

HTML Slides Editor is aimed at that gap.


## Core Idea

- English idea doc: [idea.en.md](./idea.en.md)
- Chinese idea doc: [idea.zh.md](./idea.zh.md)

## Project Status

The project now has an initial workspace scaffold for the three core parts:

- `skills/html-slides-generator`: generation-side skill spec, prompt template, and example outputs
- `packages/core`: parser, slide contract, and HTML update primitives
- `packages/react`: React-facing hooks and bindings
- `packages/stage`: the actual editor stage UI built on top of `core` and `react`
- `apps/web`: Vite + React example app that mounts the stage package

The current focus is still on refining the editing primitives and implementation strategy, but the repo is no longer doc-only.


## Roadmap Direction

The current direction includes:

- a generation-side skill for structured HTML slides
- a browser-based editor built around `iframe` + `Konva`
- a data model that can support selection, movement, text editing, history, and export

The full breakdown lives in the idea docs rather than being duplicated here.

## Workspace Layout

```text
apps/
  web/                         React + Vite example app
packages/
  core/                        Headless slide model and parser
  react/                       React bindings
  stage/                       Editor stage UI
skills/
  html-slides-generator/       Prompt spec, rules, and examples
```

## Local Development

```bash
pnpm install
pnpm dev
```

`pnpm dev` now runs the workspace in linked watch mode:

- `packages/core` watch build
- `packages/react` watch build
- `packages/stage` watch build
- `apps/web` Vite dev server

So changes in the packages can flow into the app without manually re-running a full build.

Useful commands:

```bash
pnpm build
pnpm generate:slides -- --topic "HTML Slides Editor"
```

## Run The Skill

The current skill is a local slide generator. It produces standalone HTML slides with the required `data-editable` markers, then syncs the result into the web app so the app can load that deck by default.

Generated slides must follow this boundary contract:

- exactly one slide root container marked with `data-slide-root="true"`
- that root must include `data-slide-width="1920"` and `data-slide-height="1080"`
- user-editable content inside the root must use `data-editable="text"`, `data-editable="image"`, or `data-editable="block"`

Example:

```html
<div
  class="slide-container"
  data-slide-root="true"
  data-slide-width="1920"
  data-slide-height="1080"
>
  <h1 data-editable="text">Slide title</h1>
  <p data-editable="text">Slide body</p>
</div>
```

1. Install dependencies:

```bash
pnpm install
```

2. Run the skill:

```bash
pnpm generate:slides -- --topic "Your topic"
```

Optional arguments:

```bash
pnpm generate:slides -- \
  --topic "HTML Slides Editor" \
  --summary "A starter deck with editable HTML markers." \
  --points "Problem|Approach|First milestone"
```

What this does:

- writes the generated deck to `generated/<topic-slug>/`
- writes a `manifest.json` alongside the HTML files
- syncs the latest deck to `apps/web/public/generated/current/`

3. Start the app:

```bash
pnpm dev
```

When the app starts, it will first try to load `apps/web/public/generated/current/manifest.json`. If that generated deck exists, the app uses it automatically. If not, it falls back to the built-in sample slides.

## Contributing

The best place to understand the project before contributing is the idea doc:

- start with [idea.en.md](./idea.en.md) for the English version
- use [idea.zh.md](./idea.zh.md) if you prefer Chinese

As the repository matures, contribution guidelines and implementation-specific docs can be added separately.

## License

This project is licensed under [AGPL-3.0-only](./LICENSE).
