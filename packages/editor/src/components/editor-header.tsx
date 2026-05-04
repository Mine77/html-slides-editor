import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface EditorHeaderProps {
  deckTitle: string;
  sourceLabel: string;
  isSaving: boolean;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
}

function EditorHeader({
  deckTitle,
  sourceLabel,
  isSaving,
  isInspectorOpen,
  onToggleInspector,
}: EditorHeaderProps) {
  const InspectorIcon = isInspectorOpen ? PanelRightClose : PanelRightOpen;

  return (
    <header className="flex min-h-14 items-center justify-between gap-4 border-b border-foreground/[0.08] bg-white px-5 py-2.5 max-[1200px]:flex-col max-[1200px]:items-start">
      <div className="grid min-w-0 gap-1">
        <div className="flex min-w-0 items-center gap-4">
          <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold leading-tight text-foreground">
            {deckTitle}
          </h1>
          {isSaving ? (
            <span
              className="inline-flex h-5 shrink-0 items-center rounded-md border border-foreground/[0.08] bg-foreground/[0.03] px-2 text-[10px] font-medium uppercase leading-none tracking-wider text-foreground/45"
              aria-live="polite"
            >
              saving...
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <p className="m-0 min-w-0 truncate text-[12px] text-foreground/45">{sourceLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 max-[1200px]:w-full max-[1200px]:justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              type="button"
              aria-label={isInspectorOpen ? "Hide advanced panel" : "Show advanced panel"}
              aria-pressed={isInspectorOpen}
              data-testid="toggle-inspector-button"
              onClick={onToggleInspector}
            >
              <InspectorIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isInspectorOpen ? "Hide advanced panel" : "Show advanced panel"}
          </TooltipContent>
        </Tooltip>
        <Button
          type="button"
          variant="outline"
          aria-label="Present slides"
          title="Present mode UI placeholder"
        >
          Present
        </Button>
      </div>
    </header>
  );
}

export { EditorHeader };
