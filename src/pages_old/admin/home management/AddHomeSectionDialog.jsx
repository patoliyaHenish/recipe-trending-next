"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, IconButton, Switch, Box, FormControl, InputLabel, Select, MenuItem, useMediaQuery, Autocomplete } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from '../../../utils/toast';
import { useUpdateHomeSectionMutation, useCreateHomeSectionMutation } from '../../../features/api/homeSectionApi';
import { useGetAllActiveRecipeCategoriesSimpleQuery } from '../../../features/api/categoryApi';
import { useTheme } from '../../../context/ThemeContext';
import { useUser } from '../../../context/useUser';
import CloseIcon from '@mui/icons-material/Close';

const AddHomeSectionDialog = ({
  open,
  onClose,
  isLoading,
  mode = 'add',
  sectionId = null,
  section = null,
}) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const { user } = useUser();
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin';
  const canPublish = isAdmin || userPermissions.includes('home_section.live');

  const [isFormDirty, setIsFormDirty] = useState(false);

  const [createHomeSection, { isLoading: isCreating }] = useCreateHomeSectionMutation();
  const [updateHomeSection, { isLoading: isUpdating }] = useUpdateHomeSectionMutation();
  const { data: categories } = useGetAllActiveRecipeCategoriesSimpleQuery();

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    section_type: Yup.string().required('Section Type is required'),
    type: Yup.string().required('Type is required'),
    category_id: Yup.mixed().when('type', {
        is: 'sub-category',
        then: () => Yup.number().required('Category is required'),
        otherwise: () => Yup.mixed().nullable()
    }),
    position: Yup.number().required('Position is required').min(0, 'Position must be positive'),
    is_active: Yup.boolean().optional(),
  });

  const formik = useFormik({
    initialValues: {
      name: mode === 'edit' ? (section?.name ?? '') : '',
      section_type: mode === 'edit' ? (section?.section_type ?? 'grid') : 'grid',
      type: mode === 'edit' ? (section?.type ?? 'category') : 'category',
      category_id: mode === 'edit' ? (section?.category_id ?? '') : '',
      position: mode === 'edit' ? (section?.position ?? 0) : 0,
      is_active: mode === 'edit' ? (section?.is_active ?? false) : false,
    },

    enableReinitialize: true,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        if (mode === 'add') {
          await createHomeSection(values)
            .unwrap()
            .then(() => {
              toast.success('Section created successfully');
              onClose();
            })
            .catch((error) => {
               toast.error(error?.data?.message || 'Failed to create section');
            });
        } else {
          await updateHomeSection({ id: sectionId, inputData: values })
            .unwrap()
            .then(() => {
              toast.success('Section updated successfully');
              onClose();
            })
            .catch((error) => {
               toast.error(error?.data?.message || 'Failed to update section');
            });
        }
      } catch {
        toast.error('Operation failed');
      }
    },
  });

  useEffect(() => {
    if (mode === 'edit' && section) {
      setIsFormDirty(false);
    } else if (mode === 'add') {
      formik.resetForm({ values: { name: '', section_type: 'grid', type: 'category', category_id: '', position: 0, is_active: false } });
      setIsFormDirty(false);
    }

  }, [section, mode, open]);

  const handleClose = () => {
    onClose();
    setIsFormDirty(false);
    formik.resetForm({ values: { name: '', section_type: 'grid', type: 'category', category_id: '', position: 0, is_active: false } });
  };


  const handleFieldChange = (e) => {
      formik.handleChange(e);
      setIsFormDirty(true);
  }

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
      key={`home-section-dialog-${open}`}
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
                  {mode === 'add' ? 'Add Section' : 'Edit Section'}
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
              onChange={handleFieldChange}
              onBlur={formik.handleBlur}
              required
              disabled={isLoading || isUpdating}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              sx={customInputSx}
            />

            <Autocomplete
              options={[{label: 'Slider', value: 'slider'}, {label: 'Grid', value: 'grid'}]}
              getOptionLabel={(option) => option.label}
              value={[{label: 'Slider', value: 'slider'}, {label: 'Grid', value: 'grid'}].find(opt => opt.value === formik.values.section_type) || null}
              onChange={(_, newValue) => {
                  handleFieldChange({ target: { name: 'section_type', value: newValue ? newValue.value : '' } });
              }}
              disableClearable
              disabled={isLoading || isUpdating}
              slotProps={{ paper: autocompletePaperSx }}
              renderInput={(params) => (
                  <TextField 
                      {...params} 
                      label="Section Type" 
                      sx={customInputSx} 
                  />
              )}
            />

            <Autocomplete
              options={[
                {label: 'Category', value: 'category'},
                {label: 'Sub Category', value: 'sub-category'},
                {label: 'Recipe', value: 'recipe'},
                {label: 'Keyword', value: 'keyword'}
              ]}
              getOptionLabel={(option) => option.label}
              value={[
                {label: 'Category', value: 'category'},
                {label: 'Sub Category', value: 'sub-category'},
                {label: 'Recipe', value: 'recipe'},
                {label: 'Keyword', value: 'keyword'}
              ].find(opt => opt.value === formik.values.type) || null}
              onChange={(_, newValue) => {
                  handleFieldChange({ target: { name: 'type', value: newValue ? newValue.value : '' } });
              }}
              disableClearable
              disabled={mode === 'edit' || isLoading || isUpdating}
              slotProps={{ paper: autocompletePaperSx }}
              renderInput={(params) => (
                  <TextField 
                      {...params} 
                      label="Type" 
                      sx={customInputSx} 
                  />
              )}
            />

            {formik.values.type === 'sub-category' && (
                <Autocomplete
                  options={categories?.data || []}
                  getOptionLabel={(option) => option.name}
                  value={categories?.data?.find(c => c.category_id === formik.values.category_id) || null}
                  onChange={(_, newValue) => {
                      handleFieldChange({ target: { name: 'category_id', value: newValue ? newValue.category_id : '' } });
                  }}
                  slotProps={{ paper: autocompletePaperSx }}
                  renderInput={(params) => (
                      <TextField 
                          {...params} 
                          label="Select Category" 
                          error={formik.touched.category_id && Boolean(formik.errors.category_id)}
                          helperText={formik.touched.category_id && formik.errors.category_id}
                          sx={customInputSx} 
                      />
                  )}
                />
            )}

            <TextField
              fullWidth
              label="Position"
              name="position"
              type="number"
              value={formik.values.position}
              onChange={handleFieldChange}
              onBlur={formik.handleBlur}
              required
              disabled={isLoading || isUpdating || !canPublish}
              error={formik.touched.position && Boolean(formik.errors.position)}
              helperText={formik.touched.position ? formik.errors.position : (!canPublish ? 'No permission to change position' : '')}
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
                            Make this section live {!canPublish && "(No Permission)"}
                        </Typography>
                    </Box>
                    <Switch
                      checked={formik.values.is_active}
                      onChange={(_, checked) => {
                        formik.setFieldValue('is_active', checked);
                        setIsFormDirty(true);
                      }}
                      disabled={isLoading || isUpdating || !canPublish}
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

export default AddHomeSectionDialog;

