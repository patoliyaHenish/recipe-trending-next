"use client";
import React, { useRef, useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    CircularProgress,
    Switch,
    Box,
    Typography,
    IconButton,
    InputAdornment,
    useMediaQuery
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import { Edit, Save } from "@mui/icons-material";
import { useGetRecipeCategoryDropdownQuery } from '../../../features/api/categoryApi';
import { useCreateRecipeSubCategoryMutation, useUpdateRecipeSubCategoryMutation } from '../../../features/api/subCategoryApi';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getImage } from '../../../utils/helper';
import { toast } from '../../../utils/toast';
import { useTheme } from '../../../context/ThemeContext';
import CloseIcon from '@mui/icons-material/Close';

const getValidationSchema = (mode) => Yup.object().shape({
  categoryId: Yup.number().required('Select any one Category'),
  name: Yup.string()
    .required('Sub-category name is required')
    .min(2, 'Sub-category name must be at least 2 characters')
    .max(45, 'Sub-category name must be at most 45 characters'),
  slug: Yup.string()
    .required('Slug is required')
    .matches(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .max(100, 'Slug must be at most 100 characters'),
  meta_title: Yup.string()
    .required('Meta Title is required')
    .test('min-length', 'Meta title (with suffix) must be at least 30 characters', (val) => (val?.length || 0) + 18 >= 30)
    .max(47, 'Base Meta title must be at most 47 characters'),
  meta_description: Yup.string()
    .required('Meta Description is required')
    .min(120, 'Meta description must be at least 120 characters')
    .max(160, 'Meta description must be at most 160 characters'),
  description: Yup.string()
    .required('Description is required')
    .min(150, 'Description must be at least 150 characters')
    .max(300, 'Description must be at most 300 characters'),
  image: mode === 'add'
    ? Yup.mixed()
        .required('Image is required')
        .test('fileSize', 'File size is too large (max 2MB)', (value) => !value || value.size <= 2 * 1024 * 1024)
        .test('fileType', 'Unsupported file format (JPEG, PNG, JPG, WEBP only)', (value) => !value || ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type))
    : Yup.mixed()
        .nullable()
        .test('fileSize', 'File size is too large (max 2MB)', (value) => !value || value.size <= 2 * 1024 * 1024)
        .test('fileType', 'Unsupported file format (JPEG, PNG, JPG, WEBP only)', (value) => !value || ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type)),
});

const SubCategoryDialog = ({
    open,
    onClose,
    isLoading,
    mode = 'add',
    subCategoryId = null,
    subCategoryData = null,
}) => {
    const { isDarkMode } = useTheme();
    const muiTheme = useMuiTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    const fileInputRef = useRef();
    const formikRef = useRef();
    const [dragActive, setDragActive] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [initialValues, setInitialValues] = useState(null);
    const [initialImagePreview, setInitialImagePreview] = useState(null);
    const [isEditingSlug, setIsEditingSlug] = useState(false);
    const [isEditingMeta, setIsEditingMeta] = useState(true);
    const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
    const [isAutoSyncMetaEnabled, setIsAutoSyncMetaEnabled] = useState(false);

    const { data: categoriesData, isLoading: isCategoriesLoading } = useGetRecipeCategoryDropdownQuery(undefined, { skip: !open });
    const categories = categoriesData?.data || [];

    const [updateRecipeSubCategory, { isLoading: isUpdating }] = useUpdateRecipeSubCategoryMutation();
    const [createRecipeSubCategory, { isLoading: isCreating }] = useCreateRecipeSubCategoryMutation();

    const formik = useFormik({
        initialValues: {
            name: '',
            description: '',
            categoryId: '',
            image: null,
            isActive: true,
            slug: '',
            meta_title: '',
            meta_description: '',
        },
        enableReinitialize: true,
        validateOnMount: false,
        validateOnChange: false,
        validateOnBlur: true,
        validationSchema: getValidationSchema(mode),
        onSubmit: async (values, helpers) => {
            try {
                const formData = new FormData();
                if (mode === 'add') {
                    formData.append('categoryId', Number(values.categoryId));
                    formData.append('name', values.name.trim());
                    formData.append('description', values.description.trim() || '');
                    formData.append('isActive', values.isActive);
                    if (values.image instanceof File) {
                        formData.append('image', values.image);
                    }
                    formData.append('slug', values.slug);
                    formData.append('meta_title', values.meta_title ? `${values.meta_title.trim()} | Recipe Trending` : '');
                    formData.append('meta_description', values.meta_description);
                    await createRecipeSubCategory(formData)
                        .unwrap()
                        .then(() => {
                            toast.success('Sub-category created successfully');
                            onClose();
                        })
                        .catch((error) => {
                            const errMsg =
                                error?.data?.message ||
                                error?.error ||
                                error?.message ||
                                'Failed to create sub-category';
                            toast.error(errMsg);
                        });
                    helpers.resetForm();
                    setImagePreview(null);
                } else {
                    formData.append('subCategoryId', subCategoryId);
                    formData.append('categoryId', Number(values.categoryId));
                    formData.append('name', values.name.trim());
                    formData.append('description', values.description.trim() || '');
                    formData.append('isActive', values.isActive);
                    if (values.image instanceof File) {
                        formData.append('image', values.image);
                    }
                    formData.append('slug', values.slug);
                    formData.append('meta_title', values.meta_title ? `${values.meta_title.trim()} | Recipe Trending` : '');
                    formData.append('meta_description', values.meta_description);
                    await updateRecipeSubCategory(formData).unwrap();
                    toast.success('Sub-category updated successfully');
                    onClose(true);
                }
            } catch (error) {
                const errMsg =
                    error?.data?.message ||
                    error?.error ||
                    error?.message ||
                    (mode === 'edit' ? 'Failed to update sub-category' : 'Failed to process image');
                toast.error(errMsg);
            }
        },
    });

    formikRef.current = formik;


    useEffect(() => {
        if (mode === 'edit' && open && subCategoryData) {
            const data = subCategoryData;
            const initialFormValues = {
                name: data.name || '',
                description: data.description || '',
                categoryId: data.category_id || data.categoryId || '',
                image: null,
                isActive: data.is_active !== undefined ? data.is_active : true,
                slug: data.slug || '',
                meta_title: (data.meta_title || '').replace(' | Recipe Trending', '').replace(' | Casual Cravings', ''),
                meta_description: data.meta_description || '',
            };
            setIsEditingSlug(false);
            setIsEditingMeta(false);
            setIsAutoSyncEnabled(false);
            setIsAutoSyncMetaEnabled(false);
            setTimeout(() => {
                if (formikRef.current) {
                    formikRef.current.setValues(initialFormValues);
                    formikRef.current.setErrors({});
                    formikRef.current.setTouched({});
                }
                const imagePath = data.image;
                const imageUrl = imagePath ? getImage(imagePath) : null;
                setImagePreview(imageUrl);
                setInitialValues(initialFormValues);
                setInitialImagePreview(imageUrl);
            }, 0);
        } else if (mode === 'add' && open) {
            setInitialValues(null);
            setInitialImagePreview(null);
            setIsEditingSlug(false);
            setIsEditingMeta(true);
            setIsAutoSyncEnabled(true);
            setIsAutoSyncMetaEnabled(false);
            if (formikRef.current) {
                formikRef.current.setErrors({});
                formikRef.current.setTouched({});
            }
        }
    }, [subCategoryId, open, mode, subCategoryData]);

    useEffect(() => {
        if (mode === 'add' && isAutoSyncEnabled) {
            const generatedSlug = (formik.values.name || '')
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            
            if (formik.values.slug !== generatedSlug) {
                formik.setFieldValue('slug', generatedSlug);
            }
        }
    }, [formik.values.name, mode, isAutoSyncEnabled, formik.values.slug]);

    useEffect(() => {
        if (mode === 'add' && isAutoSyncMetaEnabled) {
            const newMetaTitle = formik.values.name || '';
            if (formik.values.meta_title !== newMetaTitle) {
                formik.setFieldValue('meta_title', newMetaTitle);
            }
        }
    }, [formik.values.name, mode, isAutoSyncMetaEnabled, formik.values.meta_title]);


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        formik.setFieldValue('image', file);
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImagePreview(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            formik.setFieldValue('image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const hasFormChanged = () => {
        if (mode === 'edit' && initialValues) {
            const currentValues = {
                name: formik.values.name || '',
                description: formik.values.description || '',
                categoryId: formik.values.categoryId || '',
                image: formik.values.image instanceof File,
                isActive: formik.values.isActive,
                slug: formik.values.slug || '',
                meta_title: formik.values.meta_title || '',
                meta_description: formik.values.meta_description || '',
            };
            
            const initial = {
                name: initialValues.name || '',
                description: initialValues.description || '',
                categoryId: initialValues.categoryId || '',
                image: false,
                isActive: initialValues.isActive !== undefined ? initialValues.isActive : true,
                slug: initialValues.slug || '',
                meta_title: initialValues.meta_title || '',
                meta_description: initialValues.meta_description || '',
            };
            
            return (
                currentValues.name !== initial.name ||
                currentValues.description !== initial.description ||
                currentValues.categoryId !== initial.categoryId ||
                currentValues.image !== initial.image ||
                currentValues.isActive !== initial.isActive ||
                currentValues.slug !== initial.slug ||
                currentValues.meta_title !== initial.meta_title ||
                currentValues.meta_description !== initial.meta_description ||
                imagePreview !== initialImagePreview
            );
        }
        return false;
    };

    const handleClose = (event, reason) => {
        if (reason === 'backdropClick') {
            if (mode === 'add') {
                const isFormEmpty = 
                    !formik.values.name &&
                    !formik.values.description &&
                    !formik.values.categoryId &&
                    !formik.values.image &&
                    !imagePreview &&
                    formik.values.isActive === true;
                
                if (isFormEmpty) {
                    onClose();
                }
            } else if (mode === 'edit') {
                if (hasFormChanged()) {
                    toast.warning('You have unsaved changes. Please save or cancel to close.');
                    return;
                }
                onClose(false);
            }
            return;
        } else if (reason === 'escapeKeyDown') {
            if (mode === 'add') {
                const isFormEmpty = 
                    !formik.values.name &&
                    !formik.values.description &&
                    !formik.values.categoryId &&
                    !formik.values.image &&
                    !imagePreview &&
                    formik.values.isActive === true;
                
                if (isFormEmpty) {
                    onClose();
                }
            } else if (mode === 'edit') {
                if (hasFormChanged()) {
                    toast.warning('You have unsaved changes. Please save or cancel to close.');
                    return;
                }
                onClose(false);
            }
            return;
        }
        if (mode === 'edit') {
            onClose(false);
        } else {
            onClose();
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
            },
            '&.Mui-disabled': {
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                '& .MuiOutlinedInput-input': {
                    WebkitTextFillColor: isDarkMode ? '#9ca3af' : '#6b7280',
                },
                '& fieldset': {
                    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                },
            },
        },
        '& .MuiInputLabel-root': {
            color: isDarkMode ? '#94a3b8' : '#64748b',
            '&.Mui-focused': {
                color: '#6366f1',
            },
            '&.Mui-disabled': {
                color: isDarkMode ? '#6b7280' : '#9ca3af',
            },
        },
        '& .MuiFormHelperText-root': {
            color: isDarkMode ? '#ffffff' : '#000000',
            marginLeft: '4px',
            marginTop: '4px',
            '&.Mui-error': {
                color: '#ef4444',
            }
        },
        '& .MuiSelect-icon': {
            color: isDarkMode ? '#94a3b8' : '#64748b',
        },
        '& .MuiTypography-root': {
            color: isDarkMode ? '#e2e8f0' : '#1e293b',
        }
    };

    return (
        <Dialog
            key={`sub-category-dialog-${open}`}
            open={open}
            onClose={handleClose}
            fullScreen={isMobile}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    borderRadius: isMobile ? 0 : '16px',
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
                        {mode === 'add' ? 'Add Sub-Category' : 'Edit Sub-Category'}
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
            <form onSubmit={formik.handleSubmit} encType="multipart/form-data" noValidate key={`${mode}-${open}`}>
                <DialogContent
                    sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5
                    }}
                >
                    <TextField
                        fullWidth
                        label="Sub-Category Name"
                        name="name"
                        value={formik.values.name}
                        onChange={(e) => {
                            formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        required
                        inputProps={{ maxLength: 45 }}
                        disabled={isLoading || isUpdating}
                        error={formik.touched.name && Boolean(formik.errors.name)}
                        helperText={
                            (formik.touched.name && formik.errors.name) ||
                            `${(formik.values.name || '').length}/45`
                        }
                        sx={customInputSx}
                    />
                    <TextField
                        fullWidth
                        label="Slug"
                        name="slug"
                        value={formik.values.slug}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        required
                        disabled={isLoading || isUpdating || mode === 'edit' || (mode === 'add' && !isEditingSlug)}
                        error={formik.touched.slug && Boolean(formik.errors.slug)}
                        helperText={
                            (formik.touched.slug && formik.errors.slug) ||
                            `${(formik.values.slug || '').length}/100`
                        }
                        inputProps={{ maxLength: 100 }}
                        InputProps={{
                            endAdornment: mode === 'add' ? (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            if (isAutoSyncEnabled) setIsAutoSyncEnabled(false);
                                            setIsEditingSlug(!isEditingSlug);
                                        }}
                                        disabled={!formik.values.name || isLoading || isUpdating}
                                        sx={{ color: isEditingSlug ? '#6366f1' : (isDarkMode ? '#94a3b8' : '#64748b') }}
                                    >
                                        {isEditingSlug ? <Save fontSize="small" /> : <Edit fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                        sx={customInputSx}
                    />
                    <Autocomplete
                        options={categories}
                        getOptionLabel={(option) => option.name || ''}
                        value={categories.find(cat => cat.category_id === formik.values.categoryId) || null}
                        onChange={(_, newValue) => {
                            formik.setFieldValue('categoryId', newValue ? newValue.category_id : '');
                        }}
                        isOptionEqualToValue={(option, value) => option.category_id === value.category_id}
                        renderInput={(params) => {
                            const { InputProps, ...rest } = params;
                            return (
                                <TextField
                                    {...rest}
                                    InputProps={{
                                        ...InputProps,
                                        endAdornment: InputProps?.endAdornment && InputProps.endAdornment.type?.muiName === 'IconButton' ? null : InputProps?.endAdornment,
                                    }}
                                    label="Category"
                                    name="categoryId"
                                    required
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.categoryId && Boolean(formik.errors.categoryId)}
                                    helperText={formik.touched.categoryId && formik.errors.categoryId}
                                    disabled={isCategoriesLoading}
                                    sx={customInputSx}
                                />
                            );
                        }}
                        clearIcon={null}
                        disableClearable
                        slotProps={{
                            paper: {
                                sx: {
                                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                    boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                }
                            },
                        }}
                        sx={{
                            '& .MuiAutocomplete-option': {
                                color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                '&[aria-selected="true"]': {
                                    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                                    color: '#6366f1',
                                },
                                '&:hover': {
                                    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f1f5f9',
                                },
                            },
                            '& .MuiAutocomplete-popupIndicator': {
                                color: isDarkMode ? '#94a3b8' : '#64748b',
                            }
                        }}
                        fullWidth
                        disabled={isCategoriesLoading}
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={formik.values.description}
                        onChange={(e) => {
                            formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        multiline
                        minRows={3}
                        required
                        inputProps={{ maxLength: 300 }}
                        disabled={isLoading || isUpdating}
                        error={formik.touched.description && Boolean(formik.errors.description)}
                        helperText={
                            (formik.touched.description && formik.errors.description)
                                ? `${formik.errors.description} — ${(formik.values.description || '').length}/300`
                                : `${(formik.values.description || '').length}/300`
                        }
                        sx={customInputSx}
                    />
                    <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>
                            SEO Settings
                        </Typography>
                        <TextField
                            fullWidth
                            label="Meta Title"
                            name="meta_title"
                            value={formik.values.meta_title}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            required
                            inputProps={{ maxLength: 47 }}
                            disabled={isLoading || isUpdating || (mode === 'add' && !isEditingMeta)}
                            error={formik.touched.meta_title && Boolean(formik.errors.meta_title)}
                            helperText={
                                (formik.touched.meta_title && formik.errors.meta_title) ||
                                `${(formik.values.meta_title || '').length}/47`
                            }
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                        | Recipe Trending
                                      </Typography>
                                      {mode === 'add' && (
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                if (isAutoSyncMetaEnabled) setIsAutoSyncMetaEnabled(false);
                                                setIsEditingMeta(!isEditingMeta);
                                            }}
                                            disabled={!formik.values.name || isLoading || isUpdating}
                                            sx={{ color: isEditingMeta ? '#6366f1' : (isDarkMode ? '#94a3b8' : '#64748b'), ml: 1 }}
                                        >
                                            {isEditingMeta ? <Save fontSize="small" /> : <Edit fontSize="small" />}
                                        </IconButton>
                                      )}
                                    </InputAdornment>
                                ),
                            }}
                            sx={customInputSx}
                        />
                        <TextField
                            fullWidth
                            label="Meta Description"
                            name="meta_description"
                            value={formik.values.meta_description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            required
                            multiline
                            minRows={3}
                            inputProps={{ maxLength: 160 }}
                            disabled={isLoading || isUpdating}
                            error={formik.touched.meta_description && Boolean(formik.errors.meta_description)}
                            helperText={
                                (formik.touched.meta_description && formik.errors.meta_description) ||
                                `${(formik.values.meta_description || '').length}/160`
                            }
                            sx={customInputSx}
                        />
                    </Box>

                    <Box
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                            border: `2px dashed ${dragActive ? '#6366f1' : isDarkMode ? '#334155' : '#cbd5e1'}`,
                            borderRadius: '12px',
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            bgcolor: dragActive ? (isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)') : isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                            borderColor: '#6366f1',
                            bgcolor: isDarkMode ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.02)',
                            }
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                        />
                        <Typography variant="body2" sx={{ mb: 1, color: isDarkMode ? '#d1d5db' : '#6b7280' }}>
                            {formik.values.image || imagePreview ? 'Change Image' : 'Upload Sub-Category Image'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#9ca3af' }}>
                            or drag and drop image here
                        </Typography>
                        {imagePreview && (
                            <Box
                                component="img"
                                src={imagePreview}
                                alt="preview"
                                sx={{
                                    width: '50%',
                                    maxWidth: 300,
                                    aspectRatio: '16 / 9',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    mt: 1,
                                    mx: 'auto',
                                    display: 'block',
                                }}
                            />
                        )}
                        {formik.touched.image && formik.errors.image && (
                            <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mt: 1 }}>
                                {formik.errors.image}
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
                        border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                    }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 600, mb: 0.5 }}>
                                    Status
                                </Typography>
                                <Typography variant="body2" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                                    Make this sub-category active
                                </Typography>
                            </Box>
                            <Switch
                                checked={formik.values.isActive}
                                onChange={(_, checked) => {
                                    formik.setFieldValue('isActive', checked);
                                }}
                                disabled={isLoading || isUpdating}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#6366f1',
                                        '&:hover': {
                                            backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                        },
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: '#6366f1',
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions
                    sx={{
                        p: 3,
                        pt: 2,
                        gap: 2,
                    }}
                >
                    <Button
                        onClick={() => onClose(mode === 'edit' ? false : undefined)}
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
                        type="submit"
                        variant="contained"
                        disabled={
                            isLoading || isUpdating ||
                            (mode === 'add' && (
                                !formik.values.name.trim() ||
                                !formik.values.description.trim() ||
                                !formik.values.categoryId ||
                                !formik.values.image
                            ))
                        }
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 4,
                            backgroundColor: '#6366f1',
                            '&:hover': {
                                backgroundColor: '#4f46e5',
                            },
                            '&:disabled': {
                                backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                                color: isDarkMode ? '#64748b' : '#94a3b8',
                            }
                        }}
                    >
                        {(isLoading || isUpdating || isCreating) ? <CircularProgress size={20} color="inherit" /> : (mode === 'add' ? 'Add' : 'Update')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default SubCategoryDialog;
