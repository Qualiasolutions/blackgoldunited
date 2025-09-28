"use client"

import { Bell, Search, User, LogOut, Settings, Menu, Command, Building2, Users, BarChart3, FileText, ChevronDown, Clock, Calendar } from 'lucide-react'
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 shadow-sm">
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
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              3
            </Badge>
          </Button>

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
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
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