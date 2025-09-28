// Reset Password Page for BlackGoldUnited ERP
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'
import { PasswordReset } from '@/lib/types/auth'
import { AlertCircle, Loader2, Eye, EyeOff, Building, Shield, ArrowLeft, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resetPassword, isLoading, error, clearError } = useAuth()

  const [formData, setFormData] = useState<PasswordReset>({
    token: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState(true)

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setFormData(prev => ({ ...prev, token }))
    } else {
      setIsTokenValid(false)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    const result = await resetPassword(formData)
    if (result.success) {
      router.push('/auth/login?message=password_reset_success')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isTokenValid) {
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
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center border border-white/10">
              <XCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium">Invalid Link</p>
              <p className="text-xs text-slate-400">Reset Token Expired</p>
            </div>
          </div>
        </div>

        {/* Right Side - Error Message */}
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
              <div className="mx-auto h-16 w-16 flex items-center justify-center bg-destructive/10 rounded-full mb-6">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Invalid reset link
              </h2>
              <p className="text-muted-foreground mb-6">
                This password reset link is invalid or has expired.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">
                      Link has expired
                    </h3>
                    <p className="text-xs text-destructive/80 mt-1">
                      Password reset links are valid for 24 hours only.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button className="flex-1" asChild>
                  <Link href="/auth/forgot-password">
                    Request new reset link
                  </Link>
                </Button>
              </div>

              <div className="text-center">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to sign in
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
              <p className="text-sm text-slate-300 font-medium">Secure Reset</p>
              <p className="text-xs text-slate-400">Password Security</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center border border-white/10">
              <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium">Protected</p>
              <p className="text-xs text-slate-400">Enterprise Security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Password Reset Form */}
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
              Reset your password
            </h2>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pr-12"
                    placeholder="Enter your new password"
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
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pr-12"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">
                      {error}
                    </h3>
                    <p className="text-xs text-destructive/80 mt-1">
                      Please check your password requirements and try again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Resetting password...
                </>
              ) : (
                'Reset password'
              )}
            </Button>

            <div className="text-center">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to sign in
                </Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center">
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
        <div className="flex-1 flex items-center justify-center bg-background">
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
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Loading BGU...</h2>
            <div className="mt-6">
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
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}