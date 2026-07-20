"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, Button, Paper, CircularProgress, Box, InputAdornment, IconButton, FormControl, InputLabel, OutlinedInput, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { toast } from '../utils/toast';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import { useResetPasswordMutation } from '../features/api/authApi';

import { useTheme } from '../context/ThemeContext';

const resetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .required('New password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .matches(/[@$!%*?&#]/, 'Must contain at least one special character'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm your new password'),
});

const ResetPassword = () => {
  const { email, token } = useParams();
  const router = useRouter();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isDarkMode } = useTheme();

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleReset = async (values, { setSubmitting }) => {
    try {
      const res = await resetPassword({ email, token, newPassword: values.newPassword }).unwrap();
      toast.success(res.message || 'Password reset successful!');
      router.push('/?login=true');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reset password');
    }
    setSubmitting(false);
  };

  const textFieldStyles = {
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
        borderColor: '#F97C1B',
        borderWidth: '2px',
      },
      '&.Mui-focused': {
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
      }
    },
    '& .MuiInputLabel-root': {
      color: isDarkMode ? '#94a3b8' : '#64748b',
      '&.Mui-focused': {
        color: '#F97C1B',
      }
    },
    '& .MuiFormHelperText-root': {
      color: '#ef4444',
      marginLeft: '4px',
      marginTop: '4px',
    },
  };

  return (
    <Box className="min-h-screen flex items-center justify-center px-2 sm:px-4">
      <Paper
        elevation={6}
        className="w-full max-w-md p-8 rounded-[18px]"
        sx={{
          bgcolor: isDarkMode ? 'var(--bg-secondary)' : '#ffffff',
          color: isDarkMode ? 'var(--text-primary)' : '#000000',
          border: isDarkMode ? '1px solid var(--border-color)' : '1px solid #e5e7eb',
        }}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
        <Formik
          initialValues={{ newPassword: '', confirmPassword: '' }}
          validationSchema={resetPasswordSchema}
          onSubmit={handleReset}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
            <Form className="flex flex-col gap-4" noValidate>
              <FormControl fullWidth variant="outlined" sx={textFieldStyles} error={touched.newPassword && Boolean(errors.newPassword)}>
                <InputLabel htmlFor="new-password">New Password</InputLabel>
                <OutlinedInput
                  id="new-password"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={values.newPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  label="New Password"
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle new password visibility"
                        onClick={() => setShowNewPassword((show) => !show)}
                        edge="end"
                        sx={{ color: '#F97C1B' }}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {touched.newPassword && errors.newPassword && (
                  <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                    {errors.newPassword}
                  </Typography>
                )}
              </FormControl>
              <FormControl fullWidth variant="outlined" sx={textFieldStyles} error={touched.confirmPassword && Boolean(errors.confirmPassword)}>
                <InputLabel htmlFor="confirm-password">Confirm Password</InputLabel>
                <OutlinedInput
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  label="Confirm Password"
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword((show) => !show)}
                        edge="end"
                        sx={{ color: '#F97C1B' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                    {errors.confirmPassword}
                  </Typography>
                )}
              </FormControl>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading || isSubmitting}
                sx={{
                  height: 56,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  bgcolor: '#F97C1B',
                  color: '#FFF8ED',
                  borderRadius: 0,
                  '&:hover': { bgcolor: '#FFB15E', color: '#3B2200' },
                }}
              >
                {isLoading || isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Update'}
              </Button>
            </Form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};
export default ResetPassword;
