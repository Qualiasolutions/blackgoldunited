'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  FileText,
  Users,
  Package,
  ChevronRight,
  Info,
  Building2,
  Truck
} from 'lucide-react'

interface InvoiceType {
  id: 'business_development' | 'supply'
  name: string
  description: string
  icon: React.ComponentType<any>
  features: string[]
  color: string
}

const invoiceTypes: InvoiceType[] = [
  {
    id: 'business_development',
    name: 'Business Development',
    description: 'Invoices for consulting, services, and business development activities',
    icon: Users,
    features: [
      'Service-based billing',
      'Hourly rates or project fees',
      'Consulting and professional services',
      'Business development services',
      'Customizable terms and conditions'
    ],
    color: 'bg-blue-50 border-blue-200 hover:border-blue-300'
  },
  {
    id: 'supply',
    name: 'Supply',
    description: 'Invoices for physical goods, materials, and supply chain services',
    icon: Package,
    features: [
      'Physical goods and materials',
      'Inventory-based items',
      'Supply chain services',
      'Product sales and distribution',
      'Quantity-based pricing'
    ],
    color: 'bg-green-50 border-green-200 hover:border-green-300'
  }
]

export default function SelectInvoiceTypePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasFullAccess } = usePermissions()
  const [selectedType, setSelectedType] = useState<'business_development' | 'supply' | null>(null)

  const canManage = hasFullAccess('sales')

  const handleContinue = () => {
    if (selectedType) {
      router.push(`/sales/invoices/create?type=${selectedType}`)
    }
  }

  const handleQuickSelect = (type: 'business_development' | 'supply') => {
    setSelectedType(type)
    // Small delay to show the selection before navigating
    setTimeout(() => {
      router.push(`/sales/invoices/create?type=${type}`)
    }, 200)
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to create invoices.</p>
            <Link href="/sales/invoices" className="mt-4 inline-block">
              <Button variant="outline">← Back to Invoices</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/sales/invoices">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Invoices
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
                <p className="text-sm text-gray-600">Select the type of invoice you want to create</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Full Access
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Info Card */}
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Invoice Type Selection</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Choose the invoice type that best matches your business activity. This selection helps organize your invoices and provides relevant features for each type.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {invoiceTypes.map((type) => {
              const IconComponent = type.icon
              const isSelected = selectedType === type.id

              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300'
                      : `${type.color}`
                  } ${!selectedType ? 'hover:shadow-md' : ''}`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                          type.id === 'business_development' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <IconComponent className={`h-6 w-6 ${
                            type.id === 'business_development' ? 'text-blue-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{type.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isSelected && (
                          <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                          </div>
                        )}
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Key Features:</h4>
                        <ul className="space-y-1">
                          {type.features.map((feature, index) => (
                            <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                              <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleQuickSelect(type.id)
                          }}
                          className="w-full"
                        >
                          Quick Select
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Link href="/sales/invoices">
              <Button variant="outline" size="lg">
                Cancel
              </Button>
            </Link>
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedType}
              className="min-w-[150px]"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}