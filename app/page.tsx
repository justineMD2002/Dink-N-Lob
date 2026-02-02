import Link from "next/link";
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-white">
      <main className="max-w-3xl w-full text-center">
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="Dink N' Lob"
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
          />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">
          Welcome to Dink N' Lob!
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-4">
          Surrounded by good food, good company, and <span className="font-bold">3 good looking courts</span>.
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-600 mb-6">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-base sm:text-lg">D'HIVE Arcade, Inayawan</span>
        </div>
        <p className="text-xl sm:text-2xl font-semibold text-primary mb-8">
          Rates start at ₱299/hour
        </p>
        <div className="flex gap-4 justify-center flex-wrap mb-8">
          <Link
            href="/book"
            className="px-8 sm:px-10 py-4 bg-primary text-white text-lg sm:text-xl rounded-lg hover:bg-primary/90 transition shadow-lg w-full sm:w-auto font-semibold"
          >
            Book a Court Now
          </Link>
        </div>
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">How it works:</h3>
          <div className="text-left text-sm sm:text-base text-gray-700 space-y-2 max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <p>Select your preferred date and time slot</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <p>Fill in your contact information</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <p>Pay via GCash or Maya using QR code</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">4</span>
              <p>Submit payment reference code</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">5</span>
              <p>Get instant booking confirmation!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
