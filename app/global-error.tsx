'use client'

/**
 * Global Error Handler
 *
 * Handles errors at the root level to prevent React #310 hook mismatch errors
 * in Next.js 15 + React 19.
 *
 * See: https://github.com/vercel/next.js/issues/78396
 */

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error caught:', error)
    }
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">Error</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Something went wrong!
            </h2>
            <p className="text-gray-600 mb-8">
              {process.env.NODE_ENV === 'development' && error.message}
              {process.env.NODE_ENV === 'production' && 'An unexpected error occurred. Please try again.'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={reset}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Try again
              </button>
              <a
                href="/"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors inline-block"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
