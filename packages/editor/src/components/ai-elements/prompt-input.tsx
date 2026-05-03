import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function PromptInput({ className, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      data-slot="prompt-input"
      className={cn(
        "flex flex-none flex-col gap-2.5 rounded-[14px] border border-border bg-card/80 p-2.5 shadow-[0_10px_28px_rgba(98,70,37,0.07)]",
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
        "min-h-[86px] max-h-[140px] resize-y border-0 bg-transparent p-0 text-[13px] leading-normal shadow-none focus-visible:ring-0",
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
