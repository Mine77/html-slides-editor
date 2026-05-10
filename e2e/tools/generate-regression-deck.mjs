import fs from "node:fs";
import path from "node:path";
import { buildChartSlide } from "./regression-deck/chart-slide.mjs";
import { buildClosingSlide } from "./regression-deck/closing-slide.mjs";
import { buildCropImageSlide, buildImageSlide } from "./regression-deck/image-slide.mjs";
import { buildAgendaSlide, buildHeroSlide } from "./regression-deck/intro-slides.mjs";
import {
  buildComparisonSlide,
  buildCoverageSlide,
  buildTimelineSlide,
} from "./regression-deck/narrative-slides.mjs";
import { buildArchitectureSlide, buildProblemSlide } from "./regression-deck/pipeline-slides.mjs";
import { copyDirectory, resetDirectory, slugify, splitPoints } from "./regression-deck/shared.mjs";
import {
  buildBlockFlattenSlide,
  buildGroupGeometrySlide,
  buildSnapCenterSlide,
  buildSnapSiblingSlide,
} from "./regression-deck/snap-slides.mjs";
import { buildTableSlide } from "./regression-deck/table-slide.mjs";

function getArg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }

  return process.argv[index + 1] ?? fallback;
}

const topic = getArg("--topic", "Starry Slides");
const summary = getArg(
  "--summary",
  `A project overview deck for ${topic} that also serves as a broad HTML fixture for editor testing.`
);
const points = splitPoints(
  getArg(
    "--points",
    "Problem framing|Architecture|Feature matrix|Charts|Images|Roadmap|Comparison|Coverage"
  )
);
const outputRoot = path.resolve(process.cwd(), getArg("--out-dir", `generated/${slugify(topic)}`));
const appOutputRoot = path.resolve(process.cwd(), getArg("--app-out-dir", "sample-slides"));

const slides = [
  {
    id: "01-hero",
    title: topic,
    html: buildHeroSlide(topic, summary),
  },
  {
    id: "02-agenda",
    title: `${topic} Agenda`,
    html: buildAgendaSlide(topic, points),
  },
  {
    id: "03-why-html-native-slide-editing-matters",
    title: "Why HTML-native slide editing matters",
    html: buildProblemSlide(),
  },
  {
    id: "04-generation-to-editor-pipeline",
    title: "Generation to editor pipeline",
    html: buildArchitectureSlide(),
  },
  {
    id: "05-feature-matrix-table",
    title: "Feature matrix table",
    html: buildTableSlide(),
  },
  {
    id: "06-coverage-growth-chart",
    title: "Coverage growth chart",
    html: buildChartSlide(),
  },
  {
    id: "07-image-rich-slide",
    title: "Image-rich slide",
    html: buildImageSlide(),
  },
  {
    id: "08-project-roadmap-timeline",
    title: "Project roadmap timeline",
    html: buildTimelineSlide(),
  },
  {
    id: "09-html-native-versus-schema-first",
    title: "HTML-native versus schema-first",
    html: buildComparisonSlide(),
  },
  {
    id: "10-fixture-coverage-summary",
    title: "Fixture coverage summary",
    html: buildCoverageSlide(),
  },
  {
    id: "11-snap-center-fixture",
    title: "Snap center fixture",
    html: buildSnapCenterSlide(),
  },
  {
    id: "12-snap-sibling-fixture",
    title: "Snap sibling fixture",
    html: buildSnapSiblingSlide(),
  },
  {
    id: "13-group-geometry-fixture",
    title: "Group geometry fixture",
    html: buildGroupGeometrySlide(),
  },
  {
    id: "14-closing-and-next-steps",
    title: "Closing and next steps",
    html: buildClosingSlide(),
  },
  {
    id: "15-block-flatten-fixture",
    title: "Block flatten fixture",
    html: buildBlockFlattenSlide(),
  },
  {
    id: "16-single-image-crop-fixture",
    title: "Single image crop fixture",
    html: buildCropImageSlide(),
  },
];

function extractHeadAndBody(html) {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return {
    head: headMatch?.[1]?.trim() ?? "",
    body: bodyMatch?.[1]?.trim() ?? "",
  };
}

function createDeckHtml({ topic, slides }) {
  const defaultHead = extractHeadAndBody(slides[0]?.html ?? "");
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    ${defaultHead.head}
  </head>
  <body>
    <slides title="${topic.replace(/"/g, "&quot;")}" generated-at="${new Date().toISOString()}" width="1920" height="1080">
${slides
  .map((slide) => {
    const parts = extractHeadAndBody(slide.html);
    return `      <slide id="${slide.id}" title="${slide.title.replace(/"/g, "&quot;")}">
${parts.head ? `        ${parts.head}\n` : ""}        ${parts.body}
      </slide>`;
  })
  .join("\n")}
    </slides>
  </body>
</html>`;
}

resetDirectory(outputRoot);
fs.writeFileSync(path.join(outputRoot, "deck.html"), createDeckHtml({ topic, slides }), "utf8");

console.log(`Generated ${slides.length} slides in ${outputRoot}`);
console.log(`- deck.html`);

if (appOutputRoot !== outputRoot) {
  resetDirectory(appOutputRoot);
  copyDirectory(outputRoot, appOutputRoot);
  console.log(`Synced slides to ${appOutputRoot}`);
}
