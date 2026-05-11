import { baseStyles, escapeHtml, wrapHtml } from "./shared.mjs";

export function buildTimelineSlide() {
  return wrapHtml(
    `${baseStyles("linear-gradient(150deg, #fbfbff 0%, #f7f4ea 45%, #eef8ff 100%)")}
    .header {
      display: flex;
      justify-content: space-between;
      align-items: end;
      margin-bottom: 44px;
    }
    .header .kicker {
      background: rgba(168, 85, 247, 0.12);
      color: #7e22ce;
    }
    .header h1 {
      margin-top: 18px;
      max-width: 920px;
      font-size: 76px;
      line-height: 0.98;
      letter-spacing: -0.03em;
    }
    .header p {
      max-width: 430px;
      font-size: 23px;
      line-height: 1.48;
      color: rgba(31, 41, 55, 0.72);
    }
    .timeline {
      position: relative;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 20px;
      padding-top: 48px;
    }
    .timeline::before {
      content: "";
      position: absolute;
      left: 60px;
      right: 60px;
      top: 76px;
      height: 6px;
      border-radius: 999px;
      background: linear-gradient(90deg, #f59e0b, #7c3aed, #2563eb, #0f766e);
      opacity: 0.28;
    }
    .milestone {
      position: relative;
      padding: 42px 24px 28px;
      border-radius: 30px;
      background: rgba(255, 255, 255, 0.84);
      border: 1px solid rgba(255, 255, 255, 0.92);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      min-height: 420px;
    }
    .milestone::before {
      content: "";
      position: absolute;
      top: -4px;
      left: 24px;
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: #7c3aed;
      box-shadow: 0 0 0 10px rgba(124, 58, 237, 0.14);
    }
    .milestone strong {
      display: block;
      margin-bottom: 12px;
      font-size: 28px;
    }
    .milestone p {
      font-size: 21px;
      line-height: 1.5;
      color: rgba(31, 41, 55, 0.74);
    }
    .milestone ul {
      margin: 20px 0 0;
      padding-left: 20px;
      font-size: 19px;
      line-height: 1.55;
      color: rgba(31, 41, 55, 0.76);
    }`,
    `
      <div class="header">
        <div>
          <p class="kicker">Timeline</p>
          <h1>The roadmap slide adds chronology, repeated cards, and another layout pattern for testing</h1>
        </div>
        <p>This one is useful for verifying repeated block cards and how the editor behaves when nodes are arranged along a horizontal narrative.</p>
      </div>
      <div class="timeline">
        <article class="milestone">
          <strong>Phase 1 · Ground truth</strong>
          <p>Establish the core parser and source-preserving slide contract.</p>
          <ul>
            <li>Slide root markers</li>
            <li>Editable node extraction</li>
            <li>Manifest-based import</li>
          </ul>
        </article>
        <article class="milestone">
          <strong>Phase 2 · Editing loop</strong>
          <p>Make text edits possible directly on rendered HTML and persist them as operations.</p>
          <ul>
            <li>Double click to edit</li>
            <li>Undo and redo</li>
            <li>Selection overlays</li>
          </ul>
        </article>
        <article class="milestone">
          <strong>Phase 3 · Rich fixture deck</strong>
          <p>Replace the toy regression deck with a presentation that actually represents the project.</p>
          <ul>
            <li>Table slide</li>
            <li>Chart slide</li>
            <li>Image slide</li>
          </ul>
        </article>
        <article class="milestone">
          <strong>Phase 4 · Richer operations</strong>
          <p>Move beyond text into block, image, and structured layout editing while keeping HTML canonical.</p>
          <ul>
            <li>Resize and reposition blocks</li>
            <li>Swap images safely</li>
            <li>Chart-aware transforms</li>
          </ul>
        </article>
      </div>
    `
  );
}

export function buildComparisonSlide() {
  return wrapHtml(
    `${baseStyles("linear-gradient(160deg, #fdfaf4 0%, #f0fdf4 52%, #eff6ff 100%)")}
    .header {
      margin-bottom: 26px;
    }
    .header .kicker {
      background: rgba(22, 163, 74, 0.12);
      color: #166534;
    }
    .header h1 {
      margin-top: 14px;
      max-width: 1020px;
      font-size: 58px;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .compare {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      height: 620px;
    }
    .panel {
      padding: 24px;
      border-radius: 32px;
      box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
    }
    .panel.left {
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid rgba(255, 255, 255, 0.9);
    }
    .panel.right {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.96));
      color: #f8fafc;
    }
    .panel strong {
      display: block;
      margin-bottom: 14px;
      font-size: 28px;
    }
    .panel p {
      margin-bottom: 18px;
      font-size: 20px;
      line-height: 1.38;
    }
    .panel ul {
      margin: 0;
      padding-left: 22px;
      font-size: 18px;
      line-height: 1.36;
    }
    .quote {
      margin-top: 14px;
      padding: 16px;
      border-radius: 24px;
      background: rgba(15, 23, 42, 0.06);
      font-size: 18px;
      line-height: 1.32;
    }
    .panel.right .quote {
      background: rgba(148, 163, 184, 0.14);
      color: rgba(226, 232, 240, 0.88);
    }`,
    `
      <div class="header">
        <p class="kicker">Comparison</p>
        <h1>The project is easier to explain when contrasted with schema-first slide editors</h1>
      </div>
      <div class="compare">
        <section class="panel left">
          <strong>Schema-first editors</strong>
          <p>Traditional tools often require translation into an internal model before editing can begin.</p>
          <ul>
            <li>Imported HTML becomes an approximation.</li>
            <li>Round-trip fidelity is hard to guarantee.</li>
            <li>Generated markup is no longer the source of truth.</li>
            <li>Testing tends to happen on private model fixtures, not on real generated output.</li>
          </ul>
          <div class="quote">
            <span>Good for native ecosystems. Weak fit if the product promise is direct manipulation of arbitrary HTML slides.</span>
          </div>
        </section>
        <section class="panel right">
          <strong>Starry Slides</strong>
          <p>This project keeps the generated HTML as the canonical document and layers editing behavior on top.</p>
          <ul>
            <li>Generated files stay inspectable and git-friendly.</li>
            <li>Parser helpers derive structure without replacing the source.</li>
            <li>Edits can be reasoned about as source-preserving operations.</li>
            <li>QA runs against the same kind of deck users would actually care about.</li>
          </ul>
          <div class="quote">
            <span>Harder implementation path, but a much stronger product story if HTML-native workflows are the goal.</span>
          </div>
        </section>
      </div>
    `
  );
}

export function buildCoverageSlide() {
  return wrapHtml(
    `${baseStyles("linear-gradient(150deg, #0b1120 0%, #1e1b4b 45%, #1d4ed8 100%)", "#f8fafc")}
    .header {
      display: flex;
      justify-content: space-between;
      align-items: end;
      margin-bottom: 36px;
    }
    .header .kicker {
      background: rgba(255, 255, 255, 0.12);
      color: #dbeafe;
    }
    .header h1 {
      margin-top: 18px;
      max-width: 940px;
      font-size: 74px;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .header p {
      max-width: 430px;
      font-size: 23px;
      line-height: 1.48;
      color: rgba(226, 232, 240, 0.76);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
    }
    .tile {
      min-height: 250px;
      padding: 26px;
      border-radius: 28px;
      background: rgba(15, 23, 42, 0.34);
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }
    .tile strong {
      display: block;
      margin-bottom: 12px;
      font-size: 28px;
    }
    .tile p {
      font-size: 21px;
      line-height: 1.5;
      color: rgba(226, 232, 240, 0.8);
    }
    .tile ul {
      margin: 16px 0 0;
      padding-left: 20px;
      font-size: 18px;
      line-height: 1.6;
      color: rgba(226, 232, 240, 0.8);
    }`,
    `
      <coverage-header class="header">
        <coverage-heading>
          <p class="kicker">Coverage</p>
          <h1>What this fixture now covers beyond a minimal regression deck</h1>
        </coverage-heading>
        <p>The goal is not just more slides. It is a more credible mix of structures that future editing features will need to survive.</p>
      </coverage-header>
      <coverage-grid class="grid">
        <article class="tile">
          <strong>Typography</strong>
          <p>Large headlines, dense body copy, labels, metric cards, and table cells.</p>
          <ul>
            <li>Short and long text nodes</li>
            <li>Mixed hierarchy levels</li>
            <li>Repeated semantic patterns</li>
          </ul>
        </article>
        <article class="tile">
          <strong>Structured layouts</strong>
          <p>Grids, split panels, timelines, agenda lists, and flow diagrams.</p>
          <ul>
            <li>Asymmetric columns</li>
            <li>Nested cards</li>
            <li>Overlay captions</li>
          </ul>
        </article>
        <article class="tile">
          <strong>Media</strong>
          <p>Image nodes and inline SVG charts both appear as realistic slide content.</p>
          <ul>
            <li>Data URI images</li>
            <li>Vector-heavy DOM</li>
            <li>Mixed media with captions</li>
          </ul>
        </article>
        <article class="tile" data-editor-id="block-4">
          <strong data-editor-id="text-5">Selection behavior</strong>
          <p data-editor-id="text-11">Non-text blocks can be clicked and inspected without accidentally entering text mode.</p>
          <ul>
            <li>Block cards</li>
            <li>Figure captions</li>
            <li>Table wrapper selection</li>
          </ul>
        </article>
        <article class="tile" data-editor-id="block-10">
          <strong>Future editing targets</strong>
          <p>The same fixture should remain useful when image replacement or block transforms land.</p>
          <ul>
            <li>Image markers already present</li>
            <li>Block-level grouping is explicit</li>
            <li>HTML remains canonical</li>
          </ul>
        </article>
        <article class="tile">
          <strong>Project narrative</strong>
          <p>It is no longer just a test deck. It can actually introduce the project to a new reader.</p>
          <ul>
            <li>Problem framing</li>
            <li>Architecture explanation</li>
            <li>Roadmap and comparison</li>
          </ul>
        </article>
      </coverage-grid>
    `
  );
}
