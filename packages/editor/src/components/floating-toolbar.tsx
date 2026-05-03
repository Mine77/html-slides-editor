import type { StageRect } from "@html-slides-editor/core";
import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDownToLine,
  ArrowUpToLine,
  Bold,
  ChevronDown,
  ChevronUp,
  Italic,
  Layers,
  type LucideIcon,
  Minus,
  Palette,
  Plus,
  Strikethrough,
  Trash2,
  Type,
  Underline,
} from "lucide-react";
import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { CssPropertyRow } from "../lib/collect-css-properties";
import {
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  type TextAlign,
  composeTransform,
  getColorInputValue,
  getFontFamilyLabel,
  getStyleValue,
  isBoldFontWeight,
  isFontFamilySelected,
  parsePixelValue,
  parseTextDecorationLines,
  parseTransformParts,
} from "../lib/style-controls";
import { ColorPicker } from "./color-picker";

const TOOLBAR_FADE_MS = 140;

type MenuId = "font" | "size" | "color" | "align" | "arrange" | "layer";

interface FloatingToolbarProps {
  inspectedStyles: CssPropertyRow[];
  inlineStyleValues: Record<string, string>;
  selectionOverlay: StageRect;
  scale: number;
  offsetX: number;
  offsetY: number;
  slideWidth: number;
  slideHeight: number;
  onStyleChange: (propertyName: string, nextValue: string) => void;
  onDelete: () => void;
}

const ALIGN_OPTIONS: Array<{ value: TextAlign; icon: LucideIcon; label: string }> = [
  { value: "left", icon: AlignLeft, label: "Left" },
  { value: "center", icon: AlignCenter, label: "Center" },
  { value: "right", icon: AlignRight, label: "Right" },
];
const ARRANGE_OPTIONS: Array<{ value: string; icon: LucideIcon; label: string }> = [
  { value: "left", icon: AlignStartHorizontal, label: "Align left" },
  { value: "hcenter", icon: AlignCenterHorizontal, label: "Align horizontal center" },
  { value: "right", icon: AlignEndHorizontal, label: "Align right" },
  { value: "top", icon: AlignStartVertical, label: "Align top" },
  { value: "vcenter", icon: AlignCenterVertical, label: "Align vertical center" },
  { value: "bottom", icon: AlignEndVertical, label: "Align bottom" },
];
const LAYER_OPTIONS: Array<{ value: string; icon: LucideIcon; label: string }> = [
  { value: "front", icon: ArrowUpToLine, label: "Bring to front" },
  { value: "forward", icon: ChevronUp, label: "Bring forward" },
  { value: "backward", icon: ChevronDown, label: "Send backward" },
  { value: "back", icon: ArrowDownToLine, label: "Send to back" },
];
function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function FloatingToolbar({
  inspectedStyles,
  inlineStyleValues,
  selectionOverlay,
  scale,
  offsetX,
  offsetY,
  slideWidth,
  slideHeight,
  onStyleChange,
  onDelete,
}: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const sizeInputRef = useRef<HTMLInputElement>(null);
  const [activeMenu, setActiveMenu] = useState<MenuId | null>(null);
  const [panelLeft, setPanelLeft] = useState(0);
  const [toolbarOffsetX, setToolbarOffsetX] = useState(0);
  const fontFamily = getStyleValue(inspectedStyles, "font-family");
  const fontSize = Math.round(parsePixelValue(getStyleValue(inspectedStyles, "font-size"), 24));
  const textColor = getColorInputValue(getStyleValue(inspectedStyles, "color"));
  const textDecorationLines = parseTextDecorationLines(
    getStyleValue(inspectedStyles, "text-decoration-line")
  );
  const textAlign = normalizeTextAlign(getStyleValue(inspectedStyles, "text-align"));
  const transform = inlineStyleValues.transform || getStyleValue(inspectedStyles, "transform");
  const zIndex = inlineStyleValues.zIndex || getStyleValue(inspectedStyles, "z-index");
  const isBold = isBoldFontWeight(getStyleValue(inspectedStyles, "font-weight"));
  const isItalic = getStyleValue(inspectedStyles, "font-style").trim().toLowerCase() === "italic";
  const isUnderlined = textDecorationLines.has("underline");
  const isStruck = textDecorationLines.has("line-through");
  const fontFamilyLabel = getFontFamilyLabel(fontFamily);

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

  useLayoutEffect(() => {
    const node = toolbarRef.current;

    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const baseLeft = rect.left - toolbarOffsetX;
    const baseRight = rect.right - toolbarOffsetX;
    const viewportPadding = 16;
    let nextOffsetX = 0;

    if (baseLeft < viewportPadding) {
      nextOffsetX = viewportPadding - baseLeft;
    }

    if (baseRight + nextOffsetX > window.innerWidth - viewportPadding) {
      nextOffsetX += window.innerWidth - viewportPadding - (baseRight + nextOffsetX);
    }

    if (shouldUpdateOffset(toolbarOffsetX, nextOffsetX)) {
      setToolbarOffsetX(nextOffsetX);
    }
  });

  useEffect(() => {
    function closeOnOutsidePointer(event: MouseEvent) {
      if (toolbarRef.current?.contains(event.target as Node)) {
        return;
      }

      setActiveMenu(null);
    }

    document.addEventListener("mousedown", closeOnOutsidePointer);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsidePointer);
    };
  }, []);

  useEffect(() => {
    if (activeMenu !== "size") {
      return;
    }

    const frame = requestAnimationFrame(() => {
      sizeInputRef.current?.focus();
      sizeInputRef.current?.select();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [activeMenu]);

  function toggleMenu(menu: MenuId, event: ReactMouseEvent<HTMLButtonElement>) {
    setPanelLeft(event.currentTarget.offsetLeft);
    setActiveMenu((current) => (current === menu ? null : menu));
  }

  function commitTextDecoration(line: "underline" | "line-through", isActive: boolean) {
    const nextLines = new Set(textDecorationLines);
    if (isActive) {
      nextLines.delete(line);
    } else {
      nextLines.add(line);
    }

    onStyleChange(
      "text-decoration-line",
      nextLines.size > 0 ? Array.from(nextLines).join(" ") : "none"
    );
  }

  function commitFontSize(nextSize: number) {
    onStyleChange("font-size", `${Math.min(200, Math.max(8, nextSize))}px`);
  }

  function commitLayerAction(action: string) {
    const numericZIndex = Number.parseInt(zIndex, 10);
    const currentZIndex = Number.isFinite(numericZIndex) ? numericZIndex : 0;

    if (action === "front") {
      onStyleChange("z-index", "999");
      return;
    }

    if (action === "back") {
      onStyleChange("z-index", "0");
      return;
    }

    onStyleChange("z-index", String(Math.max(0, currentZIndex + (action === "forward" ? 1 : -1))));
  }

  function commitArrangeAction(action: string) {
    const slideRect = {
      x: (selectionOverlay.x - offsetX) / scale,
      y: (selectionOverlay.y - offsetY) / scale,
      width: selectionOverlay.width / scale,
      height: selectionOverlay.height / scale,
    };
    let deltaX = 0;
    let deltaY = 0;

    if (action === "left") {
      deltaX = -slideRect.x;
    } else if (action === "hcenter") {
      deltaX = slideWidth / 2 - (slideRect.x + slideRect.width / 2);
    } else if (action === "right") {
      deltaX = slideWidth - (slideRect.x + slideRect.width);
    } else if (action === "top") {
      deltaY = -slideRect.y;
    } else if (action === "vcenter") {
      deltaY = slideHeight / 2 - (slideRect.y + slideRect.height / 2);
    } else if (action === "bottom") {
      deltaY = slideHeight - (slideRect.y + slideRect.height);
    }

    if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01) {
      return;
    }

    const transformParts = parseTransformParts(transform);
    onStyleChange(
      "transform",
      composeTransform(
        transformParts.translateX + deltaX,
        transformParts.translateY + deltaY,
        transformParts.rotate
      )
    );
  }

  return (
    <div
      className="hse-floating-toolbar hse-floating-toolbar-pop"
      ref={toolbarRef}
      style={{ marginLeft: toolbarOffsetX }}
    >
      <div className="hse-floating-toolbar-strip" aria-label="Formatting toolbar">
        <ToolbarTrigger
          active={activeMenu === "font"}
          label="Font family"
          className="hse-floating-toolbar-trigger-font"
          onClick={(event) => {
            toggleMenu("font", event);
          }}
        >
          <span className="hse-floating-toolbar-trigger-value">
            <ToolbarIcon icon={Type} />
            <span className="hse-floating-toolbar-truncate">{fontFamilyLabel}</span>
          </span>
        </ToolbarTrigger>

        <div className="hse-floating-toolbar-size-stepper">
          <IconButton
            label="Decrease font size"
            variant="ghost"
            onClick={() => {
              commitFontSize(fontSize - 2);
            }}
          >
            <ToolbarIcon icon={Minus} />
          </IconButton>
          <ToolbarTrigger
            active={activeMenu === "size"}
            label="Font size"
            className="hse-floating-toolbar-trigger-size"
            onClick={(event) => {
              toggleMenu("size", event);
            }}
          >
            <span className="hse-floating-toolbar-size-value">{fontSize}</span>
          </ToolbarTrigger>
          <IconButton
            label="Increase font size"
            variant="ghost"
            onClick={() => {
              commitFontSize(fontSize + 2);
            }}
          >
            <ToolbarIcon icon={Plus} />
          </IconButton>
        </div>

        <Divider />

        <IconButton
          label="Bold"
          active={isBold}
          onClick={() => {
            onStyleChange("font-weight", isBold ? "400" : "700");
          }}
        >
          <ToolbarIcon icon={Bold} />
        </IconButton>
        <IconButton
          label="Italic"
          active={isItalic}
          onClick={() => {
            onStyleChange("font-style", isItalic ? "normal" : "italic");
          }}
        >
          <ToolbarIcon icon={Italic} />
        </IconButton>
        <IconButton
          label="Underline"
          active={isUnderlined}
          onClick={() => {
            commitTextDecoration("underline", isUnderlined);
          }}
        >
          <ToolbarIcon icon={Underline} />
        </IconButton>
        <IconButton
          label="Strikethrough"
          active={isStruck}
          onClick={() => {
            commitTextDecoration("line-through", isStruck);
          }}
        >
          <ToolbarIcon icon={Strikethrough} />
        </IconButton>

        <Divider />

        <ToolbarTrigger
          active={activeMenu === "color"}
          label="Text color"
          onClick={(event) => {
            toggleMenu("color", event);
          }}
        >
          <span
            className="hse-floating-toolbar-swatch"
            style={{ background: textColor }}
            aria-hidden="true"
          />
        </ToolbarTrigger>

        <ToolbarTrigger
          active={activeMenu === "align"}
          label="Text align"
          onClick={(event) => {
            toggleMenu("align", event);
          }}
        >
          <ToolbarIcon icon={getAlignIcon(textAlign)} />
        </ToolbarTrigger>

        <Divider />

        <ToolbarTrigger
          active={activeMenu === "arrange"}
          label="Arrange"
          className="hse-floating-toolbar-trigger-icon-only"
          onClick={(event) => {
            toggleMenu("arrange", event);
          }}
        >
          <ToolbarIcon icon={AlignCenterHorizontal} />
        </ToolbarTrigger>

        <ToolbarTrigger
          active={activeMenu === "layer"}
          label="Layer"
          className="hse-floating-toolbar-trigger-icon-only"
          onClick={(event) => {
            toggleMenu("layer", event);
          }}
        >
          <ToolbarIcon icon={Layers} />
        </ToolbarTrigger>

        <Divider />

        <IconButton label="Delete" variant="danger" onClick={onDelete}>
          <ToolbarIcon icon={Trash2} />
        </IconButton>
      </div>

      {activeMenu === "font" ? (
        <ToolbarPanel left={panelLeft}>
          <PanelTitle>Font</PanelTitle>
          <div className="hse-floating-toolbar-list">
            {FONT_FAMILY_OPTIONS.map((font) => (
              <button
                key={font.value}
                className={classNames(
                  "hse-floating-toolbar-option",
                  isFontFamilySelected(fontFamily, font.value) && "is-selected"
                )}
                style={{ fontFamily: font.value }}
                type="button"
                onClick={() => {
                  onStyleChange("font-family", font.value);
                  setActiveMenu(null);
                }}
              >
                <span>{font.label}</span>
              </button>
            ))}
          </div>
        </ToolbarPanel>
      ) : null}

      {activeMenu === "size" ? (
        <ToolbarPanel left={panelLeft} width="narrow">
          <PanelTitle>Font Size</PanelTitle>
          <input
            className="hse-floating-toolbar-size-input"
            ref={sizeInputRef}
            type="number"
            min={8}
            max={200}
            value={fontSize}
            onChange={(event) => {
              const nextSize = Number.parseInt(event.target.value, 10);

              if (Number.isNaN(nextSize)) {
                return;
              }

              commitFontSize(nextSize);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === "Escape") {
                setActiveMenu(null);
              }
            }}
          />
          <div className="hse-floating-toolbar-list">
            {FONT_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                className={classNames(
                  "hse-floating-toolbar-option",
                  "hse-floating-toolbar-option-number",
                  fontSize === size && "is-selected"
                )}
                type="button"
                onClick={() => {
                  commitFontSize(size);
                  setActiveMenu(null);
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </ToolbarPanel>
      ) : null}

      {activeMenu === "color" ? (
        <ToolbarPanel left={panelLeft} width="wide">
          <PanelTitle>Color</PanelTitle>
          <ColorPicker
            value={textColor}
            includeGradients={false}
            onChange={(nextColor) => {
              onStyleChange("color", nextColor);
            }}
          />
        </ToolbarPanel>
      ) : null}

      {activeMenu === "align" ? (
        <ToolbarPanel left={panelLeft} width="medium">
          <PanelTitle>Text Align</PanelTitle>
          <div className="hse-floating-toolbar-list">
            {ALIGN_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={classNames(
                  "hse-floating-toolbar-option",
                  textAlign === option.value && "is-selected"
                )}
                type="button"
                title={option.label}
                onClick={() => {
                  onStyleChange("text-align", option.value);
                  setActiveMenu(null);
                }}
              >
                <ToolbarIcon icon={option.icon} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </ToolbarPanel>
      ) : null}

      {activeMenu === "arrange" ? (
        <ToolbarPanel left={panelLeft} width="medium">
          <PanelTitle>Align</PanelTitle>
          <div className="hse-floating-toolbar-icon-grid hse-floating-toolbar-icon-grid-arrange">
            {ARRANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className="hse-floating-toolbar-arrange-button"
                type="button"
                title={option.label}
                onClick={() => {
                  commitArrangeAction(option.value);
                  setActiveMenu(null);
                }}
              >
                <ToolbarIcon icon={option.icon} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </ToolbarPanel>
      ) : null}

      {activeMenu === "layer" ? (
        <ToolbarPanel left={panelLeft} width="medium">
          <PanelTitle>Layer</PanelTitle>
          <div className="hse-floating-toolbar-list">
            {LAYER_OPTIONS.map((option) => (
              <button
                key={option.value}
                className="hse-floating-toolbar-option"
                type="button"
                onClick={() => {
                  commitLayerAction(option.value);
                  setActiveMenu(null);
                }}
              >
                <ToolbarIcon icon={option.icon} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </ToolbarPanel>
      ) : null}
    </div>
  );
}

function ToolbarTrigger({
  children,
  active = false,
  className,
  label,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
  label?: string;
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      className={classNames("hse-floating-toolbar-trigger", active && "is-active", className)}
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function IconButton({
  children,
  active = false,
  label,
  onClick,
  variant = "default",
}: {
  children: ReactNode;
  active?: boolean;
  label: string;
  onClick?: () => void;
  variant?: "default" | "ghost" | "danger";
}) {
  return (
    <button
      className={classNames(
        "hse-floating-toolbar-icon-button",
        active && "is-active",
        variant === "ghost" && "is-ghost",
        variant === "danger" && "is-danger"
      )}
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ToolbarPanel({
  children,
  left,
  width = "default",
}: {
  children: ReactNode;
  left: number;
  width?: "auto" | "default" | "medium" | "narrow" | "wide";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const baseRect = {
      bottom: rect.bottom - offset.y,
      left: rect.left - offset.x,
      right: rect.right - offset.x,
      top: rect.top - offset.y,
    };
    const viewportPadding = 16;
    let nextX = 0;
    let nextY = 0;

    if (baseRect.right > window.innerWidth - viewportPadding) {
      nextX = window.innerWidth - viewportPadding - baseRect.right;
    }

    if (baseRect.left + nextX < viewportPadding) {
      nextX += viewportPadding - (baseRect.left + nextX);
    }

    if (baseRect.bottom > window.innerHeight - viewportPadding) {
      nextY = window.innerHeight - viewportPadding - baseRect.bottom;
    }

    if (baseRect.top + nextY < viewportPadding) {
      nextY += viewportPadding - (baseRect.top + nextY);
    }

    if (shouldUpdateOffset(offset.x, nextX) || shouldUpdateOffset(offset.y, nextY)) {
      setOffset({ x: nextX, y: nextY });
    }
  });

  return (
    <div
      className={`hse-floating-toolbar-panel is-${width}`}
      ref={panelRef}
      style={{ left: left + offset.x, top: `calc(100% + 8px + ${offset.y}px)` }}
      role="menu"
    >
      {children}
    </div>
  );
}

function shouldUpdateOffset(current: number, next: number) {
  return Math.abs(current - next) >= 0.5;
}

function Divider() {
  return <div className="hse-floating-toolbar-divider" />;
}

function PanelTitle({ children }: { children: ReactNode }) {
  return <div className="hse-floating-toolbar-panel-title">{children}</div>;
}

function getAlignIcon(align: TextAlign): LucideIcon {
  if (align === "center") {
    return AlignCenter;
  }

  if (align === "right") {
    return AlignRight;
  }

  return AlignLeft;
}

function normalizeTextAlign(value: string): TextAlign {
  if (value === "center" || value === "right") {
    return value;
  }

  return "left";
}

function ToolbarIcon({ icon: Icon, muted = false }: { icon: LucideIcon; muted?: boolean }) {
  return <Icon className={classNames("hse-floating-toolbar-icon", muted && "is-muted")} />;
}

export { FloatingToolbar };
