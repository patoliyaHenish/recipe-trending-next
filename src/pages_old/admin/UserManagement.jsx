"use client";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import React, { useMemo, useState, useEffect, useRef } from 'react';

import {
    Box,
    Button,
    Typography,
    Avatar,
    Select,
    MenuItem,
    FormControl,
    Switch,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Pagination,
    Autocomplete,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Collapse,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useGetAllUsersQuery, useBlockUserMutation, useUnblockUserMutation, useUpdateUserRoleMutation, useLoginAsUserMutation } from '../../features/api/authApi';
import { useGetAllSettingsQuery } from '../../features/api/settingsApi';
import { getImage } from '../../utils/helper';
import moment from 'moment';

import { AdminHeader, SearchBar } from '../../components/common';
import { useTheme } from '../../context/ThemeContext';
import { useGetAllRolesQuery } from '../../features/api/rbacApi';
import { CheckCircle, Cancel, Close as CloseIcon, LoginOutlined, FileUploadOutlined, KeyboardArrowDown, Add, People, FilterAltOutlined, FilterAltOffOutlined, ClearAll as ClearAllIcon, Search as SearchIcon } from '@mui/icons-material';
import { toast } from '../../utils/toast';

import { useSelector } from 'react-redux';
import { AccessDenied, ConfirmDialog } from '../../components/common';

const UserManagement = () => {
    const { isDarkMode } = useTheme();
    const user = useSelector((state) => state.auth.user);
    const userPermissions = user?.permissions || [];
    const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
    const canList = isAdmin || userPermissions.includes('user.list');
    const canUpdateUser = isAdmin || userPermissions.includes('user.update');
    const canUpdateRole = isAdmin || userPermissions.includes('user.update');
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const setSearchParams = React.useCallback((updater, options = {}) => {
        const next = new URLSearchParams(Array.from(searchParams.entries()));
        let finalParams = updater;
        if (typeof updater === 'function') {
            finalParams = updater(next);
        }
        if (finalParams) {
             const newUrl = `${pathname}?${finalParams.toString()}`;
             if (options.replace) {
                  router.replace(newUrl, { scroll: false });
             } else {
                  router.push(newUrl, { scroll: false });
             }
        }
    }, [searchParams, pathname, router]);

    const [page, setPage] = useState(() => {
        const p = searchParams.get('page');
        return p ? parseInt(p, 10) : 1;
    });
    const [limit, setLimit] = useState(() => {
        const l = searchParams.get('limit');
        return l ? parseInt(l, 10) : 50;
    });

    useEffect(() => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            let changed = false;

            const currentUrlPage = next.get('page');
            if (page > 1) {
                if (currentUrlPage !== String(page)) {
                    next.set('page', page);
                    changed = true;
                }
            } else if (currentUrlPage) {
                next.delete('page');
                changed = true;
            }

            const currentUrlLimit = next.get('limit');
            if (limit !== 50) {
                if (currentUrlLimit !== String(limit)) {
                    next.set('limit', limit);
                    changed = true;
                }
            } else if (currentUrlLimit) {
                next.delete('limit');
                changed = true;
            }

            return changed ? next : prev;
        }, { replace: true });
    }, [page, limit, setSearchParams]);
    const [nameSearch, setNameSearch] = useState(() => searchParams.get('name') || '');
    const [debouncedName, setDebouncedName] = useState(() => searchParams.get('name') || '');
    const [emailSearch, setEmailSearch] = useState(() => searchParams.get('email') || '');
    const [debouncedEmail, setDebouncedEmail] = useState(() => searchParams.get('email') || '');
    const [debouncedVerified, setDebouncedVerified] = useState(() => {
        const v = searchParams.get('verified'); return v ? v : '';
    });
    const [verificationFilter, setVerificationFilter] = useState(() => {
        const v = searchParams.get('verified');
        return v === 'true' ? 'verified' : v === 'false' ? 'unverified' : 'all';
    });
    const [debouncedBlocked, setDebouncedBlocked] = useState(() => {
        const b = searchParams.get('blocked'); return b ? b : '';
    });
    const [blockedFilter, setBlockedFilter] = useState(() => {
        const b = searchParams.get('blocked');
        return b === 'true' ? 'blocked' : b === 'false' ? 'active' : 'all';
    });
    const [debouncedGoogle, setDebouncedGoogle] = useState(() => {
        const g = searchParams.get('google'); return g ? g : '';
    });
    const [googleFilter, setGoogleFilter] = useState(() => {
        const g = searchParams.get('google');
        return g === 'true' ? 'google' : g === 'false' ? 'manual' : 'all';
    });
    const [debouncedPreference, setDebouncedPreference] = useState(() => {
        return searchParams.get('preference') || '';
    });
    const [preferenceFilter, setPreferenceFilter] = useState(() => {
        return searchParams.get('preference') || 'all';
    });
    const [debouncedRole, setDebouncedRole] = useState(() => {
        return searchParams.get('role') || '';
    });
    const [roleFilter, setRoleFilter] = useState(() => {
        return searchParams.get('role') || 'all';
    });

    const [lastActiveSearch, setLastActiveSearch] = useState(() => searchParams.get('last_active') || '');
    const [debouncedLastActive, setDebouncedLastActive] = useState(() => searchParams.get('last_active') || '');
    const [registeredAtSearch, setRegisteredAtSearch] = useState(() => searchParams.get('registered_at') || '');
    const [debouncedRegisteredAt, setDebouncedRegisteredAt] = useState(() => searchParams.get('registered_at') || '');
    const [updatedAtSearch, setUpdatedAtSearch] = useState(() => searchParams.get('updated_at') || '');
    const [debouncedUpdatedAt, setDebouncedUpdatedAt] = useState(() => searchParams.get('updated_at') || '');

    const [loadingUsers, setLoadingUsers] = useState({});
    const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
    const [confirmUser, setConfirmUser] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [loginConfirmOpen, setLoginConfirmOpen] = useState(false);
    const [confirmLoginUser, setConfirmLoginUser] = useState(null);
    const [isSwitchingUser, setIsSwitchingUser] = useState(false);
    const [showFilters, setShowFilters] = useState(true);

    const { data: settingsData } = useGetAllSettingsQuery();
    const isBlockingEnabled = useMemo(() => {
        const blockingSetting = settingsData?.data?.find(s => s.key === 'enable_user_blocking_option');
        return blockingSetting ? blockingSetting.value === 'true' : true;
    }, [settingsData]);

    const isUserLoginEnabled = useMemo(() => {
        const loginSetting = settingsData?.data?.find(s => s.key === 'enable_user_login_option');
        return loginSetting ? loginSetting.value === 'true' : false;
    }, [settingsData]);

    const isRoleUpdateEnabled = useMemo(() => {
        return settingsData?.data?.find(s => s.key === 'enable_role_update_option')?.value === 'true';
    }, [settingsData]);

    const [blockUser] = useBlockUserMutation();
    const [unblockUser] = useUnblockUserMutation();
    const [updateUserRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();
    const [loginAsUser] = useLoginAsUserMutation();

    const { data: rolesData } = useGetAllRolesQuery({ limit: 100 });
    const rolesList = useMemo(() => rolesData?.data || [], [rolesData]);

    useEffect(() => {
        document.title = "Users";
    }, []);

    const { data: usersData, isLoading, isFetching } = useGetAllUsersQuery({
        page,
        limit,
        name: debouncedName,
        email: debouncedEmail,
        role: debouncedRole,
        verified: debouncedVerified,
        google: debouncedGoogle,
        preference: debouncedPreference,
        blocked: debouncedBlocked,
        last_active: debouncedLastActive,
        registered_at: debouncedRegisteredAt,
        updated_at: debouncedUpdatedAt,
    });

    const users = useMemo(() => usersData?.data || [], [usersData]);

    const pagination = useMemo(() => {
        return {
            total: usersData?.pagination?.total || 0,
            page: usersData?.pagination?.page || page,
            limit: usersData?.pagination?.limit || limit,
            totalPages: usersData?.pagination?.totalPages || 1
        };
    }, [usersData, page, limit]);

    const onNameSearchChange = (e) => setNameSearch(e.target.value);
    const onEmailSearchChange = (e) => setEmailSearch(e.target.value);
    const onFilterChange = (e) => setVerificationFilter(e.target.value);
    const onBlockedFilterChange = (e) => setBlockedFilter(e.target.value);
    const onPreferenceFilterChange = (e) => setPreferenceFilter(e.target.value);
    const onGoogleFilterChange = (e) => setGoogleFilter(e.target.value);
    const onRoleFilterChange = (e) => setRoleFilter(e.target.value);

    const onLastActiveChange = (newValue) => {
        setLastActiveSearch(newValue ? newValue.format('YYYY-MM-DD') : '');
    };
    const onRegisteredAtChange = (newValue) => {
        setRegisteredAtSearch(newValue ? newValue.format('YYYY-MM-DD') : '');
    };
    const onUpdatedAtChange = (newValue) => {
        setUpdatedAtSearch(newValue ? newValue.format('YYYY-MM-DD') : '');
    };

    const handleSearch = () => {
        setDebouncedName(nameSearch);
        setDebouncedEmail(emailSearch);
        
        const verifApiVal = verificationFilter === 'all' ? '' : (verificationFilter === 'verified' ? 'true' : 'false');
        setDebouncedVerified(verifApiVal);
        
        const blockedApiVal = blockedFilter === 'all' ? '' : (blockedFilter === 'blocked' ? 'true' : 'false');
        setDebouncedBlocked(blockedApiVal);
        
        const googleApiVal = googleFilter === 'all' ? '' : (googleFilter === 'google' ? 'true' : 'false');
        setDebouncedGoogle(googleApiVal);
        
        const prefApiVal = preferenceFilter === 'all' ? '' : preferenceFilter;
        setDebouncedPreference(prefApiVal);
        
        const roleApiVal = roleFilter === 'all' ? '' : roleFilter;
        setDebouncedRole(roleApiVal);
        
        setDebouncedLastActive(lastActiveSearch);
        setDebouncedRegisteredAt(registeredAtSearch);
        setDebouncedUpdatedAt(updatedAtSearch);
        
        setPage(1);

        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            
            if (nameSearch) next.set('name', nameSearch); else next.delete('name');
            if (emailSearch) next.set('email', emailSearch); else next.delete('email');
            if (verifApiVal) next.set('verified', verifApiVal); else next.delete('verified');
            if (blockedApiVal) next.set('blocked', blockedApiVal); else next.delete('blocked');
            if (googleApiVal) next.set('google', googleApiVal); else next.delete('google');
            if (prefApiVal) next.set('preference', prefApiVal); else next.delete('preference');
            if (roleApiVal) next.set('role', roleApiVal); else next.delete('role');
            if (lastActiveSearch) next.set('last_active', lastActiveSearch); else next.delete('last_active');
            if (registeredAtSearch) next.set('registered_at', registeredAtSearch); else next.delete('registered_at');
            if (updatedAtSearch) next.set('updated_at', updatedAtSearch); else next.delete('updated_at');

            return next;
        });
    };

    const handleToggleBlockStatus = (user) => {
        if (!canUpdateUser && !isAdmin) {
            toast.error('You do not have permission to block users');
            return;
        }
        if (!isBlockingEnabled) {
            toast.info('User blocking is currently disabled in system configuration');
            return;
        }
        setConfirmUser(user);
        setBlockConfirmOpen(true);
    };

    const handleConfirmBlockAction = async () => {
        if (!confirmUser) return;
        setIsConfirming(true);
        try {
            if (confirmUser.blocked) {
                await unblockUser(confirmUser.user_id).unwrap();
                toast.success('User unblocked successfully');
            } else {
                await blockUser(confirmUser.user_id).unwrap();
                toast.success('User blocked successfully');
            }
            setBlockConfirmOpen(false);
        } catch (err) {
            toast.error(err?.data?.message || 'Action failed');
        } finally {
            setIsConfirming(false);
            setConfirmUser(null);
        }
    };

    const handleRoleChange = async (userId, roleId) => {
        if (!canUpdateRole && !isAdmin) {
            toast.error('You do not have permission to update user roles');
            return;
        }
        try {
            await updateUserRole({ userId, roleId }).unwrap();
            toast.success('User role updated successfully');
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to update role');
        }
    };

    const handleCloseBlockConfirm = () => {
        setBlockConfirmOpen(false);
        setConfirmUser(null);
        setIsConfirming(false);
    };

    const handleOpenLoginConfirm = (user) => {
        if (!isUserLoginEnabled || (!canUpdateUser && !isAdmin)) {
            return;
        }
        setConfirmLoginUser(user);
        setLoginConfirmOpen(true);
    };

    const handleConfirmLoginAsUser = async () => {
        if (!confirmLoginUser) return;
        setIsSwitchingUser(true);
        try {
            await loginAsUser(confirmLoginUser.user_id).unwrap();
            setLoginConfirmOpen(false);
            setConfirmLoginUser(null);
            toast.success('Logged in as selected user');
            router.push('/');
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to switch user');
        } finally {
            setIsSwitchingUser(false);
        }
    };

    const handleCloseLoginConfirm = () => {
        setLoginConfirmOpen(false);
        setConfirmLoginUser(null);
        setIsSwitchingUser(false);
    };

    const handleLimitChange = (e) => {
        setLimit(e.target.value);
        setPage(1);
    };

    const selectStyles = {
        height: 38,
        bgcolor: isDarkMode ? '#283046' : '#fff',
        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: isDarkMode ? '#404656' : '#d8d6de' }
    };

    const menuPropsStyles = {
        sx: {
            '& .MuiPaper-root': {
                bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important',
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                borderRadius: '6px',
                border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
            },
            '& .MuiMenuItem-root': {
                fontSize: '0.9rem',
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                    color: '#7367f0 !important'
                },
                '&.Mui-selected': {
                    bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                    color: '#7367f0 !important',
                    fontWeight: 500,
                    '&:hover': {
                        bgcolor: 'rgba(115, 103, 240, 0.16) !important'
                    }
                }
            }
        }
    };
    const datePickerTextFieldStyles = {
        size: 'small',
        sx: {
            width: '170px',
            '& .MuiInputBase-root': {
                height: 38,
                bgcolor: isDarkMode ? '#283046' : '#fff',
                borderRadius: '4px',
                color: isDarkMode ? '#ffffff !important' : '#6e6b7b !important',
                '-webkit-text-fill-color': isDarkMode ? '#ffffff !important' : '#6e6b7b !important',
            },
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#404656' : '#d8d6de'
            },
            '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#6b7280' : '#b4b7bd'
            },
            '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#7367f0',
                borderWidth: '1px'
            },
            '& input': {
                color: isDarkMode ? '#ffffff !important' : '#6e6b7b !important',
                '-webkit-text-fill-color': `${isDarkMode ? '#ffffff' : '#6e6b7b'} !important`,
                WebkitTextFillColor: `${isDarkMode ? '#ffffff' : '#6e6b7b'} !important`,
                opacity: 1,
            },
            '& input::placeholder': {
                color: isDarkMode ? '#b4b7bd !important' : '#9ca3af !important',
                WebkitTextFillColor: `${isDarkMode ? '#b4b7bd' : '#9ca3af'} !important`,
                WebkitTextFillColor: `${isDarkMode ? '#b4b7bd' : '#9ca3af'} !important`,
                opacity: 1
            },
            '& *': {
                color: isDarkMode ? '#ffffff !important' : 'inherit',
                WebkitTextFillColor: isDarkMode ? '#ffffff !important' : 'inherit',
            },
            '& .MuiSvgIcon-root': {
                color: isDarkMode ? '#d0d2d6' : '#6e6b7b'
            }
        },
        inputProps: {
            style: {
                color: isDarkMode ? '#ffffff' : '#6e6b7b',
                WebkitTextFillColor: isDarkMode ? '#ffffff' : '#6e6b7b',
                opacity: 1
            }
        }
    };

    const datePickerDayStyles = {
        sx: {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            backgroundColor: 'transparent',
            '&.Mui-selected': {
                backgroundColor: '#7367f0 !important',
                color: '#ffffff !important',
            },
            '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(0, 0, 0, 0.04) !important',
            },
            '&.MuiPickersDay-today': {
                borderColor: '#7367f0 !important',
            }
        }
    };

    const datePickerPopperStyles = {
        sx: {
            '& .MuiPaper-root': {
                bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important',
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                backgroundImage: 'none',
            },
            '& .MuiPickersCalendarHeader-root': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            },
            '& .MuiPickersCalendarHeader-label': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            },
            '& .MuiDayCalendar-weekDayLabel': {
                color: isDarkMode ? '#b4b7bd !important' : '#6e6b7b !important',
            },
            '& .MuiIconButton-root': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            },
            '& button.MuiPickersDay-root': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                backgroundColor: 'transparent',
            },
            '& button.MuiPickersDay-root:not(.Mui-selected)': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            },
            '& button.MuiPickersDay-dayOutsideMonth': {
                color: isDarkMode ? '#6e6b7b !important' : '#b4b7bd !important',
            },
            '& button.MuiPickersDay-root:hover': {
                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(0, 0, 0, 0.04) !important',
            },
            '& button.MuiPickersDay-root.Mui-selected': {
                bgcolor: '#7367f0 !important',
                color: '#ffffff !important',
            },
            '& .MuiPickersYear-yearButton': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            },
            '& .MuiPickersMonth-monthButton': {
                color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            }
        }
    };

    // Mobile: DatePicker opens a dialog instead of a popper — needs separate dark mode styles
    const calendarDarkSx = {
        bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important',
        color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        backgroundImage: 'none',
        '& .MuiPickersCalendarHeader-root': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        },
        '& .MuiPickersCalendarHeader-label': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        },
        '& .MuiDayCalendar-weekDayLabel': {
            color: isDarkMode ? '#b4b7bd !important' : '#6e6b7b !important',
        },
        '& .MuiIconButton-root': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        },
        '& button.MuiPickersDay-root': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
            backgroundColor: 'transparent',
        },
        '& button.MuiPickersDay-root:not(.Mui-selected)': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        },
        '& button.MuiPickersDay-dayOutsideMonth': {
            color: isDarkMode ? '#6e6b7b !important' : '#b4b7bd !important',
        },
        '& button.MuiPickersDay-root:hover': {
            backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(0, 0, 0, 0.04) !important',
        },
        '& button.MuiPickersDay-root.Mui-selected': {
            backgroundColor: '#7367f0 !important',
            color: '#ffffff !important',
        },
        '& .MuiPickersYear-yearButton': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        },
        '& .MuiPickersMonth-monthButton': {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        },
        '& .MuiDialogActions-root .MuiButton-root': {
            color: isDarkMode ? '#7367f0 !important' : '#7367f0 !important',
        },
        '& .MuiPickersToolbar-root': {
            bgcolor: isDarkMode ? '#1a2035 !important' : '#7367f0 !important',
            color: '#ffffff !important',
            '& *': { color: '#ffffff !important' },
        },
    };

    const datePickerDialogStyles = {
        sx: {
            '& .MuiDialog-paper': {
                ...calendarDarkSx,
                border: isDarkMode ? '1px solid #404656' : 'none',
                boxShadow: isDarkMode
                    ? '0 8px 32px 0 rgba(0,0,0,0.48)'
                    : '0 8px 32px 0 rgba(34,41,47,0.18)',
            },
        },
    };

    const datePickerMobilePaperStyles = {
        sx: calendarDarkSx,
    };

    const hasActiveFilters =
        verificationFilter !== 'all' ||
        blockedFilter !== 'all' ||
        googleFilter !== 'all' ||
        roleFilter !== 'all' ||
        preferenceFilter !== 'all' ||
        nameSearch !== '' ||
        emailSearch !== '' ||
        lastActiveSearch !== '' ||
        registeredAtSearch !== '' ||
        updatedAtSearch !== '';

    const handleClearFilters = () => {
        setVerificationFilter('all');
        setBlockedFilter('all');
        setGoogleFilter('all');
        setRoleFilter('all');
        setPreferenceFilter('all');
        setNameSearch('');
        setEmailSearch('');
        setLastActiveSearch('');
        setRegisteredAtSearch('');
        setUpdatedAtSearch('');

        setDebouncedVerified('');
        setDebouncedBlocked('');
        setDebouncedGoogle('');
        setDebouncedRole('');
        setDebouncedPreference('');
        setDebouncedName('');
        setDebouncedEmail('');
        setDebouncedLastActive('');
        setDebouncedRegisteredAt('');
        setDebouncedUpdatedAt('');

        setPage(1);
        setSearchParams(new URLSearchParams());
    };

    if (!canList && !isAdmin) {
        return <AccessDenied message="You do not have permission to view User Management." />;
    }

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
                            Users
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={() => setShowFilters(!showFilters)}
                        startIcon={showFilters ? <FilterAltOffOutlined /> : <FilterAltOutlined />}
                        sx={{ 
                            textTransform: 'none', 
                            borderColor: isDarkMode ? '#404656' : '#d8d6de', 
                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                            '&:hover': {
                                borderColor: '#7367f0',
                                color: '#7367f0',
                                backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.08)'
                            }
                        }}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{showFilters ? 'Hide Filters' : 'Show Filters'}</Box>
                    </Button>
                </Box>

                {/* ── Filters row ───────────────────────────────────────────── */}
                <Collapse in={showFilters} timeout="auto" unmountOnExit>
                    <Box className="flex flex-col p-5 gap-4" sx={{ borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` }}>
                        <Box className="flex flex-wrap items-center gap-4">
                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Name:</Typography>
                            <input
                                type="text"
                                value={nameSearch}
                                onChange={onNameSearchChange}
                                className="px-3 py-2 border rounded outline-none transition-colors"
                                style={{
                                    height: '38px',
                                    width: '200px',
                                    backgroundColor: isDarkMode ? '#283046' : '#fff',
                                    borderColor: isDarkMode ? '#404656' : '#d8d6de',
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                }}
                            />
                        </Box>
                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Email:</Typography>
                            <input
                                type="text"
                                value={emailSearch}
                                onChange={onEmailSearchChange}
                                className="px-3 py-2 border rounded outline-none transition-colors"
                                style={{
                                    height: '38px',
                                    width: '200px',
                                    backgroundColor: isDarkMode ? '#283046' : '#fff',
                                    borderColor: isDarkMode ? '#404656' : '#d8d6de',
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                }}
                            />
                        </Box>

                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Role:</Typography>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Autocomplete
                                    size="small"
                                    options={[
                                        { label: 'All Roles', value: 'all' },
                                        ...rolesList.map(role => ({
                                            label: role.name.charAt(0).toUpperCase() + role.name.slice(1),
                                            value: role.name
                                        }))
                                    ]}
                                    getOptionLabel={(option) => option.label || ''}
                                    value={
                                        [
                                            { label: 'All Roles', value: 'all' },
                                            ...rolesList.map(role => ({
                                                label: role.name.charAt(0).toUpperCase() + role.name.slice(1),
                                                value: role.name
                                            }))
                                        ].find(opt => opt.value === roleFilter) || { label: 'All Roles', value: 'all' }
                                    }
                                    onChange={(_, newValue) => {
                                        onRoleFilterChange({ target: { value: newValue ? newValue.value : 'all' } });
                                    }}
                                    isOptionEqualToValue={(option, value) => option.value === value.value}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="All Roles"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    padding: '0 39px 0 0 !important',
                                                    height: 38,
                                                    ...selectStyles,
                                                },
                                                '& .MuiInputBase-input': {
                                                    padding: '8px 14px !important',
                                                    height: 'auto',
                                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                    '&::placeholder': {
                                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                        opacity: 1,
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                    disablePortal={true}
                                    slotProps={{
                                        paper: {
                                            sx: {
                                                bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                borderRadius: '6px',
                                                border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                                                boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                                                '& .MuiAutocomplete-listbox': {
                                                    padding: '0',
                                                    '& .MuiAutocomplete-option': {
                                                        fontSize: '0.9rem',
                                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                        '&[aria-selected="true"]': {
                                                            bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                                                            color: '#7367f0 !important',
                                                            fontWeight: 500,
                                                            '&.Mui-focused': {
                                                                bgcolor: 'rgba(115, 103, 240, 0.16) !important'
                                                            }
                                                        },
                                                        '&:hover': {
                                                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                                            color: '#7367f0 !important'
                                                        },
                                                        '&.Mui-focused': {
                                                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                                            color: '#7367f0 !important'
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    sx={{ 
                                        width: '100%',
                                        '& .MuiAutocomplete-popupIndicator': {
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        },
                                        '& .MuiAutocomplete-clearIndicator': {
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        }
                                    }}
                                />
                            </FormControl>
                        </Box>

                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Users:</Typography>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Autocomplete
                                    size="small"
                                    options={[
                                        { label: 'All Users', value: 'all' },
                                        { label: 'Verified', value: 'verified' },
                                        { label: 'Unverified', value: 'unverified' }
                                    ]}
                                    getOptionLabel={(option) => option.label || ''}
                                    value={
                                        [
                                            { label: 'All Users', value: 'all' },
                                            { label: 'Verified', value: 'verified' },
                                            { label: 'Unverified', value: 'unverified' }
                                        ].find(opt => opt.value === verificationFilter) || { label: 'All Users', value: 'all' }
                                    }
                                    onChange={(_, newValue) => {
                                        onFilterChange({ target: { value: newValue ? newValue.value : 'all' } });
                                    }}
                                    isOptionEqualToValue={(option, value) => option.value === value.value}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="All Users"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    padding: '0 39px 0 0 !important',
                                                    height: 38,
                                                    ...selectStyles,
                                                },
                                                '& .MuiInputBase-input': {
                                                    padding: '8px 14px !important',
                                                    height: 'auto',
                                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                    '&::placeholder': {
                                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                        opacity: 1,
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                    disablePortal={true}
                                    slotProps={{
                                        paper: {
                                            sx: {
                                                bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                borderRadius: '6px',
                                                border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                                                boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                                                '& .MuiAutocomplete-listbox': {
                                                    padding: '0',
                                                    '& .MuiAutocomplete-option': {
                                                        fontSize: '0.9rem',
                                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                        '&[aria-selected="true"]': {
                                                            bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                                                            color: '#7367f0 !important',
                                                            fontWeight: 500,
                                                            '&.Mui-focused': {
                                                                bgcolor: 'rgba(115, 103, 240, 0.16) !important'
                                                            }
                                                        },
                                                        '&:hover': {
                                                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                                            color: '#7367f0 !important'
                                                        },
                                                        '&.Mui-focused': {
                                                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                                            color: '#7367f0 !important'
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    sx={{ 
                                        width: '100%',
                                        '& .MuiAutocomplete-popupIndicator': {
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        },
                                        '& .MuiAutocomplete-clearIndicator': {
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        }
                                    }}
                                />
                            </FormControl>
                        </Box>

                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Login:</Typography>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Autocomplete
                                    size="small"
                                    options={[
                                        { label: 'All Login', value: 'all' },
                                        { label: 'Google', value: 'google' },
                                        { label: 'Manual', value: 'manual' }
                                    ]}
                                    getOptionLabel={(option) => option.label || ''}
                                    value={
                                        [
                                            { label: 'All Login', value: 'all' },
                                            { label: 'Google', value: 'google' },
                                            { label: 'Manual', value: 'manual' }
                                        ].find(opt => opt.value === googleFilter) || { label: 'All Login', value: 'all' }
                                    }
                                    onChange={(_, newValue) => {
                                        onGoogleFilterChange({ target: { value: newValue ? newValue.value : 'all' } });
                                    }}
                                    isOptionEqualToValue={(option, value) => option.value === value.value}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="All Login"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    padding: '0 39px 0 0 !important',
                                                    height: 38,
                                                    ...selectStyles,
                                                },
                                                '& .MuiInputBase-input': {
                                                    padding: '8px 14px !important',
                                                    height: 'auto',
                                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                    '&::placeholder': {
                                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                        opacity: 1,
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                    disablePortal={true}
                                    slotProps={{
                                        paper: {
                                            sx: {
                                                bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                borderRadius: '6px',
                                                border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                                                boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                                                '& .MuiAutocomplete-listbox': {
                                                    padding: '0',
                                                    '& .MuiAutocomplete-option': {
                                                        fontSize: '0.9rem',
                                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                        '&[aria-selected="true"]': {
                                                            bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                                                            color: '#7367f0 !important',
                                                            fontWeight: 500,
                                                            '&.Mui-focused': {
                                                                bgcolor: 'rgba(115, 103, 240, 0.16) !important'
                                                            }
                                                        },
                                                        '&:hover': {
                                                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                                            color: '#7367f0 !important'
                                                        },
                                                        '&.Mui-focused': {
                                                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                                            color: '#7367f0 !important'
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    sx={{ 
                                        width: '100%',
                                        '& .MuiAutocomplete-popupIndicator': {
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        },
                                        '& .MuiAutocomplete-clearIndicator': {
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        }
                                    }}
                                />
                            </FormControl>
                        </Box>

                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Preference:</Typography>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Autocomplete
                                    size="small"
                                    options={[
                                        { label: 'All Preference', value: 'all' },
                                        { label: 'Veg', value: 'veg' },
                                        { label: 'Non-Veg', value: 'non-veg' },
                                        { label: 'Egg', value: 'egg' }
                                    ]}
                                    getOptionLabel={(option) => option.label || ''}
                                    value={
                                        [
                                            { label: 'All Preference', value: 'all' },
                                            { label: 'Veg', value: 'veg' },
                                            { label: 'Non-Veg', value: 'non-veg' },
                                            { label: 'Egg', value: 'egg' }
                                        ].find(opt => opt.value === preferenceFilter) || { label: 'All Preference', value: 'all' }
                                    }
                                    onChange={(_, newValue) => {
                                        onPreferenceFilterChange({ target: { value: newValue ? newValue.value : 'all' } });
                                    }}
                                    isOptionEqualToValue={(option, value) => option.value === value.value}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="All Preference"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    padding: '0 39px 0 0 !important',
                                                    height: 38,
                                                    ...selectStyles,
                                                },
                                                '& .MuiInputBase-input': {
                                                    padding: '8px 14px !important',
                                                    height: 'auto',
                                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                    '&::placeholder': {
                                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                        opacity: 1,
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                    disablePortal={true}
                                    slotProps={{
                                        paper: {
                                            sx: {
                                                bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                borderRadius: '6px',
                                                border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                                                boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                                                '& .MuiAutocomplete-listbox': {
                                                    padding: '0',
                                                    '& .MuiAutocomplete-option': {
                                                        fontSize: '0.9rem',
                                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                        '&[aria-selected="true"]': {
                                                            bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                                                            color: '#7367f0 !important',
                                                            fontWeight: 500,
                                                            '&.Mui-focused': {
                                                                bgcolor: 'rgba(115, 103, 240, 0.16) !important'
                                                            }
                                                        },
                                                        '&:hover': {
                                                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                                            color: '#7367f0 !important'
                                                        },
                                                        '&.Mui-focused': {
                                                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                                            color: '#7367f0 !important'
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    sx={{ 
                                        width: '100%',
                                        '& .MuiAutocomplete-popupIndicator': {
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        },
                                        '& .MuiAutocomplete-clearIndicator': {
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        }
                                    }}
                                />
                            </FormControl>
                        </Box>

                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Status:</Typography>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Autocomplete
                                    size="small"
                                    options={[
                                        { label: 'All Status', value: 'all' },
                                        { label: 'Blocked', value: 'blocked' },
                                        { label: 'Active', value: 'active' }
                                    ]}
                                    getOptionLabel={(option) => option.label || ''}
                                    value={
                                        [
                                            { label: 'All Status', value: 'all' },
                                            { label: 'Blocked', value: 'blocked' },
                                            { label: 'Active', value: 'active' }
                                        ].find(opt => opt.value === blockedFilter) || { label: 'All Status', value: 'all' }
                                    }
                                    onChange={(_, newValue) => {
                                        onBlockedFilterChange({ target: { value: newValue ? newValue.value : 'all' } });
                                    }}
                                    isOptionEqualToValue={(option, value) => option.value === value.value}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="All Status"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    padding: '0 39px 0 0 !important',
                                                    height: 38,
                                                    ...selectStyles,
                                                },
                                                '& .MuiInputBase-input': {
                                                    padding: '8px 14px !important',
                                                    height: 'auto',
                                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                    '&::placeholder': {
                                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                        opacity: 1,
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                    disablePortal={true}
                                    slotProps={{
                                        paper: {
                                            sx: {
                                                bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                borderRadius: '6px',
                                                border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                                                boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                                                '& .MuiAutocomplete-listbox': {
                                                    padding: '0',
                                                    '& .MuiAutocomplete-option': {
                                                        fontSize: '0.9rem',
                                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                        '&[aria-selected="true"]': {
                                                            bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                                                            color: '#7367f0 !important',
                                                            fontWeight: 500,
                                                            '&.Mui-focused': {
                                                                bgcolor: 'rgba(115, 103, 240, 0.16) !important'
                                                            }
                                                        },
                                                        '&:hover': {
                                                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                                            color: '#7367f0 !important'
                                                        },
                                                        '&.Mui-focused': {
                                                            bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(115, 103, 240, 0.08) !important',
                                                            color: '#7367f0 !important'
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    sx={{ 
                                        width: '100%',
                                        '& .MuiAutocomplete-popupIndicator': {
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        },
                                        '& .MuiAutocomplete-clearIndicator': {
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        }
                                    }}
                                />
                            </FormControl>
                        </Box>

                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            <Box className="flex items-center gap-2">
                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Last Active:</Typography>
                                <DatePicker
                                    value={lastActiveSearch ? moment(lastActiveSearch) : null}
                                    onChange={onLastActiveChange}
                                    format="MM/DD/YYYY"
                                    slotProps={{ textField: datePickerTextFieldStyles, popper: datePickerPopperStyles, day: datePickerDayStyles, dialog: datePickerDialogStyles, mobilePaper: datePickerMobilePaperStyles }}
                                />
                            </Box>
                            <Box className="flex items-center gap-2">
                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Registered:</Typography>
                                <DatePicker
                                    value={registeredAtSearch ? moment(registeredAtSearch) : null}
                                    onChange={onRegisteredAtChange}
                                    format="MM/DD/YYYY"
                                    slotProps={{ textField: datePickerTextFieldStyles, popper: datePickerPopperStyles, day: datePickerDayStyles, dialog: datePickerDialogStyles, mobilePaper: datePickerMobilePaperStyles }}
                                />
                            </Box>
                            <Box className="flex items-center gap-2">
                                <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Updated:</Typography>
                                <DatePicker
                                    value={updatedAtSearch ? moment(updatedAtSearch) : null}
                                    onChange={onUpdatedAtChange}
                                    format="MM/DD/YYYY"
                                    slotProps={{ textField: datePickerTextFieldStyles, popper: datePickerPopperStyles, day: datePickerDayStyles, dialog: datePickerDialogStyles, mobilePaper: datePickerMobilePaperStyles }}
                                />
                            </Box>
                        </LocalizationProvider>
                    </Box>

                    {/* Action Buttons */}
                    <Box className="flex justify-end items-center gap-3">
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleClearFilters}
                            disabled={!hasActiveFilters}
                            sx={{ height: '38px', minWidth: { xs: '38px', sm: '120px' }, textTransform: 'none', px: { xs: 0, sm: 3 } }}
                        >
                            <ClearAllIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Clear</Box>
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSearch}
                            sx={{ height: '38px', minWidth: { xs: '38px', sm: '120px' }, textTransform: 'none', px: { xs: 0, sm: 3 }, bgcolor: '#7367f0', '&:hover': { bgcolor: '#5e50ee' }, boxShadow: 'none' }}
                        >
                            <SearchIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Search</Box>
                        </Button>
                    </Box>
                </Box>
                </Collapse>


                {/* ── Standard MUI Table ───────────────────────────────────────────── */}
                <TableContainer 
                    component={Paper} 
                    elevation={0}
                    sx={{ 
                        flex: 1,
                        width: '100%',
                        backgroundColor: 'transparent',
                        backgroundImage: 'none',
                        boxShadow: 'none',
                        borderRadius: 0,
                        overflowX: 'auto',
                    }}
                >
                    <Table stickyHeader sx={{ minWidth: 1200, borderCollapse: 'separate', borderSpacing: 0 }}>
                        <TableHead>
                            <TableRow sx={{ 
                                'height': '48px',
                                '& th': { 
                                    backgroundColor: isDarkMode ? '#283046' : '#f3f2f7',
                                    color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderBottom: 'none',
                                    borderTop: 'none',
                                    py: 0,
                                    px: 2,
                                } 
                            }}>
                                <TableCell align="center" width="50">#</TableCell>
                                <TableCell sx={{ minWidth: 300 }}>USER</TableCell>
                                <TableCell>EMAIL</TableCell>
                                <TableCell align="center" width="140">ROLE</TableCell>
                                <TableCell align="center" width="100">VERIFIED</TableCell>
                                <TableCell align="center" width="100">GOOGLE</TableCell>
                                <TableCell align="center">PREFERENCES</TableCell>
                                <TableCell align="center" width="100">BLOCKED</TableCell>
                                <TableCell align="center" sx={{ minWidth: 160 }}>BLOCKED AT</TableCell>
                                {isUserLoginEnabled && <TableCell align="center" width="90">LOGIN</TableCell>}
                                <TableCell align="center" sx={{ minWidth: 160 }}>LAST ACTIVE</TableCell>
                                <TableCell align="center" sx={{ minWidth: 160 }}>REGISTERED AT</TableCell>
                                <TableCell align="center" sx={{ minWidth: 160 }}>UPDATED AT</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading || isFetching ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={12} align="center" sx={{ borderBottom: 'none', backgroundColor: isDarkMode ? '#283046' : '#ffffff' }}>
                                        <CircularProgress size={24} sx={{ color: '#7367f0' }} />
                                    </TableCell>
                                </TableRow>
                            ) : users?.length === 0 ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={12} align="center" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', borderBottom: 'none', backgroundColor: isDarkMode ? '#283046' : '#ffffff' }}>
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users?.map((userItem, index) => {
                                    const roleStyle = (() => {
                                        const lRole = userItem.role_name?.toLowerCase() || '';
                                        if (lRole === 'admin') return { bg: isDarkMode ? 'rgba(99,102,241,0.18)' : '#ede9fe', text: isDarkMode ? '#a5b4fc' : '#4f46e5' };
                                        if (lRole === 'user') return { bg: isDarkMode ? 'rgba(10,185,129,0.15)' : '#d1fae5', text: isDarkMode ? '#6ee7b7' : '#059669' };
                                        if (lRole === 'data entry') return { bg: isDarkMode ? 'rgba(6,182,212,0.15)' : '#cffafe', text: isDarkMode ? '#67e8f9' : '#0891b2' };
                                        return { bg: isDarkMode ? 'rgba(115,103,240,0.15)' : '#ede9fe', text: isDarkMode ? '#c4b5fd' : '#7c3aed' };
                                    })();

                                    return (
                                        <TableRow 
                                            key={userItem.user_id}
                                            sx={{ 
                                                height: '60px',
                                                backgroundColor: index % 2 === 0 ? (isDarkMode ? '#283046' : '#ffffff') : (isDarkMode ? '#283046' : '#fafbfc'),
                                                '&:hover': { backgroundColor: isDarkMode ? '#2f3851' : '#f8f8f8' },
                                                transition: 'background-color 0.2s ease',
                                                '& td': { 
                                                    borderBottom: 'none',
                                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                    py: 0,
                                                    px: 2,
                                                }
                                            }}
                                        >
                                            <TableCell align="center">
                                                {(page - 1) * limit + index + 1}
                                            </TableCell>
                                            
                                            {/* USER */}
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar
                                                        src={userItem.image ? getImage(userItem.image) : ''}
                                                        alt={userItem.name}
                                                        sx={{ width: 35, height: 35, bgcolor: !userItem.image ? (userItem.profile_color || '#2563eb') : 'transparent', color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}
                                                    >
                                                        {!userItem.image && userItem.name?.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#d0d2d6' : '#4b4b4b', lineHeight: 1.2 }}>
                                                            {userItem.name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: isDarkMode ? '#b4b7bd' : '#a1a1aa', mt: 0.5 }}>
                                                            {userItem.role_name}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            
                                            {/* EMAIL */}
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }}>
                                                    {userItem.email}
                                                </Typography>
                                            </TableCell>

                                            {/* ROLE */}
                                            <TableCell align="center">
                                                {isRoleUpdateEnabled && canUpdateRole ? (
                                                    <Select
                                                        size="small"
                                                        value={rolesList.find(r => r.name === userItem.role_name)?.role_id || ''}
                                                        onChange={(e) => handleRoleChange(userItem.user_id, e.target.value)}
                                                        disabled={isUpdatingRole || userItem.email === 'togethercook1@gmail.com'}
                                                        sx={{ ...selectStyles, height: 32, width: '100%', minWidth: '100px' }}
                                                        MenuProps={menuPropsStyles}
                                                    >
                                                        {rolesList.map((r) => (
                                                            <MenuItem key={r.role_id} value={r.role_id} sx={{ fontSize: '0.75rem' }}>
                                                                {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                ) : (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ bgcolor: roleStyle.bg, color: roleStyle.text, px: 1.5, py: 0.5, borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize' }}
                                                    >
                                                        {userItem.role_name || 'User'}
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            {/* VERIFIED */}
                                            <TableCell align="center">
                                                {userItem.is_verified ? (
                                                    <CheckCircle sx={{ color: '#28c76f', fontSize: '1.2rem' }} />
                                                ) : (
                                                    <Cancel sx={{ color: '#ea5455', fontSize: '1.2rem' }} />
                                                )}
                                            </TableCell>

                                            {/* GOOGLE */}
                                            <TableCell align="center">
                                                {userItem.is_google ? (
                                                    <CheckCircle sx={{ color: '#4285F4', fontSize: '1.2rem' }} />
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#9ca3af', fontWeight: 500 }}>
                                                        No
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            {/* PREFERENCES */}
                                            <TableCell align="center">
                                                {userItem.preference && Array.isArray(userItem.preference) && userItem.preference.length > 0 ? (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                                                        {userItem.preference.map((pref, i) => (
                                                            <Typography key={i} variant="caption" sx={{ bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.15)' : '#e0e7ff', color: isDarkMode ? '#a5b4fc' : '#4338ca', px: 1, py: 0.2, borderRadius: '12px', fontWeight: 600, fontSize: '0.7rem', textTransform: 'capitalize' }}>
                                                                {pref}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                ) : '-'}
                                            </TableCell>

                                            {/* BLOCKED */}
                                            <TableCell align="center">
                                                {userItem.role === 'admin' || userItem.role_name === 'admin' ? '-' : (
                                                    loadingUsers[userItem.user_id] ? (
                                                        <CircularProgress size={20} sx={{ color: '#7367f0' }} />
                                                    ) : (
                                                        <Switch
                                                            checked={userItem.blocked}
                                                            onChange={() => handleToggleBlockStatus(userItem)}
                                                            size="small"
                                                            sx={{
                                                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#ea5455' },
                                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#ea5455' },
                                                                opacity: isBlockingEnabled ? 1 : 0.5
                                                            }}
                                                            disabled={loadingUsers[userItem.user_id] || !isBlockingEnabled || (!canUpdateUser && !isAdmin)}
                                                        />
                                                    )
                                                )}
                                            </TableCell>

                                            {/* BLOCKED AT */}
                                            <TableCell align="center" sx={{ whiteSpace: 'nowrap', color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                {userItem.blocked && userItem.blocked_time ? moment(userItem.blocked_time).format('MMM D, YYYY h:mm A') : '-'}
                                            </TableCell>

                                            {/* LOGIN */}
                                            {isUserLoginEnabled && (
                                                <TableCell align="center">
                                                    {(canUpdateUser || isAdmin) && Number(userItem.user_id) !== Number(user?.user_id) ? (
                                                        <IconButton
                                                            onClick={() => handleOpenLoginConfirm(userItem)}
                                                            size="small"
                                                            title="Login as this user"
                                                            sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', '&:hover': { color: '#7367f0' } }}
                                                        >
                                                            <LoginOutlined fontSize="small" />
                                                        </IconButton>
                                                    ) : '-'}
                                                </TableCell>
                                            )}

                                            {/* LAST ACTIVE */}
                                            <TableCell align="center" sx={{ whiteSpace: 'nowrap', color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                {userItem.last_active_at ? moment(userItem.last_active_at).format('MMM D, YYYY h:mm A') : '-'}
                                            </TableCell>

                                            {/* REGISTERED AT */}
                                            <TableCell align="center" sx={{ whiteSpace: 'nowrap', color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                {userItem.created_at ? moment(userItem.created_at).format('MMM D, YYYY h:mm A') : '-'}
                                            </TableCell>

                                            {/* UPDATED AT */}
                                            <TableCell align="center" sx={{ whiteSpace: 'nowrap', color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                {userItem.updated_at ? moment(userItem.updated_at).format('MMM D, YYYY h:mm A') : '-'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ── Pagination ────────────────────────────────────────────── */}
                <Box
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0"
                    sx={{
                        px: 3,
                        py: 2,
                        backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                        borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                    }}
                >
                    <Box className="flex items-center gap-3">
                        <Autocomplete
                            freeSolo
                            size="small"
                            options={[10, 25, 50, 100, 150, 200, 250, 300, 350]}
                            value={limit}
                            onChange={(event, newValue) => {
                                if (newValue) {
                                    setLimit(Number(newValue));
                                    setPage(1);
                                }
                            }}
                            onInputChange={(event, newInputValue) => {
                                const parsed = Number(newInputValue);
                                if (!isNaN(parsed) && parsed > 0) {
                                    setLimit(parsed);
                                    setPage(1);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    sx={{
                                        width: '100px',
                                        '& .MuiOutlinedInput-root': {
                                            height: '32px',
                                            backgroundColor: isDarkMode ? '#283046' : '#fff',
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                            '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                                        },
                                        '& .MuiInputBase-input': {
                                            padding: '0 8px !important',
                                        }
                                    }}
                                />
                            )}
                            disablePortal={true}
                            slotProps={{
                                paper: {
                                    sx: {
                                        bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        '& .MuiAutocomplete-listbox': {
                                            '& .MuiAutocomplete-option': {
                                                fontSize: '0.9rem',
                                                '&[aria-selected="true"]': { bgcolor: 'rgba(115, 103, 240, 0.12) !important', color: '#7367f0 !important' },
                                                '&:hover': { bgcolor: 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' }
                                            }
                                        }
                                    }
                                }
                            }}
                            sx={{
                                '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
                                '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                            }}
                        />
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                            Entries per page
                        </Typography>
                    </Box>

                    <Box className="flex items-center gap-4">
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                            Showing {Math.min((page - 1) * limit + 1, pagination.total || 0)} to {Math.min(page * limit, pagination.total || 0)} of {pagination.total || 0} entries
                        </Typography>
                    </Box>

                    <Pagination
                        count={pagination.totalPages || 1}
                        page={page || 1}
                        onChange={(e, value) => setPage(value)}
                        shape="rounded"
                        showFirstButton
                        showLastButton
                        sx={{
                            '& .MuiPaginationItem-root': {
                                color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                                bgcolor: isDarkMode ? '#323a50' : '#f3f2f7',
                                border: 'none',
                                fontWeight: 500,
                                m: 0.2,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: isDarkMode ? 'rgba(115,103,240,0.18)' : 'rgba(115,103,240,0.1)',
                                    color: isDarkMode ? '#a5b4fc' : '#7367f0',
                                },
                                '&.Mui-selected': {
                                    bgcolor: '#7367f0 !important',
                                    color: '#fff !important',
                                    fontWeight: 700,
                                    '&:hover': {
                                        bgcolor: '#5e50ee !important',
                                    }
                                }
                            },
                            '& .MuiPaginationItem-ellipsis': {
                                bgcolor: 'transparent',
                            }
                        }}
                    />
                </Box>
            </Box>

            <ConfirmDialog
                open={blockConfirmOpen}
                onClose={handleCloseBlockConfirm}
                onConfirm={handleConfirmBlockAction}
                title={confirmUser?.blocked ? 'Unblock User' : 'Block User'}
                message={
                    <>
                        Are you sure you want to <strong>{confirmUser?.blocked ? 'unblock' : 'block'}</strong> <strong>{confirmUser?.name}</strong>?
                    </>
                }
                confirmText={confirmUser?.blocked ? 'Unblock' : 'Block'}
                cancelText="Cancel"
                isLoading={isConfirming}
                loadingText="Processing..."
                severity={confirmUser?.blocked ? "success" : "error"}
            />

            <ConfirmDialog
                open={loginConfirmOpen}
                onClose={handleCloseLoginConfirm}
                onConfirm={handleConfirmLoginAsUser}
                title="Login as User"
                message={
                    <>
                        This will sign you out and sign in as <strong>{confirmLoginUser?.name}</strong>.
                    </>
                }
                confirmText="Continue"
                cancelText="Cancel"
                isLoading={isSwitchingUser}
                loadingText="Switching..."
                severity="primary"
            />
        </Box>
    );
};

export default UserManagement;
