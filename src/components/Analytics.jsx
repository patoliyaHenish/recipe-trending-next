"use client";
import { usePathname } from 'next/navigation';

export default function Analytics({ gaId }) {
  const pathname = usePathname();
  
  // Do not track admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
      <script dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `
      }} />
    </>
  );
}
