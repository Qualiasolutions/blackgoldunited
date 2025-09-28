'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, Loader2, ArrowLeft, Building, Shield, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const AUTH_ERRORS = {
  Configuration: {
    title: 'Server Configuration Error',
    message: 'There is a problem with the server configuration. Please contact the administrator.',
    description: 'The authentication system is not properly configured.'
  },
  AccessDenied: {
    title: 'Access Denied',
    message: 'You do not have permission to access this resource.',
    description: 'Please contact your administrator if you believe this is an error.'
  },
  Verification: {
    title: 'Verification Failed',
    message: 'The verification link is invalid or has expired.',
    description: 'Please request a new verification email.'
  },
  Default: {
    title: 'Authentication Error',
    message: 'An unexpected error occurred during authentication.',
    description: 'Please try again or contact support if the problem persists.'
  }
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [errorType, setErrorType] = useState<string>('Default')

  useEffect(() => {
    const error = searchParams.get('error') || 'Default'
    setErrorType(error)
  }, [searchParams])

  const errorConfig = AUTH_ERRORS[errorType as keyof typeof AUTH_ERRORS] || AUTH_ERRORS.Default

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
              <p className="text-xs text-slate-400">Enterprise Security</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center border border-white/10">
              <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium">Protected</p>
              <p className="text-xs text-slate-400">Authentication System</p>
            </div>
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
              {errorConfig.title}
            </h2>
            <p className="text-muted-foreground mb-6">
              BlackGoldUnited ERP System
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-destructive">
                    {errorConfig.message}
                  </h3>
                  <div className="mt-2 text-xs text-destructive/80">
                    <p>{errorConfig.description}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Button className="w-full" asChild>
                <Link href="/auth/login">
                  Back to Login
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Debug Info:</strong> Error type: {errorType}
                </p>
              </div>
            )}

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
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
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
            <div className="mx-auto h-12 w-12 flex items-center justify-center bg-destructive/10 rounded-full mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Loading...</h2>
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
      <AuthErrorContent />
    </Suspense>
  )
}