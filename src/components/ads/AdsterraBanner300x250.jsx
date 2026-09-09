'use client';
import React, { useEffect, useRef } from 'react';

const AdsterraBanner300x250 = () => {
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
              'key' : 'dc666cababfc93ae2eb60772898f823f',
              'format' : 'iframe',
              'height' : 250,
              'width' : 300,
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://www.highrevenueformat.com/dc666cababfc93ae2eb60772898f823f/invoke.js"></script>
        </body>
      </html>
    `;

    iframe.srcdoc = html;
  }, []);

  return (
    <div className="flex justify-center items-center w-[300px] h-[250px] min-w-[300px] min-h-[250px]">
      <iframe
        ref={iframeRef}
        title="Adsterra 300x250 Banner Ad"
        width="300"
        height="250"
        style={{ border: 'none', width: '300px', height: '250px', overflow: 'hidden' }}
        scrolling="no"
      />
    </div>
  );
};

export default AdsterraBanner300x250;
