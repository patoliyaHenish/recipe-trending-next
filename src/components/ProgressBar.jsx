'use client';
import NextTopLoader from 'nextjs-toploader';

export default function NProgressBar({ children }) {
  return (
    <>
      <NextTopLoader
        color="#CA6014"
        initialPosition={0.08}
        crawlSpeed={200}
        height={4}
        crawl={true}
        showSpinner={true}
        easing="ease"
        speed={200}
        shadow="0 0 10px #CA6014,0 0 5px #CA6014"
      />
      {children}
    </>
  );
}
