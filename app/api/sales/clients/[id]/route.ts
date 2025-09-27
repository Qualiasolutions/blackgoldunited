import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/sales/clients/[id] - Get specific client
export async function GET(request: NextRequest, { params }: RouteParams) {
