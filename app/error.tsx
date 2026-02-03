'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo.png"
            alt="Dink N' Lob"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>

        {/* Error Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Something Went Wrong
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-md mx-auto mb-2">
            We're sorry, but something unexpected happened. Please try again.
          </p>
          {error.message && (
            <p className="text-sm text-gray-500 mt-4 font-mono bg-gray-50 p-3 rounded-lg max-w-md mx-auto break-words">
              {error.message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold text-base shadow-md w-full sm:w-auto"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-base w-full sm:w-auto"
          >
            Go to Homepage
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Need help?
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
            <Link
              href="/"
              className="text-primary hover:underline font-medium"
            >
              Home
            </Link>
            <Link
              href="/book"
              className="text-primary hover:underline font-medium"
            >
              Book Court
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
