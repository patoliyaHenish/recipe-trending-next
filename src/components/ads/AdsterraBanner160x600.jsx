'use client';
import React, { useEffect, useRef } from 'react';

const AdsterraBanner160x600 = () => {
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
              'key' : '6b33e7e53ec5867fe278c3c67f66ddbb',
              'format' : 'iframe',
              'height' : 600,
              'width' : 160,
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://www.highrevenueformat.com/6b33e7e53ec5867fe278c3c67f66ddbb/invoke.js"></script>
        </body>
      </html>
    `;

    iframe.srcdoc = html;
  }, []);

  return (
    <div className="hidden md:flex justify-center items-center w-[160px] h-[600px] min-w-[160px] min-h-[600px] mx-auto">
      <iframe
        ref={iframeRef}
        title="Adsterra 160x600 Skyscraper Banner Ad"
        width="160"
        height="600"
        style={{ border: 'none', width: '160px', height: '600px', overflow: 'hidden' }}
        scrolling="no"
      />
    </div>
  );
};

export default AdsterraBanner160x600;
