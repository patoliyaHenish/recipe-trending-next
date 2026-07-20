"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  useVerifyEmailMutation,
  useMyProfileQuery,
  useUpdatePreferenceMutation,
} from '../../features/api/authApi';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import {
  CheckCircle,
  ErrorOutlined as ErrorOutline,
  MarkEmailRead,
  HomeRounded,
} from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/useUser';
import { motion } from 'framer-motion';
import { toast } from '../../utils/toast';
import Cookies from 'js-cookie';
import Link from 'next/link';

// Inner component that reads searchParams (must be inside Suspense)
const VerifyEmailInner = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const { isDarkMode } = useTheme();
  const { setUser } = useUser();

  const [verifyEmail, { isLoading, error }] = useVerifyEmailMutation();
  const [updatePreference] = useUpdatePreferenceMutation();
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [countdown, setCountdown] = useState(3);

  const { data: profileData } = useMyProfileQuery(undefined, {
    skip: verificationStatus !== 'success',
  });

  const effectRan = React.useRef(false);

  // Run email verification once
  useEffect(() => {
    if (!email || !token) {
      setVerificationStatus('invalid');
      return;
    }

    if (effectRan.current) return;
    effectRan.current = true;

    verifyEmail({ email, token })
      .unwrap()
      .then(() => {
        setVerificationStatus('success');
      })
      .catch(() => {
        setVerificationStatus('error');
      });
  }, [email, token, verifyEmail]);

  // Sync verified user profile into context
  useEffect(() => {
    if (verificationStatus === 'success' && profileData?.user) {
      setUser(profileData.user);
    }
  }, [verificationStatus, profileData, setUser]);

  // Countdown + auto-redirect on success
  useEffect(() => {
    if (verificationStatus !== 'success') return;

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [verificationStatus, router]);

  // ── Animation variants ───────────────────────────────────────────────────
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 100, damping: 20, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -45 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { type: 'spring', stiffness: 200, damping: 15, delay: 0.2 },
    },
  };

  // ── Status content ───────────────────────────────────────────────────────
  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <>
            <motion.div initial="hidden" animate="visible" variants={itemVariants} style={{ marginBottom: 24, position: 'relative' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress size={80} thickness={2} sx={{ color: '#F97C1B' }} />
                <Box
                  sx={{
                    top: 0, left: 0, bottom: 0, right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MarkEmailRead sx={{ fontSize: 40, color: '#F97C1B', opacity: 0.8 }} />
                </Box>
              </Box>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800, mb: 2,
                  background: 'linear-gradient(45deg, #F97C1B, #FFB15E)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Verifying...
              </Typography>
              <Typography variant="body1" sx={{ color: isDarkMode ? '#aaa' : '#666', maxWidth: 300, mx: 'auto' }}>
                Please wait a moment while we validate your email address.
              </Typography>
            </motion.div>
          </>
        );

      case 'success':
        return (
          <>
            <motion.div variants={iconVariants} style={{ marginBottom: 24 }}>
              <Box
                sx={{
                  width: 100, height: 100, borderRadius: '50%',
                  bgcolor: isDarkMode ? 'rgba(0,230,118,0.15)' : 'rgba(76,175,80,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mx: 'auto',
                  boxShadow: isDarkMode
                    ? '0 0 40px rgba(0,230,118,0.3), inset 0 0 20px rgba(0,230,118,0.1)'
                    : '0 10px 30px rgba(76,175,80,0.2)',
                }}
              >
                <CheckCircle
                  sx={{
                    fontSize: 60,
                    color: isDarkMode ? '#00e676' : '#4caf50',
                    filter: isDarkMode ? 'drop-shadow(0 0 10px rgba(0,230,118,0.5))' : 'none',
                  }}
                />
              </Box>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: isDarkMode ? '#fff' : '#1a1a1a' }}>
                Email Verified!
              </Typography>
              <Typography variant="body1" sx={{ color: isDarkMode ? '#aaa' : '#666', mb: 3, maxWidth: 350, mx: 'auto', lineHeight: 1.6 }}>
                Your account has been successfully verified.
              </Typography>
              <Typography variant="h6" sx={{ color: '#F97C1B', fontWeight: 700, mb: 1, letterSpacing: 1 }}>
                Redirecting in {countdown}...
              </Typography>
            </motion.div>
          </>
        );

      case 'error':
      case 'invalid':
        return (
          <>
            <motion.div variants={iconVariants} style={{ marginBottom: 24 }}>
              <Box
                sx={{
                  width: 100, height: 100, borderRadius: '50%',
                  bgcolor: 'rgba(244,67,54,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mx: 'auto',
                }}
              >
                <ErrorOutline sx={{ fontSize: 60, color: '#f44336' }} />
              </Box>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: isDarkMode ? '#fff' : '#1a1a1a' }}>
                Verification Failed
              </Typography>
              <Typography variant="body1" sx={{ color: isDarkMode ? '#aaa' : '#666', mb: 4, maxWidth: 350, mx: 'auto' }}>
                {error?.data?.message || 'The verification link is invalid or has expired. Please try requesting a new one.'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  component={Link}
                  href="/"
                  variant="outlined"
                  startIcon={<HomeRounded />}
                  sx={{
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#e0e0e0',
                    color: isDarkMode ? '#fff' : '#666',
                    fontWeight: 'bold',
                    px: 3, py: 1.2,
                    borderRadius: '50px',
                    '&:hover': { borderColor: '#F97C1B', color: '#F97C1B', bgcolor: 'transparent' },
                  }}
                >
                  Home
                </Button>
              </Box>
            </motion.div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode
          ? 'radial-gradient(circle at 50% 50%, #2a1a12 0%, #121212 100%)'
          : 'radial-gradient(circle at 50% 50%, #fff8ed 0%, #ffffff 100%)',
        p: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background blobs */}
      <Box
        component={motion.div}
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute', top: '10%', left: '5%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'linear-gradient(135deg, #F97C1B20 0%, transparent 70%)',
          filter: 'blur(40px)', zIndex: 0,
        }}
      />
      <Box
        component={motion.div}
        animate={{ y: [0, 30, 0], rotate: [0, -10, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        sx={{
          position: 'absolute', bottom: '10%', right: '5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFB15E15 0%, transparent 70%)',
          filter: 'blur(50px)', zIndex: 0,
        }}
      />

      {/* Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        style={{ width: '100%', maxWidth: 500, position: 'relative', zIndex: 1 }}
      >
        <Box
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 6,
            bgcolor: isDarkMode ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            boxShadow: isDarkMode
              ? '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 20px 50px rgba(249,124,27,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
            textAlign: 'center',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.5)',
          }}
        >
          {renderContent()}
        </Box>
      </motion.div>
    </Box>
  );
};

// Wrapper with Suspense (required by Next.js App Router for useSearchParams)
const VerifyEmailClient = () => {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: '#F97C1B' }} size={60} />
        </Box>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
};

export default VerifyEmailClient;
