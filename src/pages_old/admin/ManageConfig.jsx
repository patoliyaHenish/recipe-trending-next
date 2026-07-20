"use client";
import {
    Box,
    CircularProgress,
    Switch,
    Typography,
    alpha,
    TextField,
    IconButton,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    Settings,
    Save,
    LogIn
} from 'lucide-react';
import React, { useEffect } from 'react';
import { toast } from '../../utils/toast';
import moment from 'moment';
import { useTheme } from '../../context/ThemeContext';
import { useGetAllSettingsQuery, useUpdateSettingMutation } from '../../features/api/settingsApi';
import AccessDenied from '../../components/common/AccessDenied';
import { ConfirmDialog } from '../../components/common';
import { useSelector } from 'react-redux';

const ManageConfig = () => {
    const { isDarkMode } = useTheme();
    const user = useSelector((state) => state.auth.user);
    const userPermissions = user?.permissions || [];
    const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
    const canManage = isAdmin || userPermissions.includes('config.manage');

    const { data: settingsData, isLoading, isError, error } = useGetAllSettingsQuery();
    const [updateSetting] = useUpdateSettingMutation();
    const [editingValues, setEditingValues] = React.useState({});
    const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
    const [settingToToggle, setSettingToToggle] = React.useState(null);

    useEffect(() => {
        document.title = "Manage System Config";
    }, []);

    const isForbidden = error?.status === 403;

    if (!canManage && !isAdmin) {
        return <AccessDenied message="You don't have the required permissions to view or manage system configurations." />;
    }

    const handleUpdate = async (key, value) => {
        try {
            await updateSetting({ key, value }).unwrap();
            toast.success(`Setting updated successfully`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update setting');
        }
    };

    const handleToggle = (key, currentValue) => {
        const newValue = currentValue === 'true' ? 'false' : 'true';
        setSettingToToggle({ key, newValue, currentValue });
        setConfirmDialogOpen(true);
    };

    const handleConfirmToggle = () => {
        if (settingToToggle) {
            handleUpdate(settingToToggle.key, settingToToggle.newValue);
        }
        setConfirmDialogOpen(false);
        setSettingToToggle(null);
    };

    const handleTextSave = (key) => {
        if (editingValues[key] !== undefined) {
            handleUpdate(key, editingValues[key]);
            const newEditing = { ...editingValues };
            delete newEditing[key];
            setEditingValues(newEditing);
        }
    };

    const formatTitle = (key) => {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getConfigDetails = (key, value) => {
        switch (key) {
            case 'enable_user_blocking_option':
                return {
                    icon: Settings,
                    iconNode: (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ef4444' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                        </Box>
                    ),
                    color: 'text-red-500',
                    bg: isDarkMode ? 'bg-red-500/20' : 'bg-red-100',
                    label: 'Security'
                };
            case 'enable_role_update_option':
                return {
                    icon: Settings,
                    iconNode: (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3b82f6' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
                        </Box>
                    ),
                    color: 'text-blue-500',
                    bg: isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100',
                    label: 'Administration'
                };
            case 'enable_user_login_option':
                return {
                    icon: LogIn,
                    color: 'text-violet-500',
                    bg: isDarkMode ? 'bg-violet-500/20' : 'bg-violet-100',
                    label: 'Access'
                };
            default:
                return {
                    icon: Settings,
                    color: 'text-gray-500',
                    bg: isDarkMode ? 'bg-gray-500/20' : 'bg-gray-100',
                    label: 'General'
                };
        }
    };

    const settings = settingsData?.data || [];

    return (
        <Box className="transition-all duration-200 flex flex-col pt-0 md:pt-4 pb-4 px-3 mt-[64px] md:mt-[74px] min-h-[calc(100vh-74px)] h-auto w-full">
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '6px',
                    backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                    overflow: 'hidden',
                    boxShadow: isDarkMode
                        ? '0 4px 24px 0 rgba(0,0,0,0.24)'
                        : '0 4px 24px 0 rgba(34,41,47,0.1)',
                }}
            >
                {/* ── Card header ───────────────────────────────────────────── */}
                <Box
                    className="flex flex-row justify-between items-center p-4 sm:p-5 border-b gap-4"
                    sx={{ borderColor: isDarkMode ? '#3b4253' : '#ebe9f1' }}
                >
                    <Box className="flex items-center flex-wrap gap-2">
                        <Typography
                            variant="h5"
                            sx={{ 
                                fontWeight: 700, 
                                color: isDarkMode ? '#e2e8f0' : '#1e293b', 
                                letterSpacing: '0.5px',
                                fontSize: { xs: '1.25rem', sm: '1.5rem' }
                            }}
                        >
                            System Configuration
                        </Typography>
                    </Box>
                </Box>

                {/* ── AG Grid ───────────────────────────────────────────────── */}
                {isLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                        <CircularProgress size={40} thickness={4} sx={{ color: '#7367f0' }} />
                    </Box>
                ) : isError ? (
                    isForbidden ? (
                        <AccessDenied message="You don't have the required permissions to view or manage system configurations." />
                    ) : (
                        <Box className="text-center py-20">
                            <Typography color="error" variant="h6" fontWeight="700" sx={{ mb: 1 }}>
                                Failed to load system settings
                            </Typography>
                        </Box>
                    )
                ) : (
                    <TableContainer
                        sx={{
                            flex: 1,
                            minHeight: 400,
                            overflow: 'auto',
                            backgroundColor: 'transparent',
                            '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                            '&::-webkit-scrollbar-track': { background: 'transparent' },
                            '&::-webkit-scrollbar-thumb': {
                                background: isDarkMode ? '#404656' : '#c1c1c1',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: isDarkMode ? '#505666' : '#a8a8a8',
                            },
                        }}
                    >
                        <Table stickyHeader sx={{ minWidth: 700, borderCollapse: 'separate', borderSpacing: 0 }}>
                            <TableHead>
                                <TableRow>
                                    {['Name', 'Value', 'Updated At'].map((headCell, index) => (
                                        <TableCell
                                            key={index}
                                            align={headCell === 'Name' ? 'left' : 'center'}
                                            sx={{
                                                backgroundColor: isDarkMode ? '#283046' : '#f3f2f7',
                                                color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                                                fontWeight: 600,
                                                fontSize: '0.8rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                                py: 2,
                                            }}
                                        >
                                            {headCell}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {settings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                                            <Typography sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>No settings found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    settings.map((setting, index) => {
                                        const { icon: Icon, iconNode, color, bg, label } = getConfigDetails(setting.key, setting.value);
                                        const isToggleSetting = setting.key.includes('_enabled') ||
                                            setting.key.includes('show_') ||
                                            setting.key.includes('allow_') ||
                                            setting.key.includes('enable_');
                                        const isEnabled = setting.value === 'true';

                                        return (
                                            <TableRow
                                                key={setting.key || index}
                                                sx={{
                                                    backgroundColor: index % 2 === 0 ? (isDarkMode ? '#283046' : '#ffffff') : (isDarkMode ? '#283046' : '#fafbfc'),
                                                    transition: 'background-color 0.2s ease',
                                                    '&:hover': {
                                                        backgroundColor: isDarkMode ? '#2f3851 !important' : '#f8f8f8 !important',
                                                    },
                                                    '& td': {
                                                        borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                        py: 1.5,
                                                    },
                                                }}
                                            >
                                                <TableCell align="left">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                                                        <div className={`p-2 rounded-xl ${bg} ${color} flex-shrink-0`}>
                                                            {iconNode || <Icon size={20} strokeWidth={2} />}
                                                        </div>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.2, overflow: 'hidden' }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {formatTitle(setting.key)}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {label}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center">
                                                    {isToggleSetting ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                            <Switch
                                                                checked={isEnabled}
                                                                onChange={() => handleToggle(setting.key, setting.value)}
                                                                sx={{
                                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                                        color: '#7367f0',
                                                                        '&:hover': { backgroundColor: 'rgba(115, 103, 240, 0.08)' },
                                                                    },
                                                                    '& .MuiSwitch-track': { backgroundColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#7367f0' },
                                                                }}
                                                            />
                                                            <Typography variant="body2" sx={{ color: isEnabled ? (isDarkMode ? '#4ade80' : '#16a34a') : (isDarkMode ? '#9ca3af' : '#64748b'), fontWeight: 500 }}>
                                                                {isEnabled ? 'Active' : 'Inactive'}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 280, mx: 'auto' }}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                variant="outlined"
                                                                value={editingValues[setting.key] !== undefined ? editingValues[setting.key] : setting.value}
                                                                onChange={(e) => setEditingValues({ ...editingValues, [setting.key]: e.target.value })}
                                                                placeholder="Enter value..."
                                                                sx={{
                                                                    '& .MuiOutlinedInput-root': {
                                                                        bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f9fafb',
                                                                        color: isDarkMode ? '#f3f4f6' : '#111827',
                                                                        borderRadius: 1,
                                                                        height: '32px',
                                                                        '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                                                                        '&:hover fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' },
                                                                        '&.Mui-focused fieldset': { borderColor: '#7367f0' },
                                                                    },
                                                                }}
                                                                InputProps={{
                                                                    endAdornment: (
                                                                        <InputAdornment position="end">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => handleTextSave(setting.key)}
                                                                                disabled={editingValues[setting.key] === undefined || editingValues[setting.key] === setting.value}
                                                                                sx={{ color: '#7367f0', padding: '4px' }}
                                                                            >
                                                                                <Save size={16} />
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                            />
                                                        </Box>
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#64748b' }}>
                                                        {setting.updated_at ? moment(setting.updated_at).fromNow() : '-'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>

            <ConfirmDialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                onConfirm={handleConfirmToggle}
                title="Confirm Status Change"
                message={
                    settingToToggle
                        ? `Are you sure you want to ${settingToToggle.newValue === 'true' ? 'activate' : 'deactivate'} this setting?`
                        : ''
                }
                confirmText="Confirm"
                cancelText="Cancel"
                severity="warning"
            />
        </Box>
    );
};

export default ManageConfig;

