"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Button, IconButton, Autocomplete, TextField, Box, DialogActions, Typography, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAddHomeSectionItemsMutation } from '../../../features/api/homeSectionItemApi';
import { useGetRecipeCategoriesQuery } from '../../../features/api/categoryApi';
import { useGetAllRecipeSubCategorieDetailsQuery } from '../../../features/api/subCategoryApi';
import { useSearchPublicApprovedRecipesSimpleQuery } from '../../../features/api/recipeApi';
import { useGetAllKeywordsQuery } from '../../../features/api/keywordApi';
import { toast } from '../../../utils/toast';
import { useTheme } from '../../../context/ThemeContext';

const getItemId = (item, type) => {
    if (!item) return null;
    switch (type) {
        case 'category':
            return item.category_id;
        case 'sub-category':
            return item.sub_category_id || item.item_id;
        case 'recipe':
            return item.recipe_id || item.item_id;
        case 'keyword':
            return item.keyword_id || item.item_id || item.id;
        default:
            return item.recipe_id || item.sub_category_id || item.category_id || item.keyword_id || item.id || item.item_id;
    }
};

const AddHomeSectionItemsDialog = ({ open, onClose, section, existingItems }) => {
    const { isDarkMode } = useTheme();
    const [selectedItems, setSelectedItems] = useState([]);
    const [addHomeSectionItems, { isLoading: isAdding }] = useAddHomeSectionItemsMutation();

    const existingIds = useMemo(() => {
        return existingItems?.map(item => String(getItemId(item, section?.type))) || [];
    }, [existingItems, section]);

    const handleSelect = (newValue) => {
        setSelectedItems(newValue);
    };

    const handleClose = () => {
        setSelectedItems([]);
        onClose();
    };

    const handleAdd = async () => {
        if (!selectedItems || selectedItems.length === 0) return;
        try {
            const itemsToAdd = selectedItems.map(item => {
                const id = getItemId(item, section?.type);
                return { id: Number(id) };
            });

            await addHomeSectionItems({
                home_section_id: section.home_section_id,
                items: itemsToAdd
            }).unwrap();

            toast.success('Items added successfully');
            setSelectedItems([]);
            onClose();
        } catch (error) {
            toast.error('Failed to add items');
        }
    };

    const customInputSx = {
        '& .MuiOutlinedInput-root': {
            color: isDarkMode ? '#e2e8f0' : '#1e293b',
            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
            borderRadius: '8px',
            transition: 'all 0.2s ease-in-out',
            '& fieldset': {
                borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                borderWidth: '1px',
            },
            '&:hover fieldset': {
                borderColor: isDarkMode ? '#475569' : '#cbd5e1',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#6366f1',
                borderWidth: '2px',
            },
            '&.Mui-focused': {
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
            }
        },
        '& .MuiInputLabel-root': {
            color: isDarkMode ? '#94a3b8' : '#64748b',
            '&.Mui-focused': {
                color: '#6366f1',
            }
        },
        '& .MuiFormHelperText-root': {
            color: '#ef4444',
            marginLeft: '4px',
            marginTop: '4px',
        },
        '& .MuiSelect-icon': {
            color: isDarkMode ? '#94a3b8' : '#64748b',
        },
        '& .MuiTypography-root': {
            color: isDarkMode ? '#e2e8f0' : '#1e293b',
        },
        '& .MuiAutocomplete-tag': {
            display: 'none',
        },
        '& .MuiAutocomplete-popupIndicator': {
            color: isDarkMode ? '#94a3b8' : '#64748b',
        },
        '& .MuiAutocomplete-clearIndicator': {
            color: isDarkMode ? '#94a3b8' : '#64748b',
        }
    };

    const autocompletePaperSx = {
        sx: {
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            color: isDarkMode ? '#e2e8f0' : '#1e293b',
            border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            borderRadius: '8px',
            mt: 1,
            boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            '& .MuiAutocomplete-option': {
                padding: '10px 16px',
                color: isDarkMode ? '#e2e8f0' : '#1e293b',
                '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#f1f5f9',
                },
                '&[aria-selected="true"]': {
                    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff',
                    color: '#6366f1',
                    fontWeight: 600,
                    '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : '#c7d2fe',
                    }
                }
            },
            '& .MuiAutocomplete-noOptions': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
        }
    };

    const renderSearch = () => {
        if (!section) return null;

        if (section.type === 'category') {
            return <AddItemAutocomplete
                useQuery={useGetRecipeCategoriesQuery}
                label="Search Categories"
                onSelect={handleSelect}
                value={selectedItems}
                existingIds={existingIds}
                customInputSx={customInputSx}
                autocompletePaperSx={autocompletePaperSx}
                isDarkMode={isDarkMode}
                section={section}
            />
        } else if (section.type === 'sub-category') {
            return <AddItemAutocomplete
                useQuery={useGetAllRecipeSubCategorieDetailsQuery}
                label="Search Sub-Categories"
                onSelect={handleSelect}
                value={selectedItems}
                existingIds={existingIds}
                categoryId={section.category_id || undefined}
                customInputSx={customInputSx}
                autocompletePaperSx={autocompletePaperSx}
                isDarkMode={isDarkMode}
                section={section}
            />
        } else if (section.type === 'recipe') {
            return <AddItemAutocomplete
                useQuery={useSearchPublicApprovedRecipesSimpleQuery}
                label="Search Recipes"
                onSelect={handleSelect}
                value={selectedItems}
                existingIds={existingIds}
                customInputSx={customInputSx}
                autocompletePaperSx={autocompletePaperSx}
                isDarkMode={isDarkMode}
                section={section}
            />
        } else if (section.type === 'keyword') {
            return <AddItemAutocomplete
                useQuery={useGetAllKeywordsQuery}
                label="Search Keywords"
                onSelect={handleSelect}
                value={selectedItems}
                existingIds={existingIds}
                customInputSx={customInputSx}
                autocompletePaperSx={autocompletePaperSx}
                isDarkMode={isDarkMode}
                section={section}
            />
        }
        return null;
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    borderRadius: '16px',
                    boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                    backgroundImage: 'none',
                    border: isDarkMode ? '1px solid #1e293b' : 'none',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    p: 3,
                    pb: 2,
                }}
            >
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: isDarkMode ? '#f8fafc' : '#0f172a', letterSpacing: '-0.025em' }}>
                        Add Items to {section?.name}
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
                        '&:hover': {
                            backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                            color: isDarkMode ? '#f8fafc' : '#0f172a',
                        }
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent
                sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.5
                }}
            >
                <Box display="flex" flexDirection="column" gap={2}>
                    {renderSearch()}
                </Box>
            </DialogContent>
            <DialogActions
                sx={{
                    p: 3,
                    pt: 2,
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'flex-end',
                    borderTop: isDarkMode ? '1px solid #1e293b' : '1px solid #f1f5f9',
                }}
            >
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                        '&:hover': {
                            borderColor: isDarkMode ? '#475569' : '#94a3b8',
                            backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.2)' : 'rgba(100, 116, 139, 0.04)',
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleAdd}
                    disabled={isAdding || selectedItems.length === 0}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 4,
                        backgroundColor: '#7367f0',
                        boxShadow: 'none',
                        '&:hover': {
                            backgroundColor: '#5e50ee',
                            boxShadow: 'none',
                        },
                    }}
                >
                    {isAdding ? 'Adding...' : 'Add'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const AddItemAutocomplete = ({ useQuery, label, onSelect, value, existingIds, isRecipe, categoryId, customInputSx, autocompletePaperSx, isDarkMode, section }) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [options, setOptions] = useState([]);
    const [hasMore, setHasMore] = useState(true);

    const { data, isLoading, isFetching } = useQuery(
        { search: search, page: page, limit: 10, categoryId },
        { skip: !search.trim() }
    );

    useEffect(() => {
        setPage(1);
        setOptions([]);
        setHasMore(true);
    }, [search]);

    useEffect(() => {
        if (data) {
            const newItems = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

            if (page === 1) {
                setOptions(newItems);
            } else {
                setOptions(prev => {
                    const getId = (item) => getItemId(item, section?.type);

                    const existingIdsMap = new Map(prev.map(i => [String(getId(i)), i]));
                    newItems.forEach(item => {
                        const id = String(getId(item));
                        if (!existingIdsMap.has(id)) {
                            existingIdsMap.set(id, item);
                        }
                    });
                    return Array.from(existingIdsMap.values());
                });
            }

            if (newItems.length < 10) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        }
    }, [data, page]);

    const handleScroll = (event) => {
        const listboxNode = event.currentTarget;
        const position = listboxNode.scrollTop + listboxNode.clientHeight;
        if (listboxNode.scrollHeight - position <= 1) {
            if (!isFetching && hasMore) {
                setPage(prev => prev + 1);
            }
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Autocomplete
                multiple
                value={value}
                options={search.trim() ? options.filter(option => {
                    const id = getItemId(option, section?.type);
                    return !existingIds.includes(String(id));
                }) : []}
                noOptionsText={search.trim() ? "No options found" : "Type to search..."}
                getOptionLabel={(option) => option.name || option.title || ''}
                loading={isLoading}
                filterSelectedOptions
                onInputChange={(event, newInputValue) => {
                    if (event && event.type !== 'click') {
                        setSearch(newInputValue);
                    }
                }}
                onChange={(event, newValue) => {
                    onSelect(newValue);
                }}
                slotProps={{
                    paper: autocompletePaperSx,
                    listbox: {
                        onScroll: handleScroll,
                        sx: {
                            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                            color: isDarkMode ? '#e5e7eb' : '#374151',
                            '& .MuiAutocomplete-option': {
                                '&[aria-selected="true"]': {
                                    backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                                },
                                '&:hover': {
                                    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                                }
                            }
                        }
                    }
                }}

                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        variant="outlined"
                        sx={customInputSx}
                        InputProps={{
                            ...params?.InputProps,
                            endAdornment: (
                                <React.Fragment>
                                    {isLoading || isFetching ? <Box sx={{ display: 'flex', color: isDarkMode ? '#e5e7eb' : 'inherit' }} mr={1}>Loading...</Box> : null}
                                    {params?.InputProps?.endAdornment}
                                </React.Fragment>
                            ),
                        }}
                    />
                )}
                renderTags={() => []}
                isOptionEqualToValue={(option, value) => {
                    const idOption = getItemId(option, section?.type);
                    const idValue = getItemId(value, section?.type);
                    return String(idOption) === String(idValue);
                }}
            />
            {value.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {value.map((option, index) => (
                        <Chip
                            key={index}
                            label={option.name || option.title || ''}
                            onDelete={() => {
                                const newValue = value.filter((_, i) => i !== index);
                                onSelect(newValue);
                            }}
                            sx={{
                                backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                                color: isDarkMode ? '#f8fafc' : '#1e293b',
                                '& .MuiChip-deleteIcon': {
                                    color: isDarkMode ? '#94a3b8' : '#64748b',
                                    '&:hover': {
                                        color: isDarkMode ? '#e2e8f0' : '#475569',
                                    }
                                }
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    )
}

const SimpleAddItemAutocomplete = ({ useQuery, label, onSelect, value, existingIds, customInputSx, autocompletePaperSx, isDarkMode, section }) => {
    const { data, isLoading } = useQuery();

    const options = useMemo(() => {
        const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        return items.filter(option => {
            const getId = (item) => getItemId(item, section?.type);
            return !existingIds.includes(String(getId(option)));
        });
    }, [data, existingIds]);

    return (
        <Box sx={{ width: '100%' }}>
            <Autocomplete
                multiple
                value={value}
                options={options}
                getOptionLabel={(option) => option.name || option.title || ''}
                loading={isLoading}
                filterSelectedOptions
                onChange={(event, newValue) => {
                    onSelect(newValue);
                }}
                slotProps={{ paper: autocompletePaperSx }}

                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        variant="outlined"
                        sx={customInputSx}
                        InputProps={{
                            ...params?.InputProps,
                            endAdornment: (
                                <React.Fragment>
                                    {isLoading ? <Box sx={{ display: 'flex', color: isDarkMode ? '#e5e7eb' : 'inherit' }} mr={1}>Loading...</Box> : null}
                                    {params?.InputProps?.endAdornment}
                                </React.Fragment>
                            ),
                        }}
                    />
                )}
                renderTags={() => []}
                isOptionEqualToValue={(option, value) => {
                    const idOption = getItemId(option, section?.type);
                    const idValue = getItemId(value, section?.type);
                    return String(idOption) === String(idValue);
                }}
            />
            {value.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {value.map((option, index) => (
                        <Chip
                            key={index}
                            label={option.name || option.title || ''}
                            onDelete={() => {
                                const newValue = value.filter((_, i) => i !== index);
                                onSelect(newValue);
                            }}
                            sx={{
                                backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                                color: isDarkMode ? '#f8fafc' : '#1e293b',
                                '& .MuiChip-deleteIcon': {
                                    color: isDarkMode ? '#94a3b8' : '#64748b',
                                    '&:hover': {
                                        color: isDarkMode ? '#e2e8f0' : '#475569',
                                    }
                                }
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    )
}

export default AddHomeSectionItemsDialog;

