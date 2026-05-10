import { planPresentationSlides } from "./presentation";
import { DEFAULT_SLIDE_HEIGHT, DEFAULT_SLIDE_WIDTH, parseDimension } from "./slide-contract";

export interface HtmlExportSlide {
  id: string;
  title?: string;
  hidden?: boolean;
  htmlSource: string;
  width?: number;
  height?: number;
}

export interface ResolvedHtmlExportSlide {
  id: string;
  title?: string;
  htmlSource: string;
  width: number;
  height: number;
}

export interface HtmlExportDocumentOptions {
  title?: string;
  slides: HtmlExportSlide[];
}

export function planHtmlExportSlides(slides: HtmlExportSlide[]): HtmlExportSlide[] {
  return planPresentationSlides(slides);
}

export function resolveHtmlExportSlides(slides: HtmlExportSlide[]): ResolvedHtmlExportSlide[] {
  return planHtmlExportSlides(slides).map((slide) => {
    const size = getSlideSize(slide);
    return {
      id: slide.id,
      ...(slide.title ? { title: slide.title } : {}),
      htmlSource: slide.htmlSource,
      width: size.width,
      height: size.height,
    };
  });
}

export function createSingleHtmlExportDocument({
  title = "Starry Slides",
  slides,
}: HtmlExportDocumentOptions): string {
  const resolvedSlides = resolveHtmlExportSlides(slides);
  const deckPayload = {
    title,
    slides: resolvedSlides.map((slide) => ({
      id: slide.id,
      title: slide.title ?? slide.id,
      htmlSource: slide.htmlSource,
      width: slide.width,
      height: slide.height,
    })),
  };

  return `<!DOCTYPE html>
<html lang="en" data-starry-presenter="true">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>${STANDALONE_PRESENTER_CSS}</style>
  </head>
  <body>
    <main id="starry-presenter" data-starry-presenter="true">
      <section class="presenter-stage" data-testid="presenter-view">
        <div class="presenter-slide-frame" data-testid="presenter-slide-frame">
          <iframe title="Presented slide" data-testid="presenter-slide-iframe"></iframe>
          <svg class="presenter-ink-layer" data-testid="presenter-ink-layer"></svg>
        </div>
        <div class="presenter-laser-cursor" data-testid="presenter-laser-cursor"></div>
        <div class="presenter-colors" data-testid="presenter-pen-colors" aria-label="Pen colors"></div>
        <nav class="presenter-toolbar" data-testid="presenter-toolbar" data-visible="false" aria-label="Presentation controls">
          <button type="button" data-action="previous" aria-label="Previous slide">Prev</button>
          <span class="presenter-pagination" data-role="pagination">1 / ${Math.max(resolvedSlides.length, 1)}</span>
          <button type="button" data-action="next" aria-label="Next slide">Next</button>
          <span class="presenter-divider"></span>
          <button type="button" data-tool="laser" aria-label="Laser pointer" aria-pressed="false">Laser</button>
          <button type="button" data-tool="pen" aria-label="Pen" aria-pressed="false">Pen</button>
          <button type="button" data-action="fullscreen" aria-label="Enter fullscreen">Fullscreen</button>
          <span class="presenter-divider"></span>
          <button type="button" data-action="exit" aria-label="Exit presentation">Exit</button>
        </nav>
      </section>
    </main>
    <script>
      window.starryPresenterDeck = ${safeJson(deckPayload)};
      ${STANDALONE_PRESENTER_SCRIPT}
    </script>
  </body>
</html>`;
}

function getSlideSize(slide: HtmlExportSlide) {
  if (slide.width && slide.height) {
    return { width: slide.width, height: slide.height };
  }

  return {
    width: parseDimension(
      matchAttribute(slide.htmlSource, "data-slide-width"),
      DEFAULT_SLIDE_WIDTH
    ),
    height: parseDimension(
      matchAttribute(slide.htmlSource, "data-slide-height"),
      DEFAULT_SLIDE_HEIGHT
    ),
  };
}

function matchAttribute(html: string, attributeName: string): string | null {
  const pattern = new RegExp(`${attributeName}\\s*=\\s*["']([^"']+)["']`, "i");
  return pattern.exec(html)?.[1] ?? null;
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003C").replace(/>/g, "\\u003E");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STANDALONE_PRESENTER_CSS = `
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111;color:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}
#starry-presenter{display:block;width:100vw;height:100vh}
.presenter-stage{position:fixed;inset:0;display:grid;place-items:center;overflow:hidden;background:#111;cursor:default}
.presenter-stage[data-tool="laser"]{cursor:none}
.presenter-slide-frame{position:relative;overflow:hidden;background:#fff;box-shadow:0 18px 70px rgba(0,0,0,.42)}
.presenter-slide-frame iframe{display:block;border:0;background:#fff;pointer-events:none;transform-origin:top left}
.presenter-ink-layer{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.presenter-ink-layer path{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:4}
.presenter-laser-cursor{position:fixed;left:0;top:0;width:16px;height:16px;border-radius:999px;background:rgba(247,255,42,.92);box-shadow:0 0 0 1px rgba(17,24,39,.85),0 0 14px rgba(247,255,42,.9),0 0 24px rgba(34,211,238,.65);transform:translate(-50%,-50%);pointer-events:none;opacity:0}
.presenter-stage[data-tool="laser"] .presenter-laser-cursor{opacity:1}
.presenter-toolbar{position:fixed;left:50%;bottom:22px;z-index:20;display:flex;align-items:center;gap:7px;min-height:44px;padding:6px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(17,17,17,.84);box-shadow:0 18px 52px rgba(0,0,0,.38);backdrop-filter:blur(18px);transition:opacity .18s ease,transform .18s ease;transform:translate(-50%,0)}
.presenter-toolbar[data-visible="false"]{opacity:0;transform:translate(-50%,16px);pointer-events:none}
.presenter-toolbar button{height:32px;border:0;border-radius:6px;background:transparent;color:#f8fafc;padding:0 10px;font:600 12px/1 Inter,ui-sans-serif,system-ui;cursor:pointer}
.presenter-toolbar button:hover,.presenter-toolbar button[aria-pressed="true"]{background:rgba(255,255,255,.14)}
.presenter-toolbar button:disabled{opacity:.35;cursor:not-allowed}
.presenter-pagination{min-width:56px;text-align:center;color:rgba(248,250,252,.78);font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace}
.presenter-divider{width:1px;height:20px;background:rgba(255,255,255,.16)}
.presenter-colors{position:fixed;left:50%;bottom:78px;z-index:20;display:none;align-items:center;gap:8px;padding:8px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(17,17,17,.9);box-shadow:0 14px 44px rgba(0,0,0,.32);backdrop-filter:blur(18px);transform:translateX(-50%)}
.presenter-stage[data-tool="pen"] .presenter-colors{display:flex}
.presenter-swatch{width:28px;height:28px;border:1px solid rgba(255,255,255,.25);border-radius:999px;box-shadow:0 0 0 1px rgba(0,0,0,.25);padding:0;cursor:pointer}
.presenter-swatch[data-active="true"]{outline:2px solid rgba(255,255,255,.9);outline-offset:2px}
`;

const STANDALONE_PRESENTER_SCRIPT = `
(() => {
  const deck = window.starryPresenterDeck;
  const stage = document.querySelector(".presenter-stage");
  const frame = document.querySelector(".presenter-slide-frame");
  const iframe = document.querySelector("[data-testid='presenter-slide-iframe']");
  const inkLayer = document.querySelector("[data-testid='presenter-ink-layer']");
  const toolbar = document.querySelector("[data-testid='presenter-toolbar']");
  const pagination = document.querySelector("[data-role='pagination']");
  const laser = document.querySelector("[data-testid='presenter-laser-cursor']");
  const colorList = document.querySelector(".presenter-colors");
  const penColors = ["#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#8B5CF6", "#FFFFFF", "#0F172A"];
  let index = 0;
  let tool = "none";
  let hideTimer = 0;
  let drawing = null;
  let penColor = penColors[0];

  function activeSlide() {
    return deck.slides[Math.min(Math.max(index, 0), Math.max(deck.slides.length - 1, 0))];
  }

  function renderSlide() {
    const slide = activeSlide();
    if (!slide) return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scale = Math.min(viewportWidth / slide.width, viewportHeight / slide.height);
    frame.style.width = Math.floor(slide.width * scale) + "px";
    frame.style.height = Math.floor(slide.height * scale) + "px";
    iframe.style.width = slide.width + "px";
    iframe.style.height = slide.height + "px";
    iframe.style.transform = "scale(" + scale + ")";
    iframe.srcdoc = slide.htmlSource;
    inkLayer.setAttribute("viewBox", "0 0 " + slide.width + " " + slide.height);
    inkLayer.dataset.scale = String(scale);
    inkLayer.replaceChildren();
    pagination.textContent = String(index + 1) + " / " + String(deck.slides.length);
    toolbar.querySelector("[data-action='previous']").disabled = index === 0;
    toolbar.querySelector("[data-action='next']").disabled = index >= deck.slides.length - 1;
  }

  function setTool(nextTool) {
    tool = tool === nextTool ? "none" : nextTool;
    stage.dataset.tool = tool === "none" ? "" : tool;
    for (const button of toolbar.querySelectorAll("[data-tool]")) {
      button.setAttribute("aria-pressed", button.dataset.tool === tool ? "true" : "false");
    }
    drawing = null;
    updateCursor();
  }

  function clearInk() {
    inkLayer.replaceChildren();
    drawing = null;
  }

  function renderPenColors() {
    colorList.replaceChildren(...penColors.map((color) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "presenter-swatch";
      button.setAttribute("aria-label", "Use pen color " + color);
      button.style.background = color;
      button.dataset.active = color === penColor ? "true" : "false";
      button.addEventListener("click", () => {
        penColor = color;
        renderPenColors();
      });
      return button;
    }));
  }

  function showToolbar() {
    toolbar.dataset.visible = "true";
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      toolbar.dataset.visible = "false";
    }, 1600);
  }

  function updateCursor() {
    if (tool === "laser") {
      laser.style.opacity = "1";
      return;
    }
    laser.style.opacity = "0";
  }

  function stagePoint(event) {
    const rect = frame.getBoundingClientRect();
    const slide = activeSlide();
    if (!slide) return null;
    const scale = slide.width ? rect.width / slide.width : 1;
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale,
    };
  }

  window.addEventListener("resize", renderSlide);
  stage.addEventListener("mousemove", (event) => {
    showToolbar();
    laser.style.left = event.clientX + "px";
    laser.style.top = event.clientY + "px";
    if (tool !== "pen" || !drawing) {
      return;
    }
    const point = stagePoint(event);
    if (!point) return;
    drawing.push(point);
    const d = drawing.map((value, pointIndex) => (pointIndex === 0 ? "M" : "L") + value.x + " " + value.y).join(" ");
    drawing.path.setAttribute("d", d);
  });
  stage.addEventListener("mousedown", (event) => {
    if (tool !== "pen") {
      return;
    }
    const point = stagePoint(event);
    if (!point) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke", penColor);
    path.setAttribute("d", "M" + point.x + " " + point.y);
    inkLayer.appendChild(path);
    drawing = [{ ...point, path }];
    drawing.path = path;
  });
  stage.addEventListener("mouseup", () => {
    drawing = null;
  });
  stage.addEventListener("mouseleave", () => {
    drawing = null;
  });
  frame.addEventListener("click", (event) => {
    if (event.target && event.target.closest(".presenter-toolbar")) {
      return;
    }
    if (tool !== "none") {
      return;
    }
    index = Math.min(index + 1, deck.slides.length - 1);
    renderSlide();
    showToolbar();
  });
  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const action = button.dataset.action;
    const nextTool = button.dataset.tool;
    if (action === "previous") index = Math.max(index - 1, 0);
    if (action === "next") index = Math.min(index + 1, deck.slides.length - 1);
    if (action === "fullscreen" && document.fullscreenElement == null) document.documentElement.requestFullscreen?.();
    if (action === "exit") window.close();
    if (nextTool) setTool(nextTool);
    renderSlide();
    showToolbar();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      index = Math.min(index + 1, deck.slides.length - 1);
      renderSlide();
      showToolbar();
    }
    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      index = Math.max(index - 1, 0);
      renderSlide();
      showToolbar();
    }
    if (event.key === "Escape") {
      if (tool !== "none") {
        setTool("none");
        renderSlide();
        showToolbar();
      }
    }
    if ((event.key === "l" || event.key === "L") && !event.metaKey && !event.ctrlKey) {
      setTool("laser");
      showToolbar();
    }
    if ((event.key === "p" || event.key === "P") && !event.metaKey && !event.ctrlKey) {
      setTool("pen");
      showToolbar();
    }
    if ((event.key === "c" || event.key === "C") && tool === "pen" && !event.metaKey && !event.ctrlKey) {
      clearInk();
      showToolbar();
    }
  });
  renderPenColors();
  renderSlide();
  showToolbar();
})();
`;
