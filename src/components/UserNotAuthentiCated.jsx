"use client";
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/useUser';
import AuthModal from './AuthModal';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import IcecreamIcon from '@mui/icons-material/Icecream';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';

const UserNotAuthentiCated = () => {
    const router = useRouter();
    const { isDarkMode } = useTheme();
    const { user } = useUser();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const icons = [
        { Icon: LocalPizzaIcon, top: '15%', left: '10%', duration: 5, delay: 0 },
        { Icon: LunchDiningIcon, top: '25%', right: '15%', duration: 7, delay: 1 },
        { Icon: IcecreamIcon, bottom: '15%', left: '20%', duration: 6, delay: 2 },
        { Icon: LocalCafeIcon, bottom: '20%', right: '10%', duration: 8, delay: 0.5 },
        { Icon: RestaurantMenuIcon, top: '50%', left: '5%', duration: 9, delay: 1.5 },
    ];

    useEffect(() => {
        document.title = 'Not Authenticated';
    });

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, navigate]);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                background: isDarkMode
                    ? 'radial-gradient(circle at center, #1f2937 0%, #000000 100%)'
                    : 'radial-gradient(circle at center, #ffffff 0%, #fff7ed 100%)',
                p: 3,
                textAlign: 'center',
                pt: { xs: '56px', sm: '64px' }
            }}
        >

            {icons.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: 0.1,
                        y: [0, -20, 0],
                        rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                        opacity: { duration: 1 },
                        y: { duration: item.duration, repeat: Infinity, ease: 'easeInOut' },
                        rotate: { duration: item.duration * 1.5, repeat: Infinity, ease: 'easeInOut' },
                        delay: item.delay
                    }}
                    style={{
                        position: 'absolute',
                        top: item.top,
                        left: item.left,
                        right: item.right,
                        bottom: item.bottom,
                        color: '#F97C1B',
                        zIndex: 0,
                    }}
                >
                    <item.Icon sx={{ fontSize: { xs: 40, md: 80 } }} />
                </motion.div>
            ))}

            <Box
                component={motion.div}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: '450px',
                    width: '100%',
                    mx: 'auto',
                }}
            >

                <Box
                    sx={{
                        position: 'relative',
                        width: '120px',
                        height: '120px',
                        mx: 'auto',
                        mb: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: isDarkMode ? 'rgba(249, 124, 27, 0.1)' : 'rgba(249, 124, 27, 0.05)',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            inset: -10,
                            borderRadius: '50%',
                            border: '2px dashed #F97C1B',
                            opacity: 0.4,
                            animation: 'spin 10s linear infinite',
                        }
                    }}
                >
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <LockPersonIcon sx={{ fontSize: 60, color: '#F97C1B' }} />
                    </motion.div>
                </Box>

                <Typography
                    variant="h3"
                    sx={{
                        fontWeight: 900,
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        fontFamily: '"Outfit", sans-serif',
                        background: 'linear-gradient(to right, #F97C1B, #FFB15E)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 2,
                    }}
                >
                    Not Authenticated
                </Typography>

                <Typography
                    sx={{
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        mb: 4,
                        lineHeight: 1.6
                    }}
                >
                    Oops! It looks like you're trying to access a secret recipe. 
                    Please sign in or create an account to view this page.
                </Typography>

                <Button
                    component={motion.button}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    variant="contained"
                    onClick={() => setAuthModalOpen(true)}
                    sx={{
                        bgcolor: '#F97C1B',
                        color: '#fff',
                        fontWeight: 'bold',
                        px: 5,
                        py: 1.5,
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        textTransform: 'none',
                        boxShadow: '0 10px 20px rgba(249, 124, 27, 0.3)',
                        '&:hover': {
                            bgcolor: '#e06b12',
                            boxShadow: '0 15px 25px rgba(249, 124, 27, 0.4)',
                        }
                    }}
                >
                    Go to Login
                </Button>
            </Box>

            <style>
                {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
            </style>
            <AuthModal 
                open={authModalOpen} 
                onClose={() => setAuthModalOpen(false)} 
            />
        </Box>
    );
};

export default UserNotAuthentiCated;


