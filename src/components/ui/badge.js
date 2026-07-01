import { cn } from "@/lib/utils";

const styles = {
  default: "bg-primary text-primary-foreground",
  outline: "border border-input text-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-100 text-emerald-700",
  warn: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

export const Badge = ({ className, variant = "default", ...props }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      styles[variant] || styles.default,
      className
    )}
    {...props}
  />
);
