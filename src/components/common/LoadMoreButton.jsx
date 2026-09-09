"use client";

import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { useTheme } from '../../context/ThemeContext';

const LoadMoreButton = ({
  onClick,
  disabled = false,
  isLoading = false,
  loadingText = 'Loading...',
  children,
  sx = {},
  ...props
}) => {
  const { isDarkMode } = useTheme();

  return (
    <Button
      variant="contained"
      onClick={onClick}
      disabled={disabled || isLoading}
      sx={{
        minWidth: { xs: '180px', sm: '200px' },
        px: { xs: 2.5, md: 3.5 },
        py: { xs: 1, md: 1.2 },
        borderRadius: 0,
        background: isDarkMode
          ? 'linear-gradient(135deg, #d9782d 0%, #b75a14 100%)'
          : 'linear-gradient(135deg, #d9782d 0%, #b75a14 100%)',
        color: '#fff',
        border: `1.5px solid ${isDarkMode ? '#f9b36b' : '#8c440e'}`,
        boxShadow: 'none',
        fontFamily: "'Basic', sans-serif",
        fontSize: { xs: '0.96rem', md: '1.05rem' },
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'none',
        lineHeight: 1,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.85 : 1,
        transition: 'all 0.25s ease',
        '&:hover': {
          bgcolor: disabled || isLoading ? undefined : '#B75A14',
          transform: 'none',
          boxShadow: 'none',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        '&:disabled': {
          background: isDarkMode
            ? 'linear-gradient(135deg, #9d5b29 0%, #7a3c12 100%)'
            : 'linear-gradient(135deg, #c66b2d 0%, #a65118 100%)',
          boxShadow: 'none',
          opacity: 0.9,
        },
        ...sx,
      }}
      {...props}
    >
      {isLoading ? (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
          <CircularProgress size={18} sx={{ color: 'inherit' }} />
          <span>{loadingText}</span>
        </Box>
      ) : (
        children ?? (
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1.25 }}>
            <span>Load More</span>
            <span style={{ fontSize: '1.3rem', lineHeight: 1, fontWeight: 800 }}>↓</span>
          </Box>
        )
      )}
    </Button>
  );
};

export default LoadMoreButton;
