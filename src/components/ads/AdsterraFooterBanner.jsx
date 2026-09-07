'use client';
import React from 'react';
import AdsterraBanner728x90 from './AdsterraBanner728x90';
import AdsterraBanner320x50 from './AdsterraBanner320x50';

const AdsterraFooterBanner = () => {
  return (
    <div className="w-full flex justify-center items-center mt-4 mb-1">
      {/* Desktop & Laptop View (728x90) */}
      <div className="hidden md:flex justify-center items-center w-full">
        <AdsterraBanner728x90 />
      </div>

      {/* Mobile & Tablet View (320x50) */}
      <div className="flex md:hidden justify-center items-center w-full">
        <AdsterraBanner320x50 />
      </div>
    </div>
  );
};

export default AdsterraFooterBanner;
