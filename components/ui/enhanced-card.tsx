"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const enhancedCardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border hover:shadow-md",
        elevated: "border-border shadow-lg hover:shadow-xl",
        gradient: "border-0 bg-gradient-to-br hover:shadow-lg",
        interactive: "border-border hover:shadow-lg hover:scale-[1.02] cursor-pointer",
        stats: "border-0 bg-gradient-to-br hover:shadow-md",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        xl: "p-10",
      },
      colorScheme: {
        default: "",
        blue: "from-blue-50 to-blue-100 border-blue-200",
        green: "from-green-50 to-green-100 border-green-200",
        purple: "from-purple-50 to-purple-100 border-purple-200",
        orange: "from-orange-50 to-orange-100 border-orange-200",
        teal: "from-teal-50 to-teal-100 border-teal-200",
        emerald: "from-emerald-50 to-emerald-100 border-emerald-200",
        rose: "from-rose-50 to-rose-100 border-rose-200",
        amber: "from-amber-50 to-amber-100 border-amber-200",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      colorScheme: "default",
    },
  }
)

export interface EnhancedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedCardVariants> {
  asChild?: boolean
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, variant, size, colorScheme, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(enhancedCardVariants({ variant, size, colorScheme, className }))}
      {...props}
    />
  )
)
EnhancedCard.displayName = "EnhancedCard"

const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
EnhancedCardHeader.displayName = "EnhancedCardHeader"

const EnhancedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
EnhancedCardTitle.displayName = "EnhancedCardTitle"

const EnhancedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
EnhancedCardDescription.displayName = "EnhancedCardDescription"

const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
EnhancedCardContent.displayName = "EnhancedCardContent"

const EnhancedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6", className)}
    {...props}
  />
))
EnhancedCardFooter.displayName = "EnhancedCardFooter"

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardFooter,
  EnhancedCardTitle,
  EnhancedCardDescription,
  EnhancedCardContent,
}