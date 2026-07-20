"use client";
import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, IconButton, Box, FormControl, Autocomplete, CircularProgress, useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from '../../../utils/toast';
import { useTheme } from '../../../context/ThemeContext';
import { useCreatePaymentSlipMutation, useUpdatePaymentSlipByIdMutation } from '../../../features/api/paymentSlipApi';
import CloseIcon from '@mui/icons-material/Close';

const statusOptions = ['pending', 'approved', 'rejected', 'paid'];
const paymentModeOptions = ['cash', 'gpay', 'paytm', 'phonepay'];

const validationSchema = Yup.object().shape({
  user_id: Yup.number()
    .typeError('User must be a number')
    .nullable()
    .integer('User must be an integer')
    .positive('User must be greater than zero'),
  rate: Yup.number()
    .typeError('Rate must be a number')
    .nullable()
    .min(0, 'Rate cannot be negative'),
  admin_approved_count: Yup.number()
    .typeError('Approved count must be a number')
    .nullable()
    .integer('Approved count must be an integer')
    .min(0, 'Approved count cannot be negative'),
  payment_date: Yup.string().nullable(),
  status: Yup.string().nullable().oneOf(statusOptions, 'Choose a valid status'),
  payment_mode: Yup.string().nullable().max(80, 'Payment mode must be at most 80 characters'),
  details: Yup.string().nullable(),
});

const defaultValues = {
  user_id: '',
  created_by: '',
  rate: '',
  admin_approved_count: '',
  payment_date: '',
  status: 'pending',
  payment_mode: '',
  details: '',
};

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

const userLabel = (user) => {
  if (!user) return '-';
  return `${user.name || 'Unknown'} (${user.email || 'no-email'})`;
};

const AddPaymentSlipDialog = ({ open, onClose, mode = 'add', paymentSlip = null, users = [] }) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [createPaymentSlip, { isLoading: isCreating }] = useCreatePaymentSlipMutation();
  const [updatePaymentSlip, { isLoading: isUpdating }] = useUpdatePaymentSlipByIdMutation();

  const formik = useFormik({
    initialValues: {
      user_id: paymentSlip?.user_id ?? '',
      created_by: paymentSlip?.created_by ?? '',
      rate: paymentSlip?.rate ?? '',
      admin_approved_count: paymentSlip?.admin_approved_count ?? '',
      payment_date: paymentSlip?.payment_date ?? '',
      status: paymentSlip?.status ?? 'pending',
      payment_mode: paymentSlip?.payment_mode ?? '',
      details: paymentSlip?.details ?? '',
    },
    enableReinitialize: true,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        const computedTotalAmount = Number(values.rate || 0) * Number(values.admin_approved_count || 0);
        const payload = {
          user_id: values.user_id === '' ? null : Number(values.user_id),
          rate: values.rate === '' ? null : Number(values.rate),
          total_amount: computedTotalAmount,
          admin_approved_count: values.admin_approved_count === '' ? null : Number(values.admin_approved_count),
          payment_date: values.payment_date || null,
          status: values.status || null,
          payment_mode: values.payment_mode?.trim() || null,
          details: values.details?.trim() || null,
        };

        if (mode === 'edit' && paymentSlip?.id) {
          await updatePaymentSlip({ id: paymentSlip.id, inputData: { ...payload, created_by: values.created_by === '' ? null : Number(values.created_by) } }).unwrap();
          toast.success('Payment slip updated successfully');
        } else {
          await createPaymentSlip(payload).unwrap();
          toast.success('Payment slip created successfully');
        }

        handleClose();
      } catch (error) {
        toast.error(error?.data?.message || 'Failed to save payment slip');
      }
    },
  });

  const { setValues, resetForm } = formik;

  useEffect(() => {
    if (open) {
      setIsFormDirty(false);
      setValues({
        user_id: paymentSlip?.user_id ?? '',
        created_by: paymentSlip?.created_by ?? '',
        rate: paymentSlip?.rate ?? '',
        admin_approved_count: paymentSlip?.admin_approved_count ?? '',
        payment_date: paymentSlip?.payment_date ?? '',
        status: paymentSlip?.status ?? 'pending',
        payment_mode: paymentSlip?.payment_mode ?? '',
        details: paymentSlip?.details ?? '',
      });
    }
  }, [open, paymentSlip, setValues]);

  const handleClose = () => {
    setIsFormDirty(false);
    resetForm({ values: defaultValues });
    onClose();
  };

  const title = mode === 'edit' ? 'Edit Payment Slip' : 'Add Payment Slip';
  const computedTotalAmount = Number(formik.values.rate || 0) * Number(formik.values.admin_approved_count || 0);

  const getTextFieldSx = (hasError = false) => ({
    '& .MuiOutlinedInput-root': {
      color: isDarkMode ? '#e2e8f0' : '#5e5873',
      backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#ffffff',
      borderRadius: '6px',
      transition: 'all 0.2s ease-in-out',
      '& fieldset': {
        borderColor: hasError ? '#ea5455' : (isDarkMode ? '#334155' : '#d8d6de'),
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: hasError ? '#ea5455' : (isDarkMode ? '#475569' : '#b4b7bd'),
      },
      '&.Mui-focused fieldset': {
          borderColor: hasError ? '#ea5455' : '#7367f0',
          borderWidth: '1px',
      },
      '&.Mui-focused': {
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
      },
    },
    '& .MuiInputLabel-root': {
      color: hasError ? '#ea5455' : (isDarkMode ? '#94a3b8' : '#b4b7bd'),
      '&.Mui-focused': {
          color: hasError ? '#ea5455' : '#7367f0',
      }
    },
    '& .MuiFormHelperText-root': {
      color: hasError ? '#ea5455' : (isDarkMode ? '#9ca3af' : '#5e5873'),
    },
  });

  const autocompleteSx = {
    "& .MuiAutocomplete-clearIndicator": { color: isDarkMode ? "#9ca3af" : "#b4b7bd" },
    "& .MuiAutocomplete-popupIndicator": { color: isDarkMode ? "#9ca3af" : "#b4b7bd" },
    "& .MuiAutocomplete-loading": {
      backgroundColor: isDarkMode ? "#23272f" : "#ffffff",
      color: isDarkMode ? "#e5e7eb" : "#5e5873",
    },
    "& .MuiAutocomplete-option": {
      backgroundColor: isDarkMode ? "#23272f" : "#ffffff",
      color: isDarkMode ? "#e5e7eb" : "#5e5873",
      '&[aria-selected="true"]': {
        backgroundColor: isDarkMode ? "#374151" : "rgba(115, 103, 240, 0.12)",
        color: isDarkMode ? "#ffffff" : "#7367f0",
      },
      "&.Mui-focused": {
        backgroundColor: isDarkMode ? "#374151" : "#f8f8f8",
      },
      "&:hover": {
        backgroundColor: isDarkMode ? "#374151" : "#f8f8f8",
      },
    },
  };

  const autocompleteSlotProps = {
    paper: {
      sx: {
        backgroundColor: isDarkMode ? "#23272f" : "#ffffff",
        color: isDarkMode ? "#e5e7eb" : "#5e5873",
        borderRadius: "4px",
        border: `1px solid ${isDarkMode ? "#4b5563" : "#d8d6de"}`,
        boxShadow: isDarkMode
          ? "0 10px 40px rgba(0,0,0,0.45)"
          : "0 10px 40px rgba(0,0,0,0.08)",
      },
    },
  };

  return (
    <Dialog
      key={`payment-slip-dialog-${open}`}
      open={open}
      onClose={handleClose}
      PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
            borderRadius: isMobile ? 0 : '16px',
            boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            backgroundImage: 'none',
            border: isDarkMode ? '1px solid #1e293b' : 'none',
          },
      }}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
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
              <Typography 
                  variant="h5" 
                  sx={{ 
                      fontWeight: 700, 
                      color: isDarkMode ? '#e2e8f0' : '#1e293b', 
                      letterSpacing: '0.5px',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
              >
                  {title}
              </Typography>
          </Box>
          <IconButton 
              onClick={handleClose}
              size="small"
              sx={{ 
                  color: isDarkMode ? '#94a3b8' : '#b4b7bd',
                  backgroundColor: isDarkMode ? '#1e293b' : 'transparent',
                  '&:hover': {
                      backgroundColor: isDarkMode ? '#334155' : '#f8f8f8',
                      color: isDarkMode ? '#f8fafc' : '#5e5873',
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
          <>
            <Autocomplete
              fullWidth
              options={users}
              getOptionLabel={(opt) => userLabel(opt)}
              isOptionEqualToValue={(a, b) => Number(a?.user_id) === Number(b?.user_id)}
              value={users.find(u => Number(u.user_id) === Number(formik.values.user_id)) || null}
              onChange={(_, v) => {
                formik.setFieldValue("user_id", v?.user_id ?? '');
                setIsFormDirty(true);
              }}
              onBlur={formik.handleBlur}
              disabled={isCreating || isUpdating}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="user_id"
                  label="User"
                  margin="none"
                  error={Boolean(formik.touched.user_id && formik.errors.user_id)}
                  helperText={formik.touched.user_id && formik.errors.user_id}
                  sx={getTextFieldSx(Boolean(formik.touched.user_id && formik.errors.user_id))}
                />
              )}
              sx={autocompleteSx}
              slotProps={autocompleteSlotProps}
            />

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch', mt: 1 }}>
              <TextField
                fullWidth
                type="number"
                name="rate"
                label="Rate"
                value={formik.values.rate}
                onChange={(e) => {
                  formik.handleChange(e);
                  setIsFormDirty(true);
                }}
                onBlur={formik.handleBlur}
                margin="none"
                disabled={isCreating || isUpdating}
                error={formik.touched.rate && Boolean(formik.errors.rate)}
                helperText={formik.touched.rate && formik.errors.rate}
                sx={{ ...getTextFieldSx(Boolean(formik.touched.rate && formik.errors.rate)), flex: 1 }}
              />

              <TextField
                fullWidth
                type="number"
                name="admin_approved_count"
                label="Admin Approved Count"
                value={formik.values.admin_approved_count}
                onChange={(e) => {
                  formik.handleChange(e);
                  setIsFormDirty(true);
                }}
                onBlur={formik.handleBlur}
                margin="none"
                disabled={isCreating || isUpdating}
                error={formik.touched.admin_approved_count && Boolean(formik.errors.admin_approved_count)}
                helperText={formik.touched.admin_approved_count && formik.errors.admin_approved_count}
                sx={{ ...getTextFieldSx(Boolean(formik.touched.admin_approved_count && formik.errors.admin_approved_count)), flex: 1 }}
              />
            </Box>

            <TextField
              fullWidth
              type="date"
              name="payment_date"
              label="Payment Date"
              InputLabelProps={{ shrink: true }}
              value={formik.values.payment_date}
              onChange={(e) => {
                formik.handleChange(e);
                setIsFormDirty(true);
              }}
              onBlur={formik.handleBlur}
              margin="none"
              disabled={isCreating || isUpdating}
              error={formik.touched.payment_date && Boolean(formik.errors.payment_date)}
              helperText={formik.touched.payment_date && formik.errors.payment_date}
              sx={{ ...getTextFieldSx(Boolean(formik.touched.payment_date && formik.errors.payment_date)), mt: 1 }}
            />

            <Autocomplete
              fullWidth
              options={statusOptions}
              getOptionLabel={(opt) => opt.charAt(0).toUpperCase() + opt.slice(1)}
              isOptionEqualToValue={(a, b) => a === b}
              value={formik.values.status || null}
              onChange={(_, v) => {
                formik.setFieldValue("status", v || 'pending');
                setIsFormDirty(true);
              }}
              onBlur={formik.handleBlur}
              disabled={isCreating || isUpdating}
              disableClearable
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="status"
                  label="Status"
                  margin="none"
                  error={Boolean(formik.touched.status && formik.errors.status)}
                  helperText={formik.touched.status && formik.errors.status}
                  sx={getTextFieldSx(Boolean(formik.touched.status && formik.errors.status))}
                />
              )}
              sx={{ ...autocompleteSx, mt: 1 }}
              slotProps={autocompleteSlotProps}
            />

            <Autocomplete
              fullWidth
              options={paymentModeOptions}
              getOptionLabel={(opt) => opt.charAt(0).toUpperCase() + opt.slice(1)}
              isOptionEqualToValue={(a, b) => a === b}
              value={formik.values.payment_mode || null}
              onChange={(_, v) => {
                formik.setFieldValue("payment_mode", v || '');
                setIsFormDirty(true);
              }}
              onBlur={formik.handleBlur}
              disabled={isCreating || isUpdating}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="payment_mode"
                  label="Payment Mode"
                  margin="none"
                  error={Boolean(formik.touched.payment_mode && formik.errors.payment_mode)}
                  helperText={formik.touched.payment_mode && formik.errors.payment_mode}
                  sx={getTextFieldSx(Boolean(formik.touched.payment_mode && formik.errors.payment_mode))}
                />
              )}
              sx={{ ...autocompleteSx, mt: 1 }}
              slotProps={autocompleteSlotProps}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              name="details"
              label="Details"
              value={formik.values.details}
              onChange={(e) => {
                formik.handleChange(e);
                setIsFormDirty(true);
              }}
              onBlur={formik.handleBlur}
              margin="none"
              disabled={isCreating || isUpdating}
              error={formik.touched.details && Boolean(formik.errors.details)}
              helperText={formik.touched.details && formik.errors.details}
              sx={{ ...getTextFieldSx(Boolean(formik.touched.details && formik.errors.details)), mt: 1 }}
            />

            <Box
              sx={{
                mt: 0.5,
                p: 2,
                border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
                borderRadius: '4px',
                backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
              }}
            >
              <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block' }}>
                Total Amount (Rate × Admin Approved Count)
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                {moneyFormatter.format(computedTotalAmount)}
              </Typography>
            </Box>
          </>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            borderTop: isDarkMode ? '1px solid #1e293b' : 'none',
            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
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
                color: isDarkMode ? '#94a3b8' : '#b4b7bd',
                borderColor: isDarkMode ? '#334155' : '#d8d6de',
                '&:hover': {
                    borderColor: isDarkMode ? '#475569' : '#b4b7bd',
                    backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.2)' : 'rgba(34, 41, 47, 0.04)',
                    color: isDarkMode ? '#94a3b8' : '#5e5873',
                }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isCreating || isUpdating}
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
                "&:disabled": {
                  backgroundColor: isDarkMode ? "#6b7280" : "#d8d6de",
                  color: isDarkMode ? "#9ca3af" : "#b4b7bd",
                },
            }}
          >
            {(isCreating || isUpdating)
              ? <CircularProgress size={16} color="inherit" />
              : (mode === 'edit' ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddPaymentSlipDialog;

