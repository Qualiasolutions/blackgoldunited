"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ChevronDown, 
  ChevronRight,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Calculator,
  UserCheck,
  Building,
  Clock,
  CreditCard,
  FileText,
  Shield,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { navigationModules } from '@/lib/config/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

// Icon mapping
const iconMap = {
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Calculator,
  UserCheck,
  Building,
  Clock,
  CreditCard,
  FileText,
  Shield,
  Settings,
}

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const isModuleExpanded = (moduleId: string) => expandedModules.includes(moduleId)
  
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo and Title */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            <span className="text-white font-bold text-sm">BGU</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold">Black Gold United</h1>
            <p className="text-xs text-muted-foreground">ERP System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-4">
          {/* Dashboard Link */}
          <Link href="/">
            <div className={cn(
              "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === '/' 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}>
              <Building className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
          </Link>

          {/* Module Navigation */}
          {navigationModules.map((module) => {
            const IconComponent = iconMap[module.icon as keyof typeof iconMap]
            const expanded = isModuleExpanded(module.id)
            const moduleActive = isActive(module.href)

            return (
              <div key={module.id} className="space-y-1">
                <button
                  onClick={() => toggleModule(module.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    moduleActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    <span>{module.title}</span>
                  </div>
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {/* Submenu */}
                {expanded && (
                  <div className="ml-6 space-y-1 border-l border-border pl-4">
                    {module.subModules.map((subModule) => (
                      <Link key={subModule.id} href={subModule.href}>
                        <div className={cn(
                          "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive(subModule.href)
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}>
                          {subModule.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground text-center">
          BGU ERP v1.0
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/80 lg:hidden" 
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-full w-80 bg-background border-r lg:hidden">
            <SidebarContent />
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex h-full w-80 flex-col border-r bg-background",
        className
      )}>
        <SidebarContent />
      </div>
    </>
  )
}