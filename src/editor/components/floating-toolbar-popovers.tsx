import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import {
  type ComponentProps,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useRef,
} from "react";
import type { ElementToolFeature, ElementToolOption } from "../lib/element-tool-model";
import { cn } from "../lib/utils";
import { ColorPicker } from "./color-picker";
import { ToolbarIcon } from "./floating-toolbar-parts";
import type { SelectionCommandAvailability } from "./floating-toolbar-types";
import {
  ICON_STROKE_WIDTH,
  menuItemClassName,
  toolbarIconButtonActiveClassName,
  toolbarIconButtonClassName,
  toolbarIconClassName,
} from "./floating-toolbar-types";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export interface PopoverSectionProps {
  activePopoverId: string | null;
  commitFeature: (feature: ElementToolFeature, nextValue: string) => void;
  getCurrentValue: (feature: ElementToolFeature) => string;
  getFeature: (featureId: ElementToolFeature["id"]) => ElementToolFeature;
  onStylePreview: (propertyName: string, nextValue: string | null) => void;
  setActivePopoverId: Dispatch<SetStateAction<string | null>>;
}

export interface OptionsSectionProps extends PopoverSectionProps {
  selectionCommandAvailability: SelectionCommandAvailability;
}

function ColorPopover({
  activePopoverId,
  commitFeature,
  feature,
  getCurrentValue,
  icon,
  includeGradients,
  label,
  popoverId,
  setActivePopoverId,
}: PopoverSectionProps & {
  feature: ElementToolFeature;
  icon: ReactNode;
  includeGradients: boolean;
  label: string;
  popoverId: string;
}) {
  return (
    <Popover
      open={activePopoverId === popoverId}
      onOpenChange={(open) => setActivePopoverId(open ? popoverId : null)}
    >
      <PopoverTrigger asChild>
        <ToolbarPopoverButton
          active={activePopoverId === popoverId}
          data-testid={`floating-${popoverId}-trigger`}
          icon={icon}
          label={label}
        />
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[calc(100vh-40px)] overflow-y-auto p-2">
        <ColorPicker
          value={getCurrentValue(feature)}
          ariaLabelPrefix={label}
          includeGradients={includeGradients}
          onChange={(nextValue) => commitFeature(feature, nextValue)}
          onCommit={() => setActivePopoverId(null)}
        />
      </PopoverContent>
    </Popover>
  );
}

function OptionsPopover({
  activePopoverId,
  commitFeature,
  custom,
  feature,
  getCurrentValue,
  icon,
  label,
  options,
  popoverId,
  selectionCommandAvailability,
  setActivePopoverId,
  onStylePreview,
}: OptionsSectionProps & {
  custom?: ReactNode;
  feature: ElementToolFeature;
  icon: ReactNode;
  label: string;
  options: ElementToolOption[];
  popoverId: string;
}) {
  const currentValue = getCurrentValue(feature);
  const triggerIcon = feature.id === "text-align" ? getTextAlignIcon(currentValue) : icon;
  const isStylePreviewMenu = shouldShowOptionPreviewAfterLabel(feature);
  const skipNextPreviewClearRef = useRef(false);

  function clearOptionPreview() {
    if (skipNextPreviewClearRef.current) {
      return;
    }

    if (isStylePreviewMenu && feature.propertyName) {
      onStylePreview(feature.propertyName, null);
    }
  }

  return (
    <Popover
      open={activePopoverId === popoverId}
      onOpenChange={(open) => {
        if (open) {
          skipNextPreviewClearRef.current = false;
        }
        if (!open) {
          clearOptionPreview();
        }
        setActivePopoverId(open ? popoverId : null);
      }}
    >
      <PopoverTrigger asChild>
        <ToolbarPopoverButton
          active={activePopoverId === popoverId}
          data-testid={`floating-${popoverId}-trigger`}
          icon={triggerIcon}
          label={label}
        />
      </PopoverTrigger>
      <PopoverContent className={cn("p-1.5", isStylePreviewMenu ? "w-40" : "w-64")}>
        <div className={cn("grid", isStylePreviewMenu ? "gap-0.5" : "gap-1")}>
          {options.map((option) => {
            const Icon = option.icon;
            const disabled =
              feature.target === "operation" &&
              feature.id === "distribute" &&
              !selectionCommandAvailability.group;
            const showOptionPreviewAfterLabel = shouldShowOptionPreviewAfterLabel(feature);
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  menuItemClassName,
                  currentValue === option.value && "bg-foreground/[0.06]"
                )}
                disabled={disabled}
                data-value={option.value}
                onBlur={clearOptionPreview}
                onClick={() => {
                  skipNextPreviewClearRef.current = true;
                  commitFeature(feature, option.value);
                  setActivePopoverId(null);
                }}
                onMouseDown={() => {
                  skipNextPreviewClearRef.current = true;
                }}
                onPointerDown={() => {
                  skipNextPreviewClearRef.current = true;
                }}
                onFocus={() => {
                  if (feature.propertyName) {
                    onStylePreview(feature.propertyName, option.value);
                  }
                }}
                onMouseEnter={() => {
                  if (feature.propertyName) {
                    onStylePreview(feature.propertyName, option.value);
                  }
                }}
                onMouseLeave={clearOptionPreview}
              >
                {showOptionPreviewAfterLabel ? (
                  <>
                    <span className="min-w-0 truncate">{option.label}</span>
                    <OptionSwatch feature={feature} option={option} />
                  </>
                ) : (
                  <>
                    {Icon ? (
                      <ToolbarIcon icon={Icon} />
                    ) : (
                      <OptionSwatch feature={feature} option={option} />
                    )}
                    <span className="truncate">{option.label}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        {custom ? (
          <div className="mt-2 border-t border-foreground/[0.08] pt-2">{custom}</div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function AttributeMenuButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={menuItemClassName} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function ToolbarSection({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-px rounded-xl">{children}</div>;
}

function ToolbarPopoverButton({
  active,
  className,
  icon,
  label,
  ...props
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
} & Omit<ComponentProps<typeof Button>, "children" | "size" | "type" | "variant">) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      className={cn(
        toolbarIconButtonClassName,
        active && toolbarIconButtonActiveClassName,
        className
      )}
      {...props}
    >
      {icon}
    </Button>
  );
}

function OptionSwatch({
  feature,
  option,
}: {
  feature: ElementToolFeature;
  option: ElementToolOption;
}) {
  if (feature.id === "border") {
    return (
      <span
        className="h-4 w-9 shrink-0 rounded bg-white"
        data-testid="floating-toolbar-option-preview"
        style={{
          borderColor: "rgba(15,23,42,.5)",
          borderStyle: option.value === "none" ? "solid" : option.value,
          borderWidth: option.value === "none" ? "1px" : "2px",
          opacity: option.value === "none" ? 0.32 : 1,
        }}
        aria-hidden="true"
      />
    );
  }
  if (feature.id === "border-radius") {
    return (
      <span
        className="h-4 w-9 shrink-0 border border-foreground/15 bg-foreground/[0.04]"
        data-testid="floating-toolbar-option-preview"
        style={{ borderRadius: option.value }}
        aria-hidden="true"
      />
    );
  }
  if (feature.id === "border-width") {
    return (
      <span className="flex h-4 w-9 shrink-0 items-center justify-center" aria-hidden="true">
        <span
          className="w-full rounded-full bg-foreground/65"
          data-testid="floating-toolbar-option-preview"
          style={{
            height: option.value === "0px" ? "1px" : option.value,
            opacity: option.value === "0px" ? 0.22 : 1,
          }}
        />
      </span>
    );
  }
  if (feature.id === "box-shadow") {
    return (
      <span className="flex h-5 w-10 shrink-0 items-center justify-center" aria-hidden="true">
        <span
          className="h-3.5 w-8 rounded border border-foreground/10 bg-white"
          data-testid="floating-toolbar-option-preview"
          style={{ boxShadow: option.value === "none" ? undefined : option.value }}
        />
      </span>
    );
  }
  return <span className="size-1.5 rounded-full bg-foreground/35" />;
}

function shouldShowOptionPreviewAfterLabel(feature: ElementToolFeature) {
  return (
    feature.id === "border" ||
    feature.id === "border-color" ||
    feature.id === "border-radius" ||
    feature.id === "border-width" ||
    feature.id === "box-shadow"
  );
}

function getTextAlignIcon(currentValue: string) {
  if (currentValue === "left") {
    return <AlignLeft className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />;
  }
  if (currentValue === "right") {
    return <AlignRight className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />;
  }
  return <AlignCenter className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />;
}

export { AttributeMenuButton, ColorPopover, OptionsPopover, ToolbarSection };
