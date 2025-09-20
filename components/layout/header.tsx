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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/95">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Left side - Big BGU Logo Only */}
        <div className="flex items-center">
          <div className="relative">
            <Image
              src="/united-logo-white.webp"
              alt="BlackGoldUnited"
              width={64}
              height={64}
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Center - Minimal Search */}
        <div className="flex items-center space-x-4 flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-gray-300 transition-all duration-200 h-10 rounded-lg"
            />
          </div>
        </div>

        {/* Right side - Minimal Actions and User */}
        <div className="flex items-center space-x-4">
          {/* Current Date */}
          <div className="hidden sm:flex items-center text-sm text-gray-600 font-medium">
            {new Date().toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200">
            <Bell className="h-5 w-5" />
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-orange-500 text-white border-2 border-white"
            >
              3
            </Badge>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100 transition-all duration-200">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-lg border-gray-200 shadow-lg" align="end" forceMount>
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
              <DropdownMenuSeparator className="bg-gray-100" />
              <DropdownMenuItem className="rounded-lg mx-2 hover:bg-gray-50">
                <User className="mr-2 h-4 w-4 text-gray-600" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg mx-2 hover:bg-gray-50">
                <Settings className="mr-2 h-4 w-4 text-gray-600" />
                <span>System Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-100" />
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