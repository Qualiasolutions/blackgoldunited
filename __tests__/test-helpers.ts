import { createMocks } from 'node-mocks-http'
import type { NextRequest } from 'next/server'

/**
 * Mock user data for testing
 */
export const mockUsers = {
  management: {
    id: 'test-user-management',
    email: 'management@test.com',
    role: 'MANAGEMENT',
    user_metadata: {
      full_name: 'Test Management User',
    },
  },
  finance: {
    id: 'test-user-finance',
    email: 'finance@test.com',
    role: 'FINANCE_TEAM',
    user_metadata: {
      full_name: 'Test Finance User',
    },
  },
  procurement: {
    id: 'test-user-procurement',
    email: 'procurement@test.com',
    role: 'PROCUREMENT_BD',
    user_metadata: {
      full_name: 'Test Procurement User',
    },
  },
  hr: {
    id: 'test-user-hr',
    email: 'hr@test.com',
    role: 'ADMIN_HR',
    user_metadata: {
      full_name: 'Test HR User',
    },
  },
  qhse: {
    id: 'test-user-qhse',
    email: 'qhse@test.com',
    role: 'IMS_QHSE',
    user_metadata: {
      full_name: 'Test QHSE User',
    },
  },
}

/**
 * Create a mock Next.js request with authentication
 */
export function createMockRequest({
  method = 'GET',
  url = '/api/test',
  headers = {},
  body = null,
  user = mockUsers.management,
}: {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url?: string
  headers?: Record<string, string>
  body?: any
  user?: typeof mockUsers.management | null
}) {
  const { req, res } = createMocks({
    method: method as any,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
  })

  // Add user to request if provided
  if (user) {
    ;(req as any).user = user
  }

  return { req, res }
}

/**
 * Mock Supabase query builder responses
 */
export function mockSupabaseQuery(data: any = null, error: any = null) {
  return {
    data,
    error,
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    then: jest.fn((resolve) => resolve({ data, error })),
  }
}

/**
 * Create mock client data
 */
export function createMockClient(overrides = {}) {
  return {
    id: 'client-123',
    company_name: 'Test Company',
    contact_person: 'John Doe',
    email: 'john@testcompany.com',
    phone: '+1234567890',
    address: '123 Test St',
    city: 'Test City',
    country: 'Test Country',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create mock invoice data
 */
export function createMockInvoice(overrides = {}) {
  return {
    id: 'invoice-123',
    invoice_number: 'INV-20251003-0001',
    client_id: 'client-123',
    issue_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subtotal: 1000,
    tax_amount: 150,
    total_amount: 1150,
    paid_amount: 0,
    payment_status: 'UNPAID',
    status: 'SENT',
    notes: 'Test invoice',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create mock payment data
 */
export function createMockPayment(overrides = {}) {
  return {
    id: 'payment-123',
    payment_reference: 'PAY-20251003-0001',
    client_id: 'client-123',
    invoice_id: 'invoice-123',
    amount: 1150,
    payment_date: new Date().toISOString(),
    payment_method: 'BANK_TRANSFER',
    notes: 'Test payment',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Delay helper for async tests
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Test helper to verify API error responses
 */
export function expectErrorResponse(response: any, status: number, errorMessage?: string) {
  expect(response.status).toBe(status)
  if (errorMessage) {
    expect(response.error).toContain(errorMessage)
  }
}

/**
 * Test helper to verify API success responses
 */
export function expectSuccessResponse(response: any, status: number = 200) {
  expect(response.status).toBe(status)
  expect(response.error).toBeUndefined()
}
