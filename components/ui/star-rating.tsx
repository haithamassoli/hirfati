"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StarRating({
  rating,
  size = "md",
  showValue = true,
  className,
}: StarRatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.floor(rating);
    const half = !filled && i < rating;
    return { filled, half };
  });

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {stars.map((star, i) => (
          <Star
            key={i}
            className={cn(
              sizeMap[size],
              star.filled
                ? "fill-accent-400 text-accent-400"
                : star.half
                  ? "fill-accent-400/50 text-accent-400"
                  : "fill-neutral-200 text-neutral-200"
            )}
          />
        ))}
      </div>
      {showValue && rating > 0 && (
        <span className="text-sm font-medium text-neutral-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

/* ─── Interactive Star Rating ─── */

interface InteractiveStarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "md" | "lg" | "xl";
  disabled?: boolean;
  className?: string;
}

const interactiveSizeMap = {
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

const ratingLabels = ["", "سيء", "مقبول", "جيد", "جيد جداً", "ممتاز"];

export function InteractiveStarRating({
  value,
  onChange,
  size = "lg",
  disabled = false,
  className,
}: InteractiveStarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= displayValue;

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(starValue)}
              onMouseEnter={() => !disabled && setHoverValue(starValue)}
              onMouseLeave={() => setHoverValue(0)}
              className={cn(
                "transition-all duration-150 cursor-pointer",
                disabled && "cursor-not-allowed opacity-60",
                !disabled && "hover:scale-110 active:scale-95"
              )}
              aria-label={`${starValue} نجوم`}
            >
              <Star
                className={cn(
                  interactiveSizeMap[size],
                  "transition-colors duration-150",
                  isFilled
                    ? "fill-accent-400 text-accent-400 drop-shadow-sm"
                    : "fill-neutral-200 text-neutral-200 hover:fill-accent-200 hover:text-accent-200"
                )}
              />
            </button>
          );
        })}
      </div>
      {displayValue > 0 && (
        <span className="text-sm font-medium text-accent-600 animate-in fade-in duration-200">
          {ratingLabels[displayValue]}
        </span>
      )}
    </div>
  );
}
