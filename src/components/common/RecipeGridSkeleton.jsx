"use client";
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const RecipeGridSkeleton = ({ count = 8, mobileLayout = 'horizontal' }) => {
  const { isDarkMode } = useTheme();

  const DesktopSkeleton = () => (
    <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse flex flex-col overflow-hidden"
          style={{
            backgroundColor: isDarkMode ? 'var(--card-bg)' : '#FFEFD9',
            border: isDarkMode ? '1px solid #555555' : '1px solid #CA6014',
            borderRadius: '20px',
            minHeight: 280
          }}
        >
            <div className="relative" style={{ margin: '8px', borderRadius: '16px', overflow: 'hidden' }}>
            <div className="w-full bg-gray-200" style={{ paddingTop: '58%' }} />
            <div className="absolute top-2 left-2">
              <div className="bg-gray-300" style={{ width: '36px', height: '54px', borderRadius: '6px' }} />
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              <div className="bg-gray-300" style={{ width: '30px', height: '30px', borderRadius: '7px' }} />
              <div className="bg-gray-300" style={{ width: '30px', height: '30px', borderRadius: '7px' }} />
            </div>
          </div>
            <div className="flex-1 px-4 pb-4 pt-2 flex flex-col items-center">
            <div className="h-5 bg-gray-200 rounded w-4/5 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-3/5 mb-3" />
            <div className="w-full h-px" style={{ backgroundColor: isDarkMode ? '#2d2d2d' : 'rgba(202, 96, 20, 0.15)' }} />
            <div className="h-3 bg-gray-200 rounded w-2/5 mt-3" />
          </div>
        </div>
      ))}
    </div>
  );

  const MobileVerticalSkeleton = () => (
    <div className="block sm:hidden grid grid-cols-1 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse flex flex-col overflow-hidden"
          style={{
            backgroundColor: isDarkMode ? 'var(--card-bg)' : '#FFEFD9',
            border: isDarkMode ? '1px solid #555555' : '1px solid #CA6014',
            borderRadius: '16px',
          }}
        >
          <div className="relative" style={{ margin: '0', borderRadius: '0', overflow: 'hidden' }}>
            <div className="w-full bg-gray-200" style={{ paddingTop: '54%' }} />
            <div className="absolute top-2.5 left-2.5">
              <div className="bg-gray-300" style={{ width: '60px', height: '26px', borderRadius: '6px' }} />
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              <div className="bg-gray-300" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
              <div className="bg-gray-300" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
            </div>
          </div>
          <div className="flex-1 px-5 py-4 flex flex-col items-center justify-center">
            <div className="h-6 bg-gray-200 rounded w-4/5 mb-3" />
            <div className="w-full h-px mb-3" style={{ backgroundColor: isDarkMode ? '#2d2d2d' : 'rgba(202, 96, 20, 0.15)' }} />
            <div className="h-4 bg-gray-200 rounded w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );

  const MobileHorizontalSkeleton = () => (
    <div className="block sm:hidden">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="mb-4">
          <div
            className="flex overflow-hidden animate-pulse"
            style={{
              backgroundColor: isDarkMode ? 'var(--card-bg)' : '#FFEFD9',
              border: isDarkMode ? '1px solid #555555' : '1px solid #CA6014',
              borderRadius: '16px',
              padding: '6px'
            }}
          >
            <div
              className="flex-shrink-0 bg-gray-200"
              style={{ width: '108px', height: '108px', borderRadius: '10px' }}
            />
            
            <div className="flex-1 pl-3 pr-2 py-1 flex justify-between">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="flex flex-col items-end justify-between">
                <div className="bg-gray-300" style={{ width: '36px', height: '36px', borderRadius: '6px' }} />
                <div className="bg-gray-300" style={{ width: '36px', height: '36px', borderRadius: '6px' }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <DesktopSkeleton />
      {mobileLayout === 'vertical' ? <MobileVerticalSkeleton /> : <MobileHorizontalSkeleton />}
    </>
  );
};

export default RecipeGridSkeleton;
