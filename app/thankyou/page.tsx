import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      {/* The Banner */}
      <div className="bg-green-500 text-white p-8 rounded-2xl shadow-lg mb-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-2">Thank You for Visiting!</h1>
      </div>

      {/* Encouraging Message */}
      <div className="max-w-xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          We hope you had a great time!
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed mb-8">
          Your photos have been safely added to the event gallery. We would love
          to see you at our future events. Stay tuned for more updates!
        </p>

        {/* Optional: Link back to your main public website or homepage */}
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-md"
        >
          Return to Main Website
        </Link>
      </div>
    </div>
  );
}
