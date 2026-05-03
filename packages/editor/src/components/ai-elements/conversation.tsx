import type * as React from "react";

import { cn } from "@/lib/utils";

function Conversation({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="conversation"
      className={cn(
        "flex min-h-[210px] flex-auto flex-col gap-2.5 overflow-y-auto px-0.5 pb-1 pt-0.5",
        className
      )}
      {...props}
    />
  );
}

function ConversationContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="conversation-content"
      className={cn("flex min-h-full flex-col gap-2.5", className)}
      {...props}
    />
  );
}

export { Conversation, ConversationContent };
