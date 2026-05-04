import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function PromptInput({ className, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      data-slot="prompt-input"
      className={cn(
        "flex flex-none flex-col gap-2 rounded-xl border border-foreground/[0.08] bg-white p-2 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)]",
        className
      )}
      {...props}
    />
  );
}

function PromptInputTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="prompt-input-textarea"
      className={cn(
        "min-h-[86px] max-h-[140px] resize-y border-0 bg-transparent p-0 text-[13px] leading-normal shadow-none hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0",
        className
      )}
      {...props}
    />
  );
}

function PromptInputToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="prompt-input-toolbar"
      className={cn("flex items-center justify-between gap-3", className)}
      {...props}
    />
  );
}

function PromptInputTools({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="prompt-input-tools"
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function PromptInputButton({
  variant = "outline",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  return <Button data-slot="prompt-input-button" variant={variant} size={size} {...props} />;
}

function PromptInputSubmit({ size = "icon-sm", ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-slot="prompt-input-submit" size={size} {...props} />;
}

export {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
};
