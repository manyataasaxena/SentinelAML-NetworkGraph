import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "low" | "medium" | "high" | "critical" | "clean" | "flagged" | "under_review"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
    success: "border-transparent bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))]/80",
    warning: "border-transparent bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] hover:bg-[hsl(var(--warning))]/80",
    
    // Risk Levels
    low: "border-transparent bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]",
    medium: "border-transparent bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
    high: "border-transparent bg-destructive/20 text-destructive",
    critical: "border-transparent bg-destructive text-destructive-foreground",
    
    // Tx Status
    clean: "border-transparent bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]",
    flagged: "border-transparent bg-destructive/20 text-destructive",
    under_review: "border-transparent bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
