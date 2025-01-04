import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
export interface SelectionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSelected?: boolean;
  variant?: "default" | "outline";
}

const SelectionButton = React.forwardRef<HTMLButtonElement, SelectionButtonProps>(
  ({ className, isSelected, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={isSelected ? "outline" : "default"}
        className={cn(
          "rounded-full transition-colors",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
SelectionButton.displayName = "SelectionButton"

export { SelectionButton } 