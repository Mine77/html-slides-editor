export type PdfExportSelection =
  | { mode?: "all" }
  | { mode: "slide"; slideId?: string }
  | { mode: "slides"; slideIds?: string[] };

export interface PdfExportSlideEntry {
  id: string;
  title?: string;
  hidden?: boolean;
}

export type ResolvedPdfExportMode = "all" | "single" | "slides";

export interface ResolvedPdfExportSelection {
  mode: ResolvedPdfExportMode;
  slides: PdfExportSlideEntry[];
}

export function planPdfExport({
  slides,
  selection,
}: {
  slides: PdfExportSlideEntry[];
  selection?: PdfExportSelection;
}): ResolvedPdfExportSelection {
  const resolvedSelection = selection ?? { mode: "all" };
  const mode = resolvedSelection.mode ?? "all";

  if (mode === "all") {
    return { mode: "all", slides: [...slides] };
  }

  if (mode === "slide") {
    const slideId = "slideId" in resolvedSelection ? resolvedSelection.slideId?.trim() : "";
    if (!slideId) {
      throw new Error("--slide requires a slide id value");
    }

    const slide = findSlide(slides, slideId);
    if (!slide) {
      throw new Error(`--slide must match a slide id exactly: ${slideId}`);
    }

    return { mode: "single", slides: [slide] };
  }

  const slideIds = "slideIds" in resolvedSelection ? (resolvedSelection.slideIds ?? []) : [];
  const requestedIds = slideIds.map((id) => id.trim()).filter(Boolean);
  if (requestedIds.length === 0) {
    throw new Error("--slides requires at least one slide id value");
  }

  const selectedSlides: PdfExportSlideEntry[] = [];
  const missingIds: string[] = [];
  for (const slideId of requestedIds) {
    const slide = findSlide(slides, slideId);
    if (!slide) {
      missingIds.push(slideId);
      continue;
    }
    selectedSlides.push(slide);
  }

  if (missingIds.length > 0) {
    throw new Error(`--slides must match slide ids exactly: ${missingIds.join(", ")}`);
  }

  return { mode: "slides", slides: selectedSlides };
}

export function planPdfExportSlides(
  slides: PdfExportSlideEntry[],
  selection?: PdfExportSelection
): PdfExportSlideEntry[] {
  return planPdfExport({ slides, selection }).slides;
}

function findSlide(slides: PdfExportSlideEntry[], slideId: string) {
  return slides.find((slide) => slide.id === slideId);
}
