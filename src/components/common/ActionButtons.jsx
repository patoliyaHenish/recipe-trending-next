"use client";
import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
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
  viewTooltip = 'View',
  editTooltip = 'Edit',
  deleteTooltip = 'Delete',
}) => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`flex flex-row items-center gap-1 ${className}`}>
      {showView && onView && (
        <Tooltip title={viewTooltip} arrow>
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
                backgroundColor: isDarkMode ? '#064e3b' : '#d1fae5',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </IconButton>
        </Tooltip>
      )}

      {showEdit && onEdit && (
        <Tooltip title={editTooltip} arrow>
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
                backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {showDelete && onDelete && (
        <Tooltip title={deleteTooltip} arrow>
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
                backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};

export default ActionButtons;
