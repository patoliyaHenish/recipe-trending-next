"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, Select, MenuItem, Autocomplete, TextField, Pagination, Tooltip, Chip } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Delete, Close as CloseIcon, Visibility } from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import moment from 'moment';
import { toast } from '../../utils/toast';
import { useTheme } from '../../context/ThemeContext';
import { useGetAllActivityLogsQuery, useDeleteActivityLogMutation } from '../../features/api/activityLogApi';

ModuleRegistry.registerModules([AllCommunityModule]);

import { useSelector } from 'react-redux';
import { AccessDenied, ConfirmDialog } from '../../components/common';

const ActivityLogs = () => {
    const { isDarkMode } = useTheme();
    const user = useSelector((state) => state.auth.user);
    const userPermissions = user?.permissions || [];
    const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
    const canList = isAdmin || userPermissions.includes('activity_logs.list');
    const canViewDetail = isAdmin || userPermissions.includes('activity_logs.view');
    const canDelete = isAdmin || userPermissions.includes('activity_logs.delete');


    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
    const [limit, setLimit] = useState(() => Number(searchParams.get('limit')) || 50);

    const syncUrlParams = (newPage, newLimit) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (newPage > 1) next.set('page', newPage.toString());
            else next.delete('page');
            if (newLimit !== 50) next.set('limit', newLimit.toString());
            else next.delete('limit');
            return next;
        });
    };

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [viewLog, setViewLog] = useState(null);

    const [actionSearch, setActionSearch] = useState(() => searchParams.get('action') || '');
    const [debouncedAction, setDebouncedAction] = useState(() => searchParams.get('action') || '');
    
    const [entityTypeSearch, setEntityTypeSearch] = useState(() => searchParams.get('entity_type') || '');
    const [debouncedEntityType, setDebouncedEntityType] = useState(() => searchParams.get('entity_type') || '');

    const [createdAtSearch, setCreatedAtSearch] = useState(() => searchParams.get('created_at') || '');
    const [debouncedCreatedAt, setDebouncedCreatedAt] = useState(() => searchParams.get('created_at') || '');

    const handleSearch = () => {
        setDebouncedAction(actionSearch);
        setDebouncedEntityType(entityTypeSearch);
        setDebouncedCreatedAt(createdAtSearch);
        setPage(1);

        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (actionSearch) next.set('action', actionSearch); else next.delete('action');
            if (entityTypeSearch) next.set('entity_type', entityTypeSearch); else next.delete('entity_type');
            if (createdAtSearch) next.set('created_at', createdAtSearch); else next.delete('created_at');
            next.set('page', '1');
            return next;
        });
    };

    const handleClearFilters = () => {
        setActionSearch('');
        setDebouncedAction('');
        setEntityTypeSearch('');
        setDebouncedEntityType('');
        setCreatedAtSearch('');
        setDebouncedCreatedAt('');
        setPage(1);

        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete('action');
            next.delete('entity_type');
            next.delete('created_at');
            next.set('page', '1');
            return next;
        });
    };

    const hasActiveFilters = actionSearch !== '' || entityTypeSearch !== '' || createdAtSearch !== '';

    const selectStyles = {
        backgroundColor: isDarkMode ? '#283046' : '#fff',
        color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
        '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
        '&:hover fieldset': { borderColor: '#7367f0 !important' },
        '&.Mui-focused fieldset': { borderColor: '#7367f0 !important' },
    };

    const calendarDarkSx = {
        bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important',
        color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
        backgroundImage: 'none',
        '& .MuiPickersCalendarHeader-root': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important' },
        '& .MuiPickersCalendarHeader-label': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important' },
        '& .MuiDayCalendar-weekDayLabel': { color: isDarkMode ? '#b4b7bd !important' : '#6e6b7b !important' },
        '& .MuiIconButton-root': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important' },
        '& button.MuiPickersDay-root': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important', backgroundColor: 'transparent' },
        '& button.MuiPickersDay-root:not(.Mui-selected)': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important' },
        '& button.MuiPickersDay-dayOutsideMonth': { color: isDarkMode ? '#6e6b7b !important' : '#b4b7bd !important' },
        '& button.MuiPickersDay-root:hover': { backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(0, 0, 0, 0.04) !important' },
        '& button.MuiPickersDay-root.Mui-selected': { backgroundColor: '#7367f0 !important', color: '#ffffff !important' },
        '& .MuiPickersYear-yearButton': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important' },
        '& .MuiPickersMonth-monthButton': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important' },
        '& .MuiDialogActions-root .MuiButton-root': { color: isDarkMode ? '#7367f0 !important' : '#7367f0 !important' },
        '& .MuiPickersToolbar-root': { bgcolor: isDarkMode ? '#1a2035 !important' : '#7367f0 !important', color: '#ffffff !important', '& *': { color: '#ffffff !important' } },
    };

    const datePickerTextFieldStyles = {
        size: 'small',
        sx: {
            minWidth: 180,
            '& .MuiInputBase-root': {
                height: 38, bgcolor: isDarkMode ? '#283046' : '#fff', borderRadius: '4px',
                color: isDarkMode ? '#ffffff !important' : '#6e6b7b !important',
                '-webkit-text-fill-color': isDarkMode ? '#ffffff !important' : '#6e6b7b !important',
            },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: isDarkMode ? '#404656' : '#d8d6de' },
            '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: isDarkMode ? '#6b7280' : '#b4b7bd' },
            '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7367f0', borderWidth: '1px' },
            '& input': { color: isDarkMode ? '#ffffff !important' : '#6e6b7b !important', WebkitTextFillColor: `${isDarkMode ? '#ffffff' : '#6e6b7b'} !important`, opacity: 1 },
            '& input::placeholder': { color: isDarkMode ? '#b4b7bd !important' : '#9ca3af !important', WebkitTextFillColor: `${isDarkMode ? '#b4b7bd' : '#9ca3af'} !important`, opacity: 1 },
            '& *': { color: isDarkMode ? '#ffffff !important' : 'inherit', '-webkit-text-fill-color': isDarkMode ? '#ffffff !important' : 'inherit' },
            '& .MuiSvgIcon-root': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' },
            '& .MuiInputLabel-root': { color: isDarkMode ? '#9ca3af' : '#6b7280' }
        },
        inputProps: { style: { color: isDarkMode ? '#ffffff' : '#6e6b7b', WebkitTextFillColor: isDarkMode ? '#ffffff' : '#6e6b7b', opacity: 1 } }
    };

    const datePickerDayStyles = {
        sx: {
            color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important', backgroundColor: 'transparent',
            '&.Mui-selected': { backgroundColor: '#7367f0 !important', color: '#ffffff !important' },
            '&:hover': { backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(0, 0, 0, 0.04) !important' },
            '&.MuiPickersDay-today': { borderColor: '#7367f0 !important' }
        }
    };

    const datePickerPopperStyles = {
        sx: {
            '& .MuiPaper-root': { bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important', color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important', border: `1px solid ${isDarkMode ? '#404656' : '#d8d6de'}`, boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)', backgroundImage: 'none' },
            '& .MuiPickersCalendarHeader-root': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important' },
            '& .MuiPickersCalendarHeader-label': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important' },
            '& .MuiDayCalendar-weekDayLabel': { color: isDarkMode ? '#b4b7bd !important' : '#6e6b7b !important' },
            '& .MuiIconButton-root': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important' },
            '& button.MuiPickersDay-root': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important', backgroundColor: 'transparent' },
            '& button.MuiPickersDay-root:not(.Mui-selected)': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important' },
            '& button.MuiPickersDay-dayOutsideMonth': { color: isDarkMode ? '#6e6b7b !important' : '#b4b7bd !important' },
            '& button.MuiPickersDay-root:hover': { bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.12) !important' : 'rgba(0, 0, 0, 0.04) !important' },
            '& button.MuiPickersDay-root.Mui-selected': { bgcolor: '#7367f0 !important', color: '#ffffff !important' },
            '& .MuiPickersYear-yearButton': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important' },
            '& .MuiPickersMonth-monthButton': { color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important' }
        }
    };

    const datePickerDialogStyles = {
        sx: {
            '& .MuiDialog-paper': {
                ...calendarDarkSx,
                border: isDarkMode ? '1px solid #404656' : 'none',
                boxShadow: isDarkMode ? '0 8px 32px 0 rgba(0,0,0,0.48)' : '0 8px 32px 0 rgba(34,41,47,0.18)',
            },
        },
    };

    const datePickerMobilePaperStyles = { sx: calendarDarkSx };

    const { data: logsData, isLoading } = useGetAllActivityLogsQuery({ 
        page, 
        limit, 
        action: debouncedAction, 
        entity_type: debouncedEntityType, 
        created_at: debouncedCreatedAt 
    }, {
        skip: !canList && !isAdmin
    });
    const [deleteActivityLog, { isLoading: isDeleting }] = useDeleteActivityLogMutation();

    useEffect(() => {
        document.title = "Activity Logs";
    });

    const handleDeleteClick = (id) => {
        setSelectedLogId(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedLogId) {
            try {
                const res = await deleteActivityLog({ id: selectedLogId, page, limit }).unwrap();
                toast.success(res.message || 'Log deleted successfully');
                setDeleteDialogOpen(false);
                setSelectedLogId(null);
            } catch (err) {
                toast.error(err?.data?.message || 'Failed to delete log');
            }
        }
    };

    const logs = logsData?.data || [];
    const pagination = logsData?.pagination || { total: 0, page: 1, limit, totalPages: 1 };

    const columnDefs = useMemo(() => [
        {
            headerName: '#',
            valueGetter: (params) => (page - 1) * limit + params.node.rowIndex + 1,
            width: 70,
            cellStyle: { justifyContent: 'center' },
            headerClass: 'ag-header-center',
        },
        {
            headerName: 'User',
            field: 'user_name',
            flex: 1,
            minWidth: 150,
            cellStyle: { justifyContent: 'center' },
            headerClass: 'ag-header-center',
            valueFormatter: (params) => params.value ? params.value : 'System/Anonymous'
        },
        {
            headerName: 'Action',
            field: 'action',
            flex: 1,
            minWidth: 120,
            cellStyle: { justifyContent: 'center' },
            headerClass: 'ag-header-center',
            cellRenderer: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {params.value}
                </Typography>
            )
        },
        {
            headerName: 'Entity Type',
            field: 'entity_type',
            flex: 1,
            minWidth: 120,
            cellStyle: { justifyContent: 'center' },
            headerClass: 'ag-header-center',
        },
        {
            headerName: 'Created At',
            field: 'created_at',
            width: 200,
            valueFormatter: (params) => moment(params.value).format('MMM D, YYYY h:mm A'),
            cellStyle: { justifyContent: 'center' },
            headerClass: 'ag-header-center',
        },
        ...(canViewDetail || canDelete ? [{
            headerName: 'Actions',
            width: 120,
            cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
            headerClass: 'ag-header-center',
            cellRenderer: (params) => (
                <Box className="flex gap-2 justify-center items-center h-full">
                    {canViewDetail && (
                        <Tooltip title="View" arrow>
                            <IconButton
                                size="small"
                                onClick={() => setViewLog(params.data)}
                                sx={{
                                    color: isDarkMode ? "#10b981" : "#059669",
                                    "&:hover": { backgroundColor: isDarkMode ? "#064e3b" : "#d1fae5" }
                                }}
                            >
                                <Visibility fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Tooltip title="Delete" arrow>
                            <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(params.data.id)}
                                sx={{
                                    color: isDarkMode ? '#ef4444' : '#dc2626',
                                    '&:hover': { backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2' }
                                }}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            ),
        }] : [])
    ], [page, limit, isDarkMode, canViewDetail, canDelete]);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        resizable: true,
    }), []);

    if (!canList && !isAdmin) {
        return <AccessDenied message="You do not have permission to view Activity Logs." />;
    }

    return (
        <Box className="transition-all duration-200 flex flex-col pt-0 md:pt-4 pb-4 px-3 mt-[64px] md:mt-[74px] min-h-[calc(100vh-74px)] h-auto w-full">
            <Box
                sx={{
                    flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '6px',
                    backgroundColor: isDarkMode ? '#283046' : '#ffffff', overflow: 'hidden',
                    boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0,0,0,0.24)' : '0 4px 24px 0 rgba(34,41,47,0.1)',
                }}
            >
                <Box className="flex flex-col gap-4 p-4 sm:p-5 border-b" sx={{ borderColor: isDarkMode ? '#3b4253' : '#ebe9f1' }}>
                    <Box className="flex items-center flex-wrap gap-2">
                        <Typography variant="h5" sx={{ fontWeight: 700, color: isDarkMode ? '#e2e8f0' : '#1e293b', letterSpacing: '0.5px', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                            Activity Logs
                        </Typography>
                    </Box>
                    <Box className="flex flex-wrap items-center gap-3 w-full">
                        <TextField
                            placeholder="Search Action..."
                            size="small"
                            value={actionSearch}
                            onChange={(e) => setActionSearch(e.target.value)}
                            sx={{
                                minWidth: 150,
                                '& .MuiOutlinedInput-root': { height: 38, ...selectStyles },
                                '& .MuiInputBase-input': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                            }}
                        />
                        <TextField
                            placeholder="Entity Type..."
                            size="small"
                            value={entityTypeSearch}
                            onChange={(e) => setEntityTypeSearch(e.target.value)}
                            sx={{
                                minWidth: 150,
                                '& .MuiOutlinedInput-root': { height: 38, ...selectStyles },
                                '& .MuiInputBase-input': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }
                            }}
                        />
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            <DatePicker
                                label="Created At"
                                value={createdAtSearch ? moment(createdAtSearch) : null}
                                onChange={(newValue) => setCreatedAtSearch(newValue ? newValue.format('YYYY-MM-DD') : '')}
                                slotProps={{
                                    textField: datePickerTextFieldStyles,
                                    layout: { sx: calendarDarkSx },
                                    popper: datePickerPopperStyles,
                                    day: datePickerDayStyles,
                                    dialog: datePickerDialogStyles,
                                    mobilePaper: datePickerMobilePaperStyles,
                                    desktopPaper: datePickerMobilePaperStyles
                                }}
                            />
                        </LocalizationProvider>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSearch}
                            sx={{ height: '40px', px: 3, textTransform: 'none', bgcolor: '#7367f0', '&:hover': { bgcolor: '#5e50ee' }, boxShadow: 'none' }}
                        >
                            Search
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleClearFilters}
                            disabled={!hasActiveFilters}
                            sx={{ height: '40px', px: 3, textTransform: 'none' }}
                        >
                            Clear
                        </Button>
                    </Box>
                </Box>

                <Box
                    className={`${isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'} w-full`}
                    sx={{
                        flex: 1, width: '100%', height: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column',
                        '& .ag-root-wrapper': { backgroundColor: 'transparent', border: 'none', borderRadius: 0, width: '100%', height: '100%' },
                        '& .ag-root': { backgroundColor: 'transparent' },
                        '& .ag-header': { backgroundColor: isDarkMode ? '#283046' : '#f3f2f7', borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`, borderTop: 'none' },
                        '& .ag-header-cell': { color: isDarkMode ? '#b4b7bd' : '#6e6b7b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
                        '& .ag-row': { borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'} !important`, backgroundColor: isDarkMode ? '#283046' : '#ffffff', color: isDarkMode ? '#d0d2d6' : '#6e6b7b', transition: 'background-color 0.2s ease' },
                        '& .ag-row:hover': { backgroundColor: isDarkMode ? '#2f3851 !important' : '#f8f8f8 !important' },
                        '& .ag-header-cell-label': { justifyContent: 'center' },
                        '& .ag-header-center .ag-header-cell-label': { justifyContent: 'center' },
                        '& .ag-body-viewport': { backgroundColor: isDarkMode ? '#283046' : '#ffffff' },
                        '& .ag-center-cols-viewport': { backgroundColor: isDarkMode ? '#283046' : '#ffffff' },
                        '& .ag-center-cols-container': { backgroundColor: isDarkMode ? '#283046' : '#ffffff' },
                        '& .ag-root-wrapper-body': { backgroundColor: isDarkMode ? '#283046' : '#ffffff' },
                        '& .ag-body-horizontal-scroll': { backgroundColor: isDarkMode ? '#283046' : '#ffffff' },
                        '& .ag-row-even': { backgroundColor: isDarkMode ? '#283046' : '#ffffff' },
                        '& .ag-row-odd': { backgroundColor: isDarkMode ? '#283046' : '#fafbfc' },
                        '& .ag-cell': { display: 'flex', alignItems: 'center', border: 'none' },
                    }}
                >
                    <AgGridReact
                        enableCellTextSelection={true}
                        ensureDomOrder={true}
                        rowData={logs}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        domLayout="autoHeight"
                        rowHeight={60}
                        headerHeight={48}
                        animateRows={false}
                        loading={isLoading}
                        overlayLoadingTemplate='<span class="ag-overlay-loading-center">Loading...</span>'
                        overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">No logs found</span>'
                    />
                </Box>

                <Box
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0"
                    sx={{ px: 3, py: 2, backgroundColor: isDarkMode ? '#283046' : '#ffffff', borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}` }}
                >
                    <Box className="flex items-center gap-3">
                        <Autocomplete
                            freeSolo
                            size="small"
                            options={[10, 25, 50, 100, 150, 200, 250, 300, 350]}
                            value={limit}
                            onChange={(event, newValue) => { if (newValue) { const parsed = Number(newValue); setLimit(parsed); setPage(1); syncUrlParams(1, parsed); } }}
                            onInputChange={(event, newInputValue) => { const parsed = Number(newInputValue); if (!isNaN(parsed) && parsed > 0) { setLimit(parsed); setPage(1); syncUrlParams(1, parsed); } }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    sx={{ width: '100px', '& .MuiOutlinedInput-root': { height: '32px', backgroundColor: isDarkMode ? '#283046' : '#fff', color: isDarkMode ? '#d0d2d6' : '#6e6b7b', '& fieldset': { borderColor: isDarkMode ? '#404656' : '#d8d6de' } }, '& .MuiInputBase-input': { padding: '0 8px !important' } }}
                                />
                            )}
                            disablePortal={true}
                            slotProps={{ paper: { sx: { bgcolor: isDarkMode ? '#283046' : '#ffffff', color: isDarkMode ? '#d0d2d6' : '#6e6b7b', '& .MuiAutocomplete-listbox': { '& .MuiAutocomplete-option': { fontSize: '0.9rem', '&[aria-selected="true"]': { bgcolor: 'rgba(115, 103, 240, 0.12) !important', color: '#7367f0 !important' }, '&:hover': { bgcolor: 'rgba(115, 103, 240, 0.08) !important', color: '#7367f0 !important' } } } } } }}
                            sx={{ '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' }, '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#d0d2d6' : '#6e6b7b' } }}
                        />
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Entries per page</Typography>
                    </Box>

                    <Box className="flex items-center gap-4">
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                            Showing {Math.min((pagination.page - 1) * limit + 1, pagination.total || 0)} to {Math.min(pagination.page * limit, pagination.total || 0)} of {pagination.total || 0} entries
                        </Typography>
                    </Box>

                    <Pagination
                        count={pagination.totalPages || 1}
                        page={pagination.page || 1}
                        onChange={(event, value) => { setPage(value); syncUrlParams(value, limit); }}
                        shape="rounded" showFirstButton showLastButton
                        sx={{
                            '& .MuiPaginationItem-root': { color: isDarkMode ? '#b4b7bd' : '#6e6b7b', bgcolor: isDarkMode ? '#323a50' : '#f3f2f7', border: 'none', fontWeight: 500, m: 0.2, transition: 'all 0.2s ease', '&:hover': { bgcolor: isDarkMode ? 'rgba(115,103,240,0.18)' : 'rgba(115,103,240,0.1)', color: isDarkMode ? '#a5b4fc' : '#7367f0' }, '&.Mui-selected': { bgcolor: '#7367f0 !important', color: '#fff !important', fontWeight: 700, '&:hover': { bgcolor: '#5e50ee !important' } } },
                            '& .MuiPaginationItem-ellipsis': { bgcolor: 'transparent' }
                        }}
                    />
                </Box>

            {deleteDialogOpen && (
                <ConfirmDialog
                    open={deleteDialogOpen}
                    onClose={() => { setDeleteDialogOpen(false); setSelectedLogId(null); }}
                    onConfirm={handleConfirmDelete}
                    title="Delete Activity Log"
                    message={
                        <>
                            Are you sure you want to delete this activity log? This action cannot be undone.
                        </>
                    }
                    confirmText="Delete"
                    cancelText="Cancel"
                    isLoading={isDeleting}
                    loadingText="Deleting..."
                    severity="error"
                />
            )}

            {/* View Details Dialog */}
        {/* View Details Dialog */}
        <Dialog
            open={!!viewLog}
            onClose={() => setViewLog(null)}
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
                Log Details
            </Typography>
            <IconButton onClick={() => setViewLog(null)} sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
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
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }, 
                    gap: 3,
                    bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
                }}>
                    <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Action</Typography>
                    <Box sx={{ mt: 0.5 }}>
                        <Chip 
                        label={viewLog?.action?.toUpperCase() || 'GENERAL'} 
                        size="small" 
                        sx={{ 
                            backgroundColor: viewLog?.action === 'CREATE' ? (isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5') : (viewLog?.action === 'UPDATE' ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe') : (isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2')),
                            color: viewLog?.action === 'CREATE' ? (isDarkMode ? '#34d399' : '#059669') : (viewLog?.action === 'UPDATE' ? (isDarkMode ? '#60a5fa' : '#2563eb') : (isDarkMode ? '#f87171' : '#dc2626')),
                            fontWeight: 600, 
                            borderRadius: '4px' 
                        }}
                        />
                    </Box>
                    </Box>
                    <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Timestamp</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {moment(viewLog?.created_at).format('MMMM D, YYYY h:mm:ss A')}
                    </Typography>
                    </Box>
                    <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>User Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>{viewLog?.user_name || 'System'}</Typography>
                    </Box>
                    <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Entity Type</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>{viewLog?.entity_type}</Typography>
                    </Box>
                    {viewLog?.entity_id && (
                        <Box sx={{ gridColumn: '1 / -1' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Entity ID</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                            {viewLog?.entity_id}
                        </Typography>
                        </Box>
                    )}
                </Box>

                <Box sx={{ 
                    bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
                }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase', mb: 1, display: 'block' }}>Details</Typography>
                    <Box 
                    sx={{ 
                        p: 2, 
                        bgcolor: isDarkMode ? '#1f2937' : '#f3f4f6', 
                        fontSize: '0.9rem',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        borderRadius: 1,
                        border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
                        color: isDarkMode ? '#d1d5db' : '#374151'
                    }}
                    >
                    <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                        {viewLog?.details ? JSON.stringify(viewLog.details, null, 2) : 'No details available'}
                    </pre>
                    </Box>
                </Box>

                {viewLog?.old_data && (
                    <Box sx={{ 
                        bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.04)' : 'rgba(239, 68, 68, 0.04)',
                        p: 2.5,
                        borderRadius: 2,
                        border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.12)'}`,
                    }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#f87171' : '#dc2626', letterSpacing: 0.5, textTransform: 'uppercase', mb: 1, display: 'block' }}>Old Data</Typography>
                        <Box 
                        sx={{ 
                            p: 2, 
                            bgcolor: isDarkMode ? '#2c1e1e' : '#fff1f2', 
                            fontSize: '0.9rem',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            borderRadius: 1,
                            border: `1px solid ${isDarkMode ? '#5c3a3a' : '#ffe4e6'}`,
                            color: isDarkMode ? '#fecdd3' : '#9f1239'
                        }}
                        >
                        <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                            {JSON.stringify(viewLog.old_data, null, 2)}
                        </pre>
                        </Box>
                    </Box>
                )}

                {viewLog?.new_data && (
                    <Box sx={{ 
                        bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.04)',
                        p: 2.5,
                        borderRadius: 2,
                        border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.12)'}`,
                    }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#34d399' : '#059669', letterSpacing: 0.5, textTransform: 'uppercase', mb: 1, display: 'block' }}>New Data</Typography>
                        <Box 
                        sx={{ 
                            p: 2, 
                            bgcolor: isDarkMode ? '#1e2c24' : '#f0fdf4', 
                            fontSize: '0.9rem',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            borderRadius: 1,
                            border: `1px solid ${isDarkMode ? '#3a5c48' : '#dcfce7'}`,
                            color: isDarkMode ? '#bbf7d0' : '#166534'
                        }}
                        >
                        <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                            {JSON.stringify(viewLog.new_data, null, 2)}
                        </pre>
                        </Box>
                    </Box>
                )}

            </DialogContent>
            <DialogActions sx={{ p: 2.5, backgroundColor: isDarkMode ? '#283046' : '#ffffff', borderTop: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>
            <Button onClick={() => setViewLog(null)} variant="outlined" sx={{ 
                borderColor: isDarkMode ? '#404656' : '#ebe9f1',
                color: isDarkMode ? '#d1d5db' : '#374151',
                '&:hover': {
                    borderColor: isDarkMode ? '#9ca3af' : '#9ca3af',
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                }
            }}>Close</Button>
            </DialogActions>
        </Dialog>
        </Box>
        </Box>
    );
};

export default ActivityLogs;

