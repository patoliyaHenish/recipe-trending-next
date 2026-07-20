"use client";
import React from 'react';
import { Chip } from '@mui/material';

const StatusBadge = ({
  status,
  variant = 'filled',
  size = 'small',
  className = '',
}) => {
  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase();
    
    switch (statusLower) {
      case 'approved':
      case 'active':
      case 'success':
        return {
          color: 'success',
          label: status,
        };
      case 'pending':
      case 'waiting':
        return {
          color: 'warning',
          label: status,
        };
      case 'rejected':
      case 'inactive':
      case 'error':
        return {
          color: 'error',
          label: status,
        };
      case 'draft':
      case 'info':
        return {
          color: 'info',
          label: status,
        };
      default:
        return {
          color: 'default',
          label: status,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      color={config.color}
      variant={variant}
      size={size}
      className={className}
    />
  );
};

export default StatusBadge; 
