import type * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Suggestions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="suggestions" className={cn("flex flex-wrap gap-2", className)} {...props} />
  );
}

function Suggestion({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="suggestion"
      variant="outline"
      size="sm"
      className={cn(
        "h-[30px] max-w-full rounded-full bg-card/70 px-2.5 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export { Suggestion, Suggestions };
