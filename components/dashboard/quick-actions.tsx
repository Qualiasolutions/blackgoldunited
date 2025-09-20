"use client"

import Link from 'next/link'
import { 
  FileText, 
  Users, 
  Package, 
  ShoppingCart,
  Plus,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { quickActions } from '@/lib/config/navigation'

const iconMap = {
  FileText,
  Users,
  Package,
  ShoppingCart,
  Plus,
}

export function QuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {quickActions.map((action) => {
        const IconComponent = iconMap[action.icon as keyof typeof iconMap] || FileText
        
        return (
          <Card key={action.id} className="group hover:shadow-md transition-shadow cursor-pointer bg-white border-gray-200">
            <Link href={action.href}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900">
                  {action.title}
                </CardTitle>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-${action.color}-100 text-${action.color}-600`}>
                  <IconComponent className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 mb-3">
                  {action.description}
                </p>
                <div className="flex items-center justify-between">
                  <Button size="sm" variant="outline" className="h-8 text-xs border-gray-300 text-gray-700 hover:bg-gray-50">
                    Open
                  </Button>
                  <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </CardContent>
            </Link>
          </Card>
        )
      })}
    </div>
  )
}