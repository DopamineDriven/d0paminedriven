import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

function BaseSkeleton({ className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { BaseSkeleton };
