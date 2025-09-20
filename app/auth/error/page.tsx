'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

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

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [errorType, setErrorType] = useState<string>('Default')

  useEffect(() => {
    const error = searchParams.get('error') || 'Default'
    setErrorType(error)
  }, [searchParams])

  const errorConfig = AUTH_ERRORS[errorType as keyof typeof AUTH_ERRORS] || AUTH_ERRORS.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-red-500 text-white rounded-lg">
            <span className="text-xl font-bold">!</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {errorConfig.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            BlackGoldUnited ERP System
          </p>
        </div>

        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {errorConfig.message}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorConfig.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <Link
            href="/auth/login"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            Back to Login
          </Link>

          <button
            onClick={() => router.back()}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            Go Back
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <p className="text-xs text-gray-600">
              <strong>Debug Info:</strong> Error type: {errorType}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}