import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";

interface PremiumBadgeProps {
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "icon" | "banner";
  className?: string;
}

export function PremiumBadge({
  size = "md",
  variant = "badge",
  className,
}: PremiumBadgeProps) {
  if (variant === "icon") {
    const iconSizes = {
      sm: "h-3.5 w-3.5",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-gradient-to-bl from-accent-400 to-accent-500 shadow-sm",
          size === "sm" && "p-1",
          size === "md" && "p-1.5",
          size === "lg" && "p-2",
          className
        )}
      >
        <Crown className={cn(iconSizes[size], "text-white")} />
      </span>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-l from-accent-400 via-accent-500 to-accent-600 text-white shadow-md",
          className
        )}
      >
        <Crown className="h-4 w-4" />
        <span className="text-sm font-semibold">حرفي مميز</span>
      </div>
    );
  }

  // Default "badge" variant
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] gap-0.5",
    md: "px-2.5 py-0.5 text-xs gap-1",
    lg: "px-3 py-1 text-sm gap-1.5",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full bg-gradient-to-l from-accent-400 to-accent-500 text-white shadow-sm",
        sizeStyles[size],
        className
      )}
    >
      <Crown className={iconSizes[size]} />
      <span>مميز</span>
    </span>
  );
}
