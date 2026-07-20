"use client";
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  IconButton,
  GlobalStyles,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useTheme } from '../../context/ThemeContext';

const ConfirmDialog = ({
  open = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  loadingText = 'Processing...',
  severity = 'warning',
  maxWidth = 'xs',
  confirmDisabled = false,
}) => {
  const { isDarkMode } = useTheme();

  const getThemeConfig = () => {
    switch (severity) {
      case 'error':
        return { icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 44, color: isDarkMode ? '#f87171' : '#dc2626' }} />, bg: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2', text: isDarkMode ? '#f87171' : '#dc2626', btnBg: '#ef4444', btnHover: '#dc2626' };
      case 'warning':
        return { icon: <WarningRoundedIcon sx={{ fontSize: 44, color: isDarkMode ? '#fbbf24' : '#d97706' }} />, bg: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb', text: isDarkMode ? '#fbbf24' : '#d97706', btnBg: '#f59e0b', btnHover: '#d97706' };
      case 'info':
        return { icon: <InfoOutlinedIcon sx={{ fontSize: 44, color: isDarkMode ? '#60a5fa' : '#2563eb' }} />, bg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', text: isDarkMode ? '#60a5fa' : '#2563eb', btnBg: '#3b82f6', btnHover: '#2563eb' };
      case 'success':
        return { icon: <CheckCircleOutlinedIcon sx={{ fontSize: 44, color: isDarkMode ? '#34d399' : '#059669' }} />, bg: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5', text: isDarkMode ? '#34d399' : '#059669', btnBg: '#10b981', btnHover: '#059669' };
      default:
        return { icon: <InfoOutlinedIcon sx={{ fontSize: 44, color: isDarkMode ? '#60a5fa' : '#2563eb' }} />, bg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', text: isDarkMode ? '#60a5fa' : '#2563eb', btnBg: '#7367f0', btnHover: '#5e50ee' };
    }
  };

  const config = getThemeConfig();

  return (
    <>
      <GlobalStyles styles={{
        '.confirm-btn, .confirm-btn:hover, .confirm-btn:focus, .confirm-btn span': {
          color: '#ffffff !important',
        }
      }} />
      <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          backgroundImage: 'none',
        }
      }}
    >
      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        <IconButton size="small" onClick={onClose} sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogTitle sx={{ pt: 4, pb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: config.bg,
            mb: 1
          }}
        >
          {config.icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: isDarkMode ? '#f3f4f6' : '#111827', textAlign: 'center' }}>
          {title}
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 3, px: 4 }}>
        <Typography component="div" variant="body1" sx={{ textAlign: 'center', color: isDarkMode ? '#d1d5db' : '#4b5563' }}>
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'center', gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="outlined"
          sx={{ 
            borderRadius: 2, 
            px: 3, 
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            color: isDarkMode ? '#d1d5db' : '#4b5563',
            borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
            '&:hover': {
              borderColor: isDarkMode ? '#6b7280' : '#9ca3af',
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
            }
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading || confirmDisabled}
          variant="contained"
          className="confirm-btn"
          startIcon={isLoading ? <CircularProgress size={16} style={{ color: '#ffffff' }} /> : null}
          style={{
            backgroundColor: config.btnBg,
            color: '#ffffff',
          }}
          sx={{ 
            borderRadius: 2, 
            px: 4, 
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: config.btnHover,
              boxShadow: 'none',
            },
            '&:disabled': {
              opacity: 0.7,
            },
          }}
        >
          {isLoading ? loadingText : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default ConfirmDialog; 
