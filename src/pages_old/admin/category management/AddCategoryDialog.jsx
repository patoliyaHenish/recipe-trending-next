"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, IconButton, Switch, Box, InputAdornment, useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getImage } from '../../../utils/helper';
import { toast } from '../../../utils/toast';
import { useUpdateRecipeCategoryByIdMutation, useCreateRecipeCategoryMutation } from '../../../features/api/categoryApi';
import { useTheme } from '../../../context/ThemeContext';
import CloseIcon from '@mui/icons-material/Close';
import { Edit, Save } from "@mui/icons-material";

const CategoryDialog = ({
  open,
  onClose,
  isLoading,
  mode = 'add',
  categoryId = null,
  category = null,
}) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [createCategory, { isLoading: isCreating }] = useCreateRecipeCategoryMutation();

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Category name is required')
      .min(2, 'Category name must be at least 2 characters')
      .max(45, 'Category name must be at most 45 characters'),
    slug: Yup.string()
      .required('Slug is required')
      .matches(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
      .max(100, 'Slug must be at most 100 characters'),
    meta_title: Yup.string()
      .required('Meta Title is required')
      .test('min-length', 'Meta title (with suffix) must be at least 30 characters', (val) => (val?.length || 0) + 18 >= 30)
      .max(47, 'Base Meta title must be at most 47 characters'),
    meta_description: Yup.string()
      .required('Meta Description is required')
      .min(120, 'Meta description must be at least 120 characters')
      .max(160, 'Meta description must be at most 160 characters'),
    description: Yup.string()
      .required('Description is required')
      .min(150, 'Description must be at least 150 characters')
      .max(300, 'Description must be at most 300 characters'),
    image: mode === 'add'
      ? Yup.mixed()
          .required('Image is required')
          .test(
            'fileSize',
            'File size is too large (max 2MB)',
            (value) => !value || value.size <= 2 * 1024 * 1024
          )
          .test(
            'fileType',
            'Unsupported file format (JPEG, PNG, JPG, WEBP only)',
            (value) => !value || ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type)
          )
      : Yup.mixed()
          .nullable()
          .test(
            'fileSize',
            'File size is too large (max 2MB)',
            (value) => !value || value.size <= 2 * 1024 * 1024
          )
          .test(
            'fileType',
            'Unsupported file format (JPEG, PNG, JPG, WEBP only)',
            (value) => !value || ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type)
          )
  });

  const fileInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [updateRecipeCategoryById, { isLoading: isUpdating }] = useUpdateRecipeCategoryByIdMutation();
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(true);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [isAutoSyncMetaEnabled, setIsAutoSyncMetaEnabled] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: mode === 'edit' ? (category?.name ?? '') : '',
      description: mode === 'edit' ? (category?.description ?? '') : '',
      image: null,
      is_active: mode === 'edit' ? (category?.is_active ?? true) : true,
      slug: mode === 'edit' ? (category?.slug ?? '') : '',
      meta_title: mode === 'edit' ? (category?.meta_title ?? '').replace(' | Recipe Trending', '').replace(' | Casual Cravings', '') : '',
      meta_description: mode === 'edit' ? (category?.meta_description ?? '') : '',
    },
    enableReinitialize: true,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        const formData = new FormData();
        formData.append('name', values.name.trim());
        formData.append('description', values.description.trim());
        formData.append('isActive', values.is_active);
        
        if (values.image instanceof File) {
          formData.append('image', values.image);
        }

        formData.append('slug', values.slug);
        formData.append('meta_title', values.meta_title ? `${values.meta_title.trim()} | Recipe Trending` : '');
        formData.append('meta_description', values.meta_description);
        
        if (mode === 'add') {
          await createCategory(formData)
            .unwrap()
            .then(() => {
              toast.success('Category created successfully');
              onClose();
            })
            .catch((error) => {
              const errMsg =
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'Failed to create category';
              toast.error(errMsg);
            });
        } else {
          await updateRecipeCategoryById({ id: categoryId, inputData: formData })
            .unwrap()
            .then(() => {
              toast.success('Category updated successfully');
              onClose();
            })
            .catch((error) => {
              const errMsg =
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'Failed to update category';
              toast.error(errMsg);
            });
        }
      } catch {
        toast.error('Failed to process image');
      }
    },
  });

  useEffect(() => {
    if (mode === 'edit' && category) {
      const imagePath = category.image;
      setImagePreview(imagePath ? getImage(imagePath) : null);
      if (category.is_active !== undefined) {
        formik.setFieldValue('is_active', category.is_active);
      }
      setIsEditingSlug(false);
      setIsEditingMeta(false);
      setIsAutoSyncEnabled(false);
      setIsAutoSyncMetaEnabled(false);
      setIsFormDirty(false);
    } else if (mode === 'add') {
      setImagePreview(null);
      formik.resetForm({ 
        values: { 
          name: '', 
          description: '', 
          is_active: true, 
          image: null,
          slug: '',
          meta_title: (category?.meta_title || '').replace(' | Recipe Trending', '').replace(' | Casual Cravings', ''),
          meta_description: ''
        } 
      });
      setIsEditingSlug(false);
      setIsEditingMeta(true);
      setIsAutoSyncEnabled(true);
      setIsAutoSyncMetaEnabled(false);
      setIsFormDirty(false);
    }
  }, [category, mode, open]);

  useEffect(() => {
    if (mode === 'add' && isAutoSyncEnabled) {
      const generatedSlug = (formik.values.name || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      if (formik.values.slug !== generatedSlug) {
        formik.setFieldValue('slug', generatedSlug);
      }
    }
  }, [formik.values.name, mode, isAutoSyncEnabled, formik.values.slug]);

  useEffect(() => {
    if (mode === 'add' && isAutoSyncMetaEnabled) {
      const newMetaTitle = formik.values.name || '';
      if (formik.values.meta_title !== newMetaTitle) {
        formik.setFieldValue('meta_title', newMetaTitle);
      }
    }
  }, [formik.values.name, mode, isAutoSyncMetaEnabled, formik.values.meta_title]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    formik.setFieldValue('image', file);
    setIsFormDirty(true);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      formik.setFieldValue('image', file);
      setImagePreview(URL.createObjectURL(file));
      setIsFormDirty(true);
    }
  };

  const handleClose = () => {
    onClose();
    setImagePreview(null);
    setIsFormDirty(false);
    formik.resetForm({ values: { name: '', description: '', is_active: true, image: null } });
  };

  const customInputSx = {
    '& .MuiOutlinedInput-root': {
      color: isDarkMode ? '#e2e8f0' : '#1e293b',
      backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
      borderRadius: '8px',
      transition: 'all 0.2s ease-in-out',
      '& fieldset': {
        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? '#475569' : '#cbd5e1',
      },
      '&.Mui-focused fieldset': {
          borderColor: '#6366f1',
          borderWidth: '2px',
      },
      '&.Mui-focused': {
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
      },
      '&.Mui-disabled': {
        color: isDarkMode ? '#9ca3af' : '#6b7280',
        '& .MuiOutlinedInput-input': {
            WebkitTextFillColor: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        '& fieldset': {
            borderColor: isDarkMode ? '#334155' : '#e2e8f0',
        },
      },
    },
    '& .MuiInputLabel-root': {
      color: isDarkMode ? '#94a3b8' : '#64748b',
      '&.Mui-focused': {
          color: '#6366f1',
      },
      '&.Mui-disabled': {
        color: isDarkMode ? '#6b7280' : '#9ca3af',
      },
    },
    '& .MuiFormHelperText-root': {
      color: isDarkMode ? '#ffffff' : '#000000',
      marginLeft: '4px',
      marginTop: '4px',
      '&.Mui-error': {
        color: '#ef4444',
      }
    },
    '& .MuiSelect-icon': {
        color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    '& .MuiTypography-root': {
        color: isDarkMode ? '#e2e8f0' : '#1e293b',
    }
  };

  return (
    <Dialog
      key={`category-dialog-${open}`}
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
            borderRadius: isMobile ? 0 : '16px',
            boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            backgroundImage: 'none',
            border: isDarkMode ? '1px solid #1e293b' : 'none',
          },
      }}
    >
      <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            p: 3,
            pb: 2,
          }}
      >
          <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: isDarkMode ? '#f8fafc' : '#0f172a', letterSpacing: '-0.025em' }}>
                  {mode === 'add' ? 'Add Category' : 'Edit Category'}
              </Typography>
          </Box>
          <IconButton 
              onClick={handleClose}
              size="small"
              sx={{ 
                  color: isDarkMode ? '#94a3b8' : '#64748b',
                  backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
                  '&:hover': {
                      backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                  }
              }}
          >
              <CloseIcon fontSize="small" />
          </IconButton>
      </DialogTitle>
      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogContent
          sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5
          }}
        >
            <TextField
              fullWidth
              label="Category Name"
              name="name"
              value={formik.values.name}
              onChange={(e) => {
                formik.handleChange(e);
                setIsFormDirty(true);
              }}
              onBlur={formik.handleBlur}
              required
              inputProps={{ maxLength: 45 }}
              disabled={isLoading || isUpdating}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={
                (formik.touched.name && formik.errors.name) ||
                `${formik.values.name.length}/45`
              }
              sx={customInputSx}
            />
            <TextField
              fullWidth
              label="Slug"
              name="slug"
              value={formik.values.slug}
              onChange={(e) => {
                formik.handleChange(e);
                setIsFormDirty(true);
              }}
              onBlur={formik.handleBlur}
              required
              disabled={isLoading || isUpdating || mode === 'edit' || (mode === 'add' && !isEditingSlug)}
              error={formik.touched.slug && Boolean(formik.errors.slug)}
              helperText={
                (formik.touched.slug && formik.errors.slug) ||
                `${(formik.values.slug || '').length}/100`
              }
              inputProps={{ maxLength: 100 }}
              InputProps={{
                endAdornment: mode === 'add' ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (isAutoSyncEnabled) setIsAutoSyncEnabled(false);
                        setIsEditingSlug(!isEditingSlug);
                      }}
                      disabled={!formik.values.name || isLoading || isUpdating}
                      sx={{ color: isEditingSlug ? '#6366f1' : (isDarkMode ? '#94a3b8' : '#64748b') }}
                    >
                      {isEditingSlug ? <Save fontSize="small" /> : <Edit fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={customInputSx}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formik.values.description}
              onChange={(e) => {
                formik.handleChange(e);
                setIsFormDirty(true);
              }}
              onBlur={formik.handleBlur}
              multiline
              minRows={3}
              required
              inputProps={{ maxLength: 300 }}
              disabled={isLoading || isUpdating}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={
                (formik.touched.description && formik.errors.description)
                  ? `${formik.errors.description} — ${(formik.values.description || '').length}/300`
                  : `${(formik.values.description || '').length}/300`
              }
              sx={customInputSx}
            />
            <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>
                SEO Settings
              </Typography>
              <TextField
                fullWidth
                label="Meta Title"
                name="meta_title"
                value={formik.values.meta_title}
                onChange={(e) => {
                  formik.handleChange(e);
                  setIsFormDirty(true);
                }}
                onBlur={formik.handleBlur}
                required
                inputProps={{ maxLength: 47 }}
                disabled={isLoading || isUpdating || (mode === 'add' && !isEditingMeta)}
                error={formik.touched.meta_title && Boolean(formik.errors.meta_title)}
                helperText={
                  (formik.touched.meta_title && formik.errors.meta_title) ||
                  `${(formik.values.meta_title || '').length}/47`
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                       <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        | Recipe Trending
                      </Typography>
                      {mode === 'add' && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (isAutoSyncMetaEnabled) setIsAutoSyncMetaEnabled(false);
                            setIsEditingMeta(!isEditingMeta);
                          }}
                          disabled={!formik.values.name || isLoading || isUpdating}
                          sx={{ color: isEditingMeta ? '#6366f1' : (isDarkMode ? '#94a3b8' : '#64748b'), ml: 1 }}
                        >
                          {isEditingMeta ? <Save fontSize="small" /> : <Edit fontSize="small" />}
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={customInputSx}
              />
              <TextField
                fullWidth
                label="Meta Description"
                name="meta_description"
                value={formik.values.meta_description}
                onChange={(e) => {
                  formik.handleChange(e);
                  setIsFormDirty(true);
                }}
                onBlur={formik.handleBlur}
                required
                multiline
                minRows={3}
                inputProps={{ maxLength: 160 }}
                disabled={isLoading || isUpdating}
                error={formik.touched.meta_description && Boolean(formik.errors.meta_description)}
                helperText={
                  (formik.touched.meta_description && formik.errors.meta_description) ||
                  `${(formik.values.meta_description || '').length}/160`
                }
                sx={customInputSx}
              />
            </Box>
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: `2px dashed ${dragActive ? '#6366f1' : isDarkMode ? '#334155' : '#cbd5e1'}`,
                borderRadius: '12px',
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragActive ? (isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)') : isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#6366f1',
                  bgcolor: isDarkMode ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.02)',
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <Typography variant="body2" sx={{ mb: 1, color: isDarkMode ? '#d1d5db' : '#6b7280' }}>
                {formik.values.image || imagePreview ? 'Change Image' : 'Upload Category Image'}
              </Typography>
              <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#9ca3af' }}>
                or drag and drop image here
              </Typography>
              {imagePreview && (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="preview"
                  sx={{
                    width: '50%',
                    maxWidth: 300,
                    aspectRatio: '16 / 9',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    mt: 1,
                    mx: 'auto',
                    display: 'block',
                  }}
                />
              )}
              {formik.touched.image && formik.errors.image && (
                <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mt: 1 }}>
                  {formik.errors.image}
                </Typography>
              )}
            </Box>
            <Box sx={{
                p: 2,
                borderRadius: '12px',
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 600, mb: 0.5 }}>
                            Status
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                            Make this category active
                        </Typography>
                    </Box>
                    <Switch
                        checked={formik.values.is_active}
                        onChange={(_, checked) => {
                            formik.setFieldValue('is_active', checked);
                            setIsFormDirty(true);
                        }}
                        disabled={isLoading || isUpdating}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#6366f1',
                                '&:hover': {
                                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                },
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#6366f1',
                            },
                        }}
                    />
                </Box>
            </Box>
        </DialogContent>
        <DialogActions
          sx={{
              p: 3,
              pt: 2,
              gap: 2,
          }}
        >
          <Button
            onClick={handleClose}
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
            Cancel
          </Button>
          <Button
            onClick={formik.handleSubmit}
            variant="contained"
            disabled={isLoading || isCreating || isUpdating}
            sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                backgroundColor: '#7367f0',
                boxShadow: 'none',
                '&:hover': {
                    backgroundColor: '#5e50ee',
                    boxShadow: 'none',
                },
            }}
          >
            {isLoading || isCreating ? 'Adding...' : isUpdating ? 'Updating...' : mode === 'edit' ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CategoryDialog;
