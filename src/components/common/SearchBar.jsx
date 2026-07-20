"use client";
import React from 'react';
import { TextField } from '@mui/material';
import { useTheme } from '../../context/ThemeContext';

const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  label = 'Search',
  size = 'small',
  variant = 'outlined',
  className = 'rounded w-full sm:w-auto',
  sx = { minWidth: { xs: '100%', sm: 220 } },
  fullWidth = false,
  disabled = false,
}) => {
  const { isDarkMode } = useTheme();
  return (
    <TextField
      label={label}
      variant={variant}
      size={size}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      sx={{
        ...sx,
        '& .MuiOutlinedInput-root': {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          borderRadius: 0,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          '& fieldset': {
            borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
          },
          '&:hover fieldset': {
            borderColor: isDarkMode ? '#6b7280' : '#9ca3af',
          },
          '&.Mui-focused fieldset': {
            borderColor: isDarkMode ? '#3b82f6' : '#2563eb',
          }
        },
        '& .MuiInputLabel-root': {
          color: isDarkMode ? '#d1d5db' : '#6b7280',
          '&.Mui-focused': {
            color: isDarkMode ? '#3b82f6' : '#2563eb',
          }
        },
        transition: 'all 0.3s ease'
      }}
      fullWidth={fullWidth}
      disabled={disabled}
    />
  );
};

export default SearchBar; 
