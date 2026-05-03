import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignJustify,
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
  useRef,
  useState,
} from "react";
import { ColorPicker } from "./color-picker";

const TOOLBAR_FADE_MS = 140;

type MenuId = "font" | "size" | "color" | "align" | "arrange";
type TextAlign = "left" | "center" | "right" | "justify";

interface ElementStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  align: TextAlign;
  fillColor: string;
}

const FONTS = ["Inter", "Plus Jakarta Sans", "Card", "IBM Plex Sans", "Georgia", "Courier New"];
const SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 80];
const ALIGN_OPTIONS: Array<{ value: TextAlign; icon: LucideIcon; label: string }> = [
  { value: "left", icon: AlignLeft, label: "Left" },
  { value: "center", icon: AlignCenter, label: "Center" },
  { value: "right", icon: AlignRight, label: "Right" },
  { value: "justify", icon: AlignJustify, label: "Justify" },
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

function FloatingToolbar() {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<MenuId | null>(null);
  const [panelLeft, setPanelLeft] = useState(0);
  const [style, setStyle] = useState<ElementStyle>({
    fontFamily: "Card",
    fontSize: 24,
    color: "#f3efe8",
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    align: "left",
    fillColor: "#aeaeae",
  });

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

  function toggleMenu(menu: MenuId, event: ReactMouseEvent<HTMLButtonElement>) {
    setPanelLeft(event.currentTarget.offsetLeft);
    setActiveMenu((current) => (current === menu ? null : menu));
  }

  function updateStyle(patch: Partial<ElementStyle>) {
    setStyle((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="hse-floating-toolbar hse-floating-toolbar-pop" ref={toolbarRef}>
      <div className="hse-floating-toolbar-strip" aria-label="Formatting toolbar">
        <ToolbarTrigger
          active={activeMenu === "font"}
          className="hse-floating-toolbar-trigger-font"
          onClick={(event) => {
            toggleMenu("font", event);
          }}
        >
          <span className="hse-floating-toolbar-trigger-value">
            <ToolbarIcon icon={Type} />
            <span className="hse-floating-toolbar-truncate">{style.fontFamily}</span>
          </span>
          <ToolbarIcon icon={ChevronDown} muted />
        </ToolbarTrigger>

        <div className="hse-floating-toolbar-size-stepper">
          <IconButton
            label="Decrease font size"
            variant="ghost"
            onClick={() => {
              updateStyle({ fontSize: Math.max(8, style.fontSize - 2) });
            }}
          >
            <ToolbarIcon icon={Minus} />
          </IconButton>
          <ToolbarTrigger
            active={activeMenu === "size"}
            className="hse-floating-toolbar-trigger-size"
            onClick={(event) => {
              toggleMenu("size", event);
            }}
          >
            <span className="hse-floating-toolbar-size-value">{style.fontSize}</span>
          </ToolbarTrigger>
          <IconButton
            label="Increase font size"
            variant="ghost"
            onClick={() => {
              updateStyle({ fontSize: Math.min(200, style.fontSize + 2) });
            }}
          >
            <ToolbarIcon icon={Plus} />
          </IconButton>
        </div>

        <Divider />

        <IconButton
          label="Bold"
          active={style.bold}
          onClick={() => {
            updateStyle({ bold: !style.bold });
          }}
        >
          <ToolbarIcon icon={Bold} />
        </IconButton>
        <IconButton
          label="Italic"
          active={style.italic}
          onClick={() => {
            updateStyle({ italic: !style.italic });
          }}
        >
          <ToolbarIcon icon={Italic} />
        </IconButton>
        <IconButton
          label="Underline"
          active={style.underline}
          onClick={() => {
            updateStyle({ underline: !style.underline });
          }}
        >
          <ToolbarIcon icon={Underline} />
        </IconButton>
        <IconButton
          label="Strikethrough"
          active={style.strike}
          onClick={() => {
            updateStyle({ strike: !style.strike });
          }}
        >
          <ToolbarIcon icon={Strikethrough} />
        </IconButton>

        <Divider />

        <ToolbarTrigger
          active={activeMenu === "color"}
          onClick={(event) => {
            toggleMenu("color", event);
          }}
        >
          <span className="hse-floating-toolbar-trigger-value">
            <ToolbarIcon icon={Palette} />
            <span
              className="hse-floating-toolbar-swatch"
              style={{ background: style.color }}
              aria-hidden="true"
            />
          </span>
          <ToolbarIcon icon={ChevronDown} muted />
        </ToolbarTrigger>

        <ToolbarTrigger
          active={activeMenu === "align"}
          onClick={(event) => {
            toggleMenu("align", event);
          }}
        >
          <ToolbarIcon icon={getAlignIcon(style.align)} />
          <ToolbarIcon icon={ChevronDown} muted />
        </ToolbarTrigger>

        <Divider />

        <ToolbarTrigger
          active={activeMenu === "arrange"}
          className="hse-floating-toolbar-trigger-icon-only"
          onClick={(event) => {
            toggleMenu("arrange", event);
          }}
        >
          <ToolbarIcon icon={Layers} />
          <ToolbarIcon icon={ChevronDown} muted />
        </ToolbarTrigger>

        <Divider />

        <IconButton label="Delete" variant="danger">
          <ToolbarIcon icon={Trash2} />
        </IconButton>
      </div>

      {activeMenu === "font" ? (
        <ToolbarPanel left={panelLeft}>
          <PanelTitle>字体</PanelTitle>
          <div className="hse-floating-toolbar-list">
            {FONTS.map((font) => (
              <button
                key={font}
                className={classNames(
                  "hse-floating-toolbar-option",
                  "hse-floating-toolbar-option-split",
                  style.fontFamily === font && "is-selected"
                )}
                style={{ fontFamily: font }}
                type="button"
                onClick={() => {
                  updateStyle({ fontFamily: font });
                  setActiveMenu(null);
                }}
              >
                <span>{font}</span>
                <span className="hse-floating-toolbar-option-meta">Aa</span>
              </button>
            ))}
          </div>
        </ToolbarPanel>
      ) : null}

      {activeMenu === "size" ? (
        <ToolbarPanel left={panelLeft} width="narrow">
          <div className="hse-floating-toolbar-list">
            {SIZES.map((size) => (
              <button
                key={size}
                className={classNames(
                  "hse-floating-toolbar-option",
                  "hse-floating-toolbar-option-number",
                  style.fontSize === size && "is-selected"
                )}
                type="button"
                onClick={() => {
                  updateStyle({ fontSize: size });
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
          <PanelTitle>选择颜色</PanelTitle>
          <ColorPicker
            value={style.color}
            onChange={(nextColor) => {
              updateStyle(
                nextColor.startsWith("linear") ? { fillColor: nextColor } : { color: nextColor }
              );
            }}
          />
        </ToolbarPanel>
      ) : null}

      {activeMenu === "align" ? (
        <ToolbarPanel left={panelLeft} width="auto">
          <div className="hse-floating-toolbar-icon-grid hse-floating-toolbar-icon-grid-row">
            {ALIGN_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={classNames(
                  "hse-floating-toolbar-grid-button",
                  style.align === option.value && "is-selected"
                )}
                type="button"
                title={option.label}
                onClick={() => {
                  updateStyle({ align: option.value });
                  setActiveMenu(null);
                }}
              >
                <ToolbarIcon icon={option.icon} />
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
              >
                <ToolbarIcon icon={option.icon} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
          <PanelTitle>Layer</PanelTitle>
          <div className="hse-floating-toolbar-list">
            {LAYER_OPTIONS.map((option) => (
              <button key={option.value} className="hse-floating-toolbar-option" type="button">
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
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      className={classNames("hse-floating-toolbar-trigger", active && "is-active", className)}
      type="button"
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
  return (
    <div className={`hse-floating-toolbar-panel is-${width}`} style={{ left }} role="menu">
      {children}
    </div>
  );
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

  if (align === "justify") {
    return AlignJustify;
  }

  return AlignLeft;
}

function ToolbarIcon({ icon: Icon, muted = false }: { icon: LucideIcon; muted?: boolean }) {
  return <Icon className={classNames("hse-floating-toolbar-icon", muted && "is-muted")} />;
}

export { FloatingToolbar };
