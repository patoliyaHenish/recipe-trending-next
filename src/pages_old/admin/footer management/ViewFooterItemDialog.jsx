"use client";
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Chip, Box, useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import LabelIcon from '@mui/icons-material/Label';
import LinkIcon from '@mui/icons-material/Link';
import SortIcon from '@mui/icons-material/Sort';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTheme } from '../../../context/ThemeContext';

const ViewFooterItemDialog = ({ open, onClose, item }) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const DetailRow = ({ label, value, children }) => (
      <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5 }}>
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
          Footer Item Details
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
        }}
      >
        {item ? (
          <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 3,
              bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
          }}>
              <DetailRow label="Label" value={item.label} icon={LabelIcon} iconColor="#7367f0" />
              
              <DetailRow label="Path" icon={LinkIcon} iconColor="#28c76f">
                  <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                    {item.path ? (item.path.startsWith('/') || item.path.startsWith('http') ? item.path : `/${item.path}`) : '-'}
                  </Typography>
              </DetailRow>

              <DetailRow label="Sort Order" value={item.order_index} icon={SortIcon} iconColor="#00cfe8" />

              <DetailRow label="Open in New Tab" value={item.open_in_new_tab ? 'Yes' : 'No'} icon={OpenInNewIcon} iconColor="#f59e0b" />

              <DetailRow label="Status" icon={ToggleOnIcon} iconColor={item.is_active ? '#10b981' : '#ef4444'}>
                  <Chip
                    label={item.is_active ? 'Live' : 'Inactive'}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: '22px',
                      color: item.is_active ? '#10b981' : '#ef4444',
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                      border: `1px solid ${item.is_active ? '#10b98133' : '#ef444433'}`,
                    }}
                  />
              </DetailRow>

              {item.created_at && (
                  <DetailRow label="Created At" icon={AccessTimeIcon} iconColor="#8b5cf6">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {new Date(item.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Typography>
                  </DetailRow>
              )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">No details found.</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, backgroundColor: isDarkMode ? '#283046' : '#ffffff', borderTop: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{
            borderRadius: '6px',
            color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
            borderColor: isDarkMode ? '#404656' : '#d8d6de',
            '&:hover': { 
                borderColor: isDarkMode ? '#d0d2d6' : '#4b4b4b',
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewFooterItemDialog;

