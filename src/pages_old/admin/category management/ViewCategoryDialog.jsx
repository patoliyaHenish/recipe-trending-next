"use client";
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Chip, Box, useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '../../../context/ThemeContext';
import { getImage } from '../../../utils/helper';

const ViewCategoryDialog = ({
  open,
  onClose,
  category,
}) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  const { hasImg, src } = React.useMemo(() => {
    if (!category) return { hasImg: false, src: '' };
    const imgVal = (typeof category.image === 'string' ? category.image.trim() : '') || '';
    const valid = Boolean(imgVal) && imgVal.toLowerCase() !== 'null';
    return { hasImg: valid, src: valid ? getImage(imgVal) : '' };
  }, [category]);

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
          Category Details
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
        {category ? (
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
                  alt={category.name}
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
              <DetailRow label="Name" value={category.name} />
              
              <DetailRow label="Slug" value={category.slug} />

              <DetailRow label="Status">
                  <Chip
                    label={category.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: '22px',
                      color: category.is_active ? '#10b981' : '#ef4444',
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                      border: `1px solid ${category.is_active ? '#10b98133' : '#ef444433'}`,
                    }}
                  />
              </DetailRow>

              <Box sx={{ gridColumn: 'span 2' }}>
                <DetailRow label="Description" value={category.description || 'N/A'} />
              </Box>

              {category.created_at && (
                  <DetailRow label="Created At">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {new Date(category.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Typography>
                  </DetailRow>
              )}

              {category.updated_at && (
                  <DetailRow label="Updated At">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {new Date(category.updated_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Typography>
                  </DetailRow>
              )}
            </Box>

            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, 
                gap: 2,
            }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Recipes</Typography>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 700 }}>{category.recipe_count || 0}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Sub-Categories</Typography>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 700 }}>{category.subcategory_count || 0}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Added (Week)</Typography>
                <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 700 }}>{category.recipes_this_week || 0}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Added (Month)</Typography>
                <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 700 }}>{category.recipes_this_month || 0}</Typography>
              </Box>
            </Box>

            {(category.meta_title || category.meta_description) && (
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
                {category.meta_title && <DetailRow label="Meta Title" value={category.meta_title} />}
                {category.meta_description && <DetailRow label="Meta Description" value={category.meta_description} />}
              </Box>
            )}

          </>
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

export default ViewCategoryDialog;
