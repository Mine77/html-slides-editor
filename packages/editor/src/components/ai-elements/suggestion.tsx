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
        "h-8 max-w-full rounded-md bg-white px-2 text-[12px] font-medium text-foreground/60 hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}

export { Suggestion, Suggestions };
