import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to login page - the dashboard should be accessed via /dashboard
  redirect('/auth/login')
}