"use client";
import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Typography, IconButton, Autocomplete, Chip, Paper, Switch, Button, useMediaQuery } from '@mui/material'
import { useTheme as useMuiTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import { useCreateBannerMutation, useUpdateBannerMutation } from '../../../features/api/bannerApi'
import { useSearchPublicApprovedRecipesSimpleQuery } from '../../../features/api/recipeApi'
import { useTheme } from '../../../context/ThemeContext'
import { getImage } from '../../../utils/helper'
import { toast } from '../../../utils/toast'
import { useUser } from '../../../context/useUser'

const AddBannerDialog = ({ open, onClose, mode = 'add', bannerId = null, bannerData = null, existingBanners = [] }) => {
  const { isDarkMode } = useTheme()
  const muiTheme = useMuiTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'))
  const { user } = useUser();
  const userPermissions = user?.permissions || [];
  const canSetHero = userPermissions.includes('banner.set_hero');

  const [createBanner, { isLoading: isAdding }] = useCreateBannerMutation()
  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation()

  const [recipeSearch, setRecipeSearch] = useState('');
  const { data: searchedRecipesData, isLoading: isSearchingRecipes } = useSearchPublicApprovedRecipesSimpleQuery(
    { q: recipeSearch, limit: 50 },
    { skip: !open }
  );

  const availableRecipes = useMemo(() => {
    return searchedRecipesData?.data || searchedRecipesData || [];
  }, [searchedRecipesData]);

  const [imagePreview, setImagePreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const imageUrlRef = useRef(null)

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && bannerData?.image) {
        setImagePreview(getImage(bannerData.image))
      } else {
        setImagePreview(null)
      }
    }
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
    }
  }, [open, mode, bannerData])

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const formData = new FormData()
    formData.append('title', values.title)
    formData.append('button_text', values.button_text)
    formData.append('is_hero', values.is_hero ? 'true' : 'false')
    
    if (values.is_hero && values.order) {
      formData.append('order', values.order.toString())
    } else {
      formData.append('order', '0')
    }

    if (values.recipes && values.recipes.length > 0) {
      const recipeIds = values.recipes.map(r => r.recipe_id || r.id);
      formData.append('recipe_ids', JSON.stringify(recipeIds));
    } else {
      formData.append('recipe_ids', JSON.stringify([]));
    }

    if (values.image instanceof File) {
      formData.append('image', values.image)
    }

    try {
      if (mode === 'add') {
        await createBanner(formData).unwrap()
        toast.success('Banner added successfully')
      } else {
        await updateBanner({ id: bannerId, inputData: formData }).unwrap()
        toast.success('Banner updated successfully')
      }
      onClose()
      resetForm()
      setImagePreview(null)
    } catch (err) {
      const errorMessage = err?.data?.errors?.[0] || err?.data?.message || `Failed to ${mode} banner`
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const initialRecipes = useMemo(() => {
    if (mode === 'edit' && bannerData?.recipe_ids && Array.isArray(bannerData.recipe_ids)) {
      return bannerData.recipe_ids.map(id => {
        const found = availableRecipes.find(r => (r.recipe_id || r.id) === id);
        return found || { recipe_id: id, title: `Recipe #${id}` };
      });
    }
    return [];
  }, [mode, bannerData, availableRecipes]);

  const initialValues = mode === 'edit' && bannerData ? {
    title: bannerData.title || '',
    button_text: bannerData.button_text || '',
    image: null,
    is_hero: bannerData.is_hero || false,
    order: bannerData.order || '',
    recipes: initialRecipes
  } : {
    title: '',
    button_text: '',
    image: null,
    is_hero: false,
    order: '',
    recipes: []
  }

  const validationSchema = useMemo(() => {
    const baseSchema = {
      title: Yup.string().required('Title is required'),
      button_text: Yup.string().required('Button text is required'),
      is_hero: Yup.boolean(),
      order: Yup.number().when('is_hero', {
        is: true,
        then: () => Yup.number()
          .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value))
          .required('Order is required for hero banners')
          .min(1, 'Order must be at least 1')
          .test('unique-order', 'Order is already in use by another hero banner', function (value) {
            if (value === undefined || value === null || value === '') return true;
            return !existingBanners.some(b => b.is_hero && b.order === value && b.banner_id !== bannerId);
          }),
        otherwise: () => Yup.number()
          .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value))
          .nullable()
          .notRequired()
      })
    };

    if (mode === 'add') {
      baseSchema.image = Yup.mixed()
        .required('Banner image is required')
        .test('fileType', 'Please upload an image file', (value) => {
          if (!value) return false
          return value instanceof File || typeof value === 'object'
        });
    }

    return Yup.object().shape(baseSchema);
  }, [mode, existingBanners, bannerId]);

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
      }
    },
    '& .MuiInputLabel-root': {
      color: isDarkMode ? '#94a3b8' : '#64748b',
      '&.Mui-focused': {
          color: '#6366f1',
      }
    },
    '& .MuiFormHelperText-root': {
      color: '#ef4444',
      marginLeft: '4px',
      marginTop: '4px',
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
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      fullScreen={isMobile}
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
                  {mode === 'add' ? 'Add Banner' : 'Edit Banner'}
              </Typography>
          </Box>
          <IconButton 
              onClick={onClose}
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

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        validateOnBlur={true}
        validateOnChange={true}
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => {
          const handleFileChange = (e) => {
            const file = e.target.files[0]
            if (file) {
              setFieldValue('image', file)
              if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
              const url = URL.createObjectURL(file)
              imageUrlRef.current = url
              setImagePreview(url)
            }
          }

          const handleDrop = (e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(false)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0]
              setFieldValue('image', file)
              if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
              const url = URL.createObjectURL(file)
              imageUrlRef.current = url
              setImagePreview(url)
            }
          }

          return (
            <Form>
              <DialogContent
                  sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2.5
                  }}
              >
                  <TextField 
                    name="title" 
                    label="Title" 
                    fullWidth 
                    value={values.title} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    error={touched.title && Boolean(errors.title)} 
                    helperText={touched.title && errors.title} 
                    sx={customInputSx}
                  />
                  <TextField 
                    name="button_text" 
                    label="Button Text" 
                    fullWidth 
                    value={values.button_text} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    error={touched.button_text && Boolean(errors.button_text)} 
                    helperText={touched.button_text && errors.button_text} 
                    sx={customInputSx}
                  />

                  <Autocomplete
                    multiple
                    options={availableRecipes.filter(r => !values.recipes.some(selected => (selected.recipe_id || selected.id) === (r.recipe_id || r.id)))}
                    getOptionLabel={(option) => option.title || option.name || `Recipe #${option.recipe_id || option.id}`}
                    value={values.recipes}
                    loading={isSearchingRecipes}
                    onChange={(_, newValue) => {
                      setFieldValue('recipes', newValue);
                    }}
                    onInputChange={(_, newInputValue) => {
                      setRecipeSearch(newInputValue);
                    }}
                    isOptionEqualToValue={(option, value) => (option.recipe_id || option.id) === (value.recipe_id || value.id)}
                    disablePortal={true}
                    slotProps={{
                      paper: {
                        sx: {
                          bgcolor: isDarkMode ? '#283046' : '#ffffff',
                          color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                          borderRadius: '6px',
                          border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                          boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                          '& .MuiAutocomplete-listbox': {
                            padding: '0',
                            '& .MuiAutocomplete-option': {
                              fontSize: '0.9rem',
                              color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                              '&[aria-selected="true"]': {
                                bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                                color: '#7367f0 !important',
                                fontWeight: 500,
                                '&.Mui-focused': {
                                  bgcolor: 'rgba(115, 103, 240, 0.16) !important'
                                }
                              },
                              '&:hover': {
                                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                color: '#7367f0 !important'
                              },
                              '&.Mui-focused': {
                                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                color: '#7367f0 !important'
                              }
                            }
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Recipes (Show inside banner page)"
                        placeholder="Search and select recipes..."
                        sx={{
                          ...customInputSx,
                          '& .MuiAutocomplete-tag': {
                            display: 'none',
                          },
                          '& .MuiOutlinedInput-root': {
                            ...customInputSx['& .MuiOutlinedInput-root'],
                            bgcolor: isDarkMode ? '#283046' : '#fff',
                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                            '& fieldset': {
                              borderColor: isDarkMode ? '#404656' : '#d8d6de',
                            },
                            '&:hover fieldset': {
                              borderColor: '#7367f0',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#7367f0',
                              borderWidth: '1px',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                            '&.Mui-focused': {
                              color: '#7367f0',
                            }
                          },
                          '& .MuiAutocomplete-popupIndicator': {
                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                          },
                          '& .MuiAutocomplete-clearIndicator': {
                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                          }
                        }}
                      />
                    )}
                  />

                  {values.recipes && values.recipes.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                      {values.recipes.map((item) => (
                        <Chip
                          key={item.recipe_id || item.id}
                          label={item.title || item.name || `Recipe #${item.recipe_id || item.id}`}
                          onDelete={() => {
                            setFieldValue('recipes', values.recipes.filter(r => (r.recipe_id || r.id) !== (item.recipe_id || item.id)));
                          }}
                          size="small"
                          sx={{
                            backgroundColor: isDarkMode ? '#7367f0 !important' : '#e0e7ff !important',
                            color: isDarkMode ? '#ffffff !important' : '#4338ca !important',
                            fontWeight: '600 !important',
                            borderRadius: '4px',
                            '& .MuiChip-label': {
                              color: isDarkMode ? '#ffffff !important' : '#4338ca !important',
                              fontWeight: '600 !important',
                            },
                            '& .MuiChip-deleteIcon': {
                              color: isDarkMode ? '#ffffff !important' : '#4338ca !important',
                              '&:hover': {
                                color: isDarkMode ? '#f1f5f9 !important' : '#3730a3 !important',
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  )}
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
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <Typography variant="body2" sx={{ mb: 1, color: isDarkMode ? '#d1d5db' : '#64748b' }}>
                      {values.image || imagePreview ? 'Change Image' : 'Upload Banner Image'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
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
                          borderRadius: '8px',
                          mt: 1,
                          mx: 'auto',
                          display: 'block',
                        }}
                      />
                    )}
                    {touched.image && errors.image && (
                      <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mt: 1 }}>
                        {errors.image}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 2,
                      p: 2.5,
                      mt: 1,
                      borderRadius: '12px',
                      backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                  }}>
                       <Box display="flex" justifyContent="space-between" alignItems="center">
                           <Box>
                               <Typography sx={{ fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                                  Set as Hero Banner {(!canSetHero) && "(No Permission)"}
                               </Typography>
                               <Typography variant="body2" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>Make this banner the main hero image</Typography>
                           </Box>
                           <Switch
                              checked={values.is_hero}
                              onChange={(_, checked) => {
                                  setFieldValue('is_hero', checked);
                                  if (!checked) setFieldValue('order', '');
                              }}
                              name="is_hero"
                              disabled={!canSetHero}
                              sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366f1' },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#6366f1' },
                              }}
                          />
                       </Box>

                       {values.is_hero && (
                        <TextField 
                          name="order" 
                          label="Banner Order" 
                          type="number"
                          fullWidth 
                          value={values.order} 
                          onChange={handleChange} 
                          onBlur={handleBlur}
                          disabled={!canSetHero}
                          error={touched.order && Boolean(errors.order)} 
                          helperText={!canSetHero ? "You do not have permission to manage banner ordering" : (touched.order && errors.order)} 
                          sx={customInputSx}
                        />
                      )}
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
                      Cancel
                  </Button>
                  <Button 
                      type="submit" 
                      variant="contained" 
                      disabled={isAdding || isUpdating || isSubmitting}
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
                      {isAdding || isUpdating || isSubmitting ? (mode === 'add' ? 'Adding...' : 'Updating...') : (mode === 'add' ? 'Add' : 'Update')}
                  </Button>
              </DialogActions>
            </Form>
          )
        }}
      </Formik>
    </Dialog>
  )
}

export default AddBannerDialog

