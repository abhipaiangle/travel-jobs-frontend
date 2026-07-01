import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }) => (
  <div className={cn("rounded-lg border bg-background shadow-sm", className)} {...props} />
);
export const CardHeader = ({ className, ...props }) => (
  <div className={cn("p-6 pb-3", className)} {...props} />
);
export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("text-lg font-semibold tracking-tight", className)} {...props} />
);
export const CardDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);
export const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6 pt-3", className)} {...props} />
);
export const CardFooter = ({ className, ...props }) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
);
