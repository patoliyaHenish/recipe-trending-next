"use client";
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Box, Typography, Chip, useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '../../../context/ThemeContext';
import { getImage } from '../../../utils/helper';

const ViewBannerDialog = ({
  open,
  onClose,
  banner,
}) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const { hasImg, src } = React.useMemo(() => {
    if (!banner) return { hasImg: false, src: '' };
    const imgVal = (typeof banner.image === 'string' ? banner.image.trim() : '') || '';
    const valid = Boolean(imgVal) && imgVal.toLowerCase() !== 'null';
    return { hasImg: valid, src: valid ? getImage(imgVal) : '' };
  }, [banner]);

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
          Banner Details
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
        {banner ? (
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
                  alt={banner.title}
                  className="object-cover"
                  style={{ height: '12rem', aspectRatio: '16 / 9', maxWidth: '100%', borderRadius: 8 }}
                />
              ) : (
                <Typography variant="caption" color={isDarkMode ? 'grey.500' : 'text.secondary'}>No Image</Typography>
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
                <DetailRow label="Title" value={banner.title} />
                
                <DetailRow label="Button Text" value={banner.button_text || '—'} />

                <DetailRow label="Keywords">
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(banner.keywords || []).length > 0 ? (
                      banner.keywords.map((kw, idx) => (
                        <Chip
                          key={`${kw}-${idx}`}
                          label={kw}
                          size="small"
                          sx={{ 
                              backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
                              color: isDarkMode ? '#10b981' : '#059669', 
                              fontWeight: 600,
                              borderRadius: '4px' 
                          }} 
                        />
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontStyle: 'italic' }}>None</Typography>
                    )}
                  </Box>
                </DetailRow>

                <DetailRow label="Is Hero Banner">
                    <Chip
                      label={banner.is_hero ? 'Yes' : 'No'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        height: '22px',
                        color: banner.is_hero ? '#f4c542' : (isDarkMode ? '#9ca3af' : '#6b7280'),
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                        border: `1px solid ${banner.is_hero ? '#f4c54233' : (isDarkMode ? '#4b556333' : '#d1d5db33')}`,
                      }}
                    />
                </DetailRow>

                {banner.live_at && (
                    <DetailRow label="Live At">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                          {new Date(banner.live_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </Typography>
                    </DetailRow>
                )}

                {banner.created_at && (
                    <DetailRow label="Created At">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                          {new Date(banner.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </Typography>
                    </DetailRow>
                )}
            </Box>
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

export default ViewBannerDialog;

