import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
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

        {/* 404 Number */}
        <div className="mb-6">
          <h1 className="text-8xl sm:text-9xl font-bold text-primary mb-2">
            404
          </h1>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Page Not Found
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
        </div>

        {/* Pickleball-themed illustration using text */}
        <div className="mb-8 text-6xl">
          🏓
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold text-base shadow-md w-full sm:w-auto"
          >
            Go to Homepage
          </Link>
          <Link
            href="/book"
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-base w-full sm:w-auto"
          >
            Book a Court
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Looking for something else?
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
            {/* <Link
              href="/admin/login"
              className="text-primary hover:underline font-medium"
            >
              Admin Login
            </Link> */}
          </div>
        </div>
      </div>
    </div>
  )
}
