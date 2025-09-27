import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authenticateAndAuthorize } from '@/lib/auth/api-auth'

// Product validation schema
const productUpdateSchema = z.object({
  productCode: z.string().min(1, 'Product code is required').optional(),
  name: z.string().min(1, 'Product name is required').optional(),
  description: z.string().optional(),
  type: z.enum(['PRODUCT', 'SERVICE']).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  unit: z.string().min(1, 'Unit is required').optional(),
  costPrice: z.number().min(0, 'Cost price must be non-negative').optional(),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative').optional(),
  minStock: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional(),
  reorderLevel: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  isTaxable: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  barcode: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  weight: z.number().min(0).optional(),
  dimensions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// GET /api/inventory/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
