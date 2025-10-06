# 🚀 QUICK REFERENCE - Development Patterns

**For Week 6+ Development** - Copy-paste patterns from completed modules

---

## 🔗 **1. API ENDPOINT PATTERN**

```typescript
// /app/api/[module]/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  // 1. Auth check
  const authResult = await authenticateAndAuthorize(request, 'module_name', 'GET')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  // 2. Parse params
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = (page - 1) * limit

  // 3. Build query
  const supabase = await createClient()
  let queryBuilder = supabase.from('table_name').select('*', { count: 'exact' })

  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,email.ilike.%${query}%`)
  }

  const { data, error, count } = await queryBuilder.range(offset, offset + limit - 1)

  // 4. Return response
  return NextResponse.json({
    success: true,
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    }
  })
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateAndAuthorize(request, 'module_name', 'POST')
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await request.json()
  const supabase = await createClient()

  const { data, error } = await supabase.from('table_name').insert(body).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
```

---

## 🎨 **2. LIST PAGE PATTERN**

```typescript
// /app/[module]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

export default function ModulePage() {
  const { user } = useAuth()
  const { hasModuleAccess, hasFullAccess } = usePermissions()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })

  const canManage = hasFullAccess('module_name')
  const canRead = hasModuleAccess('module_name')

  if (!canRead) {
    return <div className="p-6 text-center text-red-600">Access Denied</div>
  }

  // ✅ CORRECT PATTERN - React 19 Compatible
  const fetchItems = useCallback(async (params: {
    query?: string
    page?: number
    limit?: number
  } = {}) => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()

      if (params.query) searchParams.set('query', params.query)
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())

      const response = await fetch(`/api/module_name/items?${searchParams}`)
      const result = await response.json()

      if (result.success) {
        setItems(result.data)
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }, []) // ✅ Empty dependency array - no stale closures

  useEffect(() => {
    fetchItems({
      query: searchTerm || undefined,
      page: pagination.page,
      limit: pagination.limit
    })
  }, [fetchItems, searchTerm, pagination.page, pagination.limit])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Module Name</h1>
        {canManage && (
          <Button asChild>
            <Link href="/module/create">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => fetchItems()}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Items ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="border p-4 rounded">
                  {/* Item display */}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 📝 **3. CREATE FORM PATTERN**

```typescript
// /app/[module]/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function CreatePage() {
  const router = useRouter()
  const { hasFullAccess } = usePermissions()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    // ... other fields
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canCreate = hasFullAccess('module_name')

  if (!canCreate) {
    return <div className="p-6 text-center text-red-600">Access Denied</div>
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/module_name/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        router.push('/module_name')
      } else {
        setError(result.error || 'Failed to create item')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Create New Item</h1>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              {/* ... other fields */}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Item'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🔐 **4. PERMISSION CHECKS**

```typescript
// Role-based access patterns
const { hasModuleAccess, hasFullAccess } = usePermissions()

// Module access (read)
const canRead = hasModuleAccess('purchases') // purchases, sales, inventory, etc.

// Full access (CRUD)
const canManage = hasFullAccess('purchases')

// Permission matrix:
// MANAGEMENT: Full access to all modules
// FINANCE_TEAM: Full finance, read others
// PROCUREMENT_BD: Full procurement + sales
// ADMIN_HR: Full HR, read others
// IMS_QHSE: QHSE only
```

---

## 🗂️ **5. FILE STRUCTURE**

```
app/
├── [module]/                    # e.g., purchases, sales, inventory
│   ├── page.tsx                # List view
│   ├── create/page.tsx         # Create form
│   ├── [id]/page.tsx           # Detail view
│   └── [id]/edit/page.tsx      # Edit form
└── api/
    └── [module]/               # e.g., purchases, sales, inventory
        ├── route.ts           # GET (list), POST (create)
        └── [id]/route.ts      # GET, PUT, DELETE (single)
```

---

## ⚡ **6. READY-TO-USE COMPONENTS**

```typescript
// Import these existing components:
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Custom hooks:
import { useAuth, usePermissions } from '@/lib/hooks/useAuth'

// Auth functions:
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'
import { createClient } from '@/lib/supabase/server'
```

---

**✅ Copy these patterns for Week 6 purchase management system!**