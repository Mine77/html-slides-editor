import { MessageSquare, SlidersHorizontal } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { CssPropertyRow } from "../lib/collect-css-properties";
import {
  FONT_FAMILY_OPTIONS,
  getColorInputValue,
  isFontFamilySelected,
} from "../lib/style-controls";
import { ChatPanel } from "./chat-panel";

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

  const toggleSection = (sectionId: string) => {
    setOpenSectionIds((currentSections) => {
      const nextSections = new Set(currentSections);
      if (nextSections.has(sectionId)) {
        nextSections.delete(sectionId);
      } else {
        nextSections.add(sectionId);
      }
      return nextSections;
    });
  };

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
      <div className="hse-inspector-field" key={field.propertyName}>
        <label className="hse-inspector-field-label" htmlFor={fieldInputId}>
          {field.label}
        </label>
        {field.input === "select" ? (
          <select
            id={fieldInputId}
            className="hse-inspector-select"
            value={getSelectValue(draftValue ?? currentValue, field)}
            disabled={isStyleEditingDisabled}
            onChange={(event) => {
              const nextValue = event.target.value;
              commitDraftValue(field.propertyName, nextValue, currentValue, onStyleChange);
            }}
          >
            {getSelectOptions(draftValue ?? currentValue, field).map((option) => (
              <option
                key={option.value || "__empty__"}
                value={option.value}
                style={
                  field.propertyName === "font-family" && option.value
                    ? { fontFamily: option.value }
                    : undefined
                }
              >
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="hse-inspector-input-row">
            <input
              id={fieldInputId}
              className="hse-inspector-input"
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
            {field.unit ? <span className="hse-inspector-unit">{field.unit}</span> : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      className={isOpen ? "hse-inspector-panel is-open" : "hse-inspector-panel is-closed"}
      data-testid="sidebar-tool-panel"
      aria-hidden={isOpen ? "false" : "true"}
    >
      {isEditingText ? (
        <p className="hse-editing-hint">Editing text. Press Enter to save or Escape to cancel.</p>
      ) : null}

      <div className="hse-inspector-tabs" role="tablist" aria-label="Inspector tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "edit"}
          className={activeTab === "edit" ? "hse-inspector-tab is-active" : "hse-inspector-tab"}
          onClick={() => {
            setActiveTab("edit");
          }}
        >
          <SlidersHorizontal aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "chat"}
          className={activeTab === "chat" ? "hse-inspector-tab is-active" : "hse-inspector-tab"}
          onClick={() => {
            setActiveTab("chat");
          }}
        >
          <MessageSquare aria-hidden="true" />
          Chat
        </button>
      </div>

      {activeTab === "edit" ? (
        <div className="hse-inspector-tab-panel" role="tabpanel">
          <div className="hse-inspector-accordion">
            {INSPECTOR_SECTIONS.map((section) => {
              const isSectionOpen = openSectionIds.has(section.id);
              const panelId = `${accordionBaseId}-${section.id}-panel`;

              return (
                <section
                  key={section.id}
                  className={isSectionOpen ? "hse-inspector-group is-open" : "hse-inspector-group"}
                >
                  <button
                    type="button"
                    className="hse-inspector-group-toggle"
                    aria-expanded={isSectionOpen}
                    aria-controls={panelId}
                    onClick={() => {
                      toggleSection(section.id);
                    }}
                  >
                    <span>
                      <strong>{section.title}</strong>
                      <small>{section.description}</small>
                    </span>
                    <span className="hse-inspector-group-icon" aria-hidden="true">
                      {isSectionOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isSectionOpen ? (
                    <div className="hse-inspector-group-panel" id={panelId}>
                      <div className="hse-inspector-form-grid">
                        {section.fields.map(renderField)}
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}

            <section
              className={
                openSectionIds.has("custom") ? "hse-inspector-group is-open" : "hse-inspector-group"
              }
            >
              <button
                type="button"
                className="hse-inspector-group-toggle"
                aria-expanded={openSectionIds.has("custom")}
                aria-controls={`${accordionBaseId}-custom-panel`}
                onClick={() => {
                  toggleSection("custom");
                }}
              >
                <span>
                  <strong>Custom CSS</strong>
                  <small>Add or override any CSS property directly.</small>
                </span>
                <span className="hse-inspector-group-icon" aria-hidden="true">
                  {openSectionIds.has("custom") ? "−" : "+"}
                </span>
              </button>

              {openSectionIds.has("custom") ? (
                <div className="hse-inspector-group-panel" id={`${accordionBaseId}-custom-panel`}>
                  <div className="hse-inspector-custom-grid">
                    <label className="hse-inspector-field">
                      <span className="hse-inspector-field-label">Property name</span>
                      <input
                        className="hse-inspector-input"
                        type="text"
                        value={customPropertyName}
                        placeholder="e.g. justify-content"
                        disabled={isStyleEditingDisabled}
                        onChange={(event) => {
                          setCustomPropertyName(event.target.value);
                        }}
                      />
                    </label>
                    <label className="hse-inspector-field">
                      <span className="hse-inspector-field-label">Property value</span>
                      <input
                        className="hse-inspector-input"
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

                  <button
                    type="button"
                    className="hse-inspector-apply-button"
                    disabled={isStyleEditingDisabled || customPropertyName.trim().length === 0}
                    onClick={() => {
                      onStyleChange(customPropertyName.trim(), customPropertyValue.trim());
                      setCustomPropertyValue("");
                    }}
                  >
                    Apply property
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      ) : (
        <div className="hse-inspector-tab-panel hse-chat-tab-panel" role="tabpanel">
          <ChatPanel />
        </div>
      )}
    </section>
  );
}

export { SidebarToolPanel };
