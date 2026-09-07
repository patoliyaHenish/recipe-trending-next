'use client';
import React, { useEffect, useRef } from 'react';

const AdsterraBanner300x250 = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // Clear previous script elements
    currentContainer.innerHTML = '';

    const confScript = document.createElement('script');
    confScript.type = 'text/javascript';
    confScript.text = `
      atOptions = {
        'key' : 'dc666cababfc93ae2eb60772898f823f',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.highrevenueformat.com/dc666cababfc93ae2eb60772898f823f/invoke.js';

    currentContainer.appendChild(confScript);
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
      className="hidden md:flex justify-center items-center w-[300px] h-[250px] min-w-[300px] min-h-[250px]"
      style={{ width: '300px', height: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    />
  );
};

export default AdsterraBanner300x250;
