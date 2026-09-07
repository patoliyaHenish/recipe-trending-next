'use client';
import React, { useEffect, useRef } from 'react';

const AdsterraBanner320x50 = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    currentContainer.innerHTML = '';

    // Assign atOptions to global window object before invoking script
    window.atOptions = {
      'key': 'e92f2e78acd4df15d2ab5962934008c1',
      'format': 'iframe',
      'height': 50,
      'width': 320,
      'params': {}
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.highrevenueformat.com/e92f2e78acd4df15d2ab5962934008c1/invoke.js';

    currentContainer.appendChild(script);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="adsterra-banner-320x50 flex justify-center items-center w-[320px] h-[50px] min-w-[320px] min-h-[50px] mx-auto my-2"
      style={{ width: '320px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '8px auto' }}
    />
  );
};

export default AdsterraBanner320x50;
