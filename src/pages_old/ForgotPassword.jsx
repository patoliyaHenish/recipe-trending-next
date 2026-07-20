"use client";
import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress,
  IconButton
} from '@mui/material';
import { ArrowBack, MarkEmailRead } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useForgetPasswordMutation } from '../features/api/authApi';
import { toast } from '../utils/toast';
import { useTheme } from '../context/ThemeContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [forgetPassword, { isLoading }] = useForgetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await forgetPassword({ email }).unwrap();
      setShowSuccess(true);
      toast.success('Reset link sent successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send reset link');
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  if (showSuccess) {
    return (
      <Box sx={{ 
        minHeight: '80vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: { xs: 4, md: 8 },
        pt: { xs: 4, md: 16 }
      }}>
        <Container maxWidth="sm">
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 4, md: 6 }, 
            textAlign: 'center', 
            bgcolor: isDarkMode ? 'var(--bg-secondary)' : '#ffffff',
            backgroundImage: isDarkMode ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)' : 'none',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
            boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            borderRadius: '24px'
          }}
        >
          <Box sx={{
            width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(249, 124, 27, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, mx: 'auto'
          }}>
            <MarkEmailRead sx={{ fontSize: 40, color: '#F97C1B' }} />
          </Box>
          <Typography variant="h5" gutterBottom sx={{ 
            fontFamily: "'Basic', sans-serif !important",
            color: isDarkMode ? 'var(--text-primary)' : '#111827',
            mb: 2
          }}>
            Check your Email
          </Typography>
          <Typography variant="body1" sx={{ color: isDarkMode ? 'var(--text-secondary)' : '#4b5563', mb: 4, fontFamily: "'Basic', sans-serif !important" }}>
            We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
          </Typography>
          <Button 
            variant="contained" 
            fullWidth 
            onClick={() => router.push('/')}
            sx={{ 
              bgcolor: '#F97C1B', 
              color: '#ffffff',
              '&:hover': { bgcolor: '#e86a0b', boxShadow: 'none', transform: 'translateY(-1px)' },
              py: 1.5,
              height: 48,
              fontSize: '1.05rem',
              borderRadius: '8px',
              textTransform: 'none',
              boxShadow: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Back to Home
          </Button>
        </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '80vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      py: { xs: 4, md: 8 },
      pt: { xs: 4, md: 16 }
    }}>
      <Container maxWidth="sm">
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 4, md: 5 }, 
          bgcolor: isDarkMode ? 'var(--bg-secondary)' : '#ffffff',
          backgroundImage: isDarkMode ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)' : 'none',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
          boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          borderRadius: '24px',
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center' }}>
          <Typography variant="h4" sx={{ 
            fontFamily: "'Basic', sans-serif !important", 
            fontSize: { xs: '1.5rem', md: '2rem' },
            color: isDarkMode ? 'var(--text-primary)' : '#111827'
          }}>
            Forgot Password
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ mb: 4, textAlign: 'center', color: isDarkMode ? 'var(--text-secondary)' : '#4b5563', fontFamily: "'Basic', sans-serif !important" }}>
          Enter the email address associated with your account and we'll send you a link to reset your password.
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            autoFocus
            label="Email Address"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
            helperText={error}
            variant="outlined"
            sx={{
              mb: 4,
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
              }
            }}
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={handleCancel}
              sx={{ 
                flex: 1, 
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb', 
                color: isDarkMode ? 'var(--text-primary)' : '#374151',
                '&:hover': { 
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#d1d5db',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb',
                },
                borderRadius: '8px',
                textTransform: 'none',
                height: 48,
                fontSize: '1rem',
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              sx={{ 
                flex: 1.5, 
                bgcolor: '#F97C1B', 
                color: '#ffffff',
                '&:hover': { bgcolor: '#e86a0b', boxShadow: 'none', transform: 'translateY(-1px)' },
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: 'none',
                height: 48,
                fontSize: '1.05rem',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Send Link'}
            </Button>
          </Box>
        </form>
      </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;

