import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const cardVariants = {
  default: "bg-card border-border shadow-card",
  elevated: "bg-card border-border/60 shadow-elevated hover:shadow-float",
  glass: "bg-card/50 backdrop-blur-xl border-border/50",
  highlight: "bg-card border-primary/15 shadow-glow",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof cardVariants;
}

// Re-export with enhanced variants
export { cardVariants };
