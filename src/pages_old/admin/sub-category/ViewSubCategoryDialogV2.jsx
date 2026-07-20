"use client";
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Box, Stack, Typography, Chip, CircularProgress, useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '../../../context/ThemeContext';
import { getImage } from '../../../utils/helper';

const ViewSubCategoryDialogV2 = ({ open, onClose, subCategory }) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const data = subCategory;
  const isLoading = false;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const { hasImg, src } = React.useMemo(() => {
    if (!data) return { hasImg: false, src: '' };
    const imgVal = (typeof data.image === 'string' ? data.image.trim() : '') || '';
    const valid = Boolean(imgVal) && imgVal.toLowerCase() !== 'null';
    return { hasImg: valid, src: valid ? getImage(imgVal) : '' };
  }, [data]);

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
          Sub-Category Details
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
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
            <CircularProgress color="primary" />
          </Box>
        ) : !data ? (
          <Typography variant="body2" color="text.secondary">No details found.</Typography>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDarkMode
                  ? 'linear-gradient(145deg, #1f2937, #111827)'
                  : 'linear-gradient(145deg, #ffffff, #f8fafc)',
                border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
                borderRadius: 2,
                p: 2,
              }}
            >
              {hasImg && src ? (
                <img
                  src={src}
                  alt={data.name}
                  className="object-cover"
                  style={{
                    height: '12rem',
                    aspectRatio: '16 / 9',
                    maxWidth: '100%',
                    borderRadius: 8,
                  }}
                />
              ) : (
                <Typography variant="caption" color={isDarkMode ? 'grey.500' : 'text.secondary'}>
                  No Image
                </Typography>
              )}
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
              <DetailRow label="Name" value={data.name} />
              
              <DetailRow label="Slug" value={data.slug} />

              <DetailRow label="Category" value={data.category_name} />

              <DetailRow label="Status">
                  <Chip
                    label={data.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: '22px',
                      color: data.is_active ? '#10b981' : '#ef4444',
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                      border: `1px solid ${data.is_active ? '#10b98133' : '#ef444433'}`,
                    }}
                  />
              </DetailRow>

              <Box sx={{ gridColumn: 'span 2' }}>
                <DetailRow label="Description" value={data.description || 'N/A'} />
              </Box>

              {data.created_at && (
                  <DetailRow label="Created At">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {formatDateTime(data.created_at)}
                      </Typography>
                  </DetailRow>
              )}

              {data.updated_at && (
                  <DetailRow label="Updated At">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {formatDateTime(data.updated_at)}
                      </Typography>
                  </DetailRow>
              )}
            </Box>

            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' }, 
                gap: 2,
            }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Recipes</Typography>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 700 }}>{data.recipe_count || 0}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Added (Week)</Typography>
                <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 700 }}>{data.recipes_this_week || 0}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Added (Month)</Typography>
                <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 700 }}>{data.recipes_this_month || 0}</Typography>
              </Box>
            </Box>

            {(data.meta_title || data.meta_description) && (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', 
                gap: 3,
                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
              }}>
                <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontWeight: 700, mb: -1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>SEO Settings</Typography>
                {data.meta_title && <DetailRow label="Meta Title" value={data.meta_title} />}
                {data.meta_description && <DetailRow label="Meta Description" value={data.meta_description} />}
              </Box>
            )}

          </>
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

export default ViewSubCategoryDialogV2;

