"use client";
import React from 'react';
import { Box, Skeleton } from '@mui/material';

const NavbarSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1, 2, 3, 4].map((item) => (
        <Skeleton 
          key={item} 
          variant="rectangular" 
          width={80} 
          height={32} 
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: '4px' 
          }} 
        />
      ))}
    </Box>
  );
};

export default NavbarSkeleton;

