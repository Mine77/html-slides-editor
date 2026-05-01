import { useEffect, useRef, useState } from "react";

const TOOLBAR_FADE_MS = 140;

const SIZE_OPTIONS = ["12", "14", "16", "18", "20", "24", "28", "32", "40", "48", "64"];
const FONT_OPTIONS = [
  "Card",
  "IBM Plex Sans",
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Monospace",
];
const ALIGN_OPTIONS = ["Left", "Center", "Right", "Justify"];
const BORDER_OPTIONS = [
  "None",
  "1px solid",
  "2px solid",
  "3px solid",
  "1px dashed",
  "2px dashed",
  "Custom...",
];
const RADIUS_OPTIONS = ["0", "4px", "8px", "12px", "16px", "24px", "999px"];

type MenuId = "font" | "size" | "color" | "case" | "background" | "align" | "border" | "radius";

function TypeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="m9.2 4.5-4.2 10.6h2l1-2.5h4.2l1 2.5h2L11 4.5Zm-.5 6.4L10 7.3l1.3 3.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M10 3.2a6.8 6.8 0 1 0 0 13.6h1.2c.8 0 1.3-.4 1.3-1 0-.3-.1-.6-.3-.8-.2-.2-.3-.5-.3-.8 0-.7.6-1.2 1.4-1.2h1.2A4.5 4.5 0 0 0 19 8.6c0-3-2.8-5.4-6.3-5.4Zm-3 5.1a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Zm2.7-1.7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm2.7 1.7a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Zm1.8 3a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AlignIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M4 5h12v1.6H4zm2.2 3.3h7.6v1.6H6.2zM4 11.6h12v1.6H4zm2.2 3.3h7.6v1.6H6.2z"
        fill="currentColor"
      />
    </svg>
  );
}

function BorderIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M5 5h10v10H5zm1.5 1.5v7h7v-7z" fill="currentColor" />
    </svg>
  );
}

function RadiusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M5 7.5A2.5 2.5 0 0 1 7.5 5H15v1.5H7.5c-.6 0-1 .4-1 1V15H5z"
        fill="currentColor"
      />
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M5 8V5h3V3.5H3.5V8zm9-4.5V5h3v3h1.5V3.5zM5 12H3.5v4.5H8V15H5zm12 0V15h-3v1.5h4.5V12z"
        fill="currentColor"
      />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="m10 3 1.2 3.5L15 7.7l-3 1.9 1 3.4-3-2.1-3 2.1 1-3.4-3-1.9 3.8-1.2Zm6 8 1 2.8 3 1-3 1-1 2.7-1-2.7-3-1 3-1ZM4 10l.8 2.2 2.2.8-2.2.8L4 16l-.8-2.2L1 13l2.2-.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M5 10a1.4 1.4 0 1 1 0-2.8A1.4 1.4 0 0 1 5 10Zm5 0a1.4 1.4 0 1 1 0-2.8A1.4 1.4 0 0 1 10 10Zm5 0a1.4 1.4 0 1 1 0-2.8A1.4 1.4 0 0 1 15 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M6 4.5H3.5V10H5V6h4V4.5Zm8.5 0H10V6h4v4h1.5ZM5 14v-4H3.5v5.5H9V14Zm10-4H13.5v4h-4v1.5H15Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FloatingToolbar() {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<MenuId | null>(null);
  const [sizeValue, setSizeValue] = useState("24");
  const [textColor, setTextColor] = useState("#f3efe8");
  const [backgroundColor, setBackgroundColor] = useState("#aeaeae");

  useEffect(() => {
    const node = toolbarRef.current;
    if (!node) {
      return;
    }

    node.animate(
      [
        { opacity: 0, filter: "blur(6px)" },
        { opacity: 1, filter: "blur(0px)" },
      ],
      {
        duration: TOOLBAR_FADE_MS,
        easing: "ease",
        fill: "both",
      }
    );

    return () => {
      const currentNode = toolbarRef.current;
      const stagePanel = currentNode?.closest(".hse-stage-panel");
      if (!(currentNode instanceof HTMLElement) || !(stagePanel instanceof HTMLElement)) {
        return;
      }

      const toolbarRect = currentNode.getBoundingClientRect();
      const stageRect = stagePanel.getBoundingClientRect();
      const ghost = currentNode.cloneNode(true);

      if (!(ghost instanceof HTMLElement)) {
        return;
      }

      ghost.classList.add("hse-floating-toolbar-ghost");
      ghost.setAttribute("aria-hidden", "true");
      ghost.style.left = `${toolbarRect.left - stageRect.left}px`;
      ghost.style.top = `${toolbarRect.top - stageRect.top}px`;
      ghost.style.width = `${toolbarRect.width}px`;
      ghost.style.height = `${toolbarRect.height}px`;

      stagePanel.appendChild(ghost);

      const animation = ghost.animate(
        [
          { opacity: 1, filter: "blur(0px)" },
          { opacity: 0, filter: "blur(6px)" },
        ],
        {
          duration: TOOLBAR_FADE_MS,
          easing: "ease",
          fill: "forwards",
        }
      );

      void animation.finished.finally(() => {
        ghost.remove();
      });
    };
  }, []);

  return (
    <div className="hse-floating-toolbar" ref={toolbarRef}>
      <div className="hse-floating-toolbar-shell">
        <div className="hse-floating-toolbar-strip" aria-label="Basic formatting toolbar">
          <button
            className={activeMenu === "font" ? "hse-floating-toolbar-trigger is-active" : "hse-floating-toolbar-trigger"}
            type="button"
            onClick={() => {
              setActiveMenu((current) => (current === "font" ? null : "font"));
            }}
          >
            <span className="hse-floating-toolbar-trigger-value">Card</span>
            <span className="hse-floating-toolbar-trigger-caret" aria-hidden="true">▾</span>
          </button>

          <button
            className={activeMenu === "size" ? "hse-floating-toolbar-trigger is-active is-compact" : "hse-floating-toolbar-trigger is-compact"}
            type="button"
            onClick={() => {
              setActiveMenu((current) => (current === "size" ? null : "size"));
            }}
          >
            <span className="hse-floating-toolbar-trigger-value">{sizeValue}</span>
            <span className="hse-floating-toolbar-trigger-caret" aria-hidden="true">▾</span>
          </button>

          <button
            className={activeMenu === "color" ? "hse-floating-toolbar-trigger is-active is-compact" : "hse-floating-toolbar-trigger is-compact"}
            type="button"
            onClick={() => {
              setActiveMenu((current) => (current === "color" ? null : "color"));
            }}
          >
            <span className="hse-floating-toolbar-trigger-icon"><PaletteIcon /></span>
            <span className="hse-floating-toolbar-trigger-caret" aria-hidden="true">▾</span>
          </button>

          <button
            className={activeMenu === "case" ? "hse-floating-toolbar-trigger is-active is-compact" : "hse-floating-toolbar-trigger is-compact"}
            type="button"
            onClick={() => {
              setActiveMenu((current) => (current === "case" ? null : "case"));
            }}
          >
            <span className="hse-floating-toolbar-trigger-value">Aa</span>
            <span className="hse-floating-toolbar-trigger-caret" aria-hidden="true">▾</span>
          </button>

          <button
            className={activeMenu === "background" ? "hse-floating-toolbar-trigger is-active is-compact" : "hse-floating-toolbar-trigger is-compact"}
            type="button"
            onClick={() => {
              setActiveMenu((current) => (current === "background" ? null : "background"));
            }}
          >
            <span
              className="hse-floating-toolbar-trigger-swatch"
              style={{ backgroundColor: backgroundColor }}
              aria-hidden="true"
            />
            <span className="hse-floating-toolbar-trigger-caret" aria-hidden="true">▾</span>
          </button>

          <button
            className={activeMenu === "align" ? "hse-floating-toolbar-trigger is-active is-compact" : "hse-floating-toolbar-trigger is-compact"}
            type="button"
            onClick={() => {
              setActiveMenu((current) => (current === "align" ? null : "align"));
            }}
          >
            <span className="hse-floating-toolbar-trigger-icon"><AlignIcon /></span>
            <span className="hse-floating-toolbar-trigger-caret" aria-hidden="true">▾</span>
          </button>

          <button className="hse-floating-toolbar-trigger is-action is-highlighted" type="button">
            <span className="hse-floating-toolbar-trigger-icon"><FocusIcon /></span>
          </button>

          <button
            className={activeMenu === "border" ? "hse-floating-toolbar-trigger is-active is-compact" : "hse-floating-toolbar-trigger is-compact"}
            type="button"
            onClick={() => {
              setActiveMenu((current) => (current === "border" ? null : "border"));
            }}
          >
            <span className="hse-floating-toolbar-trigger-icon"><BorderIcon /></span>
            <span className="hse-floating-toolbar-trigger-caret" aria-hidden="true">▾</span>
          </button>

          <button
            className={activeMenu === "radius" ? "hse-floating-toolbar-trigger is-active is-compact" : "hse-floating-toolbar-trigger is-compact"}
            type="button"
            onClick={() => {
              setActiveMenu((current) => (current === "radius" ? null : "radius"));
            }}
          >
            <span className="hse-floating-toolbar-trigger-icon"><RadiusIcon /></span>
            <span className="hse-floating-toolbar-trigger-caret" aria-hidden="true">▾</span>
          </button>

          <button className="hse-floating-toolbar-trigger is-compact" type="button">
            <span className="hse-floating-toolbar-trigger-icon"><SparklesIcon /></span>
          </button>

          <button className="hse-floating-toolbar-trigger is-compact" type="button">
            <span className="hse-floating-toolbar-trigger-icon"><MoreIcon /></span>
          </button>
        </div>

        <button className="hse-floating-toolbar-expand" type="button" aria-label="Expand toolbar">
          <ExpandIcon />
        </button>
      </div>

      {activeMenu === "font" ? (
        <div className="hse-floating-toolbar-menu">
          <div className="hse-floating-toolbar-menu-options">
            {FONT_OPTIONS.map((option) => (
              <button key={option} className="hse-floating-toolbar-menu-option" type="button">
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {activeMenu === "size" ? (
        <div className="hse-floating-toolbar-menu">
          <div className="hse-floating-toolbar-size-panel">
            <div className="hse-floating-toolbar-size-input-row">
              <input
                className="hse-floating-toolbar-size-input"
                type="number"
                value={sizeValue}
                onChange={(event) => {
                  setSizeValue(event.target.value);
                }}
              />
              <span className="hse-floating-toolbar-size-unit">px</span>
            </div>
            <div className="hse-floating-toolbar-menu-options">
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={option}
                  className="hse-floating-toolbar-menu-option"
                  type="button"
                  onClick={() => {
                    setSizeValue(option);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeMenu === "color" ? (
        <div className="hse-floating-toolbar-menu">
          <div className="hse-floating-toolbar-color-panel">
            <div className="hse-floating-toolbar-color-preview-row">
              <span
                className="hse-floating-toolbar-color-preview"
                style={{ backgroundColor: textColor }}
                aria-hidden="true"
              />
              <input
                className="hse-floating-toolbar-color-hex"
                type="text"
                value={textColor}
                onChange={(event) => {
                  setTextColor(event.target.value);
                }}
              />
            </div>
            <input
              className="hse-floating-toolbar-color-picker"
              type="color"
              value={textColor}
              onChange={(event) => {
                setTextColor(event.target.value);
              }}
            />
          </div>
        </div>
      ) : null}

      {activeMenu === "background" ? (
        <div className="hse-floating-toolbar-menu">
          <div className="hse-floating-toolbar-color-panel">
            <div className="hse-floating-toolbar-color-preview-row">
              <span
                className="hse-floating-toolbar-color-preview"
                style={{ backgroundColor: backgroundColor }}
                aria-hidden="true"
              />
              <input
                className="hse-floating-toolbar-color-hex"
                type="text"
                value={backgroundColor}
                onChange={(event) => {
                  setBackgroundColor(event.target.value);
                }}
              />
            </div>
            <input
              className="hse-floating-toolbar-color-picker"
              type="color"
              value={backgroundColor}
              onChange={(event) => {
                setBackgroundColor(event.target.value);
              }}
            />
          </div>
        </div>
      ) : null}

      {activeMenu === "case" ? (
        <div className="hse-floating-toolbar-menu">
          <div className="hse-floating-toolbar-menu-options">
            {["Normal", "Uppercase", "Lowercase", "Capitalize"].map((option) => (
              <button key={option} className="hse-floating-toolbar-menu-option" type="button">
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {activeMenu === "align" ? (
        <div className="hse-floating-toolbar-menu">
          <div className="hse-floating-toolbar-menu-options">
            {ALIGN_OPTIONS.map((option) => (
              <button key={option} className="hse-floating-toolbar-menu-option" type="button">
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {activeMenu === "border" ? (
        <div className="hse-floating-toolbar-menu">
          <div className="hse-floating-toolbar-menu-options">
            {BORDER_OPTIONS.map((option) => (
              <button key={option} className="hse-floating-toolbar-menu-option" type="button">
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {activeMenu === "radius" ? (
        <div className="hse-floating-toolbar-menu">
          <div className="hse-floating-toolbar-menu-options">
            {RADIUS_OPTIONS.map((option) => (
              <button key={option} className="hse-floating-toolbar-menu-option" type="button">
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { FloatingToolbar };
