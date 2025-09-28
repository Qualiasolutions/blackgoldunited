// Login Page for BlackGoldUnited ERP
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoginCredentials } from '@/lib/types/auth'
import { Building, Users, Shield, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth()

  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false
  })

  const [showPassword, setShowPassword] = useState(false)
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const authError = searchParams.get('error')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(callbackUrl)
    }
  }, [isAuthenticated, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    const result = await login(formData)
    if (result.success) {
      router.push(callbackUrl)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Corporate Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
        <div className="relative z-10 text-center px-8 max-w-md">
          <div className="mx-auto mb-8">
            <Image
              src="/united-logo-white.webp"
              alt="BlackGoldUnited"
              width={160}
              height={64}
              className="mx-auto"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            BlackGoldUnited
          </h1>
          <p className="text-lg text-slate-300 mb-8 leading-relaxed">
            Enterprise Resource Planning System
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center border border-white/10">
              <Building className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium">14 Modules</p>
              <p className="text-xs text-slate-400">Comprehensive</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center border border-white/10">
              <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium">Secure Access</p>
              <p className="text-xs text-slate-400">Role-Based</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-400">
              Trusted by enterprises worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Corporate Login Form */}
      <div className="flex-1 flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="lg:hidden mx-auto mb-6">
              <Image
                src="/united-logo-white.webp"
                alt="BlackGoldUnited"
                width={96}
                height={38}
                className="mx-auto filter brightness-0"
                priority
              />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Sign in to your enterprise dashboard
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded transition-colors"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                    Remember me for 30 days
                  </label>
                </div>

                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Error Messages */}
            {(error || authError) && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">
                      {error || 'Authentication failed'}
                    </h3>
                    <p className="text-xs text-destructive/80 mt-1">
                      Please check your credentials and try again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold tracking-wide ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg active:scale-[0.98] h-11 px-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to BGU
                  <Building className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Admin Contact Info */}
            <div className="text-center pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Account access is managed by administrators.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                For account creation or issues, contact your system administrator.
              </p>
            </div>

            {/* Powered by Qualia Solutions */}
            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">
                Powered by{' '}
                <a
                  href="https://qualiasolutions.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Qualia Solutions
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-black via-gray-900 to-black items-center justify-center">
          <div className="mx-auto">
            <Image
              src="/united-logo-white.webp"
              alt="BlackGoldUnited"
              width={200}
              height={80}
              className="mx-auto"
            />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="lg:hidden mx-auto mb-4">
              <Image
                src="/united-logo-white.webp"
                alt="BlackGoldUnited"
                width={120}
                height={48}
                className="mx-auto filter brightness-0"
              />
            </div>
            <Loader2 className="h-8 w-8 animate-spin text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Loading BGU...</h2>
            <div className="mt-6">
              <p className="text-xs text-gray-500">
                Powered by{' '}
                <a
                  href="https://qualiasolutions.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-yellow-600 hover:text-yellow-500 transition-colors"
                >
                  Qualia Solutions
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}