"use client"

import { Bell, Search, User, LogOut, Settings } from 'lucide-react'
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

interface HeaderProps {
  user?: {
    name: string
    email: string
    role: string
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side - BGU Logo */}
        <div className="flex items-center space-x-4">
          <Image
            src="/united-logo-white.webp"
            alt="BlackGoldUnited"
            width={120}
            height={120}
            className="rounded-lg"
          />
        </div>

        {/* Center - Search */}
        <div className="flex items-center space-x-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search anything..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Right side - Actions and User */}
        <div className="flex items-center space-x-4">
          {/* Current Date */}
          <span className="text-sm text-blue-100 hidden sm:block">
            {new Date().toLocaleDateString('en-US', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </span>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative text-white hover:bg-blue-500">
            <Bell className="h-4 w-4" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              3
            </Badge>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" className="text-white hover:bg-blue-500">
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || 'user@bgu.com'}
                  </p>
                  <Badge variant="secondary" className="w-fit mt-1">
                    {user?.role || 'Staff'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}