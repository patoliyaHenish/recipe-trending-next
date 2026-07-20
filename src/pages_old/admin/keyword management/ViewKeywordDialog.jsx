"use client";
import React, { useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Typography,
    IconButton,
    Box,
    CircularProgress,
    useMediaQuery,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '../../../context/ThemeContext';
import { useLazyGetKeywordByIdQuery } from '../../../features/api/keywordApi';

const ViewKeywordDialog = ({ open, onClose, keywordId }) => {
    const { isDarkMode } = useTheme();
    const muiTheme = useMuiTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    const [getKeywordById, { data, isLoading, isError }] = useLazyGetKeywordByIdQuery();

    useEffect(() => {
        if (open && keywordId) {
            getKeywordById(keywordId);
        }
    }, [open, keywordId, getKeywordById]);

    const keywordData = data?.data;

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const DetailRow = ({ label, value, children }) => (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {label}
                </Typography>
            </Box>
            {children ? children : (
                <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                    {value || 'N/A'}
                </Typography>
            )}
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    borderRadius: '8px',
                    backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
                    boxShadow: isDarkMode ? '0 15px 30px rgba(0,0,0,0.3)' : '0 15px 30px rgba(0,0,0,0.1)',
                },
            }}
        >
            <DialogTitle
                className="flex items-center justify-between"
                sx={{ borderBottom: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`, py: 2.5 }}
            >
                <Typography variant="h6" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}>
                    Keyword Details
                </Typography>
                <IconButton onClick={onClose} sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    py: 3,
                    backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                    borderColor: isDarkMode ? '#404656' : '#ebe9f1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                }}
            >
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress color="primary" />
                    </Box>
                ) : isError ? (
                    <Typography color="error" textAlign="center">Failed to load keyword details.</Typography>
                ) : !keywordData ? (
                    <Typography textAlign="center">No data available.</Typography>
                ) : (
                    <>
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr', 
                            gap: 3,
                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                            p: 2.5,
                            borderRadius: 2,
                            border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
                        }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                        Name
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                                    {keywordData.name || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                                {keywordData.created_at && (
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                                Created At
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                                            {formatDateTime(keywordData.created_at)}
                                        </Typography>
                                    </Box>
                                )}
                                {keywordData.updated_at && (
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                                Updated At
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                                            {formatDateTime(keywordData.updated_at)}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr', 
                            gap: 2,
                        }}>
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}` }}>
                                <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Usage</Typography>
                                <Typography variant="h6" sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 700 }}>{keywordData.usage_count || 0} Recipes</Typography>
                                
                                {keywordData.recipes && keywordData.recipes.length > 0 && (
                                    <Box
                                        sx={{
                                            maxHeight: 150,
                                            overflow: 'auto',
                                            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : '#f9fafb',
                                            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
                                            borderRadius: 1,
                                            mt: 2
                                        }}
                                    >
                                        <List dense disablePadding>
                                            {keywordData.recipes.map((recipe, index) => (
                                                <React.Fragment key={recipe.recipe_id}>
                                                    <ListItem>
                                                        <ListItemText
                                                            primary={recipe.title}
                                                            sx={{
                                                                m: 0,
                                                                '& .MuiListItemText-primary': {
                                                                    color: isDarkMode ? '#e5e7eb' : '#374151',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500
                                                                }
                                                            }}
                                                        />
                                                    </ListItem>
                                                    {index < keywordData.recipes.length - 1 && <Divider sx={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6' }} />}
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                        
                    </>
                )}
            </DialogContent>
            <Box sx={{ p: 2, backgroundColor: isDarkMode ? '#283046' : '#ffffff', borderTop: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        textTransform: 'none',
                        borderRadius: '6px',
                        color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                        borderColor: isDarkMode ? '#404656' : '#d8d6de',
                        '&:hover': {
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            borderColor: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                        },
                        px: 3,
                        py: 0.75
                    }}
                >
                    Close
                </Button>
            </Box>
        </Dialog>
    );
};

export default ViewKeywordDialog;

