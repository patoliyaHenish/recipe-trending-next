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
                    width: { xs: 'calc(100% - 32px)', sm: 460 },
                    maxWidth: 460,
                    borderRadius: 4,
                    bgcolor: isDarkMode ? '#20293d' : '#ffffff',
                    backgroundImage: 'none',
                    overflow: 'hidden',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e8eaf0',
                    boxShadow: isDarkMode
                        ? '0 24px 70px rgba(0,0,0,0.52)'
                        : '0 24px 70px rgba(16,24,40,0.18)',
                }
            }}
        >
            <DialogTitle sx={{ textAlign: 'left', px: { xs: 2.5, sm: 3.5 }, pt: 3, pb: 1.5, position: 'relative' }}>
                <IconButton 
                    onClick={onClose}
                    sx={{
                        position: 'absolute', right: 16, top: 16,
                        color: isDarkMode ? '#bac3d5' : '#667085',
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f6f7f9',
                        '&:hover': { color: '#f97316', bgcolor: isDarkMode ? 'rgba(249,115,22,0.14)' : '#fff1e8' },
                    }}
                    size="small"
                >
                    <CloseRounded />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, pr: 5 }}>
                    <Box sx={{
                        width: 42, height: 42, borderRadius: 2.5, display: 'grid', placeItems: 'center',
                        bgcolor: 'rgba(249,115,22,0.14)', color: '#f97316',
                    }}>
                        <RadioButtonCheckedRounded sx={{ fontSize: 23 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.15, color: isDarkMode ? '#f8fafc' : '#172033', fontFamily: "'Basic', sans-serif" }}>
                            Dietary preferences
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b8c1d4' : '#667085', mt: 0.45, fontFamily: "'Basic', sans-serif" }}>
                            Personalise recipes for your table
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 1.5, pb: 2.5 }}>
                <Typography sx={{ color: isDarkMode ? '#d8deeb' : '#344054', fontSize: '0.875rem', fontWeight: 700, mb: 1.25, fontFamily: "'Basic', sans-serif" }}>
                    Choose what you eat
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.25 }}>
                    {preferenceOptions.map((opt) => {
                        const isSelected = selected.includes(opt.value);
                        return (
                            <Box
                                key={opt.value}
                                component={motion.div}
                                whileTap={{ scale: 0.985 }}
                                onClick={() => handleToggle(opt.value)}
                                sx={{
                                    gridColumn: opt.value === 'all' ? '1 / -1' : 'auto',
                                    minHeight: 106, p: 1.5, borderRadius: 2.5, cursor: 'pointer', position: 'relative',
                                    border: '1px solid',
                                    borderColor: isSelected ? '#f97316' : (isDarkMode ? 'rgba(255,255,255,0.11)' : '#e4e7ec'),
                                    background: isSelected
                                        ? (isDarkMode ? 'linear-gradient(135deg, rgba(249,115,22,0.19), rgba(249,115,22,0.07))' : 'linear-gradient(135deg, #fff7ed, #fff)')
                                        : (isDarkMode ? 'rgba(255,255,255,0.035)' : '#ffffff'),
                                    boxShadow: isSelected ? '0 8px 18px rgba(249,115,22,0.12)' : 'none',
                                    transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
                                    '&:hover': { borderColor: isSelected ? '#f97316' : (isDarkMode ? 'rgba(255,255,255,0.25)' : '#cbd5e1') },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                    <Box sx={{
                                        width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center', flexShrink: 0,
                                        color: opt.color, bgcolor: `${opt.color}18`,
                                    }}>
                                        {opt.icon}
                                    </Box>
                                    <Box sx={{ minWidth: 0, pr: 2 }}>
                                        <Typography sx={{ fontWeight: 800, color: isDarkMode ? '#f8fafc' : '#1d2939', fontFamily: "'Basic', sans-serif", fontSize: '0.96rem', lineHeight: 1.2 }}>
                                            {opt.label}
                                        </Typography>
                                        <Typography sx={{ color: isDarkMode ? '#aeb8cc' : '#667085', fontSize: '0.74rem', mt: 0.45, lineHeight: 1.3 }}>
                                            {opt.description}
                                        </Typography>
                                    </Box>
                                </Box>
                                {isSelected && (
                                    <CheckCircleRounded sx={{ color: '#f97316', fontSize: 21, position: 'absolute', top: 12, right: 12 }} />
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 0, pb: 3.25 }}>
                <Button
                    onClick={handleSave}
                    fullWidth
                    variant="contained"
                    disabled={isLoading || selected.length === 0}
                    sx={{
                        py: 1.35,
                        borderRadius: 2.5,
                        background: 'linear-gradient(100deg, #f97316, #fb8b22)',
                        fontWeight: 700,
                        fontSize: '1rem',
                        textTransform: 'none',
                        fontFamily: "'Basic', sans-serif",
                        boxShadow: 'none',
                        '&:hover': {
                            background: 'linear-gradient(100deg, #ea6509, #f97316)',
                            boxShadow: 'none',
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

