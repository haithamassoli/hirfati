import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Snowflake,
  Grid3X3,
  Settings,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

const iconMap: Record<string, ComponentType<LucideProps>> = {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Snowflake,
  Grid3X3,
  Settings,
  Anvil: Settings,
};

interface CategoryIconProps extends LucideProps {
  icon?: string;
}

export function CategoryIcon({ icon, ...props }: CategoryIconProps) {
  const Icon = icon ? iconMap[icon] ?? Settings : Settings;
  return <Icon {...props} />;
}
