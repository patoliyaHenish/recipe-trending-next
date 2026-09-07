'use client';

import React from 'react';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Something went wrong!</h2>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
            {error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => reset && reset()}
            style={{ padding: '0.625rem 1.5rem', backgroundColor: '#CA6014', color: '#fff', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
