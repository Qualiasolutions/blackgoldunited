"use client"

import { useRouter } from 'next/navigation'

export default function SalesPurchaseOrders() {
  const router = useRouter()

  // Redirect to the actual purchase orders page
  router.push('/purchase/orders')

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to Purchase Orders...</p>
    </div>
  )
}
