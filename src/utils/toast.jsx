"use client";
import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

export const toast = {
  success: (msg, options) => window.dispatchEvent(new CustomEvent('mui-toast', { detail: { msg, type: 'success', ...options } })),
  error: (msg, options) => window.dispatchEvent(new CustomEvent('mui-toast', { detail: { msg, type: 'error', ...options } })),
  info: (msg, options) => window.dispatchEvent(new CustomEvent('mui-toast', { detail: { msg, type: 'info', ...options } })),
  warning: (msg, options) => window.dispatchEvent(new CustomEvent('mui-toast', { detail: { msg, type: 'warning', ...options } })),
  dismiss: () => window.dispatchEvent(new CustomEvent('mui-toast-dismiss')),
};

export const MuiToastContainer = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');

  useEffect(() => {
    const handleToast = (e) => {
      setMessage(e.detail.msg);
      setSeverity(e.detail.type || 'info');
      setOpen(true);
    };

    const handleDismiss = () => {
      setOpen(false);
    };

    window.addEventListener('mui-toast', handleToast);
    window.addEventListener('mui-toast-dismiss', handleDismiss);

    return () => {
      window.removeEventListener('mui-toast', handleToast);
      window.removeEventListener('mui-toast-dismiss', handleDismiss);
    };
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={severity} variant="filled" sx={{ width: '100%', color: '#fff' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

