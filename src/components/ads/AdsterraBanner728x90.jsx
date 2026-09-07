'use client';
import React, { useEffect, useRef } from 'react';

const AdsterraBanner728x90 = () => {
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
              overflow: hidden;
              background: transparent;
            }
          </style>
        </head>
        <body>
          <script type="text/javascript">
            atOptions = {
              'key' : '6d8387cad75fb00dcac07493f94c3dee',
              'format' : 'iframe',
              'height' : 90,
              'width' : 728,
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://www.highrevenueformat.com/6d8387cad75fb00dcac07493f94c3dee/invoke.js"></script>
        </body>
      </html>
    `;

    iframe.srcdoc = html;
  }, []);

  return (
    <div className="hidden md:flex justify-center items-center w-[728px] h-[90px] min-w-[728px] min-h-[90px] mx-auto mt-2 mb-0">
      <iframe
        ref={iframeRef}
        title="Adsterra 728x90 Leaderboard Banner Ad"
        width="728"
        height="90"
        style={{ border: 'none', width: '728px', height: '90px', overflow: 'hidden' }}
        scrolling="no"
      />
    </div>
  );
};

export default AdsterraBanner728x90;
