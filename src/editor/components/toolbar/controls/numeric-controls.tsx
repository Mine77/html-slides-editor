import { useEffect, useRef, useState } from "react";
import type { ElementToolFeature } from "../../../lib/element-tool-model";
import { cn } from "../../../lib/utils";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";

const NUMBER_INPUT_DEBOUNCE_MS = 450;

function NumericCommitControl({
  feature,
  label,
  onCommitFeature,
  onPreview,
  unit = "",
}: {
  feature: ElementToolFeature;
  label: string;
  onCommitFeature: (feature: ElementToolFeature, nextValue: string) => void;
  onPreview?: (nextValue: string | null) => void;
  unit?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputId = `toolbar-${feature.id}-custom`;

  useEffect(() => {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft || !onPreview) {
      onPreview?.(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onPreview(`${trimmedDraft}${unit}`);
    }, NUMERIC_INPUT_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [draft, onPreview, unit]);

  function commitDraft() {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft) {
      return;
    }

    onPreview?.(null);
    onCommitFeature(feature, `${trimmedDraft}${unit}`);
    setDraft("");
  }

  return (
    <div className="grid gap-1.5">
      <label
        className="text-[10px] font-medium uppercase tracking-wider text-foreground/45"
        htmlFor={inputId}
      >
        {label}
      </label>
      <div className="flex gap-1">
        <Input
          className="h-8 min-w-0"
          id={inputId}
          inputMode="decimal"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft();
            }
            if (event.key === "Escape") {
              onPreview?.(null);
              setDraft("");
            }
          }}
        />
        <div
          className="grid h-8 min-w-11 place-items-center rounded-md border border-input bg-muted/30 px-2 text-[12px] font-medium text-foreground/45"
          aria-label={unit ? `Unit ${unit}` : "Unitless value"}
        >
          {unit || "x"}
        </div>
      </div>
    </div>
  );
}

function DebouncedStyleNumberControl({
  currentValue,
  feature,
  formatValue,
  getDraftValue,
  label,
  max = 999,
  min = 0,
  onCommitFeature,
  onPreviewStyle,
  unit,
}: {
  currentValue: string;
  feature: ElementToolFeature;
  formatValue: (numericValue: number) => string;
  getDraftValue: (currentValue: string) => string;
  label: string;
  max?: number;
  min?: number;
  onCommitFeature: (feature: ElementToolFeature, nextValue: string) => void;
  onPreviewStyle: (propertyName: string, nextValue: string | null) => void;
  unit: string;
}) {
  const [draft, setDraft] = useState(() => getDraftValue(currentValue));
  const [isFocused, setIsFocused] = useState(false);
  const hasPreviewedDraftRef = useRef(false);
  const committedDraftRef = useRef(getDraftValue(currentValue));
  const inputId = `toolbar-${feature.id}-custom`;

  useEffect(() => {
    const nextDraft = getDraftValue(currentValue);
    committedDraftRef.current = nextDraft;
    if (!isFocused) {
      setDraft(nextDraft);
    }
  }, [currentValue, getDraftValue, isFocused]);

  useEffect(() => {
    return () => {
      if (feature.propertyName && hasPreviewedDraftRef.current) {
        onPreviewStyle(feature.propertyName, null);
      }
    };
  }, [feature.propertyName, onPreviewStyle]);

  useEffect(() => {
    if (!isFocused || !draft.trim()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      commitDraftValue(draft, false);
    }, NUMBER_INPUT_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [draft, isFocused]);

  function getNextValue(nextDraft: string) {
    const numericValue = Number.parseFloat(nextDraft);
    if (!Number.isFinite(numericValue)) {
      return null;
    }

    return formatValue(clamp(numericValue, min, max));
  }

  function previewDraftValue(nextDraft: string) {
    if (!feature.propertyName) {
      return;
    }

    const nextValue = getNextValue(nextDraft);
    hasPreviewedDraftRef.current = nextValue !== null;
    onPreviewStyle(feature.propertyName, nextValue);
  }

  function commitDraftValue(nextDraft: string, syncDraft: boolean) {
    const trimmedDraft = nextDraft.trim();
    if (!trimmedDraft) {
      if (feature.propertyName) {
        onPreviewStyle(feature.propertyName, null);
      }
      hasPreviewedDraftRef.current = false;
      setDraft(getDraftValue(currentValue));
      return;
    }

    const nextValue = getNextValue(trimmedDraft);
    if (nextValue === null) {
      setDraft(getDraftValue(currentValue));
      return;
    }

    const normalizedDraft = String(clamp(Number.parseFloat(trimmedDraft), min, max));
    if (feature.propertyName) {
      onPreviewStyle(feature.propertyName, null);
    }
    hasPreviewedDraftRef.current = false;
    committedDraftRef.current = normalizedDraft;
    onCommitFeature(feature, nextValue);
    if (syncDraft) {
      setDraft(normalizedDraft);
    }
  }

  return (
    <div className="grid gap-1.5">
      <label
        className="text-[10px] font-medium uppercase tracking-wider text-foreground/45"
        htmlFor={inputId}
      >
        {label}
      </label>
      <div className="flex h-8 items-center rounded-md border border-foreground/[0.08] bg-foreground/[0.03] px-2 transition-colors focus-within:border-foreground/20 focus-within:bg-white focus-within:ring-[2px] focus-within:ring-ring/35">
        <Input
          aria-label={label}
          className="h-full min-w-0 border-0 bg-transparent px-0 text-[13px] shadow-none outline-none ring-0 [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          id={inputId}
          inputMode="decimal"
          max={max}
          min={min}
          type="number"
          value={draft}
          onBlur={() => {
            commitDraftValue(draft, true);
            setIsFocused(false);
          }}
          onChange={(event) => {
            const nextDraft = event.target.value;
            setDraft(nextDraft);
            previewDraftValue(nextDraft);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              if (feature.propertyName) {
                onPreviewStyle(feature.propertyName, null);
              }
              hasPreviewedDraftRef.current = false;
              setDraft(getDraftValue(currentValue));
              event.currentTarget.blur();
            }
          }}
        />
        <span
          className="ml-2 shrink-0 text-[11px] font-medium text-foreground/45"
          data-testid={`toolbar-${feature.id}-custom-unit`}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

function TextCommitControl({
  feature,
  label,
  onCommitFeature,
}: {
  feature: ElementToolFeature;
  label: string;
  onCommitFeature: (feature: ElementToolFeature, nextValue: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const inputId = `toolbar-${feature.id}-custom`;
  return (
    <div className="grid gap-1.5">
      <label
        className="text-[10px] font-medium uppercase tracking-wider text-foreground/45"
        htmlFor={inputId}
      >
        {label}
      </label>
      <Textarea id={inputId} value={draft} onChange={(event) => setDraft(event.target.value)} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!draft.trim()}
        onClick={() => {
          onCommitFeature(feature, draft.trim());
          setDraft("");
        }}
      >
        Apply
      </Button>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const NUMERIC_INPUT_DEBOUNCE_MS = 500;

export { DebouncedStyleNumberControl, NumericCommitControl, TextCommitControl };
