"use client";
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
    Box,
    Button,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    FormControl,
    Pagination,
    Select,
    MenuItem,
    Divider,
    Stack,
    Chip,
    useMediaQuery,
    Tooltip,
    Autocomplete,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Collapse
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { 
    useGetAllContactsQuery, 
    useUpdateContactStatusMutation, 
    useReplyToContactMutation,
    useDeleteContactMutation 
} from '../../features/api/contactApi';
import moment from 'moment';
import { PageHeader, SearchBar, ConfirmDialog } from '../../components/common';
import { useTheme } from '../../context/ThemeContext';
import { 
    Reply as ReplyIcon, 
    MarkEmailRead as ReadIcon,
    Block as IgnoreIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Schedule as ClockIcon,
    Message as MessageIcon,
    Category as SubjectIcon,
    Delete as DeleteIcon,
    ClearAll as ClearAllIcon,
    Search as SearchIcon,
    FilterAltOutlined as FilterAltOutlined,
    FilterAltOffOutlined as FilterAltOffOutlined
} from '@mui/icons-material';
import { toast } from '../../utils/toast';

const subjects = [
    'General Question',
    'New Recipe Suggestion',
    'Report an Issue',
    'Business / Collaboration',
    'Other'
];

import { useSelector } from 'react-redux';
import { AccessDenied } from '../../components/common';

const ManageContacts = () => {
    const { isDarkMode } = useTheme();
    const muiTheme = useMuiTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    const user = useSelector((state) => state.auth.user);
    const userPermissions = user?.permissions || [];
    const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
    const canList = isAdmin || userPermissions.includes('inquiry.list');
    const canView = isAdmin || userPermissions.includes('inquiry.view');
    const canReply = isAdmin || userPermissions.includes('inquiry.reply');
    const canIgnore = isAdmin || userPermissions.includes('inquiry.ignore');
    const canDelete = isAdmin || userPermissions.includes('inquiry.delete');


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
    
    const [page, setPage] = useState(() => parseInt(searchParams.get('page')) || 1);
    const [limit, setLimit] = useState(() => parseInt(searchParams.get('limit')) || 50);
    const [search, setSearch] = useState(() => searchParams.get('search') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');
    const [subjectFilter, setSubjectFilter] = useState(() => searchParams.get('subject') || '');
    const [debouncedStatus, setDebouncedStatus] = useState(() => searchParams.get('status') || '');
    const [debouncedSubject, setDebouncedSubject] = useState(() => searchParams.get('subject') || '');
    const [showFilters, setShowFilters] = useState(true);

    const { data: contactData, isLoading, isFetching } = useGetAllContactsQuery({
        page,
        limit,
        search: debouncedSearch,
        status: debouncedStatus,
        subject: debouncedSubject
    }, { 
        refetchOnMountOrArgChange: true,
        skip: !canList
    });

    const [updateStatus] = useUpdateContactStatusMutation();
    const [replyToContact] = useReplyToContactMutation();
    const [deleteContact] = useDeleteContactMutation();

    const [selectedContact, setSelectedContact] = useState(null);
    const [replyMode, setReplyMode] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const [tableContacts, setTableContacts] = useState([]);
    const [tablePagination, setTablePagination] = useState({ total: 0, page: 1, limit, totalPages: 1 });

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState(null);

    const [ignoreDialogOpen, setIgnoreDialogOpen] = useState(false);
    const [contactToIgnore, setContactToIgnore] = useState(null);

    useEffect(() => {
        document.title = "Inquiries";
    }, []);

    useEffect(() => {
        if (contactData && !isFetching) {
            setTableContacts(contactData.data || []);
            setTablePagination(contactData.pagination || { total: 0, page: 1, limit, totalPages: 1 });
        }
    }, [contactData, isFetching, limit]);

    // Add effect to sync URL with page change if it's updated elsewhere
    useEffect(() => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (page > 1) next.set('page', page);
            else next.delete('page');
            return next;
        }, { replace: true });
    }, [page, setSearchParams]);

    const onSearchChange = (e) => setSearch(e.target.value);
    const onStatusChange = (e) => setStatusFilter(e.target.value);
    const onSubjectChange = (e) => setSubjectFilter(e.target.value);

    const handleSearch = () => {
        setDebouncedSearch(search);
        setDebouncedStatus(statusFilter);
        setDebouncedSubject(subjectFilter);
        setPage(1);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (search) next.set('search', search); else next.delete('search');
            if (statusFilter) next.set('status', statusFilter); else next.delete('status');
            if (subjectFilter) next.set('subject', subjectFilter); else next.delete('subject');
            next.delete('page');
            return next;
        });
    };

    const handleView = (contact) => {
        setSelectedContact(contact);
        setReplyMode(false);
    };

    const handleReplyOpen = (contact) => {
        setSelectedContact(contact);
        setReplyMode(true);
        setReplyText(contact.admin_reply || '');
    };

    const handleClose = () => {
        setSelectedContact(null);
        setReplyText('');
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateStatus({ id, status }).unwrap();

            setTableContacts((prev) =>
                prev.map((item) =>
                    item.contact_id === id ? { ...item, status } : item
                )
            );

            toast.success(`Status updated to ${status}`);
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setIsProcessing(true);
        try {
            await replyToContact({ 
                id: selectedContact.contact_id, 
                admin_reply: replyText 
            }).unwrap();

            setTableContacts((prev) =>
                prev.map((item) =>
                    item.contact_id === selectedContact.contact_id
                        ? {
                              ...item,
                              status: 'replied',
                              admin_reply: replyText,
                              replied_at: new Date().toISOString(),
                          }
                        : item
                )
            );

            toast.success('Reply sent successfully!');
            handleClose();
        } catch (err) {
            toast.error('Failed to send reply');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleContactDelete = (id) => {
        setContactToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleIgnoreOpen = (id) => {
        setContactToIgnore(id);
        setIgnoreDialogOpen(true);
    };

    const handleConfirmIgnore = async () => {
        if (!contactToIgnore) return;
        setIgnoreDialogOpen(false);
        await handleStatusUpdate(contactToIgnore, 'ignored');
        setContactToIgnore(null);
    };

    const handleConfirmDelete = async () => {
        if (!contactToDelete) return;
        setIsProcessing(true);
        try {
            await deleteContact(contactToDelete).unwrap();
            setTableContacts((prev) => prev.filter((item) => item.contact_id !== contactToDelete));
            toast.success('Contact message deleted successfully');
            setDeleteDialogOpen(false);
            setContactToDelete(null);
        } catch (err) {
            toast.error('Failed to delete contact message');
        } finally {
            setIsProcessing(false);
        }
    };

    const DetailRow = ({ label, value, icon: Icon, iconColor = '#CA6014', children }) => (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {Icon && <Icon sx={{ fontSize: '1rem', color: iconColor }} />}
                <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5 }}>
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



    const hasActiveFilters = search !== '' || statusFilter !== '' || subjectFilter !== '';

    const handleClearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setSubjectFilter('');
        setDebouncedSearch('');
        setDebouncedStatus('');
        setDebouncedSubject('');
        setPage(1);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete('search');
            next.delete('status');
            next.delete('subject');
            next.delete('page');
            return next;
        });
    };

    const handleLimitChange = (e) => {
        const value = e.target.value;
        setLimit(value);
        setPage(1);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('limit', value);
            next.delete('page');
            return next;
        });
    };

    const selectStyles = {
        height: 38,
        bgcolor: isDarkMode ? '#283046' : '#fff',
        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
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
                    color: '#7367f0 !important',
                },
                '&.Mui-selected': {
                    bgcolor: 'rgba(115, 103, 240, 0.12) !important',
                    color: '#7367f0 !important',
                    fontWeight: 500,
                    '&:hover': { bgcolor: 'rgba(115, 103, 240, 0.16) !important' },
                },
            },
        },
    };

    if (!canList) {
        return <AccessDenied message="You do not have permission to view Message Inquiries." />;
    }

    return (
        <Box
            className="transition-all duration-200 flex flex-col pt-0 md:pt-4 pb-4 px-3 mt-[64px] md:mt-[74px] min-h-[calc(100vh-74px)] h-auto w-full"
        >
            {/* ── Card wrapper ──────────────────────────────────────────────── */}
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
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 border-b gap-4"
                    sx={{ borderColor: isDarkMode ? '#3b4253' : '#ebe9f1' }}
                >
                    <Box className="flex items-center gap-2">
                        <Typography
                            variant="h5"
                            sx={{ 
                                fontWeight: 700, 
                                color: isDarkMode ? '#e2e8f0' : '#1e293b', 
                                letterSpacing: '0.5px',
                                fontSize: { xs: '1.25rem', sm: '1.5rem' }
                            }}
                        >
                            Inquiries
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
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                </Box>

                {/* ── Filters row ───────────────────────────────────────────── */}
                <Collapse in={showFilters} timeout="auto" unmountOnExit>
                <Box className="flex flex-col p-5 gap-4">
                    <Box className="flex flex-wrap items-center gap-4">
                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                Status:
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Autocomplete
                                    size="small"
                                    options={[
                                        { label: 'All Status', value: '' },
                                        { label: 'Pending', value: 'pending' },
                                        { label: 'Replied', value: 'replied' },
                                        { label: 'Ignored', value: 'ignored' }
                                    ]}
                                    getOptionLabel={(option) => option.label || ''}
                                    value={
                                        [
                                            { label: 'All Status', value: '' },
                                            { label: 'Pending', value: 'pending' },
                                            { label: 'Replied', value: 'replied' },
                                            { label: 'Ignored', value: 'ignored' }
                                        ].find(opt => opt.value === statusFilter) || { label: 'All Status', value: '' }
                                    }
                                    onChange={(_, newValue) => {
                                        onStatusChange({ target: { value: newValue ? newValue.value : '' } });
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

                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                Subject:
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <Autocomplete
                                    size="small"
                                    options={[
                                        { label: 'All Subjects', value: '' },
                                        ...subjects.map(s => ({
                                            label: s,
                                            value: s
                                        }))
                                    ]}
                                    getOptionLabel={(option) => option.label || ''}
                                    value={
                                        [
                                            { label: 'All Subjects', value: '' },
                                            ...subjects.map(s => ({
                                                label: s,
                                                value: s
                                            }))
                                        ].find(opt => opt.value === subjectFilter) || { label: 'All Subjects', value: '' }
                                    }
                                    onChange={(_, newValue) => {
                                        onSubjectChange({ target: { value: newValue ? newValue.value : '' } });
                                    }}
                                    isOptionEqualToValue={(option, value) => option.value === value.value}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="All Subjects"
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
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                Search:
                            </Typography>
                            <input
                                type="text"
                                value={search}
                                onChange={onSearchChange}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Name or email..."
                                className="px-3 py-2 border rounded outline-none transition-colors"
                                style={{
                                    height: '38px',
                                    width: '220px',
                                    backgroundColor: isDarkMode ? '#283046' : '#fff',
                                    borderColor: isDarkMode ? '#404656' : '#d8d6de',
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                    borderRadius: '4px',
                                }}
                            />
                        </Box>
                    </Box>

                    {/* ── Action buttons ────────────────────────────────────── */}
                    <Box className="flex justify-end items-center gap-3">
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleClearFilters}
                            disabled={!hasActiveFilters && debouncedSearch === '' && debouncedStatus === '' && debouncedSubject === ''}
                            sx={{ height: '38px', minWidth: { xs: '38px', sm: '120px' }, textTransform: 'none', px: { xs: 0, sm: 3 } }}
                        >
                            <ClearAllIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Clear</Box>
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSearch}
                            sx={{
                                height: '38px',
                                minWidth: { xs: '38px', sm: '120px' },
                                textTransform: 'none',
                                px: { xs: 0, sm: 3 },
                                bgcolor: '#7367f0',
                                '&:hover': { bgcolor: '#5e50ee' },
                                boxShadow: 'none',
                            }}
                        >
                            <SearchIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Search</Box>
                        </Button>
                    </Box>
                </Box>
                </Collapse>

                {/* ── Table ─────────────────────────────────────────────────── */}
                <TableContainer 
                    component={Paper} 
                    elevation={0}
                    sx={{
                        flex: 1,
                        backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                        borderRadius: 0,
                        overflowX: 'auto',
                    }}
                >
                    <Table stickyHeader sx={{ minWidth: 800 }}>
                        <TableHead>
                            <TableRow sx={{ 'height': '48px' }}>
                                <TableCell sx={{ width: 70, align: 'center', bgcolor: isDarkMode ? '#283046' : '#f3f2f7', color: isDarkMode ? '#b4b7bd' : '#6e6b7b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, textAlign: 'center' }}>
                                    #
                                </TableCell>
                                <TableCell sx={{ width: 130, bgcolor: isDarkMode ? '#283046' : '#f3f2f7', color: isDarkMode ? '#b4b7bd' : '#6e6b7b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` }}>
                                    Date
                                </TableCell>
                                <TableCell sx={{ width: 220, bgcolor: isDarkMode ? '#283046' : '#f3f2f7', color: isDarkMode ? '#b4b7bd' : '#6e6b7b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` }}>
                                    User
                                </TableCell>
                                <TableCell sx={{ width: 200, align: 'center', bgcolor: isDarkMode ? '#283046' : '#f3f2f7', color: isDarkMode ? '#b4b7bd' : '#6e6b7b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, textAlign: 'center' }}>
                                    Subject
                                </TableCell>
                                <TableCell sx={{ width: 120, align: 'center', bgcolor: isDarkMode ? '#283046' : '#f3f2f7', color: isDarkMode ? '#b4b7bd' : '#6e6b7b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, textAlign: 'center' }}>
                                    Status
                                </TableCell>
                                <TableCell sx={{ width: 200, align: 'center', bgcolor: isDarkMode ? '#283046' : '#f3f2f7', color: isDarkMode ? '#b4b7bd' : '#6e6b7b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, textAlign: 'center' }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(isLoading || isFetching) ? (
                                <TableRow sx={{ height: '60px' }}>
                                    <TableCell colSpan={6} sx={{ borderBottom: 'none' }}>
                                        <Box className="flex justify-center items-center p-10">
                                            <CircularProgress sx={{ color: '#7367f0' }} />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : tableContacts?.length > 0 ? (
                                tableContacts.map((contact, index) => (
                                    <TableRow 
                                        key={contact.contact_id} 
                                        sx={{ 
                                            height: '60px',
                                            bgcolor: index % 2 === 0 ? (isDarkMode ? '#283046' : '#ffffff') : (isDarkMode ? '#283046' : '#fafbfc'),
                                            '&:hover': { bgcolor: isDarkMode ? '#2f3851' : '#f8f8f8' },
                                            transition: 'background-color 0.2s ease',
                                            '& td': {
                                                borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                                color: isDarkMode ? '#e5e7eb' : '#334155',
                                                py: 1.5
                                            }
                                        }}
                                    >
                                        <TableCell align="center">{index + 1 + (page - 1) * limit}</TableCell>
                                        <TableCell>{moment(contact.created_at).format('DD MMM YYYY')}</TableCell>
                                        <TableCell>
                                            <Box sx={{ textAlign: 'left' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                                                    {contact.full_name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block' }}>
                                                    {contact.email}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            {(() => {
                                                const subjectColors = {
                                                    'General Question': { bg: '#3b82f6', text: '#fff' },
                                                    'New Recipe Suggestion': { bg: '#10b981', text: '#fff' },
                                                    'Report an Issue': { bg: '#ef4444', text: '#fff' },
                                                    'Business / Collaboration': { bg: '#8b5cf6', text: '#fff' },
                                                    'Other': { bg: '#6b7280', text: '#fff' }
                                                };
                                                const style = subjectColors[contact.subject] || { bg: '#CA6014', text: '#fff' };
                                                return (
                                                    <Box sx={{
                                                        bgcolor: style.bg,
                                                        color: style.text,
                                                        px: 1.5,
                                                        py: 0.5,
                                                        borderRadius: '4px',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        whiteSpace: 'nowrap',
                                                        display: 'inline-block'
                                                    }}>
                                                        {contact.subject}
                                                    </Box>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell align="center">
                                            {(() => {
                                                const colors = {
                                                    pending: '#f59e0b',
                                                    replied: '#10b981',
                                                    ignored: '#6b7280'
                                                };
                                                return (
                                                    <Box sx={{
                                                        bgcolor: colors[contact.status] + '20',
                                                        color: colors[contact.status],
                                                        px: 1.5,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'capitalize',
                                                        display: 'inline-block'
                                                    }}>
                                                        {contact.status}
                                                    </Box>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                {canView && (
                                                    <Tooltip title="View" arrow>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleView(contact)}
                                                            sx={{
                                                                color: isDarkMode ? '#10b981' : '#059669',
                                                                '&:hover': { color: isDarkMode ? '#34d399' : '#047857' }
                                                            }}
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </svg>
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {canReply && (
                                                    <Tooltip title="Reply" arrow>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleReplyOpen(contact)}
                                                            disabled={contact.status === 'replied' || contact.status === 'ignored'}
                                                            sx={{
                                                                color: isDarkMode ? '#60a5fa' : '#3b82f6',
                                                                '&:hover': { color: isDarkMode ? '#93c5fd' : '#2563eb' },
                                                                '&:disabled': { color: isDarkMode ? '#475569' : '#cbd5e1' }
                                                            }}
                                                        >
                                                            <ReplyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {canIgnore && contact.status === 'pending' && (
                                                    <Tooltip title="Ignore" arrow>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleIgnoreOpen(contact.contact_id)}
                                                            sx={{
                                                                color: isDarkMode ? '#f59e0b' : '#d97706',
                                                                '&:hover': { color: isDarkMode ? '#fbbf24' : '#b45309' }
                                                            }}
                                                        >
                                                            <IgnoreIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {canDelete && (
                                                    <Tooltip title="Delete" arrow>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleContactDelete(contact.contact_id)}
                                                            sx={{
                                                                color: isDarkMode ? '#ef4444' : '#dc2626',
                                                                '&:hover': { color: isDarkMode ? '#f87171' : '#b91c1c' }
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ borderBottom: 'none' }}>
                                        <Box className="flex justify-center items-center p-10">
                                            <Typography sx={{ color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }}>
                                                No inquiries found
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
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
                                    handleLimitChange({ target: { value: Number(newValue) } });
                                }
                            }}
                            onInputChange={(event, newInputValue) => {
                                const parsed = Number(newInputValue);
                                if (!isNaN(parsed) && parsed > 0) {
                                    handleLimitChange({ target: { value: parsed } });
                                }
                            }}
                            sx={{
                                width: 100,
                                '& .MuiAutocomplete-inputRoot': {
                                    paddingRight: '30px !important'
                                },
                                '& .MuiAutocomplete-clearIndicator': {
                                    color: isDarkMode ? '#b4b7bd' : '#6e6b7b'
                                },
                                '& .MuiAutocomplete-popupIndicator': {
                                    color: isDarkMode ? '#b4b7bd' : '#6e6b7b'
                                }
                            }}
                            ListboxProps={{
                                sx: {
                                    bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                }
                            }}
                            slotProps={{
                                paper: {
                                    sx: {
                                        bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                        border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`,
                                        '& .MuiAutocomplete-option': {
                                            '&[aria-selected="true"]': {
                                                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.08)',
                                                color: '#7367f0',
                                            },
                                            '&:hover': {
                                                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                                            }
                                        }
                                    }
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: isDarkMode ? '#283046' : '#fff',
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                            height: 38,
                                            '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
                                            '&:hover fieldset': { borderColor: '#7367f0' },
                                            '&.Mui-focused fieldset': { borderColor: '#7367f0', borderWidth: '1px' },
                                        },
                                        '& input': {
                                            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                                            WebkitTextFillColor: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
                                        }
                                    }}
                                />
                            )}
                        />
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                            Showing {tablePagination.total === 0 ? 0 : Math.min((page - 1) * limit + 1, tablePagination.total)} to{' '}
                            {Math.min(page * limit, tablePagination.total)} of {tablePagination.total} entries
                        </Typography>
                    </Box>

                    <Pagination
                        count={tablePagination.totalPages}
                        page={page}
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
                                    '&:hover': { bgcolor: '#5e50ee !important' },
                                },
                            },
                            '& .MuiPaginationItem-ellipsis': { bgcolor: 'transparent' },
                        }}
                    />
                </Box>
            </Box>

            <Dialog 
                open={!!selectedContact} 
                onClose={handleClose} 
                maxWidth="sm" 
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ 
                    sx: { 
                        borderRadius: '8px',
                        backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
                        boxShadow: isDarkMode ? '0 15px 30px rgba(0,0,0,0.3)' : '0 15px 30px rgba(0,0,0,0.1)',
                    } 
                }}
            >
                <DialogTitle
                    className="flex items-center justify-between"
                    sx={{ borderBottom: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`, py: 2.5 }}
                >
                    <Typography variant="h6" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}>
                        {replyMode ? 'Reply to Inquiry' : 'Inquiry Details'}
                    </Typography>
                    <IconButton onClick={handleClose} sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent 
                    dividers 
                    sx={{ 
                        py: 3,
                        backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                        borderColor: isDarkMode ? '#404656' : '#ebe9f1',
                    }}
                >
                    {selectedContact && (
                        <Stack spacing={3}>
                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(2, 1fr)', 
                                gap: 3,
                                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                                p: 2.5,
                                borderRadius: 2,
                                border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
                            }}>
                                <DetailRow label="Sender" value={selectedContact.full_name} icon={PersonIcon} iconColor="#7367f0" />
                                <DetailRow label="Email" value={selectedContact.email} icon={EmailIcon} iconColor="#28c76f" />
                                <DetailRow label="Subject" value={selectedContact.subject} icon={SubjectIcon} iconColor="#ff9f43" />
                                <DetailRow label="Sent At" value={moment(selectedContact.created_at).format('DD MMM YYYY, h:mm A')} icon={ClockIcon} iconColor="#00cfe8" />
                            </Box>

                            <Divider sx={{ borderStyle: 'dashed', opacity: 0.4, borderColor: isDarkMode ? '#b4b7bd' : '#d8d6de' }} />

                            <Box sx={{ position: 'relative' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <MessageIcon sx={{ fontSize: '1.1rem', color: '#ea5455' }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                                        User Message
                                    </Typography>
                                </Box>
                                <Box sx={{ 
                                    p: 2.5, 
                                    borderRadius: 2, 
                                    bgcolor: isDarkMode ? '#1e2436' : '#f8fafc',
                                    border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
                                    minHeight: 100
                                }}>
                                    <Typography variant="body2" sx={{ 
                                        lineHeight: 1.7, 
                                        color: isDarkMode ? '#d1d5db' : '#334155',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {selectedContact.message}
                                    </Typography>
                                </Box>
                            </Box>
                            
                            {replyMode ? (
                                <Box sx={{ mt: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <ReplyIcon sx={{ fontSize: '1.1rem', color: '#7367f0' }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                                            Your Response
                                        </Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={6}
                                        placeholder="Type your reply here..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        variant="outlined"
                                        sx={{ 
                                            '& .MuiOutlinedInput-root': { 
                                                borderRadius: 1.5,
                                                bgcolor: isDarkMode ? 'rgba(202, 96, 20, 0.03)' : '#fff',
                                                '& textarea': {
                                                    color: isDarkMode ? '#e5e7eb' : 'inherit'
                                                }
                                            } 
                                        }}
                                    />
                                </Box>
                            ) : selectedContact.admin_reply && (
                                <Box sx={{ mt: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <ReadIcon sx={{ fontSize: '1.1rem', color: '#28c76f' }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                                            Admin Reply History
                                        </Typography>
                                    </Box>
                                    <Box sx={{ 
                                        p: 2.5, 
                                        borderRadius: 1.5, 
                                        bgcolor: isDarkMode ? 'rgba(202, 96, 20, 0.05)' : '#fff8f1',
                                        border: `1px solid ${isDarkMode ? 'rgba(202, 96, 20, 0.2)' : 'rgba(202, 96, 20, 0.1)'}`,
                                    }}>
                                        <Typography variant="body2" sx={{ 
                                            lineHeight: 1.7, 
                                            color: isDarkMode ? '#e5e7eb' : '#475569',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {selectedContact.admin_reply}
                                        </Typography>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                display: 'block', 
                                                mt: 1.5, 
                                                color: isDarkMode ? '#9ca3af' : '#64748b',
                                                fontStyle: 'italic' 
                                            }}
                                        >
                                            Replied on {moment(selectedContact.replied_at).format('DD MMM YYYY [at] h:mm A')}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`, backgroundColor: isDarkMode ? '#283046' : '#ffffff' }}>
                    <Button 
                        onClick={handleClose} 
                        variant="outlined"
                        sx={{
                            borderRadius: 1.5,
                            color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                            borderColor: isDarkMode ? '#404656' : '#d8d6de',
                            px: 3,
                            '&:hover': { 
                                borderColor: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' 
                            }
                        }}
                    >
                        {replyMode ? 'Cancel' : 'Close'}
                    </Button>
                    {replyMode && (
                        <Button 
                            variant="contained" 
                            onClick={handleSendReply}
                            disabled={isProcessing || !replyText.trim()}
                            startIcon={<ReadIcon />}
                            sx={{ 
                                bgcolor: '#CA6014', 
                                '&:hover': { bgcolor: '#E07520' }, 
                                borderRadius: 1.5,
                                px: 4,
                                py: 1,
                                fontWeight: 700,
                                boxShadow: '0 4px 14px rgba(202, 96, 20, 0.3)'
                            }}
                        >
                            {isProcessing ? 'Sending...' : 'Send Reply'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Contact Message"
                message="Are you sure you want to delete this contact message? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isProcessing}
                loadingText="Deleting..."
                severity="error"
            />

            <ConfirmDialog
                open={ignoreDialogOpen}
                onClose={() => setIgnoreDialogOpen(false)}
                onConfirm={handleConfirmIgnore}
                title="Ignore Inquiry"
                message="Are you sure you want to ignore this inquiry? You won't be able to reply to it once ignored."
                confirmText="Ignore"
                cancelText="Cancel"
                isLoading={isProcessing}
                loadingText="Updating..."
                severity="warning"
            />
        </Box>
    );
};

export default ManageContacts;

