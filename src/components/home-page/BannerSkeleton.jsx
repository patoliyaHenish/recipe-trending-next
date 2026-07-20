"use client";
import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { useTheme } from '../../context/ThemeContext';

const BannerSkeleton = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div 
      style={{ 
        paddingTop: '80px',
        backgroundColor: 'var(--bg-primary)',
        transition: 'background-color 0.3s ease'
      }}
    >
    <Box
      className="relative w-full max-w-7xl mx-auto overflow-hidden flex items-stretch"
      sx={{
        height: { xs: 'auto', sm: 320, md: 480, lg: 630 },
        minHeight: { xs: 300, sm: 320, md: 480, lg: 630 },
        borderRadius: '8px',
        transition: 'all 0.3s ease'
      }}
    >
      <div 
        className="flex flex-col w-full max-w-sm sm:hidden mx-auto items-center overflow-hidden rounded-lg gap-4"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: `1px solid var(--card-border)`,
          transition: 'all 0.3s ease'
        }}
      >
        <Skeleton variant="rectangular" className="w-full h-48" />
        <div className="flex flex-col items-center w-full px-4 pb-4">
          <Skeleton variant="text" width="80%" height={32} className="mb-3" />
          <Skeleton variant="rectangular" width={120} height={40} className="rounded-lg" />
        </div>
      </div>
      <>
        <Box
          className="absolute inset-0 w-full h-full hidden sm:block"
          sx={{
            background: isDarkMode 
              ? 'linear-gradient(90deg, var(--bg-tertiary) 60%, var(--bg-secondary) 100%)'
              : 'linear-gradient(90deg, #f3f4f6 60%, #e5e7eb 100%)',
            zIndex: 1,
            transition: 'all 0.3s ease'
          }}
        >
          <Skeleton variant="rectangular" width="100%" height="100%" sx={{ height: '100%' }} />
        </Box>
        <Box
          className="absolute left-0 top-0 bottom-0 hidden sm:flex flex-col justify-center h-full px-16 sm:px-8 md:px-10 lg:px-12 py-4 max-w-full md:max-w-[580px] lg:max-w-[640px]"
          sx={{
            width: { xs: '100%', sm: '70%', md: '50%', lg: '45%' },
            background: isDarkMode 
              ? 'linear-gradient(90deg, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.0) 100%)'
              : 'linear-gradient(90deg, rgba(0,0,0,0.07) 70%, rgba(0,0,0,0.0) 100%)',
            zIndex: 2,
            transition: 'all 0.3s ease'
          }}
        >
          <Skeleton variant="text" width="80%" height={48} className="mb-4" />
          <Skeleton variant="rectangular" width={140} height={48} className="rounded-lg" />
        </Box>
      </>
    </Box>
  </div>
  );
};

export default BannerSkeleton;
