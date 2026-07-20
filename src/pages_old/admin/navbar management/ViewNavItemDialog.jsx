"use client";
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Chip, Box, useMediaQuery, Divider } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import LabelIcon from '@mui/icons-material/Label';
import LinkIcon from '@mui/icons-material/Link';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SortIcon from '@mui/icons-material/Sort';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTheme } from '../../../context/ThemeContext';
import { useLazyGetNavItemByIdQuery } from '../../../features/api/navItemApi';
import CircularProgress from '@mui/material/CircularProgress';

const ViewNavItemDialog = ({ open, onClose, item: initialItem, parentLabel }) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const [getNavItemById, { data, isLoading, isError }] = useLazyGetNavItemByIdQuery();

  React.useEffect(() => {
      if (open && initialItem?.id) {
          getNavItemById(initialItem.id);
      }
  }, [open, initialItem, getNavItemById]);

  const item = data?.data || initialItem;

  const formatDateTime = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
      });
  };

  const getVisibilityColor = (visibility) => {
    switch (visibility) {
        case 'ADMIN': return '#ef4444';
        case 'AUTH': return '#3b82f6';
        default: return '#10b981';
    }
  }

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
          Navigation Item Details
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
        {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress color="primary" />
            </Box>
        ) : isError ? (
            <Typography color="error" textAlign="center">Failed to load navigation item details.</Typography>
        ) : !item ? (
            <Typography textAlign="center">No data available.</Typography>
        ) : (
          <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 3,
              bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
          }}>
              <Box sx={{ gridColumn: 'span 2' }}>
                  <DetailRow label="Label" value={item.label} />
              </Box>
              
              <Box sx={{ gridColumn: 'span 2' }}>
                  <DetailRow label="Path">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {item.path ? (item.path.startsWith('/') || item.path.startsWith('http') ? item.path : `/${item.path}`) : '-'}
                      </Typography>
                  </DetailRow>
              </Box>

              <DetailRow label="Visibility">
                  <Chip
                      label={item.visibility}
                      size="small"
                      sx={{
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          height: '22px',
                          color: getVisibilityColor(item.visibility),
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                          border: `1px solid ${getVisibilityColor(item.visibility)}33`,
                      }}
                  />
              </DetailRow>

              {parentLabel ? (
                  <DetailRow label="Parent Menu" value={parentLabel} />
              ) : (
                  <DetailRow label="Sort Order" value={item.order_index} />
              )}

              {parentLabel && (
                  <DetailRow label="Sort Order" value={item.order_index} />
              )}

              <DetailRow label="Open in New Tab" value={item.open_in_new_tab ? 'Yes' : 'No'} />

              <DetailRow label="Status">
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
                  <DetailRow label="Created At" value={formatDateTime(item.created_at)} />
              )}
              {item.updated_at && (
                  <DetailRow label="Updated At" value={formatDateTime(item.updated_at)} />
              )}
          </Box>
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

export default ViewNavItemDialog;

