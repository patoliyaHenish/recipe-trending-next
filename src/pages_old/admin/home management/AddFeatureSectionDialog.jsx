"use client";
import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  useMediaQuery,
  Autocomplete,
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from '../../../utils/toast';
import { useTheme } from '../../../context/ThemeContext';
import { useUser } from '../../../context/useUser';
import { getImage } from '../../../utils/helper';
import { useCreateHomeFeatureSectionMutation, useUpdateHomeFeatureSectionMutation } from '../../../features/api/homeSectionApi';

const AddFeatureSectionDialog = ({ open, onClose, nextPosition = 0, mode = 'add', sectionId = null, section = null }) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const { user } = useUser();
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin';
  const canPublishFeature = isAdmin || userPermissions.includes('home_section.feature_live');

  const [createHomeFeatureSection, { isLoading }] = useCreateHomeFeatureSectionMutation();
  const [updateHomeFeatureSection, { isLoading: isUpdating }] = useUpdateHomeFeatureSectionMutation();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);


  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    type: Yup.string().oneOf(['recipe', 'keyword']).required('Type is required'),
    description: Yup.string().required('Description is required'),
    background_image: Yup.mixed()
      .test(
        'required-image',
        'Background image is required',
        (value) => {
          if (mode === 'add') return value instanceof File;
          return Boolean(section?.background_image) || value instanceof File;
        }
      )
      .test(
        'fileSize',
        'File size is too large (max 2MB)',
        (value) => !value || !(value instanceof File) || value.size <= 2 * 1024 * 1024
      )
      .test(
        'fileType',
        'Unsupported file format (JPEG, PNG, JPG, WEBP only)',
        (value) => !value || !(value instanceof File) || ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type)
      ),
    position: Yup.number().required('Order is required').min(0, 'Order must be positive'),
  });

  const formik = useFormik({
    initialValues: {
      name: mode === 'edit' ? (section?.name || '') : '',
      type: mode === 'edit' ? (section?.type || 'recipe') : 'recipe',
      description: mode === 'edit' ? (section?.description || '') : '',
      background_image: mode === 'edit' ? (section?.background_image || null) : null,
      position: mode === 'edit' ? (section?.position ?? nextPosition) : nextPosition,
      is_active: mode === 'edit' ? (section?.is_active ?? false) : false,
    },


    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('type', values.type);
        formData.append('description', values.description || '');
        formData.append('position', String(Number(values.position)));
        formData.append('is_active', String(values.is_active));

        if (values.background_image instanceof File) {
          formData.append('image', values.background_image);
        }
        if (mode === 'edit') {
          const existingImagePath = typeof values.background_image === 'string'
            ? values.background_image.trim()
            : (section?.background_image || '').trim();
          formData.append('background_image', existingImagePath);
          formData.append('existing_background_image', existingImagePath);
        }

        if (mode === 'edit' && sectionId) {
          await updateHomeFeatureSection({ id: sectionId, inputData: formData }).unwrap();
          toast.success('Feature section updated successfully');
        } else {
          await createHomeFeatureSection(formData).unwrap();
          toast.success('Feature section created successfully');
        }

        resetForm();
        setImagePreview(null);
        onClose();
      } catch (error) {
        toast.error(error?.data?.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} feature section`);
      }
    },
  });

  useEffect(() => {
    if (open && mode === 'edit' && section?.background_image) {
      setImagePreview(getImage(section.background_image));
    } else {
      setImagePreview(null);
    }
    setDragActive(false);
  }, [open, mode, section]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    formik.setFieldValue('background_image', file || null);
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
      formik.setFieldValue('background_image', file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleClose = () => {
    formik.resetForm({
      values: {
        name: '',
        type: 'recipe',
        description: '',
        background_image: null,
        position: nextPosition,
        is_active: false,
      },
    });

    setImagePreview(null);
    onClose();
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

  const autocompletePaperSx = {
      sx: {
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#e2e8f0' : '#1e293b',
          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          borderRadius: '8px',
          mt: 1,
          boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
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
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
                  {mode === 'edit' ? 'Edit Features' : 'Add Features'}
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
            label="Name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            required
            sx={customInputSx}
          />

          <Autocomplete
            options={[{label: 'Recipe', value: 'recipe'}, {label: 'Keywords', value: 'keyword'}]}
            getOptionLabel={(option) => option.label}
            value={[{label: 'Recipe', value: 'recipe'}, {label: 'Keywords', value: 'keyword'}].find(opt => opt.value === formik.values.type) || null}
            onChange={(_, newValue) => {
                formik.setFieldValue('type', newValue ? newValue.value : '');
            }}
            disableClearable
            slotProps={{ paper: autocompletePaperSx }}
            renderInput={(params) => (
                <TextField 
                    {...params} 
                    label="Type" 
                    error={formik.touched.type && Boolean(formik.errors.type)}
                    helperText={formik.touched.type && formik.errors.type}
                    sx={customInputSx} 
                />
            )}
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
            multiline
            minRows={3}
            sx={customInputSx}
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
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <Typography variant="body2" sx={{ mb: 1, color: isDarkMode ? '#d1d5db' : '#6b7280' }}>
              {formik.values.background_image || imagePreview ? 'Change Image' : 'Upload Background Image'}
            </Typography>
            <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#9ca3af' }}>
              or drag and drop image here
            </Typography>
            {imagePreview && (
              <Box
                component="img"
                src={imagePreview}
                alt="Background preview"
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
            {formik.touched.background_image && formik.errors.background_image && (
              <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mt: 1 }}>
                {formik.errors.background_image}
              </Typography>
            )}
          </Box>

          <TextField
            fullWidth
            label="Order"
            name="position"
            type="number"
            value={formik.values.position}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.position && Boolean(formik.errors.position)}
            helperText={formik.touched.position ? formik.errors.position : (!canPublishFeature ? 'No permission to change order' : '')}
            required
            disabled={isLoading || isUpdating || !canPublishFeature}
            sx={customInputSx}
          />


          <Box sx={{
              mt: 1,
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
                          Make this section live {!canPublishFeature && "(No Permission)"}
                      </Typography>
                  </Box>
                  <Switch
                    checked={formik.values.is_active}
                    onChange={(_, checked) => {
                      formik.setFieldValue('is_active', checked);
                    }}
                    disabled={isLoading || isUpdating || !canPublishFeature}
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
              type="submit"
              variant="contained" 
              disabled={isLoading || isUpdating}
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
              {(isLoading || isUpdating) ? (mode === 'edit' ? 'Updating...' : 'Adding...') : (mode === 'edit' ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddFeatureSectionDialog;

