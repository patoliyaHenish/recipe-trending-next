"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Stack, Typography, IconButton, Switch, MenuItem, Select, FormControl, InputLabel, useMediaQuery, Autocomplete, Tooltip } from '@mui/material'
import { useTheme as useMuiTheme } from '@mui/material/styles'
import { toast } from '../../../utils/toast';
import { PageHeader, SearchBar, ConfirmDialog } from '../../../components/common'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import { useTheme } from '../../../context/ThemeContext'
import { 
    useGetHomeSectionsQuery, 
    useCreateHomeSectionMutation, 
    useUpdateHomeSectionMutation, 
    useDeleteHomeSectionMutation 
} from '../../../features/api/homeSectionApi'

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  section_type: Yup.string().required('Section Type is required'),
  type: Yup.string().required('Type is required'),
  position: Yup.number().required('Position is required').min(0, 'Position must be positive'),
  is_active: Yup.boolean().optional(),
})

import ViewHomeSectionDialog from './ViewHomeSectionDialog'
import AddHomeSectionDialog from './AddHomeSectionDialog'
import AddFeatureSectionDialog from './AddFeatureSectionDialog'

import { useUser } from '../../../context/useUser';
import { AccessDenied } from '../../../components/common';

const HomeSectionManagement = () => {
  const { isDarkMode } = useTheme()
  const muiTheme = useMuiTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'))
  const { user } = useUser();
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin';
  
  const canList = isAdmin || userPermissions.includes('home_section.list');
  const canView = isAdmin || userPermissions.includes('home_section.view');
  const canCreate = isAdmin || userPermissions.includes('home_section.create');
  const canUpdate = isAdmin || userPermissions.includes('home_section.update');
  const canDelete = isAdmin || userPermissions.includes('home_section.delete');
  const canPublish = isAdmin || userPermissions.includes('home_section.live');
  
  // Feature specific permissions
  const canViewFeature = isAdmin || userPermissions.includes('home_section.feature_view');
  const canUpdateFeature = isAdmin || userPermissions.includes('home_section.feature_update');
  const canDeleteFeature = isAdmin || userPermissions.includes('home_section.feature_delete');
  const canPublishFeature = isAdmin || userPermissions.includes('home_section.feature_live');

  

  const { data, isLoading, isFetching, isError } = useGetHomeSectionsQuery(undefined, {
    refetchOnFocus: false,
    refetchOnReconnect: false,
  })
  const [createHomeSection, { isLoading: isAdding }] = useCreateHomeSectionMutation()
  const [updateHomeSection, { isLoading: isUpdating }] = useUpdateHomeSectionMutation()
  const [deleteHomeSection, { isLoading: isDeleting }] = useDeleteHomeSectionMutation()

  const [open, setOpen] = useState(false)
  const [openFeatureDialog, setOpenFeatureDialog] = useState(false)
  const [isFeatureEdit, setIsFeatureEdit] = useState(false)
  const [currentFeatureId, setCurrentFeatureId] = useState(null)
  const [currentFeatureSection, setCurrentFeatureSection] = useState(null)
  const [isEdit, setIsEdit] = useState(false)
  const [currentId, setCurrentId] = useState(null)
  const [initialValues, setInitialValues] = useState({ name: '', section_type: 'slider', type: 'category', position: 0, is_active: false })

  
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '')
  
  const [sectionType, setSectionType] = useState('all')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  
  const [debouncedSectionType, setDebouncedSectionType] = useState('all')
  const [debouncedType, setDebouncedType] = useState('all')
  const [debouncedStatus, setDebouncedStatus] = useState('all')

  

  useEffect(() => {
    document.title = 'Home Sections'
  }, [])
  
  const [viewSection, setViewSection] = useState(null)

  const handleSearch = () => {
    setDebouncedSearch(search)
    setDebouncedSectionType(sectionType)
    setDebouncedType(type)
    setDebouncedStatus(status)
    
    setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (search) next.set('search', search);
        else next.delete('search');
        return next;
    });
  }

  const handleClearFilters = () => {
    setSearch('')
    setSectionType('all')
    setType('all')
    setStatus('all')
    
    setDebouncedSearch('')
    setDebouncedSectionType('all')
    setDebouncedType('all')
    setDebouncedStatus('all')
    
    setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('search');
        return next;
    });
  }

  const homeSections = useMemo(() => {
     const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
     return raw.filter(item => {
         const matchesSearch = !debouncedSearch || item.name.toLowerCase().includes(debouncedSearch.toLowerCase());
         const matchesSectionType = debouncedSectionType === 'all' || (item.section_type && item.section_type.toLowerCase() === debouncedSectionType.toLowerCase());
         const matchesType = debouncedType === 'all' || (item.type && item.type.toLowerCase() === debouncedType.toLowerCase());
         const matchesStatus = debouncedStatus === 'all' || (debouncedStatus === 'active' ? item.is_active : (debouncedStatus === 'inactive' ? !item.is_active : true));
         return matchesSearch && matchesSectionType && matchesType && matchesStatus;
     })
  }, [data, debouncedSearch, debouncedSectionType, debouncedType, debouncedStatus])


  const handleOpen = (item = null) => {
    if (item) {
      setIsEdit(true)
      setCurrentId(item.home_section_id)
      setInitialValues({
          name: item.name,
          section_type: item.section_type,
          type: item.type,
          category_id: item.category_id,
          position: item.position,
          is_active: item.is_active
      })
    } else {
      setIsEdit(false)
      setCurrentId(null)
      setInitialValues({ name: '', section_type: 'slider', type: 'category', position: homeSections.length + 1, is_active: false })

    }
    setOpen(true)
  }

  const handleOpenFeature = (item = null) => {
    if (item) {
      setIsFeatureEdit(true)
      setCurrentFeatureId(item.home_section_id)
      setCurrentFeatureSection(item)
    } else {
      setIsFeatureEdit(false)
      setCurrentFeatureId(null)
      setCurrentFeatureSection(null)
    }
    setOpenFeatureDialog(true)
  }

  const [deleteId, setDeleteId] = useState(null)
  const [toggleItem, setToggleItem] = useState(null)
  
  const handleDelete = (id) => {
      setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteHomeSection(deleteId).unwrap()
      toast.success('Section deleted successfully')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete section')
      setDeleteId(null)
    }
  }

  const confirmToggleActive = async () => {
    if (!toggleItem) return;
    try {
      await updateHomeSection({ 
          id: toggleItem.home_section_id, 
          inputData: { ...toggleItem, is_active: !toggleItem.is_active } 
      }).unwrap();
      toast.success('Section status updated successfully');
      setToggleItem(null);
    } catch (error) {
      toast.error('Failed to update section status');
      setToggleItem(null);
    }
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (isEdit) {
        await updateHomeSection({ id: currentId, inputData: values }).unwrap()
        toast.success('Section updated successfully')
      } else {
        await createHomeSection(values).unwrap()
        toast.success('Section created successfully')
      }
      setOpen(false)
    } catch (error) {
      toast.error(error?.data?.message || 'Operation failed')
    }
    setSubmitting(false)
  }

  


  const selectStyles = {
      bgcolor: isDarkMode ? '#283046 !important' : '#ffffff !important',
      color: isDarkMode ? '#d0d2d6 !important' : '#6e6b7b !important',
      '& .MuiOutlinedInput-notchedOutline': {
          borderColor: isDarkMode ? '#404656 !important' : '#d8d6de !important',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#7367f0 !important',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#7367f0 !important',
          borderWidth: '1px !important',
      },
      '& .MuiSvgIcon-root': {
          color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
      },
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
    return <AccessDenied message="You do not have permission to view Home Section Management." />;
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
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 border-b gap-4"
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
                        Home Section
                    </Typography>
                </Box>
                {canCreate && (
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-start' } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: { xs: '48%', sm: 'auto' } }}>
                            <Button
                                variant="contained"
                                onClick={() => handleOpenFeature()}
                                sx={{
                                    height: '38px',
                                    textTransform: 'none',
                                    px: { xs: 0, sm: 3 },
                                    fontSize: '16px',
                                    width: '100%',
                                    bgcolor: '#7367f0',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#5e50ee', boxShadow: 'none' },
                                }}
                            >
                                {isMobile ? '+ Add' : '+ Add Feature'}
                            </Button>
                            {isMobile && (
                                <Typography variant="caption" sx={{ mt: 0.5, color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                                    Feature
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: { xs: '48%', sm: 'auto' } }}>
                            <Button
                                variant="contained"
                                onClick={() => handleOpen()}
                                sx={{
                                    height: '38px',
                                    textTransform: 'none',
                                    px: { xs: 0, sm: 3 },
                                    fontSize: '16px',
                                    width: '100%',
                                    bgcolor: '#28c76f',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#23af62', boxShadow: 'none' },
                                }}
                            >
                                {isMobile ? '+ Add' : '+ Add Section'}
                            </Button>
                            {isMobile && (
                                <Typography variant="caption" sx={{ mt: 0.5, color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                                    Section
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* ── Filters row ───────────────────────────────────────────── */}
            <Box className="flex flex-col p-5 gap-4">
                <Box className="flex flex-wrap items-center justify-between gap-4">
                    <Box className="flex flex-wrap items-center gap-4">
                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                Section Type:
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Autocomplete
                                    size="small"
                                    options={[
                                        { label: 'All Types', value: 'all' },
                                        { label: 'Feature', value: 'feature' },
                                        { label: 'Grid', value: 'grid' },
                                        { label: 'Slider', value: 'slider' }
                                    ]}
                                    getOptionLabel={(option) => option.label || ''}
                                    value={
                                        [
                                            { label: 'All Types', value: 'all' },
                                            { label: 'Feature', value: 'feature' },
                                            { label: 'Grid', value: 'grid' },
                                            { label: 'Slider', value: 'slider' }
                                        ].find(opt => opt.value === sectionType) || { label: 'All Types', value: 'all' }
                                    }
                                    onChange={(_, newValue) => {
                                        setSectionType(newValue ? newValue.value : 'all');
                                    }}
                                    isOptionEqualToValue={(option, value) => option.value === value.value}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="All Types"
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
                                Type:
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <Autocomplete
                                    size="small"
                                    options={[
                                        { label: 'All Types', value: 'all' },
                                        { label: 'Recipe', value: 'recipe' },
                                        { label: 'Category', value: 'category' },
                                        { label: 'User', value: 'user' }
                                    ]}
                                    getOptionLabel={(option) => option.label || ''}
                                    value={
                                        [
                                            { label: 'All Types', value: 'all' },
                                            { label: 'Recipe', value: 'recipe' },
                                            { label: 'Category', value: 'category' },
                                            { label: 'User', value: 'user' }
                                        ].find(opt => opt.value === type) || { label: 'All Types', value: 'all' }
                                    }
                                    onChange={(_, newValue) => {
                                        setType(newValue ? newValue.value : 'all');
                                    }}
                                    isOptionEqualToValue={(option, value) => option.value === value.value}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="All Types"
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
                                Status:
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 130 }}>
                                <Autocomplete
                                    size="small"
                                    options={[
                                        { label: 'All Status', value: 'all' },
                                        { label: 'Active', value: 'active' },
                                        { label: 'Inactive', value: 'inactive' }
                                    ]}
                                    getOptionLabel={(option) => option.label || ''}
                                    value={
                                        [
                                            { label: 'All Status', value: 'all' },
                                            { label: 'Active', value: 'active' },
                                            { label: 'Inactive', value: 'inactive' }
                                        ].find(opt => opt.value === status) || { label: 'All Status', value: 'all' }
                                    }
                                    onChange={(_, newValue) => {
                                        setStatus(newValue ? newValue.value : 'all');
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
                                Search:
                            </Typography>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search sections..."
                                className="px-3 py-2 border rounded outline-none transition-colors"
                                style={{
                                    height: '38px',
                                    width: '180px',
                                    backgroundColor: isDarkMode ? '#283046' : '#fff',
                                    borderColor: isDarkMode ? '#404656' : '#d8d6de',
                                    color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                    borderRadius: '4px',
                                }}
                            />
                        </Box>
                    </Box>
                    <Box className="flex items-center gap-3">
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleClearFilters}
                            disabled={search === '' && sectionType === 'all' && type === 'all' && status === 'all' && debouncedSearch === '' && debouncedSectionType === 'all' && debouncedType === 'all' && debouncedStatus === 'all'}
                            startIcon={<ClearAllIcon />}
                            sx={{ height: '38px', minWidth: '100px', textTransform: 'none', px: 3 }}
                        >
                            Clear
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSearch}
                            startIcon={<SearchIcon />}
                            sx={{
                                height: '38px',
                                minWidth: '100px',
                                textTransform: 'none',
                                px: 3,
                                bgcolor: '#7367f0',
                                '&:hover': { bgcolor: '#5e50ee' },
                                boxShadow: 'none',
                            }}
                        >
                            Search
                        </Button>
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
                <Table stickyHeader sx={{ minWidth: 900, borderCollapse: 'separate', borderSpacing: 0 }}>
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
                            <TableCell>NAME</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>SECTION TYPE</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>TYPE</TableCell>
                            <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>TOTAL ITEMS</TableCell>
                            <TableCell align="center">LIVE</TableCell>
                            <TableCell align="center">POSITION</TableCell>
                            <TableCell align="center">ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading || isFetching ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                    <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                </TableCell>
                            </TableRow>
                        ) : homeSections.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                                    <Typography variant="body1" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
                                        No sections found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            homeSections.map((rowItem, index) => {
                                const isFeature = String(rowItem?.section_type || '').toLowerCase() === 'feature';
                                const allowedToView = isFeature ? canViewFeature : canView;
                                const allowedToUpdate = isFeature ? canUpdateFeature : canUpdate;
                                const allowedToDelete = isFeature ? canDeleteFeature : canDelete;
                                const allowedToToggle = isFeature ? canPublishFeature : canPublish;

                                return (
                                    <TableRow 
                                        key={rowItem.home_section_id}
                                        className={isFeature ? 'feature-row' : ''}
                                        sx={{ 
                                            'height': '60px',
                                            '&:hover': {
                                                backgroundColor: isDarkMode ? '#2f3851' : '#f8f8f8',
                                            },
                                            '&.feature-row': {
                                                backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.08)' : 'rgba(115, 103, 240, 0.05)',
                                            },
                                            '&.feature-row:hover': {
                                                backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.16)' : 'rgba(115, 103, 240, 0.1)',
                                            },
                                            '& td': {
                                                borderColor: isDarkMode ? '#3b4253' : '#ebe9f1',
                                                color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                            }
                                        }}
                                    >
                                        <TableCell align="center">{index + 1}</TableCell>
                                        <TableCell>{rowItem.name}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                            {rowItem.section_type ? rowItem.section_type.charAt(0).toUpperCase() + rowItem.section_type.slice(1) : ''}
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                            {rowItem.type ? rowItem.type.charAt(0).toUpperCase() + rowItem.type.slice(1) : ''}
                                        </TableCell>
                                        <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                            {rowItem.total_items}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Switch 
                                                checked={!!rowItem.is_active} 
                                                onChange={() => setToggleItem(rowItem)}
                                                size="small"
                                                color="success"
                                                disabled={!allowedToToggle}
                                            />
                                        </TableCell>
                                        <TableCell align="center">{rowItem.position}</TableCell>
                                        <TableCell align="center">
                                            <Box display="flex" gap={1} justifyContent="center" alignItems="center" height="100%">
                                                {allowedToView && (
                                                    <Tooltip title="View" arrow>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => setViewSection(rowItem)} 
                                                            sx={{ 
                                                                color: isDarkMode ? '#10b981' : '#059669',
                                                                '&:hover': {
                                                                    backgroundColor: isDarkMode ? '#064e3b' : '#d1fae5',
                                                                },
                                                            }}
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </svg>
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {allowedToUpdate && (
                                                    <Tooltip title="Edit" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                if (isFeature) {
                                                                    handleOpenFeature(rowItem)
                                                                } else {
                                                                    handleOpen(rowItem)
                                                                }
                                                            }}
                                                            sx={{
                                                                color: isDarkMode ? '#3b82f6' : '#2563eb',
                                                                '&:hover': {
                                                                    backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
                                                                },
                                                            }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {allowedToDelete && !rowItem.is_active && (
                                                    <Tooltip title="Delete" arrow>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleDelete(rowItem.home_section_id)} 
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
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

        </Box>

      <AddHomeSectionDialog
        open={open}
        onClose={() => {
            setOpen(false)
            setCurrentId(null)
            setIsEdit(false)
            setInitialValues(null)
        }}
        mode={isEdit ? 'edit' : 'add'}
        sectionId={currentId}
        section={initialValues}
        isLoading={isAdding || isUpdating}
      />

      <AddFeatureSectionDialog
        open={openFeatureDialog}
        onClose={() => {
          setOpenFeatureDialog(false)
          setIsFeatureEdit(false)
          setCurrentFeatureId(null)
          setCurrentFeatureSection(null)
        }}
        nextPosition={homeSections.length + 1}
        mode={isFeatureEdit ? 'edit' : 'add'}
        sectionId={currentFeatureId}
        section={currentFeatureSection}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Section"
        message={
          <>
            Are you sure you want to delete <strong>{homeSections.find(s => s.home_section_id === deleteId)?.name}</strong>?
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        loadingText="Deleting..."
        severity="error"
      />

      <ConfirmDialog
        open={!!toggleItem}
        onClose={() => setToggleItem(null)}
        onConfirm={confirmToggleActive}
        title="Change Status"
        message={
          <>
            Are you sure you want to {toggleItem?.is_active ? 'deactivate' : 'activate'} the section <strong>{toggleItem?.name}</strong>?
          </>
        }
        confirmText="Confirm"
        cancelText="Cancel"
        isLoading={isUpdating}
        loadingText="Updating..."
        severity="primary"
      />
      
      <ViewHomeSectionDialog 
        open={!!viewSection}
        onClose={() => setViewSection(null)}
        section={viewSection}
      />

    </Box>
  )
}

export default HomeSectionManagement

