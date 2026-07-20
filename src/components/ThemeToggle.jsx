"use client";
import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ color }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const iconColor = color ?? '#ffffff';
  const hoverBg = color
    ? isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
    : 'rgba(255,255,255,0.1)';

  return (
    <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton
        onClick={toggleTheme}
        sx={{
          color: iconColor,
          '&:hover': {
            bgcolor: hoverBg,
            color: iconColor,
          },
          transition: 'all 0.3s ease',
        }}
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <LightMode sx={{ fontSize: 24 }} />
        ) : (
          <DarkMode sx={{ fontSize: 24 }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;

