import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const variants = {
  default: "bg-neutral-100 text-neutral-700 border-neutral-200",
  primary: "bg-primary-50 text-primary-700 border-primary-200",
  accent: "bg-accent-50 text-accent-800 border-accent-200",
  success: "bg-success-light text-green-800 border-green-200",
  warning: "bg-warning-light text-orange-800 border-orange-200",
  error: "bg-error-light text-red-800 border-red-200",
  info: "bg-info-light text-blue-800 border-blue-200",
  premium: "bg-gradient-to-l from-accent-400 to-accent-500 text-white border-accent-400",
} as const;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
