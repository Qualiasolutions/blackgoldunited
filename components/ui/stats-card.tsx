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
    bg: "bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100/50",
    border: "border-blue-200/60",
    icon: "text-blue-600",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30",
    title: "text-slate-600",
    value: "text-slate-900",
    trend: "text-slate-500"
  },
  green: {
    bg: "bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100/50",
    border: "border-emerald-200/60",
    icon: "text-white",
    iconBg: "bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30",
    title: "text-slate-600",
    value: "text-slate-900",
    trend: "text-slate-500"
  },
  purple: {
    bg: "bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100/50",
    border: "border-purple-200/60",
    icon: "text-white",
    iconBg: "bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30",
    title: "text-slate-600",
    value: "text-slate-900",
    trend: "text-slate-500"
  },
  orange: {
    bg: "bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100/50",
    border: "border-orange-200/60",
    icon: "text-white",
    iconBg: "bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30",
    title: "text-slate-600",
    value: "text-slate-900",
    trend: "text-slate-500"
  },
  teal: {
    bg: "bg-gradient-to-br from-teal-50 via-teal-50 to-teal-100/50",
    border: "border-teal-200/60",
    icon: "text-white",
    iconBg: "bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30",
    title: "text-slate-600",
    value: "text-slate-900",
    trend: "text-slate-500"
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100/50",
    border: "border-emerald-200/60",
    icon: "text-white",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30",
    title: "text-slate-600",
    value: "text-slate-900",
    trend: "text-slate-500"
  },
  rose: {
    bg: "bg-gradient-to-br from-rose-50 via-rose-50 to-rose-100/50",
    border: "border-rose-200/60",
    icon: "text-white",
    iconBg: "bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30",
    title: "text-slate-600",
    value: "text-slate-900",
    trend: "text-slate-500"
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-50 via-amber-50 to-amber-100/50",
    border: "border-amber-200/60",
    icon: "text-white",
    iconBg: "bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30",
    title: "text-slate-600",
    value: "text-slate-900",
    trend: "text-slate-500"
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
          "relative overflow-hidden rounded-2xl border backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20",
          colors.bg,
          colors.border,
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <p className={cn("text-sm font-semibold uppercase tracking-wide", colors.title)}>
              {title}
            </p>
            <div className={cn("text-4xl font-bold tracking-tight", colors.value)}>
              {typeof value === 'number' ? (value ?? 0).toLocaleString() : value}
            </div>
            {description && (
              <p className={cn("text-xs font-medium", colors.trend)}>
                {description}
              </p>
            )}
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", colors.trend)}>
                <span className={cn(
                  "flex items-center gap-0.5 px-2 py-1 rounded-md font-semibold",
                  trend.isPositive !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {trend.isPositive !== false ? "↗" : "↘"}
                  {trend.isPositive !== false ? "+" : ""}{trend.value}%
                </span>
                <span className="text-slate-500">{trend.label}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn("rounded-xl p-3.5", colors.iconBg)}>
              <Icon className={cn("h-7 w-7", colors.icon)} />
            </div>
          )}
        </div>

        {/* Modern decorative elements */}
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -right-2 -bottom-2 h-12 w-12 rounded-full bg-white/10 blur-xl" />
      </div>
    )
  }
)
StatsCard.displayName = "StatsCard"

export { StatsCard }