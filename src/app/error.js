'use client';

import React from 'react';

export default function Error({ error, reset }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center text-gray-800 dark:text-gray-100">
      <h2 className="text-3xl font-bold mb-3 font-basic">Something went wrong!</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {error?.message || "An unexpected error occurred while loading this page."}
      </p>
      <button
        onClick={() => reset && reset()}
        className="px-6 py-2.5 bg-[#CA6014] text-white font-semibold rounded-lg shadow hover:bg-[#A04E10] transition"
      >
        Try Again
      </button>
    </div>
  );
}
