"use client";
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Box, Stack, Typography, Chip, useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '../../../context/ThemeContext';

const ViewPayrollDialog = ({ open, onClose, slip, users = [] }) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const userMap = React.useMemo(() => {
    return users.reduce((map, currentUser) => {
      map[currentUser.user_id] = currentUser;
      return map;
    }, {});
  }, [users]);

  const formatUser = (userId, fallbackName, fallbackEmail) => {
    const user = userMap[userId];
    if (user) {
      return `${user.name || 'Unknown'} (${user.email || 'no-email'})`;
    }
    if (fallbackName || fallbackEmail) {
      return `${fallbackName || 'Unknown'} (${fallbackEmail || 'no-email'})`;
    }
    return `User #${userId}`;
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDateOnly = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const moneyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  });

  const DetailRow = ({ label, value, children }) => (
      <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {label}
              </Typography>
          </Box>
          {children ? children : (
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                  {value || 'N/A'}
              </Typography>
          )}
      </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: '8px',
          backgroundColor: isDarkMode ? '#283046' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
          boxShadow: isDarkMode ? '0 15px 30px rgba(0,0,0,0.3)' : '0 15px 30px rgba(0,0,0,0.1)',
        },
      }}
    >
      <DialogTitle
        className="flex items-center justify-between"
        sx={{ borderBottom: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`, py: 2.5 }}
      >
        <Typography variant="h6" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}>
          Payment Slip Details
        </Typography>
        <IconButton onClick={onClose} sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          py: 3,
          backgroundColor: isDarkMode ? '#283046' : '#ffffff',
          borderColor: isDarkMode ? '#404656' : '#ebe9f1',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {slip ? (
          <>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: isDarkMode
                  ? 'linear-gradient(145deg, #111827, #1f2937)'
                  : 'linear-gradient(145deg, #f8fafc, #fff)',
                border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                mb: 3
              }}
            >
              <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#93c5fd' : '#1e40af', fontWeight: 700, mb: 1 }}>
                Payment Summary
              </Typography>
              <Box className="flex flex-wrap gap-3">
                <Box sx={{ p: 1.5, borderRadius: 1.5, flex: '1 1 120px', backgroundColor: isDarkMode ? '#111827' : '#f8fafc', border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}` }}>
                  <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>
                    Rate
                  </Typography>
                  <Typography variant="h6" sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 700 }}>
                    {moneyFormatter.format(Number(slip.rate || 0))}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 1.5, flex: '1 1 120px', backgroundColor: isDarkMode ? '#111827' : '#f8fafc', border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}` }}>
                  <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>
                    Total Amount
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 700 }}>
                    {moneyFormatter.format(Number(slip.total_amount || 0))}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 1.5, flex: '1 1 120px', backgroundColor: isDarkMode ? '#111827' : '#f8fafc', border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}` }}>
                  <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>
                    Approved Count
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 700 }}>
                    {slip.admin_approved_count ?? 0}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 3,
              bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
            }}>
              <DetailRow label="User" value={formatUser(slip.user_id, slip.user_name, slip.user_email)} />

              <DetailRow label="Status">
                <Chip
                  label={String(slip.status || 'pending').toUpperCase()}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    color:
                      slip.status === 'approved'
                        ? '#10b981'
                        : slip.status === 'rejected'
                          ? '#ef4444'
                          : slip.status === 'paid'
                            ? '#3b82f6'
                            : '#f59e0b',
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                    border: `1px solid ${slip.status === 'approved'
                      ? '#10b98133'
                      : slip.status === 'rejected'
                        ? '#ef444433'
                        : slip.status === 'paid'
                          ? '#3b82f633'
                          : '#f59e0b33'
                      }`,
                  }}
                />
              </DetailRow>

              <DetailRow label="Created By" value={formatUser(slip.created_by, slip.created_by_name, slip.created_by_email)} />

              <DetailRow label="Payment Mode" value={slip.payment_mode || 'N/A'} />

              <DetailRow label="Payment Date" value={formatDateOnly(slip.payment_date)} />

              <DetailRow label="Created At" value={formatDateTime(slip.created_at)} />

              <Box sx={{ gridColumn: 'span 2' }}>
                <DetailRow label="Updated At" value={formatDateTime(slip.updated_at)} />
              </Box>

              <Box sx={{ gridColumn: 'span 2' }}>
                <DetailRow label="Details" value={slip.details} />
              </Box>
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">No details found.</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            color: isDarkMode ? '#94a3b8' : '#64748b',
            borderColor: isDarkMode ? '#334155' : '#cbd5e1',
            '&:hover': {
              borderColor: isDarkMode ? '#475569' : '#94a3b8',
              backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.2)' : 'rgba(100, 116, 139, 0.04)',
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewPayrollDialog;

