"use client";
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Grid,
    IconButton,
    CircularProgress,
} from '@mui/material';
import {
    CheckCircleRounded,
    CloseRounded,
    EggRounded as EggIcon,
    RadioButtonCheckedRounded
} from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const getVegIcon = (color) => (
    <Box sx={{ 
        width: 18, 
        height: 18, 
        border: `2px solid ${color}`, 
        borderRadius: '2px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
    }}>
        <Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: '50%' }} />
    </Box>
);

const preferenceOptions = [
    { value: 'veg', label: 'Vegetarian', icon: getVegIcon('#43a047'), color: '#43a047', description: 'Fresh, plant-based recipes' },
    { value: 'egg', label: 'Eggetarian', icon: <EggIcon sx={{ fontSize: '1.4rem' }} />, color: '#ffb300', description: 'Including eggs in your diet' },
    { value: 'all', label: 'I Eat Everything', icon: <RadioButtonCheckedRounded sx={{ fontSize: '1.4rem' }} />, color: '#795548', description: 'No specific restrictions' }
];

const PreferenceDialog = ({ open, onSave, onClose, isLoading, initialValues = ['all'] }) => {
    const { isDarkMode } = useTheme();
    const [selected, setSelected] = useState(initialValues);

    useEffect(() => {
        if (open) {
            setSelected(initialValues);
        }
    }, [open, initialValues]);

    const handleToggle = (value) => {
        if (value === 'all') {
            setSelected(['all']);
        } else {
            let next = [...selected].filter(v => v !== 'all');
            if (next.includes(value)) {
                next = next.filter(v => v !== value);
            } else {
                next.push(value);
            }
            
            if (next.length === 0 || next.length === 2) {
                setSelected(['all']);
            } else {
                setSelected(next);
            }
        }
    };

    const handleSave = () => {
        onSave(selected);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            disableScrollLock
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    bgcolor: isDarkMode ? 'var(--bg-secondary)' : '#ffffff',
                    backgroundImage: 'none',
                    overflow: 'visible'
                }
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1, position: 'relative' }}>
                <IconButton 
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: isDarkMode ? '#999' : '#666' }}
                    size="small"
                >
                    <CloseRounded />
                </IconButton>
                <Typography variant="h5" sx={{ 
                    fontWeight: 800, 
                    color: isDarkMode ? 'var(--text-primary)' : '#1a1a1a',
                    fontFamily: "'Basic', sans-serif"
                }}>
                    Dietary Preference
                </Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? 'var(--text-secondary)' : '#666', mt: 0.5, fontFamily: "'Basic', sans-serif" }}>
                    Select your default meal types
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2 }}>
                <Grid container spacing={1.5}>
                    {preferenceOptions.map((opt) => {
                        const isSelected = selected.includes(opt.value);
                        return (
                            <Grid item xs={12} key={opt.value}>
                                <Box
                                    component={motion.div}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleToggle(opt.value)}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        border: '1.2px solid',
                                        borderColor: isSelected ? '#F97C1B' : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#eee'),
                                        background: isSelected 
                                            ? (isDarkMode ? 'rgba(249, 124, 27, 0.1)' : 'rgba(249, 124, 27, 0.05)')
                                            : (isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff'),
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2
                                    }}
                                >
                                    <Box sx={{ 
                                        color: opt.color,
                                        display: 'flex'
                                    }}>
                                        {opt.icon}
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1a1a1a', fontFamily: "'Basic', sans-serif", fontSize: '0.95rem' }}>
                                            {opt.label}
                                        </Typography>
                                    </Box>
                                    {isSelected && (
                                        <CheckCircleRounded sx={{ color: '#F97C1B', fontSize: 20 }} />
                                    )}
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button
                    onClick={handleSave}
                    fullWidth
                    variant="contained"
                    disabled={isLoading || selected.length === 0}
                    sx={{
                        py: 1.2,
                        borderRadius: 2,
                        bgcolor: '#F97C1B',
                        fontWeight: 700,
                        fontSize: '1rem',
                        textTransform: 'none',
                        fontFamily: "'Basic', sans-serif",
                        '&:hover': {
                            bgcolor: '#e66a00',
                        }
                    }}
                >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Preferences'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PreferenceDialog;

