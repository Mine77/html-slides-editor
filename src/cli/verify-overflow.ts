import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

export interface OverflowElement {
  selector: string;
  text: string;
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  clientHeight: number;
}

export interface SlideOverflowResult {
  file: string;
  bodyOverflowsHorizontally: boolean;
  bodyOverflowsVertically: boolean;
  overflowingElements: OverflowElement[];
}

export interface CheckOverflowOptions {
  deckDir: string;
  scale?: number;
}

export async function checkOverflow(options: CheckOverflowOptions): Promise<SlideOverflowResult[]> {
  const { deckDir } = options;
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

  const results: SlideOverflowResult[] = [];
  const browser = await chromium.launch({ headless: true });

  try {
    for (const slide of manifest.slides) {
      if (!slide.file) continue;

      const slidePath = path.resolve(deckDir, slide.file);
      if (!fs.existsSync(slidePath)) {
        continue;
      }

      const html = fs.readFileSync(slidePath, "utf8");
      const widthMatch = html.match(/data-slide-width="(\d+)"/);
      const heightMatch = html.match(/data-slide-height="(\d+)"/);
      const width = widthMatch ? parseInt(widthMatch[1], 10) : 1920;
      const height = heightMatch ? parseInt(heightMatch[1], 10) : 1080;

      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: options.scale ?? 1,
      });
      const page = await context.newPage();
      await page.goto(`file://${slidePath}`, { waitUntil: "load" });
      await page.waitForTimeout(200);

      const result = await page.evaluate(
        ({ }) => {
          const body = document.body;
          const bodyOverflowsHorizontally = body.scrollWidth > body.clientWidth;
          const bodyOverflowsVertically = body.scrollHeight > body.clientHeight;

          const editables = document.querySelectorAll("[data-editable]");
          const overflowingElements: Array<{
            selector: string;
            text: string;
            scrollWidth: number;
            clientWidth: number;
            scrollHeight: number;
            clientHeight: number;
          }> = [];

          for (const el of editables) {
            const htmlEl = el as HTMLElement;
            const sw = htmlEl.scrollWidth;
            const cw = htmlEl.clientWidth;
            const sh = htmlEl.scrollHeight;
            const ch = htmlEl.clientHeight;

            if (sw > cw || sh > ch) {
              overflowingElements.push({
                selector: htmlEl.tagName.toLowerCase() + (htmlEl.className ? `.${htmlEl.className.split(" ")[0]}` : ""),
                text: (htmlEl.textContent ?? "").slice(0, 60),
                scrollWidth: sw,
                clientWidth: cw,
                scrollHeight: sh,
                clientHeight: ch,
              });
            }
          }

          return { bodyOverflowsHorizontally, bodyOverflowsVertically, overflowingElements };
        }
      );

      results.push({
        file: slide.file,
        bodyOverflowsHorizontally: result.bodyOverflowsHorizontally,
        bodyOverflowsVertically: result.bodyOverflowsVertically,
        overflowingElements: result.overflowingElements,
      });

      await context.close();
    }
  } finally {
    await browser.close();
  }

  return results;
}

export function formatOverflowResults(results: SlideOverflowResult[]): string {
  const lines: string[] = [];
  let totalIssues = 0;

  for (const r of results) {
    const issues: string[] = [];
    if (r.bodyOverflowsHorizontally) issues.push("body overflows horizontally");
    if (r.bodyOverflowsVertically) issues.push("body overflows vertically");
    for (const el of r.overflowingElements) {
      issues.push(
        `<${el.selector}> overflows (${el.scrollWidth}x${el.scrollHeight} > ${el.clientWidth}x${el.clientHeight}) "${el.text}"`
      );
    }

    if (issues.length > 0) {
      lines.push(`OVERFLOW ${r.file}`);
      for (const msg of issues) {
        lines.push(`  ${msg}`);
      }
      totalIssues += issues.length;
    }
  }

  if (totalIssues === 0) {
    lines.push("No overflow detected.");
  } else {
    lines.push(`\n${totalIssues} overflow issue(s) found.`);
  }

  return lines.join("\n");
}
