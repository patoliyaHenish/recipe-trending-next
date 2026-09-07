'use client';
import React, { useEffect, useRef } from 'react';

export const AdsterraNative = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // Clear previous elements
    currentContainer.innerHTML = '';

    const adDiv = document.createElement('div');
    adDiv.id = 'container-79b87f6c4835a2e9f48347410a318489';

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://pl31232745.profitableratecpmnetwork.com/79b87f6c4835a2e9f48347410a318489/invoke.js';

    currentContainer.appendChild(adDiv);
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
      className="adsterra-native-wrapper my-6 flex justify-center items-center w-full min-h-[100px]"
      style={{ minHeight: '100px', display: 'flex', justifyContent: 'center', margin: '24px 0' }}
    />
  );
};

export const AdsterraNativeBanner = AdsterraNative;

export const AdsterraBanner300x250 = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

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

export const AdsterraBanner320x50 = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    currentContainer.innerHTML = '';

    const confScript = document.createElement('script');
    confScript.type = 'text/javascript';
    confScript.text = `
      atOptions = {
        'key' : 'e92f2e78acd4df15d2ab5962934008c1',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.highrevenueformat.com/e92f2e78acd4df15d2ab5962934008c1/invoke.js';

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
      className="adsterra-banner-320x50 flex justify-center items-center w-[320px] h-[50px] min-w-[320px] min-h-[50px] mx-auto my-3"
      style={{ width: '320px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '12px auto' }}
    />
  );
};

export default AdsterraNative;
