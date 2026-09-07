import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center text-gray-800 dark:text-gray-100">
      <h2 className="text-4xl font-extrabold mb-2 font-basic">404 - Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">The page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="px-6 py-2.5 bg-[#CA6014] text-white font-semibold rounded-lg shadow hover:bg-[#A04E10] transition no-underline">
        Return Home
      </Link>
    </div>
  );
}
