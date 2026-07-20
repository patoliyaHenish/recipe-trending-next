"use client";

import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    Typography, 
    IconButton, 
    Box
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from '../../../utils/toast';
import { useCreatePermissionMutation, useUpdatePermissionMutation } from '../../../features/api/rbacApi';
import { useTheme } from '../../../context/ThemeContext';
import CloseIcon from '@mui/icons-material/Close';
import { Key as KeyIcon } from "@mui/icons-material";

const PermissionDialog = ({
  open,
  onClose,
  mode = 'add',
  permissionId = null,
  permission = null,
}) => {
  const { isDarkMode } = useTheme();
  const [isFormDirty, setIsFormDirty] = useState(false);
  
  const [createPermission, { isLoading: isCreating }] = useCreatePermissionMutation();
  const [updatePermission, { isLoading: isUpdating }] = useUpdatePermissionMutation();

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Permission name is required')
      .min(2, 'Permission name must be at least 2 characters')
      .max(50, 'Permission name must be at most 50 characters')
      .matches(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores are allowed'),
    description: Yup.string()
      .max(255, 'Description must be at most 255 characters'),
  });

  const formik = useFormik({
    initialValues: {
      name: mode === 'edit' ? (permission?.name ?? '') : '',
      description: mode === 'edit' ? (permission?.description ?? '') : '',
    },
    enableReinitialize: true,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        const payload = {
            name: values.name.trim(),
            description: values.description.trim()
        };

        if (mode === 'add') {
          await createPermission(payload).unwrap();
          toast.success('Permission created successfully');
          onClose();
        } else {
          await updatePermission({ id: permissionId, ...payload }).unwrap();
          toast.success('Permission updated successfully');
          onClose();
        }
      } catch (error) {
        toast.error(error?.data?.message || 'Failed to save permission');
      }
    },
  });

  useEffect(() => {
    if (open) {
        setIsFormDirty(false);
    }
  }, [open]);

  const handleClose = () => {
    onClose();
    setIsFormDirty(false);
    formik.resetForm();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderRadius: 0,
        },
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        sx={{
          color: isDarkMode ? '#e5e7eb' : '#374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
          borderBottom: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <KeyIcon />
            <Typography variant="h6">{mode === 'add' ? 'Add Permission' : 'Edit Permission'}</Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent
          sx={{
            color: isDarkMode ? '#e5e7eb' : '#374151',
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
            py: 3,
          }}
        >
            <TextField
              fullWidth
              label="Permission Name"
              name="name"
              placeholder="e.g., manage_users"
              value={formik.values.name}
              onChange={(e) => {
                formik.handleChange(e);
                setIsFormDirty(true);
              }}
              onBlur={formik.handleBlur}
              margin="normal"
              required
              disabled={isUpdating}
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
              margin="normal"
              multiline
              rows={3}
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
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
            borderTop: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
          }}
        >
          <Button
            onClick={handleClose}
            sx={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
          >
            Cancel
          </Button>
          <Button
            onClick={formik.handleSubmit}
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
              borderRadius: 0
            }}
          >
            {isCreating || isUpdating ? 'Saving...' : mode === 'edit' ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PermissionDialog;

