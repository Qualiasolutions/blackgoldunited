"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'emerald' | 'rose' | 'amber'
}

const colorSchemes = {
  blue: {
    bg: "from-blue-50 to-blue-100",
    border: "border-blue-200",
    icon: "text-blue-600",
    iconBg: "bg-blue-100",
    title: "text-blue-800",
    value: "text-blue-900",
    trend: "text-blue-600"
  },
  green: {
    bg: "from-green-50 to-green-100",
    border: "border-green-200",
    icon: "text-green-600",
    iconBg: "bg-green-100",
    title: "text-green-800",
    value: "text-green-900",
    trend: "text-green-600"
  },
  purple: {
    bg: "from-purple-50 to-purple-100",
    border: "border-purple-200",
    icon: "text-purple-600",
    iconBg: "bg-purple-100",
    title: "text-purple-800",
    value: "text-purple-900",
    trend: "text-purple-600"
  },
  orange: {
    bg: "from-orange-50 to-orange-100",
    border: "border-orange-200",
    icon: "text-orange-600",
    iconBg: "bg-orange-100",
    title: "text-orange-800",
    value: "text-orange-900",
    trend: "text-orange-600"
  },
  teal: {
    bg: "from-teal-50 to-teal-100",
    border: "border-teal-200",
    icon: "text-teal-600",
    iconBg: "bg-teal-100",
    title: "text-teal-800",
    value: "text-teal-900",
    trend: "text-teal-600"
  },
  emerald: {
    bg: "from-emerald-50 to-emerald-100",
    border: "border-emerald-200",
    icon: "text-emerald-600",
    iconBg: "bg-emerald-100",
    title: "text-emerald-800",
    value: "text-emerald-900",
    trend: "text-emerald-600"
  },
  rose: {
    bg: "from-rose-50 to-rose-100",
    border: "border-rose-200",
    icon: "text-rose-600",
    iconBg: "bg-rose-100",
    title: "text-rose-800",
    value: "text-rose-900",
    trend: "text-rose-600"
  },
  amber: {
    bg: "from-amber-50 to-amber-100",
    border: "border-amber-200",
    icon: "text-amber-600",
    iconBg: "bg-amber-100",
    title: "text-amber-800",
    value: "text-amber-900",
    trend: "text-amber-600"
  }
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({
    className,
    title,
    value,
    description,
    icon: Icon,
    trend,
    colorScheme = 'blue',
    ...props
  }, ref) => {
    const colors = colorSchemes[colorScheme]

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 transition-all duration-200 hover:shadow-lg",
          colors.bg,
          colors.border,
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={cn("text-sm font-medium", colors.title)}>
              {title}
            </p>
            <div className={cn("text-3xl font-bold", colors.value)}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {description && (
              <p className={cn("text-xs", colors.trend)}>
                {description}
              </p>
            )}
            {trend && (
              <div className={cn("flex items-center text-xs", colors.trend)}>
                <span className={cn(
                  "mr-1",
                  trend.isPositive !== false ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive !== false ? "↗" : "↘"}
                </span>
                <span className="font-medium">
                  {trend.isPositive !== false ? "+" : ""}{trend.value}%
                </span>
                <span className="ml-1">{trend.label}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn("rounded-lg p-3", colors.iconBg)}>
              <Icon className={cn("h-6 w-6", colors.icon)} />
            </div>
          )}
        </div>

        {/* Subtle decorative element */}
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" />
      </div>
    )
  }
)
StatsCard.displayName = "StatsCard"

export { StatsCard }