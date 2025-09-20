import { MainLayout } from '@/components/layout/main-layout'
import { DashboardPage } from '@/components/dashboard/dashboard-page'

// Mock user data - in real app this would come from authentication
const mockUser = {
  name: 'John Smith',
  email: 'john.smith@bgu.com',
  role: 'MANAGEMENT'
}

export default function HomePage() {
  return (
    <MainLayout user={mockUser}>
      <DashboardPage user={mockUser} />
    </MainLayout>
  )
}