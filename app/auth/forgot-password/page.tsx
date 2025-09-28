// Forgot Password Page for BlackGoldUnited ERP
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'
import { PasswordResetRequest } from '@/lib/types/auth'
import { AlertCircle, Loader2, CheckCircle, Building, Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const { requestPasswordReset, isLoading, error, clearError } = useAuth()

  const [formData, setFormData] = useState<PasswordResetRequest>({
    email: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    const result = await requestPasswordReset(formData)
    if (result.success) {
      setIsSubmitted(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (isSubmitted) {
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
              <CheckCircle className="h-5 w-5 text-success mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium">Password Reset</p>
              <p className="text-xs text-slate-400">Email Sent Successfully</p>
            </div>
          </div>
        </div>

        {/* Right Side - Success Message */}
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
              <div className="mx-auto h-16 w-16 flex items-center justify-center bg-success/10 rounded-full mb-6">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Check your email
              </h2>
              <p className="text-muted-foreground mb-6">
                We've sent a password reset link to <strong className="text-foreground">{formData.email}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-success/10 border border-success/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-success">
                      Email sent successfully
                    </h3>
                    <p className="text-xs text-success/80 mt-1">
                      Please check your inbox and spam folder for the reset link.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Didn't receive the email?{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Try again
                </button>
              </p>

              <div className="flex space-x-3">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/auth/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to sign in
                  </Link>
                </Button>
              </div>
            </div>

            {/* Powered by Qualia Solutions */}
            <div className="text-center pt-8">
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
              <p className="text-sm text-slate-300 font-medium">Secure Access</p>
              <p className="text-xs text-slate-400">Account Recovery</p>
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
              Forgot your password?
            </h2>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full"
                placeholder="Enter your email address"
              />
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
                      Please check your email address and try again.
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
                  Sending reset link...
                </>
              ) : (
                'Send reset link'
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

            {/* Powered by Qualia Solutions */}
            <div className="text-center pt-6">
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