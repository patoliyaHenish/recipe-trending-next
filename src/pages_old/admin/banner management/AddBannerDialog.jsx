"use client";
import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Typography, IconButton, Autocomplete, Chip, Paper, Switch, Button, useMediaQuery } from '@mui/material'
import { useTheme as useMuiTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import { toast } from '../../../utils/toast';
import { useCreateBannerMutation, useUpdateBannerMutation } from '../../../features/api/bannerApi'
import { useGetAllKeywordsQuery } from '../../../features/api/keywordApi'
import { useTheme } from '../../../context/ThemeContext'
import { getImage } from '../../../utils/helper'
import { useUser } from '../../../context/useUser'

const AddBannerDialog = ({ open, onClose, mode = 'add', bannerId = null, bannerData = null, existingBanners = [] }) => {
  const { isDarkMode } = useTheme()
  const muiTheme = useMuiTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'))
  const { user } = useUser();
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
  const canSetHero = isAdmin || userPermissions.includes('banner.set_hero');

  const [createBanner, { isLoading: isAdding }] = useCreateBannerMutation()

  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation()
  const [keywordSearch, setKeywordSearch] = useState('')
  const [debouncedKeywordSearch, setDebouncedKeywordSearch] = useState('')
  const { data: keywordSuggestionsRaw } = useGetAllKeywordsQuery(
    { search: debouncedKeywordSearch, page: 1, limit: 15 },
    { skip: !open }
  )

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
      setKeywordSearch('')
      setDebouncedKeywordSearch('')
    }
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
    }
  }, [open, mode, bannerData])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeywordSearch(keywordSearch.trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [keywordSearch])

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const formData = new FormData()
    formData.append('title', values.title)
    formData.append('button_text', values.button_text)
    formData.append('keywords', JSON.stringify(values.keywords))
    formData.append('is_hero', values.is_hero ? 'true' : 'false')
    
    if (values.is_hero && values.order) {
      formData.append('order', values.order.toString())
    } else {
      formData.append('order', '0')
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

  const initialValues = mode === 'edit' && bannerData ? {
    title: bannerData.title || '',
    button_text: bannerData.button_text || '',
    keywords: bannerData.keywords || [],
    image: null,
    is_hero: bannerData.is_hero || false,
    order: bannerData.order || ''
  } : {
    title: '',
    button_text: '',
    keywords: [],
    image: null,
    is_hero: false,
    order: ''
  }

  const validationSchema = useMemo(() => {
    const baseSchema = {
      title: Yup.string().required('Title is required'),
      button_text: Yup.string().required('Button text is required'),
      keywords: Yup.array().of(Yup.string().trim().required()).min(1, 'At least one keyword is required'),
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
          const keywordOptions = Array.isArray(keywordSuggestionsRaw?.data)
            ? keywordSuggestionsRaw.data
                .filter(k => !values.keywords.includes(k.name))
                .map(k => ({
                  label: `${k.name} (${Number(k.usage_count || 0)})`,
                  value: k.name,
                  usageCount: Number(k.usage_count || 0),
                }))
            : []

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
                    sx={{
                      '& .MuiAutocomplete-tag': {
                        backgroundColor: '#6366f1 !important',
                        color: '#ffffff !important',
                        fontWeight: 600,
                        borderRadius: '6px',
                        '& .MuiChip-label': {
                          color: '#ffffff !important',
                        },
                        '& .MuiChip-deleteIcon': {
                          color: 'rgba(255, 255, 255, 0.7) !important',
                          '&:hover': {
                            color: '#ffffff !important',
                          }
                        }
                      }
                    }}
                    options={keywordOptions}
                    inputValue={keywordSearch}
                    onInputChange={(_, value, reason) => {
                      if (reason === 'input') {
                        setKeywordSearch(value)
                      }
                    }}
                    getOptionLabel={option => typeof option === 'string' ? option : option.label}
                    value={values.keywords.map(val => {
                      const found = keywordOptions.find(opt => opt.value === val)
                      return found ? found : { label: val, value: val }
                    })}
                    onChange={(_, newValue) => setFieldValue('keywords', newValue.map(v => (typeof v === 'string' ? v : v.value)))}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip 
                          variant="filled" 
                          color="primary"
                          label={option.label} 
                          {...getTagProps({ index })} 
                          key={option.value || option.label}
                          sx={{
                            color: '#ffffff !important',
                            backgroundColor: '#6366f1 !important',
                            fontWeight: 600,
                            borderRadius: '6px',
                            '& .MuiChip-label': {
                              color: '#ffffff !important',
                            },
                            '& .MuiChip-deleteIcon': {
                              color: 'rgba(255, 255, 255, 0.7) !important',
                              '&:hover': { color: '#ffffff !important' },
                            },
                          }}
                        />
                      ))
                    }
                    slotProps={{
                        paper: {
                            sx: {
                                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                borderRadius: '8px',
                                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                mt: 1,
                                '& .MuiAutocomplete-option': {
                                    padding: '10px 16px',
                                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                    '&:hover': {
                                        backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#f1f5f9',
                                    },
                                    '&[aria-selected="true"]': {
                                        backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff',
                                        color: '#6366f1',
                                        fontWeight: 600,
                                        '&:hover': {
                                            backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : '#c7d2fe',
                                        }
                                    }
                                },
                                '& .MuiAutocomplete-noOptions': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                            }
                        }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Keywords"
                        fullWidth
                        error={touched.keywords && Boolean(errors.keywords)}
                        helperText={touched.keywords && errors.keywords}
                        sx={customInputSx}
                      />
                    )}
                  />

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

