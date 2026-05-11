import { baseStyles, escapeHtml, wrapHtml } from "./shared.mjs";

export function buildProblemSlide() {
  return wrapHtml(
    `${baseStyles(
      "radial-gradient(circle at top right, rgba(254, 226, 226, 0.9), transparent 28%), linear-gradient(145deg, #fffaf7 0%, #fef2f2 48%, #eef2ff 100%)"
    )}
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: end;
      margin-bottom: 24px;
    }
    .title-row .kicker {
      background: rgba(190, 24, 93, 0.1);
      color: #9d174d;
    }
    .title-row h1 {
      margin-top: 18px;
      font-size: 62px;
      letter-spacing: -0.03em;
      line-height: 0.98;
    }
    .summary-chip {
      width: 360px;
      padding: 22px 24px;
      border-radius: 26px;
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid rgba(255, 255, 255, 0.86);
    }
    .summary-chip strong {
      display: block;
      margin-bottom: 10px;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9d174d;
    }
    .summary-chip p {
      font-size: 24px;
      line-height: 1.4;
    }
    .problem-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 24px;
    }
    .problem-card {
      min-height: 400px;
      padding: 24px;
      border-radius: 30px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.88);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    }
    .problem-card strong {
      display: block;
      margin-bottom: 14px;
      font-size: 26px;
    }
    .problem-card p {
      font-size: 20px;
      line-height: 1.36;
      color: rgba(31, 41, 55, 0.76);
    }
    .problem-card ul {
      margin: 18px 0 0;
      padding-left: 24px;
      color: rgba(31, 41, 55, 0.78);
      font-size: 18px;
      line-height: 1.32;
    }`,
    `
      <div class="title-row">
        <div>
          <p class="kicker">Problem</p>
          <h1>Most slide editors only work after converting your content into their own private model</h1>
        </div>
        <div class="summary-chip">
          <strong>Why now</strong>
          <p>AI tools increasingly output HTML-based presentations, but downstream editing still breaks the original structure.</p>
        </div>
      </div>
      <div class="problem-grid">
        <article class="problem-card">
          <strong>Format lock-in</strong>
          <p>Existing editors often require import into a proprietary JSON or canvas schema before any visual editing can happen.</p>
          <ul>
            <li>Round-tripping becomes lossy.</li>
            <li>Generated HTML cannot stay canonical.</li>
            <li>Custom markup gets flattened away.</li>
          </ul>
        </article>
        <article class="problem-card">
          <strong>AI-first workflows need direct HTML</strong>
          <p>Teams want to generate, inspect, patch, version, and re-edit slides without a format translation boundary in the middle.</p>
          <ul>
            <li>Generated decks should stay readable in git.</li>
            <li>Editing should preserve original semantics.</li>
            <li>Render and source should remain aligned.</li>
          </ul>
        </article>
        <article class="problem-card">
          <strong>Testing needs realism</strong>
          <p>A three-slide toy deck is enough for text editing, but not enough to pressure-test broader presentation structures.</p>
          <ul>
            <li>Tables surface alignment and overflow issues.</li>
            <li>Charts stress SVG and mixed-content layouts.</li>
            <li>Images expose cropping and sizing edge cases.</li>
          </ul>
        </article>
      </div>
    `
  );
}

export function buildArchitectureSlide() {
  return wrapHtml(
    `${baseStyles("linear-gradient(135deg, #0f172a 0%, #1e293b 52%, #163b58 100%)", "#f8fafc")}
    .header {
      display: flex;
      justify-content: space-between;
      align-items: end;
      margin-bottom: 26px;
    }
    .header .kicker {
      background: rgba(56, 189, 248, 0.14);
      color: #bae6fd;
    }
    .header h1 {
      margin-top: 16px;
      max-width: 980px;
      font-size: 68px;
      line-height: 0.98;
      letter-spacing: -0.035em;
    }
    .header p {
      max-width: 480px;
      font-size: 24px;
      line-height: 1.45;
      color: rgba(226, 232, 240, 0.76);
    }
    .flow {
      display: grid;
      grid-template-columns: 1fr 140px 1fr 140px 1fr;
      gap: 18px;
      align-items: center;
      height: 620px;
    }
    .flow-card {
      min-height: 330px;
      padding: 26px;
      border-radius: 32px;
      background: rgba(15, 23, 42, 0.46);
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }
    .flow-card strong {
      display: block;
      margin-bottom: 16px;
      font-size: 30px;
    }
    .flow-card p {
      font-size: 21px;
      line-height: 1.4;
      color: rgba(226, 232, 240, 0.78);
    }
    .flow-card ul {
      margin: 18px 0 0;
      padding-left: 22px;
      font-size: 18px;
      line-height: 1.38;
      color: rgba(226, 232, 240, 0.8);
    }
    .arrow {
      display: grid;
      justify-items: center;
      gap: 14px;
      color: rgba(186, 230, 253, 0.92);
    }
    .arrow-line {
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.9));
    }
    .arrow span {
      font-size: 24px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }`,
    `
      <div class="header">
        <div>
          <p class="kicker">Architecture</p>
          <h1>One pipeline from generated HTML to live iframe editing</h1>
        </div>
        <p>The same files serve as generated artifacts, app input, and editor runtime source. That keeps the system inspectable end to end.</p>
      </div>
      <div class="flow">
        <section class="flow-card">
          <strong>1. Generate</strong>
          <p>A local skill writes standalone HTML slides plus a manifest. The generator is deterministic enough for tests and rich enough for demos.</p>
          <ul>
            <li>Self-contained 1920x1080 HTML documents</li>
            <li>Stable editor ids</li>
            <li>Latest output synced into the app</li>
          </ul>
        </section>
        <div class="arrow">
          <span>Manifest</span>
          <div class="arrow-line"></div>
        </div>
        <section class="flow-card">
          <strong>2. Parse</strong>
          <p>Core utilities fetch the manifest, load each HTML file, normalize selector IDs, and derive a SlideModel without inventing a second document format.</p>
          <ul>
            <li>Node IDs like text-1 and block-4</li>
            <li>Root dimensions preserved from source</li>
            <li>Title inferred from heading structure</li>
          </ul>
        </section>
        <div class="arrow">
          <span>Iframe</span>
          <div class="arrow-line"></div>
        </div>
        <section class="flow-card">
          <strong>3. Edit</strong>
          <p>The editor renders raw HTML in an iframe, overlays selection geometry, exposes styles, and commits text edits back into the slide source.</p>
          <ul>
            <li>Direct text editing on double click</li>
            <li>Undo and redo on source-level operations</li>
            <li>Selection overlay for block inspection</li>
          </ul>
        </section>
      </div>
    `
  );
}
