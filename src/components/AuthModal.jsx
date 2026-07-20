"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextField, Button, Paper, Tabs, Tab, Box, CircularProgress,
  InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Typography, FormControl, InputLabel, OutlinedInput
} from '@mui/material';
import { Visibility, VisibilityOff, Close, Google, PersonAddOutlined, LockOutlined } from '@mui/icons-material';
import { useRegisterUserMutation, useLoginUserMutation, useForgetPasswordMutation, useMyProfileQuery } from '../features/api/authApi';
import { FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { toast } from '../utils/toast';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/useUser';
import { MarkEmailRead } from '@mui/icons-material';
import Cookies from 'js-cookie';

const registerSchema = Yup.object().shape({
  name: Yup.string().required('Name is required').max(255),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[@$!%*?&#]/, 'Password must contain at least one special character'),
});

const loginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required').min(6),
});

const AuthModal = ({ open, onClose }) => {
  const [tab, setTab] = useState(1);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [shouldFetchProfile, setShouldFetchProfile] = useState(false);
  const [registerPreference, setRegisterPreference] = useState(['all']);

  const { isDarkMode } = useTheme();

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
    '& .MuiSelect-icon': {
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    '& .MuiTypography-root': {
      color: isDarkMode ? '#e2e8f0' : '#1e293b',
    }
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState("We've sent a verification link to your email address.");

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const prevOpenRef = useRef(open);

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (open && !wasOpen) {
      setShowSuccess(false);
      setSuccessMessage("We've sent a verification link to your email address.");
      setTab(1);
    } else if (!open && wasOpen) {
      setShowSuccess(false);
      setSuccessMessage("We've sent a verification link to your email address.");
      setTab(1);
    }
  }, [open]);

  const [registerUser, { isLoading: regLoading }] = useRegisterUserMutation();
  const [loginUser, { isLoading: loginLoading }] = useLoginUserMutation();
  const [forgetPassword, { isLoading: forgetLoading }] = useForgetPasswordMutation();

  const { user, setUser, refetch } = useUser();
  const token = typeof window !== 'undefined' ? Cookies.get('token') : null;
  const { data: profileData, isSuccess: profileSuccess } = useMyProfileQuery(undefined, {
    skip: !token
  });

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleGoogleLogin = () => {
    try {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
    } catch {
      toast.error("Failed to initiate Google login");
    }
  };


  const handleRegister = async (values, { setSubmitting, resetForm }) => {
    try {
      const sanitizedPreference = Array.from(
        new Set(
          (registerPreference || []).filter((pref) =>
            ['all', 'veg', 'egg'].includes(pref)
          )
        )
      );
      const registerData = {
        name: values.name,
        email: values.email,
        password: values.password,
        preference: sanitizedPreference.length > 0 ? sanitizedPreference : ['all'],
      };
      const res = await registerUser(registerData).unwrap();

      if (res.user) {
        setUser(res.user);
        refetch(); // Fetch full profile after registration
      }

      setSuccessMessage("We've sent a verification link to your email address.");
      setShowSuccess(true);
      resetForm();
    } catch (err) {
      toast.error(err?.data?.message || "Registration failed");
    }
    setSubmitting(false);
  };

  const handleLogin = async (values, { setSubmitting }) => {
    try {
      const res = await loginUser(values).unwrap();

      if (res.user) {
        setUser(res.user);
      }

      // Force immediate profile API call
      refetch();

      toast.success(res.message || "Login successful!");
      onClose();
    } catch (err) {
      if (err?.data?.isUnverified) {
        setSuccessMessage(err?.data?.message || "Account not verified. A new verification link has been sent to your email.");
        setShowSuccess(true);
      } else {
        toast.error(err?.data?.message || "Login failed");
      }
    }
    setSubmitting(false);
  };

  useEffect(() => {
    if (profileSuccess && profileData?.user) {
      setUser(profileData.user);
      setShouldFetchProfile(false);
    }
  }, [profileSuccess, profileData, setUser]);

  const handleClose = useCallback(() => {
    setTab(1);
    setShowSuccess(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (user && open) {
      handleClose();
    }
  }, [user, open, handleClose]);



  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth={true}
        disableScrollLock={true}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }
        }}
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            overflow: 'auto',
            width: '100%',
            maxWidth: { xs: '95vw', sm: '420px', md: '440px' },
            bgcolor: isDarkMode ? 'var(--bg-secondary)' : '#ffffff',
            backgroundImage: isDarkMode ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)' : 'none',
            color: isDarkMode ? 'var(--text-primary)' : '#000000',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
            boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            borderRadius: '24px',
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          pb: 1,
          pt: 2,
          px: 3,
        }}>
          <IconButton onClick={handleClose} size="small" sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb', transform: 'rotate(90deg)' }
          }}>
            <Close sx={{ color: isDarkMode ? '#fff' : '#222', fontSize: '1.2rem' }} />
          </IconButton>

        </DialogTitle>

        <DialogContent sx={{ p: 0, fontFamily: "'Basic', sans-serif !important" }}>
          <Box sx={{ px: 4, pb: 4, pt: 1, fontFamily: "'Basic', sans-serif !important" }}>
            {showSuccess ? (
              <Box className="flex flex-col items-center justify-center py-8 text-center">
                <Box sx={{
                  width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(249, 124, 27, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3
                }}>
                  <MarkEmailRead sx={{ fontSize: 40, color: '#F97C1B' }} />
                </Box>
                <Typography variant="h5" sx={{ mb: 2, color: isDarkMode ? 'var(--text-primary)' : '#111827', fontFamily: "'Basic', sans-serif !important" }}>
                  Check your Email
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, color: isDarkMode ? 'var(--text-secondary)' : '#4b5563', fontFamily: "'Basic', sans-serif !important" }}>
                  {successMessage}
                </Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? 'var(--text-muted)' : '#6b7280', fontFamily: "'Basic', sans-serif !important" }}>
                  Please check your inbox and click the link to verify your account.
                </Typography>
              </Box>
            ) : (
              <>
                <Tabs
                  value={tab}
                  onChange={handleTabChange}
                  centered
                  variant="fullWidth"
                  sx={{
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f3f4f6',
                    '& .MuiTabs-indicator': {
                      display: 'none',
                    },
                    borderRadius: '8px',
                    p: 0.5,
                    mb: 3,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    '& .MuiTab-root': {
                      color: isDarkMode ? 'var(--text-secondary)' : '#6b7280',

                      textTransform: 'none',
                      borderRadius: '6px',
                      minHeight: '40px',
                      fontSize: '0.95rem',
                      transition: 'all 0.3s ease',
                      fontFamily: "'Basic', sans-serif !important"
                    },
                    '& .Mui-selected': {
                      color: isDarkMode ? '#ffffff !important' : '#111827 !important',
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#ffffff',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                    },
                  }}
                >
                  <Tab label="Sign Up" />
                  <Tab label="Login" />
                </Tabs>

                <Box hidden={tab !== 0}>
                  <Formik
                    initialValues={{ name: '', email: '', password: '' }}
                    validationSchema={registerSchema}
                    onSubmit={handleRegister}
                  >
                    {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
                      <Form className="flex flex-col gap-4" style={{ fontFamily: "'Basic', sans-serif" }}>

                        <TextField
                          label="Name"
                          name="name"
                          value={values.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.name && Boolean(errors.name)}
                          helperText={touched.name && errors.name}
                          fullWidth
                          variant="outlined"
                          size="medium"
                          sx={customInputSx}
                        />
                        <TextField
                          label="Email"
                          name="email"
                          type="email"
                          value={values.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.email && Boolean(errors.email)}
                          helperText={touched.email && errors.email}
                          fullWidth
                          variant="outlined"
                          size="medium"
                          sx={customInputSx}
                        />
                        <FormControl fullWidth variant="outlined" sx={customInputSx} error={touched.password && Boolean(errors.password)}>
                          <InputLabel htmlFor="register-password">Password</InputLabel>
                          <OutlinedInput
                            id="register-password"
                            name="password"
                            type={showRegisterPassword ? "text" : "password"}
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            label="Password"
                            endAdornment={
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={() => setShowRegisterPassword((show) => !show)}
                                  edge="end"
                                  sx={{ color: '#F97C1B' }}
                                >
                                  {showRegisterPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            }
                          />
                          {touched.password && errors.password && (
                            <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                              {errors.password}
                            </Typography>
                          )}
                        </FormControl>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ mb: 1, color: isDarkMode ? 'var(--text-primary)' : '#374151', fontFamily: "'Basic', sans-serif" }}>Food Preference</Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            {['all', 'veg', 'egg'].map(pref => {
                              const isChecked = registerPreference.includes(pref);
                              return (
                                <Box
                                  key={pref}
                                  onClick={() => {
                                    if (pref === 'all') {
                                      setRegisterPreference(['all']);
                                    } else {
                                      let next = registerPreference.filter(v => v !== 'all');
                                      if (isChecked) next = next.filter(v => v !== pref);
                                      else next = [...next, pref];
                                      if (next.length === 0) next = ['all'];
                                      setRegisterPreference(next);
                                    }
                                  }}
                                  sx={{
                                    flex: 1,
                                    py: 1,
                                    textAlign: 'center',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: isChecked ? '#F97C1B' : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'),
                                    bgcolor: isChecked ? 'rgba(249, 124, 27, 0.1)' : (isDarkMode ? 'rgba(255,255,255,0.02)' : '#f9fafb'),
                                    color: isChecked ? '#F97C1B' : (isDarkMode ? 'var(--text-secondary)' : '#6b7280'),
                                    textTransform: 'capitalize',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {pref}
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>

                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          sx={{
                            mt: 2,
                            bgcolor: '#F97C1B',
                            color: '#ffffff',
                            borderRadius: '8px',
                            boxShadow: 'none',
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#e86a0b', boxShadow: 'none', transform: 'translateY(-1px)' },
                            height: 48,
                            fontSize: '1.05rem',
                            transition: 'all 0.2s ease',
                          }}
                          disabled={regLoading || isSubmitting}
                        >
                          {regLoading || isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                        </Button>
                      </Form>
                    )}
                  </Formik>

                </Box>

                <Box hidden={tab !== 1}>
                  <Formik
                    initialValues={{ email: '', password: '' }}
                    validationSchema={loginSchema}
                    onSubmit={handleLogin}
                  >
                    {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
                      <Form className="flex flex-col gap-4">
                        <TextField
                          label="Email"
                          name="email"
                          type="email"
                          value={values.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.email && Boolean(errors.email)}
                          helperText={touched.email && errors.email}
                          fullWidth
                          variant="outlined"
                          size="medium"
                          sx={customInputSx}
                        />
                        <FormControl fullWidth variant="outlined" sx={customInputSx} error={touched.password && Boolean(errors.password)}>
                          <InputLabel htmlFor="login-password">Password</InputLabel>
                          <OutlinedInput
                            id="login-password"
                            name="password"
                            type={showLoginPassword ? "text" : "password"}
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            label="Password"
                            endAdornment={
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={() => setShowLoginPassword((show) => !show)}
                                  edge="end"
                                  sx={{ color: '#F97C1B' }}
                                >
                                  {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            }
                          />
                          {touched.password && errors.password && (
                            <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                              {errors.password}
                            </Typography>
                          )}
                        </FormControl>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                          <Button
                            type="button"
                            onClick={() => { onClose(); router.push('/forgot-password'); }}
                            sx={{ color: '#F97C1B', textTransform: 'none', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                            disableRipple
                          >
                            Forgot Password?
                          </Button>
                        </Box>

                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          sx={{
                            bgcolor: '#F97C1B',
                            color: '#ffffff',
                            borderRadius: '8px',
                            boxShadow: 'none',
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#e86a0b', boxShadow: 'none', transform: 'translateY(-1px)' },
                            height: 48,
                            fontSize: '1.05rem',
                            transition: 'all 0.2s ease',
                          }}
                          disabled={loginLoading || isSubmitting}
                        >
                          {loginLoading || isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                        </Button>
                      </Form>
                    )}
                  </Formik>
                </Box>

                {!showSuccess && (
                  <Box className="flex flex-col gap-3 mt-6">
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2 }}>
                      <Box sx={{ flex: 1, height: '1px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }} />
                      <Typography variant="body2" sx={{
                        color: isDarkMode ? 'var(--text-secondary)' : '#6b7280',
                        fontSize: '0.85rem',
                      }}>
                        Or continue with
                      </Typography>
                      <Box sx={{ flex: 1, height: '1px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }} />
                    </Box>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                        color: isDarkMode ? 'var(--text-primary)' : '#374151',
                        borderRadius: '8px',
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
                        textTransform: 'none',
                        fontSize: '1rem',
                        display: 'flex',
                        gap: 1.5,
                        '&:hover': {
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#d1d5db',
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb',
                        },
                        height: 48,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      onClick={handleGoogleLogin}
                    >
                      <Box
                        component="img"
                        src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                        alt="Google Logo"
                        sx={{ height: 20, width: 20 }}
                      />
                      Continue with Google
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthModal;



