import { MainLayout } from '@/components/layout/main-layout'
import { ClientList } from '@/components/modules/clients/client-list'
import { ProtectedRoute } from '@/components/auth/protected-route'

// Mock user data - in real app this would come from authentication
const mockUser = {
  name: 'John Smith',
  email: 'john.smith@bgu.com',
  role: 'MANAGEMENT' as const
}

export default function ClientsPage() {
  return (
    <MainLayout user={mockUser}>
      <ProtectedRoute 
        userRole={mockUser.role}
        isAuthenticated={true}
      >
        <ClientList />
      </ProtectedRoute>
    </MainLayout>
  )
}