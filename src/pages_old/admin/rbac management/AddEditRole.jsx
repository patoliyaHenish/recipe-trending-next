"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { 
    Button, 
    TextField, 
    Typography, 
    IconButton, 
    Box, 
    Grid,
    Paper,
    Checkbox,
    FormControlLabel,
    CircularProgress,
    Container
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from '../../../utils/toast';
import { 
    useCreateRoleMutation, 
    useUpdateRoleMutation, 
    useGetAllPermissionsQuery,
    useGetRoleByIdQuery
} from '../../../features/api/rbacApi';
import { useTheme } from '../../../context/ThemeContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Security as SecurityIcon } from "@mui/icons-material";
import { PageHeader } from '../../../components/common';

const AddEditRole = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const mode = id ? 'edit' : 'add';
  const [isFormDirty, setIsFormDirty] = useState(false);
  
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const { data: permissionsData, isLoading: permissionsLoading } = useGetAllPermissionsQuery({ limit: 1000 });
  const { data: roleData, isLoading: roleLoading } = useGetRoleByIdQuery(id, {
    skip: !id,
  });

  const activeRole = mode === 'edit' ? roleData?.data : null;

  useEffect(() => {
    document.title = mode === 'add' ? 'Create Role' : 'Edit Role';
  }, [mode]);

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Role name is required')
      .min(2, 'Role name must be at least 2 characters')
      .max(50, 'Role name must be at most 50 characters'),
    description: Yup.string()
      .max(255, 'Description must be at most 255 characters'),
    permissions: Yup.array().of(Yup.number())
  });

  const formik = useFormik({
    initialValues: {
      name: activeRole?.name ?? '',
      description: activeRole?.description ?? '',
      permissions: activeRole?.permissions?.map(p => p.permission_id) ?? [],
    },
    enableReinitialize: true,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        const payload = {
            name: values.name.trim(),
            description: values.description.trim(),
            permissions: values.permissions
        };

        if (mode === 'add') {
          await createRole(payload).unwrap();
          toast.success('Role created successfully');
          navigate('/manage-roles');
        } else {
          await updateRole({ id, ...payload }).unwrap();
          toast.success('Role updated successfully');
          navigate('/manage-roles');
        }
      } catch (error) {
        toast.error(error?.data?.message || 'Failed to save role');
      }
    },
  });

  const handlePermissionToggle = (permissionId) => {
    const currentPermissions = [...formik.values.permissions];
    const index = currentPermissions.indexOf(permissionId);
    if (index > -1) {
        currentPermissions.splice(index, 1);
    } else {
        currentPermissions.push(permissionId);
    }
    formik.setFieldValue('permissions', currentPermissions);
    setIsFormDirty(true);
  };

  const handleBack = () => {
    navigate('/manage-roles');
  };

  const groupedPermissions = React.useMemo(() => {
    if (!permissionsData?.data) return {};
    return permissionsData.data.reduce((acc, permission) => {
      const parts = permission.name.split('.');
      let category = parts.length > 1 ? parts[0] : 'General';

      if (permission.name.startsWith('recipe.note_') || permission.name.startsWith('recipe.notes_')) {
        category = 'Recipe Notes';
      }
      


      // Group analytics permissions under 'Analytics' title
      if (permission.name === 'user.analytics' || permission.name === 'engagement.analytics') {
        category = 'Analytics';
      }
      
      if (!acc[category]) acc[category] = [];
      acc[category].push(permission);
      return acc;
    }, {});
  }, [permissionsData]);

  if (roleLoading && mode === 'edit') {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );
  }

  return (
    <Box
      className={`transition-all duration-200 flex flex-col pt-2 md:pt-4 pb-4 px-3 mt-[74px]
       min-h-[calc(100vh-74px)]
      w-full max-w-[1200px] xl:max-w-none mx-auto xl:mx-0 xl:w-auto`}
    >
      <Box className="flex items-center gap-3 mb-4">
        <IconButton onClick={handleBack} sx={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}>
          <ArrowBackIcon />
        </IconButton>
        <PageHeader title={mode === 'add' ? 'Create New Role' : `Edit Role: ${activeRole?.name}`} />
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, md: 4 }, 
          borderRadius: 0,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          color: isDarkMode ? '#e5e7eb' : '#374151',
          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
        }}
      >
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Role Name"
                name="name"
                value={formik.values.name}
                onChange={(e) => {
                  formik.handleChange(e);
                  setIsFormDirty(true);
                }}
                onBlur={formik.handleBlur}
                required
                disabled={isUpdating || (mode === 'edit' && activeRole?.name === 'admin')}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: isDarkMode ? '#e5e7eb' : '#374151',
                    borderRadius: '4px',
                    '& fieldset': { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                    '&:hover fieldset': { borderColor: isDarkMode ? '#6b7280' : '#9ca3af' },
                  },
                  '& .MuiInputLabel-root': { color: isDarkMode ? '#d1d5db' : '#6b7280' },
                }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
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
                rows={1}
                disabled={isUpdating}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: isDarkMode ? '#e5e7eb' : '#374151',
                    borderRadius: '4px',
                    '& fieldset': { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                    '&:hover fieldset': { borderColor: isDarkMode ? '#6b7280' : '#9ca3af' },
                  },
                  '& .MuiInputLabel-root': { color: isDarkMode ? '#d1d5db' : '#6b7280' },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon sx={{ color: isDarkMode ? '#10b981' : '#059669' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Assign Permissions
                </Typography>
              </Box>
              
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  bgcolor: isDarkMode ? '#374151' : '#f9fafb', 
                  borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                  borderRadius: '4px'
                }}
              >
                {permissionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <Box key={category} sx={{ mb: 4, '&:last-child': { mb: 0 } }}>
                      <Typography variant="subtitle2" sx={{ 
                        mb: 2, 
                        textTransform: 'uppercase', 
                        letterSpacing: 1.5, 
                        color: isDarkMode ? '#10b981' : '#059669',
                        fontWeight: 700,
                        borderBottom: `2px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
                        pb: 0.5,
                        display: 'inline-block'
                      }}>
                        {category}
                      </Typography>
                      <Grid container spacing={2}>
                        {permissions.map(permission => (
                          <Grid item xs={12} sm={6} md={4} lg={3} key={permission.permission_id}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'flex-start',
                                bgcolor: formik.values.permissions.includes(permission.permission_id)
                                  ? (isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.05)')
                                  : 'transparent',
                                border: `1px solid ${formik.values.permissions.includes(permission.permission_id)
                                  ? (isDarkMode ? '#10b981' : '#059669')
                                  : (isDarkMode ? '#4b5563' : '#e5e7eb')}`,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  borderColor: isDarkMode ? '#10b981' : '#059669',
                                }
                              }}
                            >
                              <FormControlLabel
                                control={
                                  <Checkbox 
                                    checked={formik.values.permissions.includes(permission.permission_id)}
                                    onChange={() => handlePermissionToggle(permission.permission_id)}
                                    size="small"
                                    sx={{
                                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                                      '&.Mui-checked': { color: isDarkMode ? '#10b981' : '#059669' },
                                      mt: -1
                                    }}
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#374151' }}>
                                      {permission.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', lineHeight: 1.2, mt: 0.5 }}>
                                      {permission.description}
                                    </Typography>
                                  </Box>
                                }
                                sx={{ margin: 0, width: '100%', alignItems: 'flex-start' }}
                              />
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))
                )}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                <Button
                  onClick={handleBack}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 0,
                    borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                    color: isDarkMode ? '#e5e7eb' : '#374151',
                    px: 4
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    isCreating || isUpdating ||
                    (mode === 'add' ? !formik.values.name.trim() : !isFormDirty)
                  }
                  sx={{
                    backgroundColor: mode === 'edit' ? (isDarkMode ? '#3b82f6' : '#2563eb') : (isDarkMode ? '#10b981' : '#059669'),
                    '&:hover': {
                      backgroundColor: mode === 'edit' ? (isDarkMode ? '#2563eb' : '#1d4ed8') : (isDarkMode ? '#059669' : '#047857'),
                    },
                    borderRadius: 0,
                    px: 6
                  }}
                >
                  {isCreating || isUpdating ? 'Saving...' : mode === 'edit' ? 'Update Role' : 'Create Role'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AddEditRole;

