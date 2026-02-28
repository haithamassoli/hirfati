import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
} as const;

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const initials = alt
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full overflow-hidden bg-primary-100 text-primary-700 flex items-center justify-center font-semibold",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={size === "xl" ? "80px" : size === "lg" ? "56px" : "40px"}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
