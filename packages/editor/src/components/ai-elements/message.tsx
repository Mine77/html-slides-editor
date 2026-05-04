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
        "min-w-0 max-w-[92%] rounded-lg border border-foreground/[0.08] bg-white px-3 py-2.5 text-foreground data-[from=user]:border-foreground/[0.12] data-[from=user]:bg-foreground/[0.04]",
        className
      )}
      {...props}
    />
  );
}

export { Message, MessageContent };
