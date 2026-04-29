# HTML Slides Generator

This skill generates slide HTML that can be consumed directly by the editor app and the editor package in this repo.

## Goal

Produce visually polished HTML slides while preserving editability. The output must remain valid standalone HTML, and editable content must be marked in a way the editor can parse reliably.

## Output contract

- Every user-editable text node must include `data-editable="text"`.
- Every user-editable image must include `data-editable="image"`.
- Every movable container-level element must include `data-editable="block"`.
- Decorative-only layers must not be marked editable.
- A slide should render as a self-contained 1920x1080 HTML document.
- Every slide must contain exactly one slide root container with `data-slide-root="true"`.
- The slide root container must also declare `data-slide-width="1920"` and `data-slide-height="1080"` so editors and presenters can identify the intended canvas boundary.

## Required structure

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        margin: 0;
        width: 1920px;
        height: 1080px;
        overflow: hidden;
      }
    </style>
  </head>
<body>
    <div
      class="slide-container"
      data-slide-root="true"
      data-slide-width="1920"
      data-slide-height="1080"
    >
      <h1 data-editable="text">Slide title</h1>
      <p data-editable="text">Body copy</p>
    </div>
</body>
</html>
```

## Editing expectations

- Prefer absolute or clearly structured layout so the editor can reason about block movement later.
- Keep typography and decorative layers expressive, but separate the decorative layer from editable content.
- Treat the slide root as the canonical boundary of the page. The editor and any future presenter should not need to infer slide bounds from `body`.
- Do not wrap the output in markdown fences unless the caller explicitly asks for that.

## Related files

- Use [`templates/base-slide.html`](./templates/base-slide.html) as the starting point for new slide layouts.
- The React app in `apps/web` and the parser in `packages/editor` both assume this contract.
- Use `node skills/html-slides-generator/generate-slides.mjs --topic "Your topic"` or `pnpm generate:slides -- --topic "Your topic"` to generate a starter deck locally.
