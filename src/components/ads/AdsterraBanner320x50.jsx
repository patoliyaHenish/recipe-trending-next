'use client';
import React, { useEffect, useRef } from 'react';

const AdsterraBanner320x50 = () => {
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
              'key' : 'e92f2e78acd4df15d2ab5962934008c1',
              'format' : 'iframe',
              'height' : 50,
              'width' : 320,
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://www.highrevenueformat.com/e92f2e78acd4df15d2ab5962934008c1/invoke.js"></script>
        </body>
      </html>
    `;

    iframe.srcdoc = html;
  }, []);

  return (
    <div className="adsterra-banner-320x50 flex justify-center items-center w-[320px] h-[50px] min-w-[320px] min-h-[50px] mx-auto my-2">
      <iframe
        ref={iframeRef}
        title="Adsterra 320x50 Banner Ad"
        width="320"
        height="50"
        style={{ border: 'none', width: '320px', height: '50px', overflow: 'hidden' }}
        scrolling="no"
      />
    </div>
  );
};

export default AdsterraBanner320x50;
