"use client";

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Typography, Button, IconButton, Select, MenuItem, FormControl, InputLabel, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import { useTheme } from '../../../context/ThemeContext'
import { toast } from '../../../utils/toast';
import { PageHeader, ConfirmDialog } from '../../../components/common'
import DeleteIcon from '@mui/icons-material/Delete'
import { useGetHomeSectionsQuery } from '../../../features/api/homeSectionApi'

import { useGetHomeSectionItemsQuery, useRemoveHomeSectionItemsMutation } from '../../../features/api/homeSectionItemApi'
import AddHomeSectionItemsDialog from './AddHomeSectionItemsDialog'
import { getImage } from '../../../utils/helper'



import { useUser } from '../../../context/useUser';
import { AccessDenied } from '../../../components/common';

const HomeSectionItemsManagement = () => {
    const { isDarkMode } = useTheme()
    const { user } = useUser();
    const userPermissions = user?.permissions || [];
    const isAdmin = user?.role === 'admin';
    
    const canList = isAdmin || userPermissions.includes('home_section_items.list');
    const canViewItems = isAdmin || userPermissions.includes('home_section_items.list');
    const canAddItems = isAdmin || userPermissions.includes('home_section_items.add');
    const canDeleteItems = isAdmin || userPermissions.includes('home_section_items.delete');

    


    useEffect(() => {
        document.title = 'Home Section Items'
    })

    const [searchParams, setSearchParams] = useSearchParams()
    const { data: homeSections, isLoading: isLoadingSections } = useGetHomeSectionsQuery()
    
    const selectedSectionId = searchParams.get('sectionId') || ''
    

    const { data: sectionItems, isLoading: isLoadingItems, isFetching: isFetchingItems } = useGetHomeSectionItemsQuery(selectedSectionId, {
        skip: !selectedSectionId
    })

    const [removeHomeSectionItems, { isLoading: isRemoving }] = useRemoveHomeSectionItemsMutation()

    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState(null)
    const [search, setSearch] = useState('')


    useEffect(() => {
        if (homeSections?.data && homeSections.data.length > 0 && !selectedSectionId) {
            setSearchParams({ sectionId: homeSections.data[0].home_section_id })
        }
    }, [homeSections, selectedSectionId, setSearchParams])

    

    const selectedSection = useMemo(() => {
        return homeSections?.data?.find(s => String(s.home_section_id) === String(selectedSectionId))
    }, [homeSections, selectedSectionId])

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



    const rowData = useMemo(() => {
        let finalData = Array.isArray(sectionItems?.data) ? sectionItems.data : [];
        
        if (selectedSection?.type === 'keyword' && finalData.length > 0) {
            const groups = {};
            const seenRecipeIds = new Set();
            
            finalData.forEach(item => {
                const kId = item.keyword_id;
                if (!groups[kId]) {
                    groups[kId] = {
                        isHeader: true,
                        keyword_id: kId,
                        keyword_name: item.keyword_name,
                        recipes: []
                    };
                }
                
                const rId = item.recipe_id || item.id;
                if (!seenRecipeIds.has(rId)) {
                    groups[kId].recipes.push(item);
                    seenRecipeIds.add(rId);
                }
            });

            const transformed = [];
            Object.values(groups).forEach(group => {
                transformed.push(group);
                group.recipes.forEach(recipe => {
                    transformed.push({ ...recipe, isChild: true });
                });
            });
            finalData = transformed;
        }
        
        if (search) {
            const lowerSearch = search.toLowerCase();
            return finalData.filter(item => {
                if (item.isHeader) {
                    return item.keyword_name?.toLowerCase().includes(lowerSearch);
                }
                return (item.name || item.title || '').toLowerCase().includes(lowerSearch) ||
                       (item.keyword_name || '').toLowerCase().includes(lowerSearch);
            });
        }
        
        return finalData;
    }, [sectionItems, selectedSection, search])

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
                                onChange={(e) => setSearch(e.target.value)}
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
                                onChange={(e, newValue) => setSearchParams({ sectionId: newValue })}
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
                                {selectedSection?.type === 'keyword' && (
                                    <TableCell>KEYWORD</TableCell>
                                )}
                                {selectedSection?.type === 'recipe' && (
                                    <TableCell align="center">FOOD TYPE</TableCell>
                                )}
                                <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>TYPE</TableCell>
                                {canDeleteItems && (
                                    <TableCell align="center" width={100}>ACTIONS</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoadingItems || isFetchingItems ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                        <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                    </TableCell>
                                </TableRow>
                            ) : (!rowData || rowData.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                        <Typography variant="body1" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                            No items found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                (() => {
                                    const filteredItems = search ? 
                                        rowData.filter(item => {
                                            const searchStr = search.toLowerCase();
                                            const nameMatch = (item.name || item.title || '').toLowerCase().includes(searchStr);
                                            const keywordMatch = (item.keyword_name || '').toLowerCase().includes(searchStr);
                                            return nameMatch || keywordMatch;
                                        }) : rowData;

                                    if (filteredItems.length === 0) {
                                        return (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                                    <Typography variant="body1" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                                        No matching items
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }

                                    return filteredItems.map((rowItem, index) => {
                                        const isKeywordType = selectedSection?.type === 'keyword';
                                        const isRecipeType = selectedSection?.type === 'recipe';

                                        if (rowItem.isHeader) {
                                            let colSpan = 2;
                                            if (isKeywordType) colSpan += 1;
                                            if (isRecipeType) colSpan += 1;
                                            
                                            return (
                                                <TableRow key={'header-'+index} sx={{ backgroundColor: isDarkMode ? '#111827' : '#f9fafb', height: '60px' }}>
                                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>•</TableCell>
                                                    <TableCell></TableCell>
                                                    <TableCell colSpan={colSpan} sx={{ fontWeight: 'bold', color: '#CA6014', pl: '20px' }}>
                                                        Recipes for: {rowItem.keyword_name}
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}></TableCell>
                                                    {canDeleteItems && <TableCell></TableCell>}
                                                </TableRow>
                                            );
                                        }

                                        const imgVal = (typeof rowItem.image === 'string' ? rowItem.image.trim() : '') || '';
                                        const imgUrl = imgVal && imgVal.toLowerCase() !== 'null' ? getImage(imgVal) : '';
                                        const isSquare = selectedSection?.type === 'category' || selectedSection?.type === 'sub-category';
                                        const isRecipe = selectedSection?.type === 'recipe' || selectedSection?.type === 'keyword';
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
                                                <TableCell align="center">{index + 1}</TableCell>
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
                                                
                                                {isKeywordType && (
                                                    <TableCell>{rowItem.keyword_name || '-'}</TableCell>
                                                )}
                                                
                                                {isRecipeType && (
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
                                                )}

                                                <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                    {selectedSection?.type ? selectedSection.type.charAt(0).toUpperCase() + selectedSection.type.slice(1) : '-'}
                                                </TableCell>
                                                
                                                {canDeleteItems && (
                                                    <TableCell align="center">
                                                        <Tooltip title="Delete" arrow>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleDelete(rowItem.keyword_id || rowItem.recipe_id || rowItem.category_id || rowItem.sub_category_id || rowItem.id)}
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
                                })()
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
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
            />
        </Box>
    )
}

export default HomeSectionItemsManagement

