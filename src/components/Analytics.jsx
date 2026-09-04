"use client";
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function Analytics({ gaId }) {
  const pathname = usePathname();
  
  // Do not track admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            debug_mode: true
          });
        `}
      </Script>
    </>
  );
}
