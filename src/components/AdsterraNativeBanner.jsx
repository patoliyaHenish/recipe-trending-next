'use client';
import React, { useEffect, useRef } from 'react';

const AdsterraNativeBanner = () => {
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
      className="adsterra-native-banner flex justify-center items-center w-full min-h-[100px] my-6"
      style={{ minHeight: '100px', display: 'flex', justifyContent: 'center', margin: '24px 0' }}
    />
  );
};

export default AdsterraNativeBanner;
