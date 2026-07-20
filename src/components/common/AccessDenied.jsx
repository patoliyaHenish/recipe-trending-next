"use client";
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext';

const AccessDenied = ({ message = "You don't have the required permissions to view or manage this section." }) => {
    const { isDarkMode } = useTheme();
    const router = useRouter();

    return (
        <Box 
            className="flex flex-col items-center justify-center text-center py-20 px-4"
            sx={{ flex: 1 }}
        >
            <Box 
                sx={{ 
                    p: 3, 
                    borderRadius: '50%', 
                    bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                    color: '#ef4444',
                    mb: 3
                }}
            >
                <ShieldAlert size={48} strokeWidth={1.5} />
            </Box>
            
            <Typography 
                variant="h5" 
                fontWeight="800" 
                sx={{ 
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                    mb: 1.5,
                    letterSpacing: '-0.025em'
                }}
            >
                Access Denied
            </Typography>
            
            <Typography 
                variant="body1" 
                sx={{ 
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    maxWidth: '450px',
                    mb: 4,
                    lineHeight: 1.6
                }}
            >
                {message}
            </Typography>
            
            <Box className="flex gap-3">
                <Button 
                    variant="outlined"
                    onClick={() => router.push(-1)}
                    sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        borderColor: isDarkMode ? '#374151' : '#d1d5db',
                        color: isDarkMode ? '#f3f4f6' : '#111827',
                        '&:hover': {
                            borderColor: isDarkMode ? '#4b5563' : '#9ca3af',
                            bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                        }
                    }}
                >
                    Go Back
                </Button>
                <Button 
                    variant="contained"
                    onClick={() => router.push('/')}
                    sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        bgcolor: '#ef4444',
                        '&:hover': {
                            bgcolor: '#dc2626'
                        }
                    }}
                >
                    Return Home
                </Button>
            </Box>
        </Box>
    );
};

export default AccessDenied;


