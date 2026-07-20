"use client";
import React from 'react';
import { IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '../../context/ThemeContext';

const ActionButtons = ({
  onView,
  onEdit,
  onDelete,
  disabled = false,
  showView = true,
  showEdit = true,
  showDelete = true,
  size = 'small',
  className = '',
}) => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`flex flex-row items-center gap-1 ${className}`}>
      {showView && onView && (
        <IconButton
          onClick={onView}
          disabled={disabled}
          size={size}
          sx={{
            color: isDarkMode ? '#10b981' : '#059669',
            backgroundColor: 'transparent',
            borderRadius: 0,
            border: 'none',
            '&:hover': {
              backgroundColor: 'transparent',
              color: isDarkMode ? '#10b981' : '#059669',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </IconButton>
      )}

      {showEdit && onEdit && (
        <IconButton
          onClick={onEdit}
          disabled={disabled}
          size={size}
          sx={{
            color: isDarkMode ? '#3b82f6' : '#2563eb',
            backgroundColor: 'transparent',
            borderRadius: 0,
            border: 'none',
            '&:hover': {
              backgroundColor: 'transparent',
              color: isDarkMode ? '#3b82f6' : '#2563eb',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      )}

      {showDelete && onDelete && (
        <IconButton
          onClick={onDelete}
          disabled={disabled}
          size={size}
          sx={{
            color: isDarkMode ? '#ef4444' : '#dc2626',
            backgroundColor: 'transparent',
            borderRadius: 0,
            border: 'none',
            '&:hover': {
              backgroundColor: 'transparent',
              color: isDarkMode ? '#ef4444' : '#dc2626',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </div>
  );
};

export default ActionButtons; 
