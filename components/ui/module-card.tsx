"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LucideIcon, ArrowRight, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ModuleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  description: string
  icon: LucideIcon
  path: string
  hasAccess: boolean
  colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'emerald' | 'rose' | 'amber'
  stats?: {
    count: number
    amount?: number
    label?: string
  }
  isNew?: boolean
  comingSoon?: boolean
}

const colorSchemes = {
  blue: {
    bg: "from-blue-50 to-blue-100",
    hover: "hover:from-blue-100 hover:to-blue-200",
    border: "border-blue-200",
    icon: "text-blue-600",
    iconBg: "bg-blue-100",
    title: "text-blue-900",
    description: "text-blue-700",
    badge: "bg-blue-100 text-blue-800 border-blue-200"
  },
  green: {
    bg: "from-green-50 to-green-100",
    hover: "hover:from-green-100 hover:to-green-200",
    border: "border-green-200",
    icon: "text-green-600",
    iconBg: "bg-green-100",
    title: "text-green-900",
    description: "text-green-700",
    badge: "bg-green-100 text-green-800 border-green-200"
  },
  purple: {
    bg: "from-purple-50 to-purple-100",
    hover: "hover:from-purple-100 hover:to-purple-200",
    border: "border-purple-200",
    icon: "text-purple-600",
    iconBg: "bg-purple-100",
    title: "text-purple-900",
    description: "text-purple-700",
    badge: "bg-purple-100 text-purple-800 border-purple-200"
  },
  orange: {
    bg: "from-orange-50 to-orange-100",
    hover: "hover:from-orange-100 hover:to-orange-200",
    border: "border-orange-200",
    icon: "text-orange-600",
    iconBg: "bg-orange-100",
    title: "text-orange-900",
    description: "text-orange-700",
    badge: "bg-orange-100 text-orange-800 border-orange-200"
  },
  teal: {
    bg: "from-teal-50 to-teal-100",
    hover: "hover:from-teal-100 hover:to-teal-200",
    border: "border-teal-200",
    icon: "text-teal-600",
    iconBg: "bg-teal-100",
    title: "text-teal-900",
    description: "text-teal-700",
    badge: "bg-teal-100 text-teal-800 border-teal-200"
  },
  emerald: {
    bg: "from-emerald-50 to-emerald-100",
    hover: "hover:from-emerald-100 hover:to-emerald-200",
    border: "border-emerald-200",
    icon: "text-emerald-600",
    iconBg: "bg-emerald-100",
    title: "text-emerald-900",
    description: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200"
  },
  rose: {
    bg: "from-rose-50 to-rose-100",
    hover: "hover:from-rose-100 hover:to-rose-200",
    border: "border-rose-200",
    icon: "text-rose-600",
    iconBg: "bg-rose-100",
    title: "text-rose-900",
    description: "text-rose-700",
    badge: "bg-rose-100 text-rose-800 border-rose-200"
  },
  amber: {
    bg: "from-amber-50 to-amber-100",
    hover: "hover:from-amber-100 hover:to-amber-200",
    border: "border-amber-200",
    icon: "text-amber-600",
    iconBg: "bg-amber-100",
    title: "text-amber-900",
    description: "text-amber-700",
    badge: "bg-amber-100 text-amber-800 border-amber-200"
  }
}

const ModuleCard = React.forwardRef<HTMLDivElement, ModuleCardProps>(
  ({
    className,
    name,
    description,
    icon: Icon,
    path,
    hasAccess,
    colorScheme,
    stats,
    isNew,
    comingSoon,
    ...props
  }, ref) => {
    const colors = colorSchemes[colorScheme]

    const CardContent = () => (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-xl border-2 bg-gradient-to-br p-6 transition-all duration-300",
          colors.bg,
          colors.border,
          hasAccess && !comingSoon ? cn(
            "cursor-pointer hover:shadow-xl hover:scale-[1.02]",
            colors.hover
          ) : "opacity-75",
          !hasAccess && "cursor-not-allowed",
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "rounded-lg p-3 transition-all duration-200",
              colors.iconBg,
              hasAccess && !comingSoon && "group-hover:scale-110"
            )}>
              <Icon className={cn(
                "h-6 w-6",
                hasAccess ? colors.icon : "text-gray-400"
              )} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className={cn(
                  "text-lg font-bold",
                  hasAccess ? colors.title : "text-gray-500"
                )}>
                  {name}
                </h3>
                {isNew && (
                  <Badge className={cn("text-xs px-2 py-0.5", colors.badge)}>
                    New
                  </Badge>
                )}
                {comingSoon && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    Soon
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Icon */}
          <div className="flex-shrink-0">
            {!hasAccess ? (
              <Lock className="h-4 w-4 text-gray-400" />
            ) : comingSoon ? (
              <div className="h-4 w-4" />
            ) : (
              <ArrowRight className={cn(
                "h-4 w-4 transition-all duration-200",
                colors.icon,
                "group-hover:translate-x-1"
              )} />
            )}
          </div>
        </div>

        {/* Description */}
        <p className={cn(
          "text-sm leading-relaxed mb-4",
          hasAccess ? colors.description : "text-gray-400"
        )}>
          {description}
        </p>

        {/* Stats */}
        {stats && hasAccess && !comingSoon && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              {stats.count} {stats.label || 'items'}
            </span>
            {stats.amount && stats.amount > 0 && (
              <span className={cn("font-semibold", colors.title)}>
                ${stats.amount.toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Access Restriction Badge */}
        {!hasAccess && (
          <div className="mt-4">
            <Badge variant="destructive" className="text-xs">
              Access Restricted
            </Badge>
          </div>
        )}

        {/* Decorative Elements */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 transition-all duration-500 group-hover:scale-125" />
        <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-white/10 transition-all duration-300 group-hover:scale-110" />
      </div>
    )

    if (!hasAccess || comingSoon) {
      return <CardContent />
    }

    return (
      <Link href={path} className="block">
        <CardContent />
      </Link>
    )
  }
)
ModuleCard.displayName = "ModuleCard"

export { ModuleCard }