"use client"

import { useRouter } from 'next/navigation'

export default function CreateSalesPurchaseOrder() {
  const router = useRouter()

  // Redirect to the actual purchase orders creation page
  router.push('/purchases/orders/create')

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to Create Purchase Order...</p>
    </div>
  )
}
