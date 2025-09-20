"use client"

import { Bell, Search, User, LogOut, Settings, Menu, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
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

interface HeaderProps {
  user?: {
    name: string
    email: string
    role: string
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-orange-200 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-orange-600/95">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side - BGU Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Image
              src="/united-logo-white.webp"
              alt="BlackGoldUnited"
              width={48}
              height={48}
              className="rounded-xl shadow-lg ring-2 ring-white/20"
            />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-white tracking-tight">BGU Portal</h1>
            <p className="text-xs text-orange-100 font-medium">Enterprise Management</p>
          </div>
        </div>

        {/* Center - Enhanced Search with Command Palette */}
        <div className="flex items-center space-x-4 flex-1 max-w-lg mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-200" />
            <Command className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-200" />
            <Input
              placeholder="Search modules, clients, invoices... (Ctrl+K)"
              className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-orange-100 focus:bg-white/20 focus:border-white/40 transition-all duration-200 h-10 rounded-xl"
            />
          </div>
        </div>

        {/* Right side - Enhanced Actions and User */}
        <div className="flex items-center space-x-3">
          {/* Current Date with improved styling */}
          <div className="hidden sm:flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <span className="text-sm text-orange-100 font-medium">
              {new Date().toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Notifications with enhanced styling */}
          <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/20 hover:text-white transition-all duration-200 rounded-xl">
            <Bell className="h-5 w-5" />
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-2 border-white"
            >
              3
            </Badge>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white transition-all duration-200 rounded-xl">
            <Settings className="h-5 w-5" />
          </Button>

          {/* Enhanced User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-white/20 transition-all duration-200">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg ring-2 ring-white/20">
                  <span className="text-white text-sm font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-xl border-orange-200 shadow-xl" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-semibold leading-none text-gray-900">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-gray-500">
                    {user?.email || 'user@bgu.com'}
                  </p>
                  <Badge className="w-fit bg-orange-100 text-orange-800 hover:bg-orange-200">
                    {user?.role || 'Staff'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-orange-100" />
              <DropdownMenuItem className="rounded-lg mx-2 hover:bg-orange-50">
                <User className="mr-2 h-4 w-4 text-orange-600" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg mx-2 hover:bg-orange-50">
                <Settings className="mr-2 h-4 w-4 text-orange-600" />
                <span>System Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-orange-100" />
              <DropdownMenuItem className="rounded-lg mx-2 mb-2 text-red-600 hover:bg-red-50 hover:text-red-700">
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