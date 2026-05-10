import fs from "node:fs";
import path from "node:path";
import { loadVerifyDeckSource } from "../core/verify-deck";
import {
  type HtmlExportSlide,
  createSingleHtmlExportDocument,
  planHtmlExportSlides,
} from "../core";
import { materializeRenderableSlide } from "./view-renderer";

export interface HtmlExportResultSlide {
  index: number;
  slideId: string;
  title?: string;
}

export interface HtmlExportResult {
  deck: string;
  mode: "all";
  outFile: string;
  path: string;
  slides: HtmlExportResultSlide[];
}

export async function exportHtml({
  deckPath,
  outFile,
}: {
  deckPath: string;
  outFile: string;
}): Promise<HtmlExportResult> {
  const deck = path.resolve(process.cwd(), deckPath);
  const outputPath = path.resolve(process.cwd(), outFile);
  const source = loadVerifyDeckSource(deck);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempDir = fs.mkdtempSync(path.join(path.dirname(outputPath), ".starry-slides-html-"));
  try {
    const slides: HtmlExportSlide[] = source.slides.map((slide) => ({
      id: slide.id,
      ...(slide.title ? { title: slide.title } : {}),
      ...(slide.hidden ? { hidden: slide.hidden } : {}),
      htmlSource: fs.readFileSync(materializeRenderableSlide(slide, source.deck, tempDir), "utf8"),
    }));
    const html = createSingleHtmlExportDocument({
      title: path.basename(source.deck),
      slides,
    });
    const exportedSlides = planHtmlExportSlides(slides);

    fs.writeFileSync(outputPath, html, "utf8");

    return {
      deck: source.deck,
      mode: "all",
      outFile: outputPath,
      path: outputPath,
      slides: exportedSlides.map((slide) => {
        const manifestSlide = source.slides.find((item) => item.id === slide.id);
        return {
          index: manifestSlide?.index ?? 0,
          slideId: slide.id,
          ...(slide.title ? { title: slide.title } : {}),
        };
      }),
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
