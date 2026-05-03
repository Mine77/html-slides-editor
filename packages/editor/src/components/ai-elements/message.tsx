import type * as React from "react";

import { cn } from "@/lib/utils";

type MessageProps = React.ComponentProps<"div"> & {
  from: "assistant" | "user";
};

function Message({ className, from, ...props }: MessageProps) {
  return (
    <div
      data-slot="message"
      data-from={from}
      className={cn("flex max-w-full items-start", from === "user" && "justify-end", className)}
      {...props}
    />
  );
}

type MessageContentProps = React.ComponentProps<"div"> & {
  from?: MessageProps["from"];
};

function MessageContent({ className, from, ...props }: MessageContentProps) {
  return (
    <div
      data-slot="message-content"
      data-from={from}
      className={cn(
        "min-w-0 max-w-[92%] rounded-[11px] border border-border bg-card/60 px-3 py-2.5 text-foreground data-[from=user]:border-primary/20 data-[from=user]:bg-primary/10",
        className
      )}
      {...props}
    />
  );
}

export { Message, MessageContent };
