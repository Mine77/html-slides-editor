import fs from "node:fs";
import path from "node:path";

function getArg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }

  return process.argv[index + 1] ?? fallback;
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "slides";
}

function escapeHtml(value) {
  return value
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function splitPoints(raw) {
  return raw
    .split("|")
    .map((point) => point.trim())
    .filter(Boolean);
}

function baseStyles(background, foreground) {
  return `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      color: ${foreground};
      background: ${background};
    }
    .slide-container {
      position: relative;
      width: 100%;
      height: 100%;
      padding: 110px 120px;
    }
  `;
}

function wrapHtml(styles, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${styles}</style>
  </head>
  <body>
    <div class="slide-container" data-slide-root="true" data-slide-width="1920" data-slide-height="1080">
      ${bodyContent}
    </div>
  </body>
</html>`;
}

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function buildCoverSlide(topic, summary) {
  return wrapHtml(
    `${baseStyles(
      "radial-gradient(circle at top right, rgba(255, 208, 122, 0.72), transparent 24%), linear-gradient(135deg, #f8f1e6 0%, #ebdcc6 50%, #d4bea7 100%)",
      "#1f1912"
    )}
    .eyebrow {
      display: inline-flex;
      padding: 12px 18px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 26px;
    }
    h1 {
      margin: 40px 0 24px;
      max-width: 1100px;
      font-size: 110px;
      line-height: 0.94;
    }
    p {
      margin: 0;
      max-width: 920px;
      font-size: 44px;
      line-height: 1.35;
      color: rgba(31, 25, 18, 0.75);
    }
    .badge {
      position: absolute;
      right: 120px;
      bottom: 120px;
      width: 360px;
      padding: 28px 32px;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.58);
      box-shadow: 0 22px 60px rgba(95, 63, 27, 0.14);
    }
    .badge strong {
      display: block;
      margin-bottom: 12px;
      font-size: 24px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .badge span {
      display: block;
      font-size: 30px;
      line-height: 1.35;
    }`,
    `
      <div class="eyebrow" data-editable="text">Generated Slide Deck</div>
      <h1 data-editable="text">${escapeHtml(topic)}</h1>
      <p data-editable="text">${escapeHtml(summary)}</p>
      <div class="badge" data-editable="block">
        <strong data-editable="text">Editor contract</strong>
        <span data-editable="text">Editable nodes are marked with data-editable for downstream parsing.</span>
      </div>
    `
  );
}

function buildPointsSlide(topic, points) {
  const cards = points
    .map(
      (point, index) => `
        <article class="card" data-editable="block">
          <span class="card-index" data-editable="text">0${index + 1}</span>
          <h2 data-editable="text">${escapeHtml(point)}</h2>
          <p data-editable="text">${escapeHtml(`A concrete point about ${topic.toLowerCase()} that can be refined later.`)}</p>
        </article>
      `
    )
    .join("");

  return wrapHtml(
    `${baseStyles(
      "linear-gradient(150deg, rgba(15, 37, 63, 0.96), rgba(30, 69, 96, 0.96))",
      "#f6f4ef"
    )}
    h1 {
      margin: 0 0 26px;
      font-size: 88px;
      max-width: 1000px;
    }
    .deck {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 28px;
      margin-top: 64px;
    }
    .card {
      min-height: 430px;
      padding: 36px;
      border-radius: 30px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
    }
    .card-index {
      display: inline-flex;
      margin-bottom: 24px;
      font-size: 22px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      opacity: 0.68;
    }
    h2 {
      margin: 0 0 18px;
      font-size: 44px;
      line-height: 1.08;
    }
    p {
      margin: 0;
      font-size: 28px;
      line-height: 1.45;
      color: rgba(246, 244, 239, 0.8);
    }`,
    `
      <h1 data-editable="text">${escapeHtml(`${topic}: key points`)}</h1>
      <div class="deck">
        ${cards}
      </div>
    `
  );
}

function buildNextStepsSlide(topic, nextSteps) {
  const items = nextSteps
    .map(
      (step) => `
        <li class="step" data-editable="block">
          <strong data-editable="text">${escapeHtml(step.title)}</strong>
          <span data-editable="text">${escapeHtml(step.body)}</span>
        </li>
      `
    )
    .join("");

  return wrapHtml(
    `${baseStyles(
      "radial-gradient(circle at bottom left, rgba(255, 147, 101, 0.28), transparent 28%), #fcfaf6",
      "#211c16"
    )}
    .layout {
      display: grid;
      grid-template-columns: 760px 1fr;
      gap: 70px;
      align-items: start;
      height: 100%;
    }
    h1 {
      margin: 0 0 20px;
      font-size: 96px;
      line-height: 0.96;
    }
    .lead {
      margin: 0;
      font-size: 38px;
      line-height: 1.4;
      color: rgba(33, 28, 22, 0.72);
    }
    .steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 20px;
    }
    .step {
      display: grid;
      gap: 10px;
      padding: 28px 32px;
      border-radius: 26px;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 18px 50px rgba(99, 75, 48, 0.08);
    }
    .step strong {
      font-size: 30px;
    }
    .step span {
      font-size: 24px;
      line-height: 1.45;
      color: rgba(33, 28, 22, 0.72);
    }`,
    `
      <div class="layout">
        <div>
          <h1 data-editable="text">Next steps for ${escapeHtml(topic)}</h1>
          <p class="lead" data-editable="text">This first generator is intentionally simple: it creates valid standalone slides with editor-friendly markers and a predictable structure.</p>
        </div>
        <ul class="steps">
          ${items}
        </ul>
      </div>
    `
  );
}

const topic = getArg("--topic", "HTML Slides Editor");
const summary = getArg(
  "--summary",
  `A starter deck for ${topic} with editable text and block markers baked into the HTML.`
);
const points = splitPoints(
  getArg(
    "--points",
    "What it is|Why it matters|What the first version proves"
  )
);
const outputRoot = path.resolve(
  process.cwd(),
  getArg("--out-dir", `generated/${slugify(topic)}`)
);
const appOutputRoot = path.resolve(
  process.cwd(),
  getArg("--app-out-dir", "apps/web/public/generated/current")
);

const steps = [
  {
    title: "Improve design quality",
    body: "Swap the starter layout for stronger visual systems once the generation pipeline is stable."
  },
  {
    title: "Connect with the editor",
    body: "Load these HTML files directly into the iframe workflow and map each editable node into the inspector."
  },
  {
    title: "Add richer element types",
    body: "Expand from text and block markers into image, chart, and structured layout editing."
  }
];

const slides = [
  {
    file: "01-cover.html",
    title: `${topic} Cover`,
    html: buildCoverSlide(topic, summary)
  },
  {
    file: "02-points.html",
    title: `${topic} Key Points`,
    html: buildPointsSlide(topic, points)
  },
  {
    file: "03-next-steps.html",
    title: `${topic} Next Steps`,
    html: buildNextStepsSlide(topic, steps)
  }
];

fs.mkdirSync(outputRoot, { recursive: true });

slides.forEach((slide) => {
  fs.writeFileSync(path.join(outputRoot, slide.file), slide.html, "utf8");
});

fs.writeFileSync(
  path.join(outputRoot, "manifest.json"),
  JSON.stringify(
    {
      topic,
      generatedAt: new Date().toISOString(),
      slides: slides.map((slide) => ({
        file: slide.file,
        title: slide.title
      }))
    },
    null,
    2
  ),
  "utf8"
);

copyDirectory(outputRoot, appOutputRoot);

console.log(`Generated ${slides.length} slides in ${outputRoot}`);
slides.forEach((slide) => {
  console.log(`- ${slide.file}`);
});
console.log(`Synced slides to ${appOutputRoot}`);
