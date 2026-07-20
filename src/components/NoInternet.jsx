"use client";
import React from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import IcecreamIcon from '@mui/icons-material/Icecream';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';

const NoInternet = () => {
  const { isDarkMode } = useTheme();

  const handleRetry = () => {
    window.location.reload();
  };

  const FloatingIcon = ({ Icon, top, left, right, bottom, duration, delay, size, rotate }) => (
    <Box
      sx={{
        position: 'absolute',
        top, left, right, bottom,
        color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        animation: `float ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        transform: `rotate(${rotate}deg)`,
        zIndex: 0,
      }}
    >
      <Icon sx={{ fontSize: size }} />
    </Box>
  );

  return (
    <Box
      className="min-h-screen flex items-center justify-center"
      sx={{
        background: isDarkMode
          ? 'radial-gradient(circle at center, #1f2937 0%, #111827 100%)'
          : 'radial-gradient(circle at center, #fff7ed 0%, #ffedd5 100%)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >

        <FloatingIcon Icon={LocalPizzaIcon} top="10%" left="10%" duration={6} delay={0} size={80} rotate={-15} />
        <FloatingIcon Icon={LunchDiningIcon} top="20%" right="15%" duration={7} delay={1} size={100} rotate={15} />
        <FloatingIcon Icon={IcecreamIcon} bottom="15%" left="20%" duration={8} delay={2} size={70} rotate={-10} />
        <FloatingIcon Icon={LocalCafeIcon} bottom="10%" right="10%" duration={6} delay={0.5} size={90} rotate={20} />
        <FloatingIcon Icon={RestaurantMenuIcon} top="50%" left="5%" duration={9} delay={1.5} size={120} rotate={45} />


      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        

        <Box 
            sx={{ 
                position: 'relative', 
                mb: 6,
                animation: 'bounce 3s infinite ease-in-out'
            }}
        >

            <Box
                sx={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    border: `4px dashed ${isDarkMode ? '#F97C1B' : '#F97C1B'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'spin 20s linear infinite',
                    opacity: 0.3
                }}
            />
            
            <Box
               sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: isDarkMode 
                    ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' 
                    : 'linear-gradient(135deg, #ffffff 0%, #fff1e0 100%)', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
               }}
            >
                <SoupKitchenIcon sx={{ fontSize: '80px', color: '#F97C1B' }} />
            </Box>


            <Box
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    background: '#ef4444',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                    animation: 'pulse 2s infinite'
                }}
            >
                 <WifiOffIcon sx={{ fontSize: '28px', color: '#fff' }} />
            </Box>
        </Box>


        <Typography
            variant="h2"
            sx={{
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 900,
              fontSize: { xs: '2.5rem', md: '4rem' },
              background: isDarkMode 
                ? 'linear-gradient(to right, #F97C1B, #FFB15E)' 
                : 'linear-gradient(to right, #F97C1B, #c2410c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              letterSpacing: '-2px',
              textShadow: isDarkMode ? '0 10px 30px rgba(249, 124, 27, 0.2)' : 'none'
            }}
        >
          Kitchen Closed!
        </Typography>

        <Typography
            variant="h5"
            sx={{
              color: isDarkMode ? '#dadada' : '#4b5563',
              fontSize: { xs: '1.1rem', md: '1.5rem' },
              maxWidth: '600px',
              mb: 6,
              lineHeight: 1.6,
              fontWeight: 500
            }}
        >
          We're missing the secret ingredient: <span style={{ color: '#F97C1B', fontWeight: 'bold' }}>The Internet.</span><br/>
          Check your connection to get cooking again.
        </Typography>

        <Button
            variant="contained"
            size="large"
            startIcon={<RefreshIcon className="animate-spin-slow" />}
            onClick={handleRetry}
            sx={{
              bgcolor: '#F97C1B',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '1rem',
              padding: '10px 32px',
              borderRadius: '100px',
              textTransform: 'none',
              boxShadow: '0 10px 20px rgba(249, 124, 27, 0.3)',
              '&:hover': {
                bgcolor: '#e6690b',
                transform: 'translateY(-2px)',
                boxShadow: '0 15px 25px rgba(249, 124, 27, 0.4)',
              },
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            Reconnect
          </Button>

      </Container>
      

       <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(var(--rotation, 0deg)); }
            50% { transform: translateY(-20px) rotate(calc(var(--rotation, 0deg) + 5deg)); }
          }
          @keyframes bounce {
             0%, 100% { transform: translateY(0); }
             50% { transform: translateY(-15px); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
           @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          .animate-spin-slow {
            animation: spin 3s linear infinite;
          }
        `}
      </style>

    </Box>
  );
};

export default NoInternet;

