"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Box, Stack, Typography, useMediaQuery, Tooltip } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTheme } from '../../../context/ThemeContext';
import { getYouTubeThumbnail, getYouTubeVideoTitle, getImage } from '../../../utils/helper';
import { AdminApprovedToggle, PublicApprovedToggle } from '../../../components/common';
import { useGetRecipeNotesQuery } from '../../../features/api/recipeNoteApi';
import { toast } from '../../../utils/toast';

const ViewRecipeDialog = ({
  open,
  onClose,
  isLoading,
  data,
  onSuccess,
  canViewAnalytics,
  isAdmin,
  canPublish,
  onPublicApprovedChange,
  onAdminApprovedChange,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  canViewNotes,
  onViewNotes,
}) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  const [videoTitle, setVideoTitle] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyIngSuccess, setCopyIngSuccess] = useState(false);
  const [copyVideoSuccess, setCopyVideoSuccess] = useState(false);

  const handleCopyIngredients = () => {
    if (!data?.ingredients) return;
    const ingredientsText = data.ingredients.map(ing => {
      if (ing.is_free_text) return ing.free_text;
      const quantityStr = ing.quantity ? ing.quantity + ' ' : '';
      const unitStr = ing.unit ? ing.unit + ' ' : '';
      return `${quantityStr}${unitStr}${ing.ingredient_name || ''}`.trim();
    }).join('\n');
    
    const promptText = "Is this list of ingredients with quantity is same as in this video and is that any missing ingredients and if yes then give it with the quantity";
    const text = `${ingredientsText}\n\n${promptText}`;
    
    navigator.clipboard.writeText(text);
    setCopyIngSuccess(true);
    toast.success("Ingredients copied successfully!");
    setTimeout(() => setCopyIngSuccess(false), 2000);
  };

  const handleCopyVideoUrl = () => {
    if (!data?.video_url) return;
    navigator.clipboard.writeText(data.video_url);
    setCopyVideoSuccess(true);
    toast.success("Video URL copied successfully!");
    setTimeout(() => setCopyVideoSuccess(false), 2000);
  };

  const { data: notesData } = useGetRecipeNotesQuery(data?.recipe_id, { 
    skip: !data?.recipe_id || !open 
  });
  const notes = notesData?.data || [];

  useEffect(() => {
    const fetchVideoTitle = async () => {
      if (data?.video_url) {
        const title = await getYouTubeVideoTitle(data.video_url);
        setVideoTitle(title);
      }
    };
    fetchVideoTitle();
  }, [data?.video_url]);

  const parseKeywords = (keywords) => {
    if (!keywords) return [];
    if (Array.isArray(keywords)) return keywords;
    try {
      return JSON.parse(keywords);
    } catch {
      return [];
    }
  };

  const keywords = parseKeywords(data?.keywords);

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

  const { imgSrc, hasImage } = useMemo(() => {
    if (!data) return { imgSrc: null, hasImage: false };
    const img = data.image;
    const hasImg = typeof img === 'string' && img.trim() !== '' && img !== 'null';
    if (hasImg) {
      return { imgSrc: img.startsWith('http') ? img : getImage(img), hasImage: true };
    }
    if (data.video_url) {
      return { imgSrc: getYouTubeThumbnail(data.video_url), hasImage: true };
    }
    return { imgSrc: null, hasImage: false };
  }, [data]);

  const DetailRow = ({ label, value, children }) => (
      <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {label}
              </Typography>
          </Box>
          {children ? children : (
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827', wordBreak: 'break-word' }}>
                  {value || 'N/A'}
              </Typography>
          )}
      </Box>
  );

  const handlePublicApprovalChange = async (newValue) => {
    if (!onPublicApprovedChange || !data?.recipe_id) return;
    const result = await onPublicApprovedChange(data.recipe_id, newValue);
    if (result && onSuccess) onSuccess();
  };

  const handleAdminApprovalChange = async (newValue) => {
    if (!onAdminApprovedChange || !data?.recipe_id) return;
    const result = await onAdminApprovedChange(data.recipe_id, newValue);
    if (result && onSuccess) onSuccess();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}>Recipe Details</Typography>
          {data?.badge && (
            <Chip 
              label={data.badge} 
              size="small" 
              sx={{ 
                backgroundColor: 
                  data.badge === 'Popular' ? '#ef4444' :
                  data.badge === 'Trending' ? '#3b82f6' :
                  data.badge === 'Beginner' ? '#10b981' :
                  data.badge === 'Quick' ? '#f59e0b' : '#f97316', 
                color: '#fff', 
                fontWeight: 'bold',
                fontSize: '0.75rem',
                height: '22px',
                borderRadius: '4px',
                px: 0.5
              }} 
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {canViewNotes && onViewNotes && (
            <IconButton onClick={() => { onViewNotes(data?.recipe_id); }} size="small" sx={{ color: isDarkMode ? '#10b981' : '#059669', '&:hover': { color: isDarkMode ? '#34d399' : '#047857', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } }} title="View Notes">
              <NoteAltOutlinedIcon fontSize="small" />
            </IconButton>
          )}
          {canEdit && onEdit && (
            <IconButton onClick={() => { onEdit(data?.recipe_id); }} size="small" sx={{ color: isDarkMode ? '#3b82f6' : '#2563eb', '&:hover': { color: isDarkMode ? '#60a5fa' : '#1d4ed8', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } }} title="Edit">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {canDelete && onDelete && (
            <IconButton onClick={() => { onDelete(data?.recipe_id); }} size="small" sx={{ color: isDarkMode ? '#ef4444' : '#dc2626', '&:hover': { color: isDarkMode ? '#f87171' : '#b91c1c', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } }} title="Delete">
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton onClick={onClose} sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', ml: 1, '&:hover': { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } }}>
            <CloseIcon />
          </IconButton>
        </Box>
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
            <CircularProgress size={30} sx={{ color: '#7367f0' }} />
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
              {hasImage && imgSrc ? (
                <img
                  src={imgSrc}
                  alt={data.title}
                  className="object-cover"
                  style={{
                    height: isMobile ? 'auto' : '14rem',
                    width: isMobile ? '100%' : 'auto',
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
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }, 
                gap: 3,
                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
            }}>
              <DetailRow label="Title" value={data.title} />
              <DetailRow label="Slug" value={data.slug} />

              <DetailRow label="Food Type">
                <Typography 
                  component="span" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: data.food_type === 'veg' ? '#10b981' : 
                           data.food_type === 'egg' ? '#f59e0b' : 
                           data.food_type === 'non_veg' ? '#ef4444' : 'inherit'
                  }}
                >
                  {data.food_type ? (data.food_type.charAt(0).toUpperCase() + data.food_type.slice(1).replace('_', '-')) : 'N/A'}
                </Typography>
              </DetailRow>

              <Box sx={{ gridColumn: '1 / -1' }}>
                <DetailRow label="Description" value={data.description || 'N/A'} />
              </Box>

              {data.note && data.note.trim() !== '' && data.note.toLowerCase() !== 'null' && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <DetailRow label="Note" value={data.note} />
                  </Box>
              )}

              <DetailRow label="Category" value={data.category_name} />
              {data.sub_category_name && <DetailRow label="Sub Category" value={data.sub_category_name} />}

              <DetailRow label="Prep Time" value={`${data.prep_time} min`} />
              <DetailRow label="Cook Time" value={`${data.cook_time} min`} />
              {data.rest_time > 0 && <DetailRow label="Rest Time" value={`${data.rest_time} min`} />}
              <DetailRow label="Serving Size" value={data.serving_size} />

              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Keywords</Typography>
                {keywords && keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <Chip key={index} label={keyword} size="small" sx={{ backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5', color: isDarkMode ? '#34d399' : '#059669', fontWeight: 600, borderRadius: '4px' }} />
                    ))}
                  </div>
                ) : (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">No keywords</Typography>
                )}
              </Box>

              <Box sx={{ mt: 1 }}>
                  <DetailRow label="Created By">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {data.created_by_name || '-'}
                      </Typography>
                  </DetailRow>
              </Box>

              <Box sx={{ mt: 1 }}>
                  <DetailRow label="Updated By">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {data.updated_by_name || '-'}
                      </Typography>
                  </DetailRow>
              </Box>

              <DetailRow label="Created At">
                  <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                    {formatDateTime(data.created_at)}
                  </Typography>
              </DetailRow>

              <DetailRow label="Updated At">
                  <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                    {formatDateTime(data.updated_at)}
                  </Typography>
              </DetailRow>
            </Box>

            {data.video_url && (
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(1, 1fr)', 
                    gap: 2,
                    bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: -1 }}>
                      <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Video Instructions</Typography>
                      <Tooltip title={copyVideoSuccess ? "Copied!" : "Copy Video URL"} placement="top">
                        <IconButton onClick={handleCopyVideoUrl} size="small" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', p: 0.5 }}>
                          <ContentCopyIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <DetailRow label="Video URL">
                      <a href={data.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline">
                          {data.video_url}
                      </a>
                    </DetailRow>
                    {videoTitle && <DetailRow label="Video Title" value={videoTitle} />}
                </Box>
            )}

            {canViewAnalytics && (
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' }, 
                    gap: 2,
                }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                    <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Views</Typography>
                    <Typography variant="h6" sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 700 }}>{data.total_views != null ? data.total_views.toLocaleString() : 0}</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                    <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Views (24h)</Typography>
                    <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 700 }}>{data.views_last_24h != null ? data.views_last_24h.toLocaleString() : 0}</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                    <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Views (7d)</Typography>
                    <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 700 }}>{data.views_last_7d != null ? data.views_last_7d.toLocaleString() : 0}</Typography>
                  </Box>
                </Box>
            )}

            {data.saved_count > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                  <span className="text-xl">🔖</span>
                  <Typography component="span" sx={{ fontWeight: 600, color: isDarkMode ? '#93c5fd' : '#1e40af' }}>
                    Saved by {data.saved_count} {data.saved_count === 1 ? 'user' : 'users'}
                  </Typography>
                </Box>
            )}

            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(1, 1fr)', 
                gap: 3,
                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
            }}>
               <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontWeight: 700, mb: -1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Recipe Instructions</Typography>
               <Box component="ol" sx={{ pl: 2, m: 0 }}>
                 {(data.instructions || []).map((instr, idx) => (
                   <li key={idx} style={{ marginBottom: '0.5rem', color: isDarkMode ? '#d1d5db' : '#374151' }}>
                      <Typography component="span" variant="body2" sx={{ fontWeight: 600, mr: 1, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Step {idx + 1}:</Typography>
                      {instr.instruction_text || instr}
                   </li>
                 ))}
               </Box>
            </Box>

            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(1, 1fr)', 
                gap: 3,
                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
            }}>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 1 }}>
                 <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Ingredients Details</Typography>
                 {data.ingredients && data.ingredients.length > 0 && (
                   <Tooltip title={copyIngSuccess ? "Copied!" : "Copy Ingredients"} placement="top">
                     <IconButton onClick={handleCopyIngredients} size="small" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', p: 0.5 }}>
                       <ContentCopyIcon sx={{ fontSize: '1.1rem' }} />
                     </IconButton>
                   </Tooltip>
                 )}
               </Box>
               {data.ingredients && data.ingredients.length > 0 ? (
                  <TableContainer sx={{ border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`, borderRadius: 1, backgroundColor: 'transparent', maxHeight: 320, overflowY: 'auto' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 600, borderColor: isDarkMode ? '#404656' : '#ebe9f1', bgcolor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>Ingredient</TableCell>
                          <TableCell sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 600, borderColor: isDarkMode ? '#404656' : '#ebe9f1', bgcolor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>Quantity</TableCell>
                          <TableCell sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 600, borderColor: isDarkMode ? '#404656' : '#ebe9f1', bgcolor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>Unit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.ingredients.map((ing, idx) => {
                          if (ing.is_free_text) {
                            const isSectionHeader = typeof ing.free_text === 'string' && ing.free_text.trim().endsWith(':') && !ing.quantity && !ing.unit;
                            return isSectionHeader ? (
                              <TableRow key={idx}>
                                <TableCell colSpan={3} sx={{ padding: 0, border: 'none', borderColor: isDarkMode ? '#404656' : '#ebe9f1' }}>
                                  <div style={{ backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)', color: isDarkMode ? '#fcd34d' : '#d97706', fontWeight: 700, padding: '6px 16px', borderBottom: `1px solid ${isDarkMode ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.15)'}` }}>{ing.free_text}</div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              <TableRow key={idx}>
                                <TableCell colSpan={3} sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontStyle: 'italic', borderColor: isDarkMode ? '#404656' : '#ebe9f1' }}>{ing.free_text}</TableCell>
                              </TableRow>
                            );
                          }
                          return (
                            <TableRow key={idx}>
                              <TableCell sx={{ color: isDarkMode ? '#d1d5db' : '#374151', borderColor: isDarkMode ? '#404656' : '#ebe9f1' }}>{ing.ingredient_name}</TableCell>
                              <TableCell sx={{ color: isDarkMode ? '#d1d5db' : '#374151', borderColor: isDarkMode ? '#404656' : '#ebe9f1' }}>{ing.quantity}</TableCell>
                              <TableCell sx={{ color: isDarkMode ? '#d1d5db' : '#374151', borderColor: isDarkMode ? '#404656' : '#ebe9f1' }}>{ing.unit}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
               ) : (
                  <Typography variant="body2" color="text.secondary">No ingredients found</Typography>
               )}
            </Box>

            {data.nutrition && (
              <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(1, 1fr)', 
                  gap: 3,
                  bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                  p: 2.5,
                  borderRadius: 2,
                  border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
              }}>
                 <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontWeight: 700, mb: -1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Nutrition Info (per serving)</Typography>
                 <TableContainer sx={{ border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`, borderRadius: 1, backgroundColor: 'transparent', maxHeight: 320, overflowY: 'auto' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 600, borderColor: isDarkMode ? '#404656' : '#ebe9f1', bgcolor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>Nutrient</TableCell>
                          <TableCell sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 600, borderColor: isDarkMode ? '#404656' : '#ebe9f1', bgcolor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>Value</TableCell>
                          <TableCell sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 600, borderColor: isDarkMode ? '#404656' : '#ebe9f1', bgcolor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>Unit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { label: "Calories", value: data.nutrition.calories, unit: "kcal" },
                          { label: "Protein", value: data.nutrition.protein, unit: "g" },
                          { label: "Total Fat", value: data.nutrition.total_fat, unit: "g" },
                          { label: "Saturated Fat", value: data.nutrition.saturated_fat, unit: "g" },
                          { label: "Cholesterol", value: data.nutrition.cholesterol, unit: "mg" },
                          { label: "Total Carbohydrate", value: data.nutrition.total_carbohydrate, unit: "g" },
                          { label: "Dietary Fiber", value: data.nutrition.dietary_fiber, unit: "g" },
                          { label: "Total Sugars", value: data.nutrition.total_sugars, unit: "g" },
                          { label: "Sodium", value: data.nutrition.sodium, unit: "mg" },
                          { label: "Vitamin C", value: data.nutrition.vitamin_c, unit: "mg" },
                          { label: "Calcium", value: data.nutrition.calcium, unit: "mg" },
                          { label: "Iron", value: data.nutrition.iron, unit: "mg" },
                          { label: "Potassium", value: data.nutrition.potassium, unit: "mg" },
                        ].map((nutri, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ color: isDarkMode ? '#d1d5db' : '#374151', borderColor: isDarkMode ? '#404656' : '#ebe9f1' }}>{nutri.label}</TableCell>
                            <TableCell sx={{ color: isDarkMode ? '#d1d5db' : '#374151', borderColor: isDarkMode ? '#404656' : '#ebe9f1' }}>{nutri.value != null ? Number(nutri.value).toFixed(1) : '-'}</TableCell>
                            <TableCell sx={{ color: isDarkMode ? '#d1d5db' : '#374151', borderColor: isDarkMode ? '#404656' : '#ebe9f1' }}>{nutri.unit}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                 </TableContainer>
              </Box>
            )}

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

            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }, 
                gap: 3,
                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
            }}>
               <Typography variant="subtitle2" sx={{ gridColumn: '1 / -1', color: isDarkMode ? '#9ca3af' : '#6b7280', fontWeight: 700, mb: -1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Approval Controls</Typography>
               <Box className="flex flex-col gap-3">
                 {(canPublish || isAdmin) && (
                   <PublicApprovedToggle value={!!data.public_approved} onChange={handlePublicApprovalChange} disabled={!(canPublish || isAdmin)} showLabel labelSx={{ color: isDarkMode ? '#e5e7eb' : '#374151', fontWeight: 500 }} />
                 )}
                 <AdminApprovedToggle value={!!data.is_admin_approved} onChange={handleAdminApprovalChange} disabled={!isAdmin} showLabel labelSx={{ color: isDarkMode ? '#e5e7eb' : '#374151', fontWeight: 500 }} />
               </Box>
               <Box className="flex flex-col gap-3">
                 {(canPublish || isAdmin) && data.public_approved && data.public_approved_time && (
                   <DetailRow label="Public Approved At" value={formatDateTime(data.public_approved_time)} />
                 )}
                 {data.is_admin_approved && data.admin_approved_time && (
                   <DetailRow label="Admin Approved At" value={formatDateTime(data.admin_approved_time)} />
                 )}
               </Box>
            </Box>

            {notes.length > 0 && (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', 
                gap: 2,
                bgcolor: isDarkMode ? 'rgba(234, 84, 85, 0.04)' : 'rgba(234, 84, 85, 0.04)',
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(234, 84, 85, 0.12)' : 'rgba(234, 84, 85, 0.12)'}`,
              }}>
                <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#ea5455' : '#ea5455', fontWeight: 700, mb: -1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Recipe Notes ({notes.length})</Typography>
                <Stack spacing={1.5} mt={1}>
                  {notes.map(note => (
                    <Box key={note.note_id} sx={{ p: 2, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#ffffff', borderRadius: 2, border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                         <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#1e293b' }}>{note.commenter_name || 'Unknown'}</Typography>
                         <Chip label={note.status} size="small" sx={{ height: '20px', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', backgroundColor: note.status === 'resolved' ? (isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5') : (isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7'), color: note.status === 'resolved' ? (isDarkMode ? '#34d399' : '#059669') : (isDarkMode ? '#fbbf24' : '#d97706') }} />
                      </Box>
                      <Typography variant="body2" sx={{ color: isDarkMode ? '#d1d5db' : '#4b5563', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>{note.message}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#9ca3af', fontSize: '0.65rem' }}>{formatDateTime(note.created_at)}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, backgroundColor: isDarkMode ? '#283046' : '#ffffff', borderTop: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`, gap: 1 }}>
        <Box sx={{ flexGrow: 1 }} />
        {data?.public_approved && data?.slug && (
          <>
            <Tooltip title={copySuccess ? "Copied!" : "Copy Link"} placement="top">
              <IconButton 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/${data.slug}`);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                sx={{ 
                  color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                  border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                  borderRadius: '6px',
                  p: '6px',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                  }
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button 
              onClick={() => window.open(`/${data.slug}`, '_blank')} 
            variant="contained"
            sx={{
              borderRadius: '6px',
              backgroundColor: '#7367f0',
              color: '#fff',
              boxShadow: 'none',
              '&:hover': { 
                  backgroundColor: '#5e50ee',
                  boxShadow: 'none'
              }
            }}
          >
            View Details Page
          </Button>
          </>
        )}
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

export default ViewRecipeDialog;

