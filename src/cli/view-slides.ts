import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

export interface ViewSlidesOptions {
  deckDir: string;
  outDir?: string;
  scale?: number;
}

export async function viewSlides(options: ViewSlidesOptions): Promise<void> {
  const { deckDir, scale = 1 } = options;
  const outDir = options.outDir ?? path.join(deckDir, "view-output");
  const manifestPath = path.join(deckDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest.json not found in ${deckDir}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    slides?: Array<{ file?: string }>;
  };

  if (!Array.isArray(manifest.slides) || manifest.slides.length === 0) {
    throw new Error("manifest.json contains no slides");
  }

  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    for (const [index, slide] of manifest.slides.entries()) {
      if (!slide.file) continue;

      const slidePath = path.resolve(deckDir, slide.file);
      if (!fs.existsSync(slidePath)) {
        console.error(`  ⚠ Slide not found: ${slide.file}`);
        continue;
      }

      const page = await browser.newPage();

      // Read slide to extract dimensions
      const html = fs.readFileSync(slidePath, "utf8");
      const widthMatch = html.match(/data-slide-width="(\d+)"/);
      const heightMatch = html.match(/data-slide-height="(\d+)"/);
      const width = widthMatch ? parseInt(widthMatch[1], 10) : 1920;
      const height = heightMatch ? parseInt(heightMatch[1], 10) : 1080;

      await page.setViewportSize({ width, height });
      if (scale !== 1) {
        // deviceScaleFactor is set at context level, but we can emulate via CDP
        // For simplicity, we reload with a new context — but since we already opened page,
        // we use page.evaluate to check. Actually, let's close and reopen with context.
        await page.close();
        const context = await browser.newContext({
          viewport: { width, height },
          deviceScaleFactor: scale,
        });
        const scaledPage = await context.newPage();
        await scaledPage.goto(`file://${slidePath}`, { waitUntil: "load" });
        await scaledPage.waitForTimeout(200);

        const baseName = path.basename(slide.file, ".html");
        const outPath = path.join(outDir, `${String(index + 1).padStart(2, "0")}-${baseName}.png`);
        await scaledPage.screenshot({ path: outPath, fullPage: false });
        console.log(`  ✓ ${slide.file} → ${path.basename(outPath)}`);
        await context.close();
      } else {
        await page.goto(`file://${slidePath}`, { waitUntil: "load" });
        await page.waitForTimeout(200);

        const baseName = path.basename(slide.file, ".html");
        const outPath = path.join(outDir, `${String(index + 1).padStart(2, "0")}-${baseName}.png`);
        await page.screenshot({ path: outPath, fullPage: false });
        console.log(`  ✓ ${slide.file} → ${path.basename(outPath)}`);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\nViewed ${manifest.slides.length} slide(s) → ${outDir}`);
}
