import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-[var(--radius)] border border-border bg-panel-2 px-3 py-2 text-[14.5px] text-text placeholder:text-muted focus-visible:outline-none focus-visible:border-accent",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
export { Input };
