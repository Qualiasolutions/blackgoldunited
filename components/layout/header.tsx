"use client"

import { Bell, Search, User, LogOut, Settings, Menu, Command, Building2, Users, BarChart3, FileText, ChevronDown, Clock, Calendar, X, CheckCircle, AlertTriangle, Info, AlertCircle, Package, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useAuth } from '@/lib/hooks/useAuth'
import { Notification } from '@/lib/types/bgu'

// Helper function to get notification icons
const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle
    case 'warning':
      return AlertTriangle
    case 'error':
      return AlertCircle
    case 'info':
    default:
      return Info
  }
}

// Helper function to get module icons
const getModuleIcon = (module?: string) => {
  switch (module) {
    case 'sales':
      return TrendingUp
    case 'inventory':
      return Package
    case 'purchase':
      return Building2
    case 'clients':
      return Users
    default:
      return FileText
  }
}

// Corporate Quick Navigation Links
const quickNavItems = [
  {
    title: "Create",
    items: [
      { name: "New Invoice", href: "/sales/invoices/create", icon: FileText },
      { name: "New Client", href: "/clients/create", icon: Users },
      { name: "New Purchase Order", href: "/purchase/create", icon: Building2 },
    ]
  },
  {
    title: "Reports",
    items: [
      { name: "Sales Analytics", href: "/reports/sales", icon: BarChart3 },
      { name: "Financial Overview", href: "/reports/finance", icon: BarChart3 },
      { name: "Employee Reports", href: "/reports/employees", icon: Users },
    ]
  }
]

interface HeaderProps {
  user?: {
    name: string
    email: string
    role: string
  }
}

export function Header({ user }: HeaderProps) {
  const { logout } = useAuth()
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()

  const handleSignOut = async () => {
    await logout()
  }

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section - Logo & Company Info */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              <Image
                src="/united-logo-white.webp"
                alt="BlackGoldUnited"
                width={48}
                height={48}
                className="rounded-lg shadow-sm"
              />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-lg font-bold text-foreground">BlackGoldUnited</h1>
              <p className="text-xs text-muted-foreground">Enterprise ERP System</p>
            </div>
          </Link>
        </div>

        {/* Center - Corporate Navigation Menu */}
        <div className="hidden lg:flex items-center space-x-1">
          <NavigationMenu>
            <NavigationMenuList>
              {quickNavItems.map((section) => (
                <NavigationMenuItem key={section.title}>
                  <NavigationMenuTrigger className="text-sm font-medium bg-transparent hover:bg-accent data-[state=open]:bg-accent">
                    {section.title}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-80 p-4">
                      <div className="grid gap-3">
                        <div className="mb-2">
                          <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                          <p className="text-xs text-muted-foreground">Quick access to {section.title.toLowerCase()} functions</p>
                        </div>
                        {section.items.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                              "flex items-center space-x-3 rounded-md p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{item.name}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Section - Search, Time, Actions & User */}
        <div className="flex items-center space-x-4">
          {/* Global Search */}
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search across all modules..."
              className="pl-10 bg-muted/50 border-border/50 focus:bg-background transition-all duration-200"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          {/* Current Time & Date */}
          <div className="hidden xl:flex flex-col items-end text-xs">
            <div className="flex items-center space-x-1 text-foreground font-medium">
              <Clock className="h-3 w-3" />
              <span>{currentTime}</span>
            </div>
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{currentDate}</span>
            </div>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-96" align="end" forceMount>
              <DropdownMenuLabel className="flex items-center justify-between p-4 pb-2">
                <span className="font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Mark all as read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="max-h-96 overflow-y-auto">
                {notificationsLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const IconComponent = getNotificationIcon(notification.type)
                    const ModuleIcon = getModuleIcon(notification.module)

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start space-x-3 p-4 hover:bg-accent/50 transition-colors cursor-pointer border-l-4",
                          !notification.read && "bg-accent/20",
                          notification.type === 'success' && "border-l-green-500",
                          notification.type === 'warning' && "border-l-yellow-500",
                          notification.type === 'error' && "border-l-red-500",
                          notification.type === 'info' && "border-l-blue-500"
                        )}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            notification.type === 'success' && "bg-green-100 text-green-600",
                            notification.type === 'warning' && "bg-yellow-100 text-yellow-600",
                            notification.type === 'error' && "bg-red-100 text-red-600",
                            notification.type === 'info' && "bg-blue-100 text-blue-600"
                          )}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-1">
                              {notification.module && (
                                <div className="flex items-center space-x-1">
                                  <ModuleIcon className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {notification.module}
                                  </span>
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <Button variant="ghost" className="w-full justify-center" size="sm">
                      View All Notifications
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {user?.name || 'User Name'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email || 'user@blackgoldunited.com'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {user?.role || 'Staff Member'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}