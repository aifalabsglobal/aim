"use client";

import * as React from "react";

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "outline" }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors",
      variant === "default" && "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30",
      variant === "secondary" && "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]",
      variant === "outline" && "border border-[var(--border-color)] text-[var(--text-primary)]",
      className
    )}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge };
