"use client";
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Box, Typography, Chip, useMediaQuery, Pagination, TextField, Tooltip } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { ConfirmDialog } from '../../../components/common';
import { useTheme } from '../../../context/ThemeContext';
import { getImage } from '../../../utils/helper';
import { toast } from '../../../utils/toast';
import { useGetBannerRecipesByIdQuery, useUpdateBannerMutation, useGetBannerByIdQuery } from '../../../features/api/bannerApi';

const BannerRecipesList = ({ bannerId, isDarkMode }) => {
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [foodType, setFoodType] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [deleteTarget, setDeleteTarget] = React.useState(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, foodType]);

  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation();
  const { data: fullBannerData } = useGetBannerByIdQuery(bannerId, { skip: !bannerId });

  const { data: recipesRes, isLoading, isFetching } = useGetBannerRecipesByIdQuery({
    id: bannerId,
    search: debouncedSearch,
    food_type: foodType,
    page,
    limit: 20
  }, { skip: !bannerId });

  const confirmDeleteRecipe = async () => {
    if (!deleteTarget || !bannerId || !fullBannerData?.data) return;
    const recipeIdToRemove = deleteTarget.recipe_id;
    const currentBanner = fullBannerData.data;
    const currentRecipeIds = currentBanner.recipe_ids || [];
    const updatedRecipeIds = currentRecipeIds.filter(id => Number(id) !== Number(recipeIdToRemove));

    const formData = new FormData();
    formData.append('title', currentBanner.title);
    formData.append('button_text', currentBanner.button_text || '');
    formData.append('is_hero', currentBanner.is_hero ? 'true' : 'false');
    formData.append('order', (currentBanner.order || 0).toString());
    formData.append('recipe_ids', JSON.stringify(updatedRecipeIds));

    try {
      await updateBanner({ id: bannerId, inputData: formData }).unwrap();
      toast.success('Recipe removed from banner successfully');
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Failed to remove recipe from banner');
    }
  };

  const payload = recipesRes?.data;
  const recipes = Array.isArray(payload) ? payload : (payload?.recipes || []);
  const pagination = payload?.pagination || { total: 0, totalPages: 1, currentPage: 1 };

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: isDarkMode ? '#e2e8f0' : '#1e293b',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            fontSize: '0.75rem'
          }}
        >
          Banner Recipes ({pagination.total || recipes.length})
        </Typography>

        {/* Food Type Filter Chips */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {[
            { label: 'All', value: 'all' },
            { label: 'Veg', value: 'veg' },
            { label: 'Egg', value: 'egg' },
            { label: 'Non-Veg', value: 'non_veg' },
          ].map((filter) => {
            const isActive = foodType === filter.value;
            return (
              <Chip
                key={filter.value}
                label={filter.label}
                size="small"
                onClick={() => setFoodType(filter.value)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: '22px',
                  cursor: 'pointer',
                  backgroundColor: isActive
                    ? '#7367f0 !important'
                    : isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  color: isActive
                    ? '#ffffff !important'
                    : isDarkMode ? '#9ca3af' : '#64748b',
                  border: `1px solid ${isActive ? '#7367f0' : isDarkMode ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Search Input */}
      <Box sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes..."
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.825rem',
              height: 34,
              color: isDarkMode ? '#e2e8f0' : '#1e293b',
              backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc',
              borderRadius: '6px',
              '& fieldset': {
                borderColor: isDarkMode ? '#374151' : '#e2e8f0',
              },
              '&:hover fieldset': {
                borderColor: '#7367f0',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#7367f0',
                borderWidth: '1px',
              },
            },
            '& .MuiInputBase-input': {
              padding: '6px 12px',
            }
          }}
        />
      </Box>

      {isLoading || isFetching ? (
        <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', py: 2, textAlign: 'center' }}>
          Loading recipes...
        </Typography>
      ) : recipes.length === 0 ? (
        <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', italic: true, py: 2, textAlign: 'center' }}>
          No recipes found.
        </Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {recipes.map((recipe) => {
              const imgVal = (typeof recipe.image === 'string' ? recipe.image.trim() : '') || '';
              const recipeSrc = imgVal && imgVal.toLowerCase() !== 'null' ? getImage(imgVal) : '';
              const foodTypeVal = String(recipe.food_type || '').trim().toLowerCase();
              const foodTypeLabel = foodTypeVal === 'veg' ? 'Veg' : foodTypeVal === 'egg' ? 'Egg' : foodTypeVal ? 'Non-Veg' : '';

              return (
                <Box
                  key={recipe.recipe_id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1,
                    borderRadius: 1.5,
                    backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                  }}
                >
                  {recipeSrc ? (
                    <img
                      src={recipeSrc}
                      alt={recipe.title || recipe.name}
                      style={{
                        width: 60,
                        height: 40,
                        objectFit: 'cover',
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 60,
                        height: 40,
                        borderRadius: 4,
                        backgroundColor: isDarkMode ? '#374151' : '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        fontSize: '0.65rem',
                      }}
                    >
                      No Img
                    </Box>
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: isDarkMode ? '#f3f4f6' : '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {recipe.title || recipe.name}
                      </Typography>
                      {foodTypeLabel && (
                        <Chip
                          label={foodTypeLabel}
                          size="small"
                          sx={{
                            height: '18px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            backgroundColor: foodTypeVal === 'veg'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : foodTypeVal === 'egg'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            color: foodTypeVal === 'veg'
                              ? '#10b981'
                              : foodTypeVal === 'egg'
                                ? '#f59e0b'
                                : '#ef4444',
                            border: `1px solid ${foodTypeVal === 'veg' ? '#10b98133' : foodTypeVal === 'egg' ? '#f59e0b33' : '#ef444433'}`,
                          }}
                        />
                      )}
                    </Box>
                    {(recipe.category_name || recipe.sub_category_name) && (
                      <Typography
                        variant="caption"
                        sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block' }}
                      >
                        {[recipe.category_name, recipe.sub_category_name].filter(Boolean).join(' • ')}
                      </Typography>
                    )}
                  </Box>
                  <Tooltip title="Remove recipe from banner" arrow>
                    <IconButton
                      size="small"
                      onClick={() => setDeleteTarget(recipe)}
                      disabled={isUpdating}
                      sx={{
                        color: isDarkMode ? '#ef4444' : '#dc2626',
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>

          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
              <Pagination
                count={pagination.totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                size="small"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                    fontSize: '0.75rem',
                    minWidth: '26px',
                    height: '26px',
                  },
                  '& .Mui-selected': {
                    backgroundColor: '#7367f0 !important',
                    color: '#ffffff !important',
                  }
                }}
              />
            </Box>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteRecipe}
        title="Remove Recipe from Banner"
        message={
          <>
            Are you sure you want to remove <strong>{deleteTarget?.title || deleteTarget?.name}</strong> from this banner?
          </>
        }
        confirmText="Remove"
        cancelText="Cancel"
        isLoading={isUpdating}
        loadingText="Removing..."
        severity="error"
      />
    </Box>
  );
};

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

            {/* ── Banner Recipes Section ────────────────────────────────────────── */}
            <BannerRecipesList bannerId={banner.banner_id || banner.id} isDarkMode={isDarkMode} />
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

