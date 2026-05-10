import type { SlideModel } from "./slide-contract";
import { parseSlide } from "./slide-document";

const DEFAULT_NEW_SLIDE_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Untitled Slide</title>
  </head>
  <body>
    <main
      data-slide-root="true"
      data-slide-width="1920"
      data-slide-height="1080"
      data-editor-id="slide-root"
      style="position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #ffffff;"
    >
      <h1 data-editable="text" data-editor-id="text-1" style="position: absolute; left: 160px; top: 160px; width: 1200px; margin: 0; font-size: 96px; line-height: 1.05;">
        Untitled Slide
      </h1>
    </main>
  </body>
</html>`;

export function createUniqueSlideId(slides: SlideModel[], preferredId: string): string {
  const existingIds = new Set(slides.map((slide) => slide.id));
  if (!existingIds.has(preferredId)) {
    return preferredId;
  }

  let index = 2;
  while (existingIds.has(`${preferredId}-${index}`)) {
    index += 1;
  }

  return `${preferredId}-${index}`;
}

export function createBlankSlide(slides: SlideModel[], insertIndex: number): SlideModel {
  const position = Math.max(insertIndex + 1, 1);
  const slideId = createUniqueSlideId(slides, `generated-slide-${position}`);

  return {
    ...parseSlide(DEFAULT_NEW_SLIDE_HTML, slideId),
    hidden: false,
    title: "Untitled Slide",
  };
}

export function createDuplicatedSlide(slides: SlideModel[], sourceSlide: SlideModel): SlideModel {
  const slideId = createUniqueSlideId(slides, `${sourceSlide.id}-copy`);

  return {
    ...parseSlide(sourceSlide.htmlSource, slideId),
    hidden: sourceSlide.hidden === true,
    title: sourceSlide.title,
  };
}
