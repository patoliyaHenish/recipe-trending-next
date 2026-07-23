'use client';

export const dynamic = 'force-dynamic';

/**
 * Global error boundary — renders OUTSIDE the root layout.
 *
 * Must be completely self-contained (no context providers, no MUI, no Redux).
 * Next.js 16 tries to prerender this page at build time, and since it renders
 * outside <RootLayout>, hooks like useServerInsertedHTML (used by MUI's
 * AppRouterCacheProvider) will fail because their provider context is missing.
 *
 * We use plain inline styles only.
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          fontFamily: 'Inter, Roboto, sans-serif',
          color: '#333',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#e65100',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
