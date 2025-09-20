import { MainLayout } from '@/components/layout/main-layout'
import { InvoiceList } from '@/components/modules/sales/invoice-list'
import { ProtectedRoute } from '@/components/auth/protected-route'

// Mock user data - in real app this would come from authentication
const mockUser = {
  name: 'John Smith',
  email: 'john.smith@bgu.com',
  role: 'MANAGEMENT' as const
}

export default function InvoicesPage() {
  return (
    <MainLayout user={mockUser}>
      <ProtectedRoute 
        userRole={mockUser.role}
        isAuthenticated={true}
      >
        <InvoiceList />
      </ProtectedRoute>
    </MainLayout>
  )
}