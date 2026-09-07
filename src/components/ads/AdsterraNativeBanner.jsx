'use client';
import React, { useEffect, useRef } from 'react';

const AdsterraNativeBanner = () => {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              background: transparent;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <div id="container-79b87f6c4835a2e9f48347410a318489"></div>
          <script async="async" data-cfasync="false" src="https://pl31232745.profitableratecpmnetwork.com/79b87f6c4835a2e9f48347410a318489/invoke.js"></script>
        </body>
      </html>
    `;

    iframe.srcdoc = html;
  }, []);

  return (
    <div className="adsterra-native-banner flex justify-center items-center w-full min-h-[120px] my-0">
      <iframe
        ref={iframeRef}
        title="Adsterra Native Banner Ad"
        style={{ border: 'none', width: '100%', minHeight: '120px', overflow: 'hidden' }}
        scrolling="no"
      />
    </div>
  );
};

export default AdsterraNativeBanner;
