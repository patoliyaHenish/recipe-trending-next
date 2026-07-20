"use client";
import React from 'react';
import { Button } from '@mui/material';
import { useTheme } from '../../context/ThemeContext';

const PageHeader = ({
  title,
  children,
  className = '',
}) => {
  const { isDarkMode } = useTheme();
  return (
    <div 
      className={`flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4 ${className}`}
      style={{
        color: 'var(--text-primary)',
        transition: 'all 0.3s ease'
      }}
    >
      <h2 
        className="text-4xl font-bold text-center sm:text-left w-full sm:w-auto"
        style={{
          color: 'var(--text-primary)',
          transition: 'color 0.3s ease'
        }}
      >
        {title}
      </h2>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {children}
      </div>
    </div>
  );
};

export default PageHeader; 
