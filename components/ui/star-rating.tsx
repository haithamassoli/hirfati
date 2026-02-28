import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
