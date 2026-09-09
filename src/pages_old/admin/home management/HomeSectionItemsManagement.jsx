"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Typography, Button, IconButton, Paper, Tabs, Tab, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Autocomplete, TextField, Pagination } from '@mui/material'

import { useTheme } from '../../../context/ThemeContext'
import { toast } from '../../../utils/toast';
import { ConfirmDialog } from '../../../components/common'
import DeleteIcon from '@mui/icons-material/Delete'
import { useGetHomeSectionsQuery } from '../../../features/api/homeSectionApi'

import { useGetHomeSectionItemsQuery, useRemoveHomeSectionItemsMutation } from '../../../features/api/homeSectionItemApi'
import AddHomeSectionItemsDialog from './AddHomeSectionItemsDialog'
import { getImage } from '../../../utils/helper'

import { useUser } from '../../../context/useUser';
import { AccessDenied } from '../../../components/common';

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

const HomeSectionItemsManagement = () => {
    const { isDarkMode } = useTheme()
    const { user } = useUser();
    const userPermissions = user?.permissions || [];

    const canList = userPermissions.includes('home_section_items.list');
    const canAddItems = userPermissions.includes('home_section_items.add');
    const canDeleteItems = userPermissions.includes('home_section_items.delete');

    useEffect(() => {
        document.title = 'Home Section Items'
    }, [])

    const [searchParams, setSearchParams] = useSearchParams()
    const { data: homeSections, isLoading: isLoadingSections } = useGetHomeSectionsQuery()

    const selectedSectionId = searchParams.get('sectionId') || ''
    
    const urlPage = parseInt(searchParams.get('page'), 10) || 1;
    const urlLimit = parseInt(searchParams.get('limit'), 10) || 10;
    const urlSearch = searchParams.get('search') || '';

    const [page, setPage] = useState(urlPage);
    const [limit, setLimit] = useState(urlLimit);
    const [search, setSearch] = useState(urlSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

    useEffect(() => {
        setPage(urlPage);
        setLimit(urlLimit);
        setSearch(urlSearch);
        setDebouncedSearch(urlSearch);
    }, [urlPage, urlLimit, urlSearch]);

    const searchTimerRef = useRef(null);
    const onSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(value);
            setPage(1);
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (value) next.set("search", value);
                else next.delete("search");
                next.set("page", "1");
                return next;
            });
        }, 500);
    };

    const { data: sectionItemsData, isLoading: isLoadingItems, isFetching: isFetchingItems } = useGetHomeSectionItemsQuery({
        homeSectionId: selectedSectionId,
        page,
        limit,
        search: debouncedSearch
    }, {
        skip: !selectedSectionId
    })

    const [removeHomeSectionItems, { isLoading: isRemoving }] = useRemoveHomeSectionItemsMutation()

    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState(null)

    useEffect(() => {
        if (homeSections?.data && homeSections.data.length > 0 && !selectedSectionId) {
            setSearchParams({ sectionId: homeSections.data[0].home_section_id, page: "1", limit: String(limit) })
        }
    }, [homeSections, selectedSectionId, setSearchParams, limit])

    const selectedSection = useMemo(() => {
        return homeSections?.data?.find(s => String(s.home_section_id) === String(selectedSectionId))
    }, [homeSections, selectedSectionId])

    const isRecipeSection = selectedSection?.type === 'recipe';

    const handleDelete = (itemId) => {
        setDeleteId(itemId)
    }

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await removeHomeSectionItems({
                home_section_id: Number(selectedSectionId),
                item_ids: [Number(deleteId)]
            }).unwrap();
            toast.success('Item removed successfully');
            setDeleteId(null);
        } catch (error) {
            toast.error('Failed to remove item');
        }
    }

    const rowData = sectionItemsData?.data || [];
    const pagination = sectionItemsData?.pagination || { total: 0, page: 1, limit, totalPages: 1 };

    const syncUrlParams = (newPage, newLimit) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("page", String(newPage));
            next.set("limit", String(newLimit));
            return next;
        });
    };

    if (!canList) {
        return <AccessDenied message="You do not have permission to view Home Section Items Management." />;
    }

    return (
        <Box className="transition-all duration-200 flex flex-col pt-0 md:pt-4 pb-4 px-3 mt-[64px] md:mt-[74px] min-h-[calc(100vh-74px)] h-auto w-full">
            <Box
                className="flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden transition-all duration-200"
                sx={{
                    bgcolor: isDarkMode ? '#283046' : '#ffffff',
                    borderColor: isDarkMode ? '#3b4253' : '#ebe9f1',
                    boxShadow: isDarkMode ? '0 4px 24px 0 rgba(0, 0, 0, 0.24)' : '0 4px 24px 0 rgba(34, 41, 47, 0.1)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* ── Header Area ───────────────────────────────────────────── */}
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
                            Section Items
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, width: 'auto', alignItems: 'center' }}>
                        {canAddItems && (
                            <Button
                                variant="contained"
                                onClick={() => setAddDialogOpen(true)}
                                disabled={!selectedSectionId}
                                sx={{
                                    height: '38px',
                                    textTransform: 'none',
                                    px: { xs: 2, sm: 3 },
                                    fontSize: { xs: '14px', sm: '16px' },
                                    width: 'auto',
                                    bgcolor: '#28c76f',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#23af62', boxShadow: 'none' },
                                }}
                            >
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>+ Add Items</Box>
                                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>+ Add</Box>
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* ── Filters row ───────────────────────────────────────────── */}
                <Box className="flex flex-col p-5 gap-4">
                    <Box className="flex flex-wrap items-center justify-between gap-4">
                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                Search:
                            </Typography>
                            <input
                                type="text"
                                value={search}
                                onChange={onSearchChange}
                                placeholder="Search items..."
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
                        <Box className="flex items-center gap-3" sx={{ width: { xs: '100%', md: 'auto' }, maxWidth: '100%', overflow: 'hidden' }}>
                            <Tabs
                                value={selectedSectionId || false}
                                onChange={(e, newValue) => {
                                    setPage(1);
                                    setSearchParams({ sectionId: newValue, page: "1", limit: String(limit) });
                                }}
                                variant="scrollable"
                                scrollButtons="auto"
                                allowScrollButtonsMobile
                                sx={{
                                    minHeight: '38px',
                                    height: '38px',
                                    width: '100%',
                                    maxWidth: { xs: '100%', sm: 'calc(100vw - 350px)', md: '800px' },
                                    '& .MuiTab-root': {
                                        minHeight: '38px',
                                        height: '38px',
                                        color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                        padding: '0 20px',
                                    },
                                    '& .Mui-selected': {
                                        color: '#7367f0 !important',
                                        fontWeight: 600,
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: '#7367f0',
                                    }
                                }}
                            >
                                {homeSections?.data?.map((section) => {
                                    const isFeature = String(section.section_type || '').toLowerCase() === 'feature';
                                    return (
                                        <Tab
                                            key={section.home_section_id}
                                            value={String(section.home_section_id)}
                                            label={`${section.name} (${section.type})`}
                                            sx={{
                                                color: isFeature ? (isDarkMode ? '#60a5fa' : '#2563eb') : 'inherit',
                                            }}
                                        />
                                    );
                                })}
                            </Tabs>
                        </Box>
                    </Box>
                </Box>

                {/* ── Stats Section (Recipe only) ──────────────────────────── */}
                {isRecipeSection && sectionItemsData?.stats && (
                    <Box
                        className="flex flex-wrap gap-3 px-5 pb-4"
                    >
                        {[
                            { label: 'Total Recipes', count: sectionItemsData.stats.total, color: '#7367f0', bgLight: 'rgba(115, 103, 240, 0.12)', bgDark: 'rgba(115, 103, 240, 0.16)' },
                            { label: 'Veg', count: sectionItemsData.stats.veg, color: '#28c76f', bgLight: 'rgba(40, 199, 111, 0.12)', bgDark: 'rgba(40, 199, 111, 0.16)' },
                            { label: 'Non-Veg', count: sectionItemsData.stats.non_veg, color: '#ea5455', bgLight: 'rgba(234, 84, 85, 0.12)', bgDark: 'rgba(234, 84, 85, 0.16)' },
                            { label: 'Egg', count: sectionItemsData.stats.egg, color: '#ff9f43', bgLight: 'rgba(255, 159, 67, 0.12)', bgDark: 'rgba(255, 159, 67, 0.16)' },
                        ].map((stat) => (
                            <Box
                                key={stat.label}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 2.5,
                                    py: 1.5,
                                    borderRadius: '8px',
                                    bgcolor: isDarkMode ? stat.bgDark : stat.bgLight,
                                    minWidth: '140px',
                                    flex: { xs: '1 1 calc(50% - 12px)', sm: '0 1 auto' },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '8px',
                                        bgcolor: stat.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontWeight: 700,
                                        fontSize: '1.1rem',
                                        flexShrink: 0,
                                    }}
                                >
                                    {stat.count}
                                </Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        color: stat.color,
                                        fontSize: '0.85rem',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {stat.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* ── Table ───────────────────────────────────────────────── */}
                <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        flex: 1,
                        backgroundColor: 'transparent',
                        backgroundImage: 'none',
                        boxShadow: 'none',
                        borderRadius: 0,
                        overflowX: 'auto',
                    }}
                >
                    <Table stickyHeader sx={{ minWidth: 800, borderCollapse: 'separate', borderSpacing: 0 }}>
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
                                    borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                    borderTop: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
                                    py: 0,
                                    px: 2,
                                }
                            }}>
                                <TableCell align="center" width={60}>#</TableCell>
                                <TableCell align="center" width={80}>IMAGE</TableCell>
                                <TableCell>NAME</TableCell>
                                {isRecipeSection && (
                                    <>
                                        <TableCell align="center">CATEGORY</TableCell>
                                        <TableCell align="center">SUB CATEGORY</TableCell>
                                        <TableCell align="center">FOOD TYPE</TableCell>
                                    </>
                                )}
                                <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>TYPE</TableCell>
                                <TableCell align="center">ADDED TIME</TableCell>
                                {canDeleteItems && (
                                    <TableCell align="center" width={100}>ACTIONS</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoadingItems || isFetchingItems ? (
                                <TableRow>
                                    <TableCell colSpan={isRecipeSection ? 9 : 7} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                        <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                    </TableCell>
                                </TableRow>
                            ) : (!rowData || rowData.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={isRecipeSection ? 9 : 7} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                        <Typography variant="body1" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                            No items found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rowData.map((rowItem, index) => {
                                    const imgVal = (typeof rowItem.image === 'string' ? rowItem.image.trim() : '') || '';
                                    const imgUrl = imgVal && imgVal.toLowerCase() !== 'null' ? getImage(imgVal) : '';
                                    const isSquare = selectedSection?.type === 'category' || selectedSection?.type === 'sub-category';
                                    const isRecipe = selectedSection?.type === 'recipe';
                                    let width = 60; let height = 40;
                                    if (isSquare) { width = 40; height = 40; } else if (isRecipe) { width = 50; height = 35; }

                                    return (
                                        <TableRow
                                            key={rowItem.id || `item-${index}`}
                                            sx={{
                                                'height': '60px',
                                                '&:hover': {
                                                    backgroundColor: isDarkMode ? '#2f3851' : '#f8f8f8',
                                                },
                                                '& td': {
                                                    borderColor: isDarkMode ? '#3b4253' : '#ebe9f1',
                                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                                }
                                            }}
                                        >
                                            <TableCell align="center">{(page - 1) * limit + index + 1}</TableCell>
                                            <TableCell align="center">
                                                {imgUrl ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                        <img src={imgUrl} alt={rowItem.name || rowItem.title} style={{ width, height, objectFit: 'cover', borderRadius: isSquare ? '50%' : 4 }} />
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                        <span style={{ color: '#9ca3af' }}>-</span>
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>{rowItem.name || rowItem.title}</TableCell>

                                            {isRecipeSection && (
                                                <>
                                                    <TableCell align="center">{rowItem.category_name || '-'}</TableCell>
                                                    <TableCell align="center">{rowItem.sub_category_name || '-'}</TableCell>
                                                    <TableCell align="center">
                                                        {(() => {
                                                            const val = String(rowItem.food_type || '').trim().toLowerCase();
                                                            if (!val) return '-';
                                                            if (val === 'veg') return 'Veg';
                                                            if (val === 'egg') return 'Egg';
                                                            if (val === 'non_veg' || val === 'non-veg' || val === 'non veg') return 'Non-Veg';
                                                            return val.charAt(0).toUpperCase() + val.slice(1);
                                                        })()}
                                                    </TableCell>
                                                </>
                                            )}

                                            <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                {selectedSection?.type ? selectedSection.type.charAt(0).toUpperCase() + selectedSection.type.slice(1) : '-'}
                                            </TableCell>

                                            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                                {formatDate(rowItem.added_at)}
                                            </TableCell>

                                            {canDeleteItems && (
                                                <TableCell align="center">
                                                    <Tooltip title="Delete" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDelete(rowItem.recipe_id || rowItem.category_id || rowItem.sub_category_id || rowItem.id)}
                                                            disabled={isRemoving}
                                                            sx={{
                                                                color: isDarkMode ? '#ef4444' : '#dc2626',
                                                                '&:hover': {
                                                                    backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
                                                                },
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ── Pagination row ───────────────────────────────────────── */}
                <Box
                    className="flex flex-col sm:flex-row justify-between items-center p-4 border-t gap-4"
                    sx={{ borderColor: isDarkMode ? '#3b4253' : '#ebe9f1' }}
                >
                    <Box className="flex items-center gap-2">
                        <Autocomplete
                            freeSolo
                            size="small"
                            options={[10, 25, 50, 100, 150, 200, 250, 300, 350]}
                            getOptionLabel={(option) => String(option)}
                            value={limit}
                            onChange={(event, newValue) => {
                                if (newValue) {
                                    const parsed = Number(newValue);
                                    if (!isNaN(parsed) && parsed > 0) {
                                        setLimit(parsed);
                                        setPage(1);
                                        syncUrlParams(1, parsed);
                                    }
                                }
                            }}
                            onInputChange={(event, newInputValue) => {
                                const parsed = Number(newInputValue);
                                if (!isNaN(parsed) && parsed > 0) {
                                    setLimit(parsed);
                                    setPage(1);
                                    syncUrlParams(1, parsed);
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
                            Showing {pagination.total === 0 ? 0 : Math.min((pagination.page - 1) * limit + 1, pagination.total || 0)} to {Math.min(pagination.page * limit, pagination.total || 0)} of {pagination.total || 0} entries
                        </Typography>
                    </Box>

                    <Pagination
                        count={pagination.totalPages || 1}
                        page={pagination.page || 1}
                        onChange={(event, value) => {
                            setPage(value);
                            syncUrlParams(value, limit);
                        }}
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

            {selectedSection && (
                <AddHomeSectionItemsDialog
                    open={addDialogOpen}
                    onClose={() => setAddDialogOpen(false)}
                    section={selectedSection}
                    existingItems={rowData}
                />
            )}

            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Item"
                message="Are you sure you want to remove this item?"
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isRemoving}
                loadingText="Deleting..."
                severity="error"
                confirmButtonProps={{ sx: { bgcolor: '#dc2626', color: '#fff', '&:hover': { bgcolor: '#b91c1c' } } }}
            />
        </Box>
    )
}

export default HomeSectionItemsManagement
