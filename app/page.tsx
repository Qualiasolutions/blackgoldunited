import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-black text-white rounded-lg">
            <span className="text-xl font-bold">BGU</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            BlackGoldUnited ERP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enterprise Resource Planning System
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <Link
            href="/auth/login"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            Sign In to Access System
          </Link>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Welcome to BlackGoldUnited ERP System
            </p>
          </div>
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <p className="text-xs text-gray-600">
              <strong>Development Mode:</strong> Environment variables may need configuration for full functionality.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}