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
    <header className="flex min-h-[72px] items-center justify-between gap-5 border-b border-border/70 bg-card/90 px-6 py-3 backdrop-blur-md max-[1200px]:flex-col max-[1200px]:items-start">
      <div className="grid min-w-0 gap-1">
        <div className="flex min-w-0 items-center gap-4">
          <h1 className="min-w-0 flex-1 truncate text-[22px] font-semibold leading-tight">
            {deckTitle}
          </h1>
          {isSaving ? (
            <span
              className="inline-flex h-[22px] shrink-0 items-center rounded-md border border-border bg-secondary px-2.5 text-[11px] font-medium leading-none text-muted-foreground"
              aria-live="polite"
            >
              saving...
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <p className="m-0 min-w-0 truncate text-[13px] text-muted-foreground">{sourceLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 max-[1200px]:w-full max-[1200px]:justify-end">
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
        <Button type="button" aria-label="Present slides" title="Present mode UI placeholder">
          Present
        </Button>
      </div>
    </header>
  );
}

export { EditorHeader };
