import { MessageSquare, SlidersHorizontal } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { CssPropertyRow } from "../lib/collect-css-properties";
import {
  FONT_FAMILY_OPTIONS,
  getColorInputValue,
  isFontFamilySelected,
} from "../lib/style-controls";
import { cn } from "../lib/utils";
import { ChatPanel } from "./chat-panel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface SidebarToolPanelProps {
  inspectedStyles: CssPropertyRow[];
  isEditingText: boolean;
  isOpen: boolean;
  canEditStyles: boolean;
  selectedElementId: string | null;
  onStyleChange: (propertyName: string, nextValue: string) => void;
}

interface InspectorFieldConfig {
  propertyName: string;
  label: string;
  input: "text" | "number" | "select" | "color";
  placeholder?: string;
  options?: SelectOption[];
  unit?: string;
  min?: number;
  step?: number;
}

interface SelectOption {
  label: string;
  value: string;
}

interface InspectorSectionConfig {
  id: string;
  title: string;
  description: string;
  fields: InspectorFieldConfig[];
}

const INSPECTOR_SECTIONS: InspectorSectionConfig[] = [
  {
    id: "typography",
    title: "Typography",
    description: "Text style, spacing, and alignment.",
    fields: [
      {
        propertyName: "font-family",
        label: "Font family",
        input: "select",
        options: FONT_FAMILY_OPTIONS.map((font) => ({ label: font.label, value: font.value })),
      },
      {
        propertyName: "font-size",
        label: "Font size",
        input: "number",
        unit: "px",
        min: 0,
        step: 1,
      },
      {
        propertyName: "font-weight",
        label: "Font weight",
        input: "select",
        options: [
          { label: "unset", value: "" },
          { label: "Light", value: "300" },
          { label: "Regular", value: "400" },
          { label: "Medium", value: "500" },
          { label: "Semibold", value: "600" },
          { label: "Bold", value: "700" },
          { label: "Heavy", value: "800" },
        ],
      },
      {
        propertyName: "line-height",
        label: "Line height",
        input: "text",
        placeholder: "1.4 or 32px",
      },
      {
        propertyName: "text-align",
        label: "Text align",
        input: "select",
        options: [
          { label: "unset", value: "" },
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
      },
      { propertyName: "color", label: "Text color", input: "color" },
    ],
  },
  {
    id: "layout",
    title: "Layout",
    description: "Size and element visibility.",
    fields: [
      { propertyName: "width", label: "Width", input: "text", placeholder: "320px or auto" },
      { propertyName: "height", label: "Height", input: "text", placeholder: "240px or auto" },
      { propertyName: "opacity", label: "Opacity", input: "text", placeholder: "0 to 1" },
      {
        propertyName: "display",
        label: "Visibility",
        input: "select",
        options: [
          { label: "visible", value: "" },
          { label: "hidden", value: "none" },
        ],
      },
    ],
  },
  {
    id: "fill",
    title: "Fill",
    description: "Background color and surface style.",
    fields: [{ propertyName: "background-color", label: "Background color", input: "color" }],
  },
  {
    id: "border",
    title: "Shape",
    description: "Edges, border, and shadow.",
    fields: [
      { propertyName: "border", label: "Border", input: "text", placeholder: "1px solid #d1c1ae" },
      { propertyName: "border-radius", label: "Radius", input: "text", placeholder: "16px" },
      {
        propertyName: "box-shadow",
        label: "Shadow",
        input: "text",
        placeholder: "0 12px 30px rgba(...)",
      },
    ],
  },
];

const DEFAULT_OPEN_SECTIONS = new Set<string>(["typography", "layout"]);
const STYLE_CHANGE_DEBOUNCE_MS = 750;
const EMPTY_SELECT_VALUE = "__empty__";

function toStyleMap(inspectedStyles: CssPropertyRow[]): Map<string, string> {
  return new Map(inspectedStyles.map((property) => [property.name, property.value]));
}

function normalizeNumberInput(rawValue: string, unit: string | undefined) {
  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return "";
  }

  return unit ? `${trimmed}${unit}` : trimmed;
}

function getInputValue(value: string, field: InspectorFieldConfig) {
  if (field.input === "number" && field.unit && value.endsWith(field.unit)) {
    return value.slice(0, -field.unit.length);
  }

  if (field.input === "color") {
    return getColorInputValue(value);
  }

  return value;
}

function getSelectValue(value: string, field: InspectorFieldConfig): string {
  if (field.propertyName === "font-family") {
    return (
      field.options?.find((option) => isFontFamilySelected(value, option.value))?.value ?? value
    );
  }

  if (field.propertyName === "display") {
    return value === "none" ? "none" : "";
  }

  if (field.propertyName === "text-align" && value === "start") {
    return "left";
  }

  return value;
}

function getSelectOptions(value: string, field: InspectorFieldConfig): SelectOption[] {
  const options = field.options ?? [{ label: "unset", value: "" }];
  const selectValue = getSelectValue(value, field);
  const hasMatchingOption = options.some((option) => option.value === selectValue);

  if (hasMatchingOption) {
    return options;
  }

  return [{ label: value || "unset", value }, ...options];
}

function getChangeValue(nextRawValue: string, field: InspectorFieldConfig) {
  if (field.input === "number") {
    return normalizeNumberInput(nextRawValue, field.unit);
  }

  return nextRawValue;
}

function commitDraftValue(
  propertyName: string,
  draftValue: string | undefined,
  inspectedValue: string,
  onStyleChange: (propertyName: string, nextValue: string) => void
) {
  if (draftValue === undefined) {
    return;
  }

  const normalizedDraft = (draftValue ?? "").trim();
  const normalizedCurrent = inspectedValue.trim();

  if (normalizedDraft === normalizedCurrent) {
    return;
  }

  onStyleChange(propertyName, normalizedDraft);
}

function SidebarToolPanel({
  inspectedStyles,
  isEditingText,
  isOpen,
  canEditStyles,
  selectedElementId,
  onStyleChange,
}: SidebarToolPanelProps) {
  const accordionBaseId = useId();
  const styleMap = useMemo(() => toStyleMap(inspectedStyles), [inspectedStyles]);
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(DEFAULT_OPEN_SECTIONS);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [customPropertyName, setCustomPropertyName] = useState("");
  const [customPropertyValue, setCustomPropertyValue] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "chat">("edit");
  const isStyleEditingDisabled = !canEditStyles || isEditingText;
  const editingTargetId = selectedElementId ?? "slide-root";
  const customPropertyNameId = `${accordionBaseId}-custom-property-name`;
  const customPropertyValueId = `${accordionBaseId}-custom-property-value`;

  useEffect(() => {
    void editingTargetId;
    setDraftValues({});
    setCustomPropertyName("");
    setCustomPropertyValue("");
  }, [editingTargetId]);

  useEffect(() => {
    const draftEntries = Object.entries(draftValues);
    if (draftEntries.length === 0 || isStyleEditingDisabled) {
      return;
    }

    const timer = window.setTimeout(() => {
      for (const [propertyName, draftValue] of draftEntries) {
        commitDraftValue(propertyName, draftValue, styleMap.get(propertyName) ?? "", onStyleChange);
      }

      setDraftValues((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        for (const [propertyName, draftValue] of draftEntries) {
          if (nextDrafts[propertyName] === draftValue) {
            delete nextDrafts[propertyName];
          }
        }
        return nextDrafts;
      });
    }, STYLE_CHANGE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draftValues, isStyleEditingDisabled, onStyleChange, styleMap]);

  const renderField = (field: InspectorFieldConfig) => {
    const currentValue = styleMap.get(field.propertyName) ?? "";
    const draftValue = draftValues[field.propertyName];
    const inputValue = getInputValue(draftValue ?? currentValue, field);
    const fieldInputId = `${accordionBaseId}-${field.propertyName}`;

    const commitField = () => {
      commitDraftValue(
        field.propertyName,
        draftValues[field.propertyName],
        currentValue,
        onStyleChange
      );
    };

    return (
      <div className="grid gap-1.5" key={field.propertyName}>
        <label
          className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
          htmlFor={fieldInputId}
        >
          {field.label}
        </label>
        {field.input === "select" ? (
          <Select
            value={getSelectValue(draftValue ?? currentValue, field) || EMPTY_SELECT_VALUE}
            disabled={isStyleEditingDisabled}
            onValueChange={(nextValue) => {
              commitDraftValue(
                field.propertyName,
                nextValue === EMPTY_SELECT_VALUE ? "" : nextValue,
                currentValue,
                onStyleChange
              );
            }}
          >
            <SelectTrigger
              id={fieldInputId}
              aria-label={field.label}
              className="w-full bg-card/90"
              data-value={getSelectValue(draftValue ?? currentValue, field)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {getSelectOptions(draftValue ?? currentValue, field).map((option) => (
                  <SelectItem
                    key={option.value || EMPTY_SELECT_VALUE}
                    value={option.value || EMPTY_SELECT_VALUE}
                    data-testid={`${field.propertyName}-option`}
                    data-value={option.value}
                    style={
                      field.propertyName === "font-family" && option.value
                        ? { fontFamily: option.value }
                        : undefined
                    }
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <Input
              id={fieldInputId}
              className="bg-card/90"
              type={
                field.input === "number" ? "number" : field.input === "color" ? "color" : "text"
              }
              value={inputValue}
              min={field.min}
              step={field.step}
              placeholder={field.placeholder}
              disabled={isStyleEditingDisabled}
              onChange={(event) => {
                const nextValue = getChangeValue(event.target.value, field);
                setDraftValues((current) => ({ ...current, [field.propertyName]: nextValue }));
              }}
              onBlur={commitField}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitField();
                  event.currentTarget.blur();
                }
              }}
            />
            {field.unit ? (
              <span className="text-xs text-muted-foreground">{field.unit}</span>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      className={cn(
        "flex min-h-0 w-[360px] max-w-[360px] flex-[0_0_360px] flex-col overflow-x-hidden overflow-y-auto bg-card/90 opacity-100 transition-[width,max-width,padding,opacity] duration-200 max-[1200px]:flex-none",
        !isOpen && "w-0 max-w-0 pointer-events-none opacity-0"
      )}
      data-testid="sidebar-tool-panel"
      aria-hidden={isOpen ? "false" : "true"}
    >
      {isEditingText ? (
        <p className="mx-[18px] mt-4 rounded-[14px] bg-primary/10 px-3 py-2.5 text-[13px] leading-normal text-accent-foreground">
          Editing text. Press Enter to save or Escape to cancel.
        </p>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value === "chat" ? "chat" : "edit");
        }}
        className="min-h-0 flex-1 gap-0"
      >
        <TabsList
          variant="line"
          className="grid h-11 w-full grid-cols-2 rounded-none border-b border-border bg-card/60 px-[18px] py-0"
          aria-label="Inspector tabs"
        >
          <TabsTrigger value="edit" className="h-full rounded-none text-xs font-semibold">
            <SlidersHorizontal aria-hidden="true" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="chat" className="h-full rounded-none text-xs font-semibold">
            <MessageSquare aria-hidden="true" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="min-h-0 p-[18px]">
          <Accordion
            type="multiple"
            value={Array.from(openSectionIds)}
            onValueChange={(nextSectionIds) => {
              setOpenSectionIds(new Set(nextSectionIds));
            }}
            className="grid gap-3"
          >
            {INSPECTOR_SECTIONS.map((section) => {
              const isSectionOpen = openSectionIds.has(section.id);

              return (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  className="overflow-hidden rounded-[18px] border border-border bg-card/70"
                >
                  <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
                    <span className="grid gap-1 text-left">
                      <strong className="text-[15px] leading-tight">{section.title}</strong>
                      <small className="text-xs leading-normal text-muted-foreground">
                        {section.description}
                      </small>
                    </span>
                  </AccordionTrigger>

                  {isSectionOpen ? (
                    <AccordionContent className="px-4 pb-4">
                      <div className="grid gap-3">{section.fields.map(renderField)}</div>
                    </AccordionContent>
                  ) : null}
                </AccordionItem>
              );
            })}

            <AccordionItem
              value="custom"
              className="overflow-hidden rounded-[18px] border border-border bg-card/70"
            >
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
                <span className="grid gap-1 text-left">
                  <strong className="text-[15px] leading-tight">Custom CSS</strong>
                  <small className="text-xs leading-normal text-muted-foreground">
                    Add or override any CSS property directly.
                  </small>
                </span>
              </AccordionTrigger>

              {openSectionIds.has("custom") ? (
                <AccordionContent className="px-4 pb-4">
                  <div className="grid gap-3">
                    <label className="grid gap-1.5" htmlFor={customPropertyNameId}>
                      <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        Property name
                      </span>
                      <Input
                        id={customPropertyNameId}
                        type="text"
                        value={customPropertyName}
                        placeholder="e.g. justify-content"
                        disabled={isStyleEditingDisabled}
                        onChange={(event) => {
                          setCustomPropertyName(event.target.value);
                        }}
                      />
                    </label>
                    <label className="grid gap-1.5" htmlFor={customPropertyValueId}>
                      <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        Property value
                      </span>
                      <Input
                        id={customPropertyValueId}
                        type="text"
                        value={customPropertyValue}
                        placeholder="e.g. space-between"
                        disabled={isStyleEditingDisabled}
                        onChange={(event) => {
                          setCustomPropertyValue(event.target.value);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            const propertyName = customPropertyName.trim();
                            if (!propertyName) {
                              return;
                            }
                            onStyleChange(propertyName, customPropertyValue.trim());
                            setCustomPropertyValue("");
                          }
                        }}
                      />
                    </label>
                  </div>

                  <Button
                    className="mt-3"
                    variant="secondary"
                    type="button"
                    disabled={isStyleEditingDisabled || customPropertyName.trim().length === 0}
                    onClick={() => {
                      onStyleChange(customPropertyName.trim(), customPropertyValue.trim());
                      setCustomPropertyValue("");
                    }}
                  >
                    Apply property
                  </Button>
                </AccordionContent>
              ) : null}
            </AccordionItem>
          </Accordion>
        </TabsContent>
        <TabsContent value="chat" className="flex min-h-0 p-[18px]">
          <ChatPanel />
        </TabsContent>
      </Tabs>
    </section>
  );
}

export { SidebarToolPanel };
