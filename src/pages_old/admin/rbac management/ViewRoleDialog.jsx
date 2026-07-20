"use client";
import React, { useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    IconButton,
    Box,
    Stack,
    Chip,
    CircularProgress,
    Grid,
    Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '../../../context/ThemeContext';
import { useLazyGetRoleByIdQuery } from '../../../features/api/rbacApi';

const ViewRoleDialog = ({ open, onClose, roleId }) => {
    const { isDarkMode } = useTheme();
    const [getRoleById, { data, isLoading, isError }] = useLazyGetRoleByIdQuery();

    useEffect(() => {
        if (open && roleId) {
            getRoleById(roleId);
        }
    }, [open, roleId, getRoleById]);

    const roleData = data?.data;

    // Group permissions by category (e.g., "recipe.list" -> category "recipe")
    const groupedPermissions = React.useMemo(() => {
        if (!roleData?.permissions) return {};
        return roleData.permissions.reduce((acc, perm) => {
            const category = (perm.name.startsWith('recipe.note_') || perm.name.startsWith('recipe.notes_'))
                ? 'Recipe Notes'
                : (perm.name.split('.')[0] || 'other');
            if (!acc[category]) acc[category] = [];
            acc[category].push(perm);
            return acc;
        }, {});
    }, [roleData]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
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
                    Role Details
                </Typography>
                <IconButton onClick={onClose} sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ backgroundColor: isDarkMode ? '#283046' : '#ffffff', py: 3, borderColor: isDarkMode ? '#404656' : '#ebe9f1' }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress color="primary" />
                    </Box>
                ) : isError ? (
                    <Typography color="error" textAlign="center">Failed to load role details.</Typography>
                ) : !roleData ? (
                    <Typography textAlign="center">No data available.</Typography>
                ) : (
                    <Stack spacing={4}>
                        <Box>
                            <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                Role Name
                            </Typography>
                            <Typography variant="h5" sx={{ color: isDarkMode ? '#fff' : '#111827', fontWeight: 600, mt: 0.5 }}>
                                {roleData.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', mt: 1 }}>
                                {roleData.description || 'No description provided.'}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="h6" sx={{ color: isDarkMode ? '#e5e7eb' : '#111827', fontWeight: 600, mb: 2 }}>
                                Assigned Permissions ({roleData.permissions?.length || 0})
                            </Typography>
                            
                            <Grid container spacing={2}>
                                {Object.keys(groupedPermissions).length > 0 ? (
                                    Object.entries(groupedPermissions).map(([category, perms]) => (
                                        <Grid item xs={12} sm={6} md={4} key={category}>
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                    height: '100%',
                                                    bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                                                    border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#7367f0' : '#7367f0', fontWeight: 700, textTransform: 'uppercase', mb: 1.5 }}>
                                                    {category}
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                                    {perms.map(p => (
                                                        <Chip
                                                            key={p.id}
                                                            label={p.name.split('.')[1] || p.name}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                fontSize: '0.7rem',
                                                                color: isDarkMode ? '#e5e7eb' : '#374151',
                                                                borderColor: isDarkMode ? '#404656' : '#d1d5db',
                                                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#fff'
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))
                                ) : (
                                    <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontStyle: 'italic' }}>
                                            No permissions assigned to this role.
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, backgroundColor: isDarkMode ? '#283046' : '#ffffff', borderTop: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        borderRadius: '6px',
                        color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                        borderColor: isDarkMode ? '#404656' : '#d8d6de',
                        '&:hover': { 
                            borderColor: isDarkMode ? '#d0d2d6' : '#4b4b4b',
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                        }
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewRoleDialog;

