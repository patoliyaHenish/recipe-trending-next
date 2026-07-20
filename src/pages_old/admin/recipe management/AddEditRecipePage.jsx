import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
"use client";
import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Switch, Box, Typography, IconButton, MenuItem, Chip,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, InputAdornment
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Add, Cancel, Edit, Remove, Save, ArrowBack, Delete } from "@mui/icons-material";
import IngredientInput from "../../../components/IngredientInput";
import KeywordInput from "../../../components/KeywordInput";
import {
  getImage,
  getYouTubeThumbnail,
  getYouTubeVideoTitle,
  isValidYouTubeVideo,
} from "../../../utils/helper";
import { useTheme } from "../../../context/ThemeContext";
import { useGetAllKeywordsQuery } from "../../../features/api/keywordApi";

import { useGetRecipeCategoryDropdownQuery } from "../../../features/api/categoryApi";
import { useGetRecipeByIdForAdminQuery, useCreateRecipeByAdminMutation, useUpdateRecipeByAdminMutation, useLazyCheckRecipeSlugQuery, useGetRecipeDraftQuery, useSaveRecipeDraftMutation, useDeleteRecipeDraftMutation } from '../../../features/api/recipeApi';
import { toast } from '../../../utils/toast';
import { Card, CardContent, CardHeader, Paper } from '@mui/material';
import { useSelector } from 'react-redux';
import { AccessDenied, PageHeader, ConfirmDialog } from '../../../components/common';



const InstructionItem = ({
  instruction,
  index,
  onUpdate,
  onRemove,
  disabled,
}) => {
  const { isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(instruction);

  useEffect(() => {
    setEditValue(instruction);
  }, [instruction]);

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdate(editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(instruction);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-start gap-2 mb-2 p-3 border rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-blue-200'}`}>
        <span className={`min-w-[24px] font-semibold mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{index + 1}.</span>
        <div className="flex-1">
          <AutoSizeInstructionTextarea
            value={editValue}
            onChange={setEditValue}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={disabled}
            isDarkMode={isDarkMode}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button
              onClick={handleCancel}
              disabled={disabled}
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
              onClick={handleSave}
              disabled={disabled || !editValue.trim()}
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
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 p-3 border rounded-lg mb-2 transition-colors shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
      <span className={`font-semibold min-w-[24px] mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{index + 1}.</span>
      <p className={`flex-1 leading-relaxed whitespace-pre-wrap break-words text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{instruction}</p>
      <div className="flex items-center gap-1">
        <IconButton
          size="small"
          onClick={() => setIsEditing(true)}
          disabled={disabled}
          sx={{ color: '#3b82f6' }}
        >
          <Edit fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={onRemove}
          disabled={disabled}
          sx={{ color: '#ef4444' }}
        >
          <Delete fontSize="small" />
        </IconButton>
      </div>
    </div>
  );
};

const AutoSizeInstructionTextarea = ({
  value,
  onChange,
  onKeyDown,
  autoFocus = false,
  disabled = false,
  isDarkMode = false,
}) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      disabled={disabled}
      autoFocus={autoFocus}
      onChange={(e) => {
        onChange(e.target.value);
        if (ref.current) {
          ref.current.style.height = "auto";
          ref.current.style.height = ref.current.scrollHeight + "px";
        }
      }}
      onKeyDown={onKeyDown}
      style={{
        width: "100%",
        resize: "none",
        overflow: "hidden",
        lineHeight: "1.4",
        padding: "8px",
        fontFamily: "inherit",
        fontSize: "0.9rem",
        border: `1px solid ${isDarkMode ? '#4b5563' : '#c4c4c4'}`,
        borderRadius: "4px",
        backgroundColor: disabled ? (isDarkMode ? '#374151' : '#f5f5f5') : (isDarkMode ? '#1f2937' : '#ffffff'),
        color: isDarkMode ? '#e5e7eb' : '#000000',
      }}
      className="focus:outline-none focus:border-blue-500 transition-colors"
    />
  );
};

const getValidationSchema = (mode) => Yup.object().shape({
  title: Yup.string().required('Title is required').max(45),
  description: Yup.string().required('Description is required').min(450, 'Description must be at least 450 characters').max(500, 'Description must be at most 500 characters'),
  slug: Yup.string().required('Slug is required').matches(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').max(100),
  meta_title: Yup.string().required('Meta Title is required')
    .test('min-length', 'Meta title (with suffix) must be at least 30 characters', (val) => (val?.length || 0) + 18 >= 30)
    .max(47, 'Base Meta title must be at most 47 characters'),
  meta_description: Yup.string().required('Meta Description is required').min(120, 'Meta description must be at least 120 characters').max(160, 'Meta description must be at most 160 characters'),
  food_type: Yup.string().required('Food Type is required').oneOf(['veg', 'egg', 'non_veg']),
  note: Yup.string().max(1000),
  prep_time: Yup.number().required('Prep time is required').min(1),
  cook_time: Yup.number().required('Cook time is required').min(0),
  rest_time: Yup.number().required('Rest time is required').min(0),
  serving_size: Yup.string().required('Serving size is required'),
  category_id: Yup.number().required('Category is required'),
  sub_category_id: Yup.number().nullable(),
  recipe_instructions: Yup.array()
    .min(1, "At least one instruction")
    .required(),
  keywords: Yup.array()
    .of(Yup.string().trim().min(1, "Keyword cannot be empty"))
    .min(1, "At least one keyword is required")
    .required(),
  ingredients: Yup.array()
    .min(1, "At least one ingredient is required")
    .required()
    .of(
      Yup.object().shape({
        ingredient_id: Yup.number().nullable().when('is_free_text', {
          is: true,
          then: (schema) => schema.notRequired(),
          otherwise: (schema) => schema.required(),
        }),
        ingredient_name: Yup.string().when('is_free_text', {
          is: true,
          then: (schema) => schema.notRequired(),
          otherwise: (schema) => schema.required(),
        }),
        quantity: Yup.mixed().nullable().notRequired(),
        unit_id: Yup.number().nullable().notRequired(),
        is_free_text: Yup.boolean().default(false),
        free_text: Yup.string().when('is_free_text', {
          is: true,
          then: (schema) => schema.required('Free text is required'),
          otherwise: (schema) => schema.notRequired(),
        }),
      })
    ),
  video_url: Yup.string()
    .nullable()
    .url("Enter a valid URL")
    .notRequired()
    .test(
      "is-valid-youtube",
      "YouTube video not found or invalid URL",
      async function (value) {
        if (!value) return true;
        const valid = await isValidYouTubeVideo(value);
        return valid;
      }
    ),
  image: Yup.mixed()
    .nullable()
    .test(
      'fileSize',
      'File size is too large (max 2MB)',
      (value) => !value || (value instanceof File && value.size <= 2 * 1024 * 1024)
    )
    .test(
      'fileType',
      'Unsupported file format (JPEG, PNG, JPG, WEBP only)',
      (value) => !value || (value instanceof File && ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(value.type))
    ),
});

const AddEditRecipePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnToUrl = '/admin/manage-recipes' + (location.state?.returnTo || '');
  const mode = (!id || id === 'create') ? 'add' : 'edit';

  const [searchParams, setSearchParams] = useSearchParams();

  const user = useSelector((state) => state.auth.user);
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
  const canCreate = isAdmin || userPermissions.includes('recipe.create');
  const canUpdate = isAdmin || userPermissions.includes('recipe.update');
  const canPublish = isAdmin || userPermissions.includes('recipe.publish');

  const { data: categoryDropdownData } = useGetRecipeCategoryDropdownQuery();
  const categories = categoryDropdownData?.data || [];

  const getAllSubCategories = (categoriesList) => {
    return categoriesList.reduce((acc, cat) => {
      if (cat.sub_categories && cat.sub_categories.length > 0) {
        const subsWithCatId = cat.sub_categories.map(sub => ({ ...sub, category_id: cat.category_id }));
        return [...acc, ...subsWithCatId];
      }
      return acc;
    }, []);
  };
  const subCategories = getAllSubCategories(categories);

  const { data: editRecipeData, isLoading: isFetchingRecipe } = useGetRecipeByIdForAdminQuery(id, { skip: !id });
  const [addRecipe, { isLoading: isAdding }] = useCreateRecipeByAdminMutation();
  const [updateRecipe, { isLoading: isUpdating }] = useUpdateRecipeByAdminMutation();
  const isLoading = isAdding || isUpdating;

  const [recipeData, setRecipeData] = useState(null);

  const { data: draftData } = useGetRecipeDraftQuery(undefined, { skip: mode !== 'add' });
  const [saveDraft] = useSaveRecipeDraftMutation();
  const [deleteDraft] = useDeleteRecipeDraftMutation();

  useEffect(() => {
    if (mode === 'edit' && editRecipeData?.data) {
      const r = editRecipeData.data;
      setRecipeData({
        recipe_id: r.recipe_id,
        has_pending_notes: r.has_pending_notes,
        title: r.title || '',
        description: r.description || '',
        note: r.note || '',
        prep_time: r.prep_time || '',
        cook_time: r.cook_time || '',
        serving_size: r.serving_size || '',
        category_id: r.category_id || '',
        sub_category_id: r.sub_category_id || null,
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        instructions: Array.isArray(r.instructions)
          ? r.instructions.map(i => i.instruction_text || '')
          : [],
        keywords: Array.isArray(r.keywords) ? r.keywords : [],
        video_url: r.video_url || '',
        image_url: r.image_url || '',
        image: r.image || '',
        meta_title: r.meta_title || '',
        meta_description: r.meta_description || '',
        slug: r.slug || '',
        food_type: r.food_type || 'veg',
        badge: r.badge || '',
        isActive: r.public_approved ?? false,
      });
    } else if (mode === 'add') {
      if (draftData?.data) {
        setRecipeData(draftData.data);
      } else {
        setRecipeData({});
      }
    }
  }, [editRecipeData, mode, draftData]);

  const { isDarkMode } = useTheme();
  const fileInputRef = useRef();
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [newInstruction, setNewInstruction] = useState("");

  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [videoTitle, setVideoTitle] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [isAutoSyncMetaEnabled, setIsAutoSyncMetaEnabled] = useState(true);
  const [slugWarning, setSlugWarning] = useState('');
  const [checkRecipeSlug] = useLazyCheckRecipeSlugQuery();
  const initialAutoSave = searchParams.get('autosave') === 'true';
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(initialAutoSave);
  const [lastSaved, setLastSaved] = useState(null);
  const [isClearDraftDialogOpen, setIsClearDraftDialogOpen] = useState(false);
  const [isClearingDraft, setIsClearingDraft] = useState(false);

  const handleAutoSaveToggle = (e) => {
    const isChecked = e.target.checked;
    setIsAutoSaveEnabled(isChecked);
    setSearchParams(prev => {
      if (isChecked) {
        prev.set('autosave', 'true');
      } else {
        prev.delete('autosave');
      }
      return prev;
    }, { replace: true });
  };





  const formik = useFormik({
    initialValues: {
      title: recipeData?.title || '',
      description: recipeData?.description || '',
      note: recipeData?.note || '',
      prep_time: recipeData?.prep_time || '',
      cook_time: recipeData?.cook_time || '',
      rest_time: recipeData?.rest_time || '0',
      serving_size: recipeData?.serving_size || '',
      category_id: recipeData?.category_id || '',
      sub_category_id: recipeData?.sub_category_id || null,
      keywords: Array.isArray(recipeData?.keywords) ? recipeData.keywords : (recipeData?.keywords ? [recipeData.keywords] : []),
      ingredients: recipeData?.ingredients || [],
      recipe_instructions: recipeData?.instructions || [],
      video_url: recipeData?.video_url || '',
      image: null,
      meta_title: (recipeData?.meta_title || '').replace(' | Recipe Trending', '').replace(' | Casual Cravings', ''),
      meta_description: recipeData?.meta_description || '',
      slug: recipeData?.slug || '',
      food_type: recipeData?.food_type || 'veg',
      mode: mode,
    },
    enableReinitialize: true,
    validateOnMount: true,
    validationSchema: getValidationSchema(mode),
    onSubmit: (values) => {
      const finalValues = {
        ...values,
        meta_title: values.meta_title ? `${values.meta_title.trim()} | Recipe Trending` : ''
      };
      const formData = new FormData();
      Object.keys(finalValues).forEach(key => {
        if (key === 'image' && finalValues[key]) {
          formData.append(key, finalValues[key]);
        } else if (key === 'ingredients' || key === 'recipe_instructions' || key === 'keywords') {
          formData.append(key, JSON.stringify(finalValues[key]));
        } else if (finalValues[key] !== null && finalValues[key] !== undefined) {
          formData.append(key, finalValues[key]);
        }
      });

      // In edit mode, if no new image selected, tell backend to keep existing image
      if (mode === 'edit' && !finalValues.image && recipeData?.image) {
        formData.append('keepExistingImage', 'true');
      }

      if (mode === 'add') {
        addRecipe(formData).unwrap().then(() => {
          toast.success("Recipe added successfully");
          deleteDraft();
          navigate(returnToUrl);
        }).catch((err) => {
          toast.error(err?.data?.message || "Failed to add recipe");
        });
      } else {
        updateRecipe({ id, inputData: formData }).unwrap().then(() => {
          toast.success("Recipe updated successfully");
          navigate(returnToUrl);
        }).catch((err) => {
          toast.error(err?.data?.message || "Failed to update recipe");
        });
      }
    },
  });

  const valuesRef = useRef(formik.values);
  useEffect(() => {
    valuesRef.current = formik.values;
  }, [formik.values]);

  useEffect(() => {
    let interval;
    if (mode === 'add' && isAutoSaveEnabled) {
      interval = setInterval(() => {
        saveDraft(valuesRef.current).unwrap().then(() => {
          setLastSaved(new Date());
        }).catch(err => {
          console.error("Auto save failed", err);
        });
      }, 15000);
    }
    return () => clearInterval(interval);
  }, [mode, isAutoSaveEnabled, saveDraft]);

  const handleCheckSlug = async () => {
    if (formik.values.slug && formik.values.slug.length >= 3) {
      try {
        const res = await checkRecipeSlug({ slug: formik.values.slug, exclude_id: id || 0 }).unwrap();
        if (res.exists) {
          setSlugWarning(`This slug is already in use by "${res.conflicting_title}". Please use a unique slug.`);
        } else {
          setSlugWarning('Slug is available!');
          setTimeout(() => setSlugWarning(''), 3000);
        }
      } catch (e) {
        console.error("Error checking slug:", e);
      }
    } else {
      setSlugWarning('Slug is too short to check.');
      setTimeout(() => setSlugWarning(''), 3000);
    }
  };

  useEffect(() => {
    if (true) {
      formik.setErrors({});
      formik.setTouched({});
      setIsEditingSlug(false);
      setIsEditingMeta(false);
      setIsAutoSyncEnabled(mode === 'add');
      setIsAutoSyncMetaEnabled(mode === 'add');
    }
  }, []);


  useEffect(() => {
    if (mode === 'add' && isAutoSyncEnabled) {
      const generatedSlug = (formik.values.title || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (formik.values.slug !== generatedSlug) {
        formik.setFieldValue('slug', generatedSlug);
      }
    }
  }, [formik.values.title, mode, isAutoSyncEnabled, formik.values.slug]);




  useEffect(() => {
    if (recipeData?.image && typeof recipeData.image === 'string') {
      const img = recipeData.image;
      setImagePreview(img.startsWith("http") ? img : getImage(img));
    } else {
      setImagePreview(null);
    }
  }, [recipeData]);

  useEffect(() => {
    if (formik.values.video_url) {
      setVideoUrl(formik.values.video_url);
    }
    if (!formik.values.video_url) {
      setVideoUrl("");
      setVideoThumbnail(null);
      setVideoTitle(null);
      setVideoError(null);
    }
  }, [formik.values.video_url]);

  useEffect(() => {
    let ignore = false;
    const url = videoUrl;
    if (!url) {
      setVideoThumbnail(null);
      setVideoTitle(null);
      setVideoError(null);
      setVideoLoading(false);
      return;
    }
    setVideoLoading(true);
    setVideoError(null);
    setVideoThumbnail(null);
    setVideoTitle(null);
    (async () => {
      const valid = await isValidYouTubeVideo(url);
      if (ignore) return;
      if (!valid) {
        setVideoError("Invalid or non-existent YouTube video.");
        setVideoThumbnail(null);
        setVideoTitle(null);
        setVideoLoading(false);
        return;
      }
      const thumb = getYouTubeThumbnail(url);
      const title = await getYouTubeVideoTitle(url);
      if (ignore) return;
      setVideoThumbnail(thumb);
      setVideoTitle(title);
      setVideoError(null);
      setVideoLoading(false);
    })();
    return () => {
      ignore = true;
    };
  }, [videoUrl]);

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

  if (mode === 'add' && !canCreate) {
    return <AccessDenied message="You do not have permission to add recipes." />;
  }

  if (mode === 'edit' && !canUpdate) {
    return <AccessDenied message="You do not have permission to edit recipes." />;
  }

  if (mode === 'edit' && isFetchingRecipe) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}><CircularProgress /></Box>;
  }

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
      color: isDarkMode ? '#94a3b8' : '#64748b',
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

  const handleClearDraftClick = () => {
    setIsClearDraftDialogOpen(true);
  };

  const confirmClearDraft = () => {
    setIsClearingDraft(true);
    deleteDraft().unwrap().then(() => {
      setLastSaved(null);
      toast.success("Draft cleared successfully");
      formik.resetForm();
      setRecipeData({});
      setIsClearDraftDialogOpen(false);
    }).catch(err => {
      toast.error("Failed to clear draft");
    }).finally(() => {
      setIsClearingDraft(false);
    });
  };

  if (mode === 'edit' && !recipeData) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box
      className={`transition-all duration-200 flex flex-col pt-2 md:pt-4 pb-4 px-3 mt-[74px] min-h-[calc(100vh-74px)] w-full max-w-[1200px] xl:max-w-none mx-auto xl:mx-0 xl:w-auto`}
      sx={{ flex: 1, minWidth: 0 }}
    >
      <Box className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <PageHeader title={mode === 'add' ? 'Add Recipe' : 'Edit Recipe'} />
        <Box className="flex flex-wrap items-center gap-3">
          {mode === 'add' && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAutoSaveEnabled}
                    onChange={handleAutoSaveToggle}
                    color="primary"
                  />
                }
                label={
                  <Typography sx={{ color: isDarkMode ? '#e5e7eb' : '#374151', fontSize: '0.875rem' }}>
                    Auto Save {lastSaved && `(Saved ${lastSaved.toLocaleTimeString()})`}
                  </Typography>
                }
              />
              <Button
                variant="text"
                color="error"
                size="small"
                onClick={handleClearDraftClick}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Clear Saved
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(returnToUrl)}
          size="medium"
          sx={{
            borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
            color: isDarkMode ? '#e5e7eb' : '#374151',
            textTransform: 'none',
            borderRadius: 1,
            px: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: isDarkMode ? '#9ca3af' : '#6b7280',
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          Back
          </Button>
        </Box>
      </Box>

      <form onSubmit={formik.handleSubmit} encType="multipart/form-data" noValidate className="flex flex-col flex-1">
        <Paper elevation={0} sx={{
          overflow: 'hidden',
          borderRadius: '16px',
          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
          boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          border: isDarkMode ? '1px solid #1e293b' : 'none',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 2, md: 3 }
        }}>
          <Box
            className="flex-1"
            sx={{
              color: isDarkMode ? '#e5e7eb' : '#374151',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0, md: 3 } }}>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  margin="normal"
                  required
                  inputProps={{ maxLength: 45 }}
                  disabled={isLoading}
                  error={formik.touched.title && Boolean(formik.errors.title)}
                  helperText={
                    (formik.touched.title && formik.errors.title)
                      ? `${formik.errors.title} — ${(formik.values.title || '').length}/45`
                      : `${(formik.values.title || '').length}/45`
                  }
                  sx={customInputSx}
                />
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    fullWidth
                    label="Slug"
                    name="slug"
                    value={formik.values.slug}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    margin="normal"
                    required
                    error={(formik.touched.slug && Boolean(formik.errors.slug)) || (slugWarning && !slugWarning.includes('available'))}
                    helperText={
                      slugWarning ? (
                        <Typography variant="caption" sx={{ color: slugWarning.includes('available') ? 'success.main' : 'error.main' }}>
                          {slugWarning}
                        </Typography>
                      ) : (
                        (formik.touched.slug && formik.errors.slug)
                          ? `${formik.errors.slug} — ${(formik.values.slug || '').length}/100`
                          : `${(formik.values.slug || '').length}/100`
                      )
                    }
                    inputProps={{ maxLength: 100 }}
                    InputProps={{
                      readOnly: isLoading || mode === 'edit' || (mode === 'add' && !isEditingSlug),
                    }}
                    sx={{
                      flex: 1,
                      ...customInputSx,
                      backgroundColor: (isLoading || mode === 'edit' || (mode === 'add' && !isEditingSlug))
                        ? (isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f5f5f5')
                        : undefined
                    }}
                  />
                  {(!id || id === 'create') && (
                    <Box display="flex" flexDirection="row" gap={2} mt={1}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleCheckSlug}
                        disabled={!formik.values.slug || formik.values.slug.length < 3 || isLoading}
                        startIcon={<CheckCircleIcon fontSize="small" />}
                        sx={{ textTransform: 'none', px: 2, mr: 2 }}
                      >
                        Check
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          if (isAutoSyncEnabled) setIsAutoSyncEnabled(false);
                          setIsEditingSlug(!isEditingSlug);
                        }}
                        disabled={!formik.values.title || isLoading}
                        startIcon={isEditingSlug ? <Save fontSize="small" /> : <Edit fontSize="small" />}
                        sx={{ textTransform: 'none' }}
                      >
                        {isEditingSlug ? 'Save' : 'Edit'}
                      </Button>
                    </Box>
                  )}
                </Box>
                {/* Left column continues directly into Food Type */}
                <FormControl component="fieldset" sx={{ display: 'block', mt: 2 }}>
                  <FormLabel component="legend" sx={{ color: isDarkMode ? '#d1d5db' : '#6b7280', fontSize: '0.8rem', mb: 0.5 }}>Food Type *</FormLabel>
                  <RadioGroup
                    row
                    name="food_type"
                    value={formik.values.food_type}
                    onChange={formik.handleChange}
                  >
                    <FormControlLabel
                      value="veg"
                      control={<Radio size="small" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', '&.Mui-checked': { color: '#10b981' } }} />}
                      label="Veg"
                      sx={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
                    />
                    <FormControlLabel
                      value="egg"
                      control={<Radio size="small" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', '&.Mui-checked': { color: '#f59e0b' } }} />}
                      label="Egg"
                      sx={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
                    />
                    <FormControlLabel
                      value="non_veg"
                      control={<Radio size="small" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', '&.Mui-checked': { color: '#ef4444' } }} />}
                      label="Non-Veg"
                      sx={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
                    />
                  </RadioGroup>
                  {formik.touched.food_type && formik.errors.food_type && (
                    <Typography variant="caption" color="error">
                      {formik.errors.food_type}
                    </Typography>
                  )}
                </FormControl>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mt: 3 }}>
                  <TextField
                    label="Prep Time (min)"
                    name="prep_time"
                    type="number"
                    value={formik.values.prep_time}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    disabled={isLoading}
                    error={formik.touched.prep_time && Boolean(formik.errors.prep_time)}
                    helperText={formik.touched.prep_time && formik.errors.prep_time}
                    sx={customInputSx}
                  />
                  <TextField
                    label="Cook Time (min)"
                    name="cook_time"
                    type="number"
                    value={formik.values.cook_time}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    disabled={isLoading}
                    error={formik.touched.cook_time && Boolean(formik.errors.cook_time)}
                    helperText={formik.touched.cook_time && formik.errors.cook_time}
                    sx={customInputSx}
                  />
                  <TextField
                    label="Rest Time (min)"
                    name="rest_time"
                    type="number"
                    value={formik.values.rest_time}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    disabled={isLoading}
                    error={formik.touched.rest_time && Boolean(formik.errors.rest_time)}
                    helperText={formik.touched.rest_time && formik.errors.rest_time}
                    sx={customInputSx}
                  />
                  <TextField
                    label="Serving Size"
                    name="serving_size"
                    value={formik.values.serving_size}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    disabled={isLoading}
                    error={formik.touched.serving_size && Boolean(formik.errors.serving_size)}
                    helperText={formik.touched.serving_size && formik.errors.serving_size}
                    sx={customInputSx}
                  />
                </Box>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  margin="normal"
                  required
                  multiline
                  minRows={7}
                  inputProps={{ maxLength: 500 }}
                  disabled={isLoading}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={
                    (formik.touched.description && formik.errors.description)
                      ? `${formik.errors.description} — ${(formik.values.description || '').length}/500`
                      : `${(formik.values.description || '').length}/500`
                  }
                  sx={customInputSx}
                />
                <TextField
                  fullWidth
                  label="Note (optional)"
                  name="note"
                  value={formik.values.note}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  margin="normal"
                  multiline
                  minRows={6}
                  inputProps={{ maxLength: 1000 }}
                  disabled={isLoading}
                  error={formik.touched.note && Boolean(formik.errors.note)}
                  helperText={formik.touched.note && formik.errors.note}
                  sx={customInputSx}
                />
              </Box>
            </Box>


            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 3 }}>
              <Autocomplete
                options={categories}
                getOptionLabel={(option) => option.name || ''}
                value={categories.find(cat => Number(cat.category_id) === Number(formik.values.category_id)) || null}
                onChange={(_, newValue) => {
                  formik.setFieldValue('category_id', newValue ? Number(newValue.category_id) : '');
                  formik.setFieldValue('sub_category_id', null);
                }}
                isOptionEqualToValue={(option, value) => Number(option.category_id) === Number(value.category_id)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    name="category_id"
                    required
                    onBlur={formik.handleBlur}
                    error={formik.touched.category_id && Boolean(formik.errors.category_id)}
                    helperText={formik.touched.category_id && formik.errors.category_id}
                    disabled={isLoading}
                    sx={customInputSx}
                  />
                )}
                clearIcon={null}
                disableClearable
                fullWidth
                slotProps={{
                  paper: {
                    sx: {
                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      color: isDarkMode ? '#e2e8f0' : '#1e293b',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                      boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      mt: 1,
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
                  }
                }}
              />
              <Autocomplete
                options={subCategories.filter(sub => !formik.values.category_id || Number(sub.category_id) === Number(formik.values.category_id))}
                getOptionLabel={(option) => option.name || ''}
                value={subCategories.find(sub => Number(sub.sub_category_id) === Number(formik.values.sub_category_id)) || null}
                onChange={(_, newValue) => {
                  formik.setFieldValue('sub_category_id', newValue ? Number(newValue.sub_category_id) : null);
                }}
                isOptionEqualToValue={(option, value) => Number(option.sub_category_id) === Number(value.sub_category_id)}
                disabled={!formik.values.category_id || subCategories.filter(sc => Number(sc.category_id) === Number(formik.values.category_id)).length === 0 || isLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Sub-Category"
                    name="sub_category_id"
                    onBlur={formik.handleBlur}
                    error={formik.touched.sub_category_id && Boolean(formik.errors.sub_category_id)}
                    helperText={formik.touched.sub_category_id && formik.errors.sub_category_id}
                    sx={customInputSx}
                  />
                )}
                clearIcon={null}
                fullWidth
                slotProps={{
                  paper: {
                    sx: {
                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      color: isDarkMode ? '#e2e8f0' : '#1e293b',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                      boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      mt: 1,
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
                  }
                }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <IngredientInput
                  value={formik.values.ingredients || []}
                  onChange={(ingredients) =>
                    formik.setFieldValue("ingredients", ingredients)
                  }
                  disabled={isLoading}
                  dialogOpen={open}
                  error={formik.touched.ingredients && Boolean(formik.errors.ingredients)}
                  errorText={formik.touched.ingredients && formik.errors.ingredients}
                />

                <KeywordInput
                  value={formik.values.keywords || []}
                  onChange={(keywords) => formik.setFieldValue("keywords", keywords)}
                  disabled={isLoading}
                  dialogOpen={open}
                  error={formik.touched.keywords && Boolean(formik.errors.keywords)}
                  errorText={formik.touched.keywords && formik.errors.keywords}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box mb={2}>
                  <Box>
                    <TextField
                      label="Add Instruction"
                      value={newInstruction}
                      onChange={(e) => setNewInstruction(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && newInstruction.trim()) {
                          e.preventDefault();
                          formik.setFieldValue("recipe_instructions", [
                            ...(Array.isArray(formik.values.recipe_instructions) ? formik.values.recipe_instructions : []),
                            newInstruction.trim(),
                          ]);
                          setNewInstruction("");
                        }
                      }}
                      fullWidth
                      margin="normal"
                      multiline
                      minRows={3}
                      disabled={isLoading}
                      error={
                        formik.touched.recipe_instructions &&
                        Boolean(formik.errors.recipe_instructions)
                      }
                      helperText={
                        formik.touched.recipe_instructions && formik.errors.recipe_instructions
                      }
                      sx={customInputSx}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                      <Button
                        onClick={() => setNewInstruction("")}
                        disabled={!newInstruction.trim() || isLoading}
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
                        onClick={() => {
                          if (newInstruction.trim()) {
                            formik.setFieldValue("recipe_instructions", [
                              ...(Array.isArray(formik.values.recipe_instructions) ? formik.values.recipe_instructions : []),
                              newInstruction.trim(),
                            ]);
                            setNewInstruction("");
                          }
                        }}
                        disabled={!newInstruction.trim() || isLoading}
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
                        Add
                      </Button>
                    </Box>
                  </Box>
                </Box>

                {(formik.values.recipe_instructions && formik.values.recipe_instructions.length > 0) && (
                  <div className="mb-4">
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Instructions:</h4>
                    {(formik.values.recipe_instructions || []).map((instruction, index) => (
                      <InstructionItem
                        key={index}
                        instruction={instruction}
                        index={index}
                        onUpdate={(updatedInstruction) => {
                          const newInstructions = [...formik.values.recipe_instructions];
                          newInstructions[index] = updatedInstruction;
                          formik.setFieldValue("recipe_instructions", newInstructions);
                        }}
                        onRemove={() => {
                          const newInstructions =
                            formik.values.recipe_instructions.filter(
                              (_, i) => i !== index
                            );
                          formik.setFieldValue("recipe_instructions", newInstructions);
                        }}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                )}

              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mt: 3, alignItems: 'start' }}>
              {/* Left: SEO Settings */}
              <Box sx={{ p: 2, border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`, borderRadius: '4px' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: isDarkMode ? '#93c5fd' : '#1e40af', fontWeight: 'bold' }}>
                  SEO Settings
                </Typography>
                <Box sx={{ mt: 1, mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <TextField
                      label="Meta Title"
                      name="meta_title"
                      value={formik.values.meta_title}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      margin="normal"
                      disabled={isLoading}
                      error={formik.touched.meta_title && Boolean(formik.errors.meta_title)}
                      helperText={
                        (formik.touched.meta_title && formik.errors.meta_title) ||
                        `${(formik.values.meta_title || '').length}/47`
                      }
                      inputProps={{ maxLength: 47 }}
                      sx={{ flex: 1, ...customInputSx }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        display: { xs: 'none', sm: 'block' },
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        mt: '30px',
                        flexShrink: 0
                      }}
                    >
                      | Recipe Trending
                    </Typography>
                  </Box>
                </Box>
                <TextField
                  label="Meta Description"
                  name="meta_description"
                  value={formik.values.meta_description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  fullWidth
                  margin="normal"
                  multiline
                  minRows={3}
                  error={formik.touched.meta_description && Boolean(formik.errors.meta_description)}
                  helperText={
                    (formik.touched.meta_description && formik.errors.meta_description) ||
                    `${(formik.values.meta_description || '').length}/160`
                  }
                  inputProps={{ maxLength: 160 }}
                  sx={customInputSx}
                />
              </Box>

              {/* Right: Video URL + Image Upload */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={!videoTitle && !videoThumbnail ? "Video URL (YouTube, optional)" : "Video URL"}
                  name="video_url"
                  value={formik.values.video_url}
                  onChange={(e) => {
                    formik.handleChange(e);
                    setVideoUrl(e.target.value);
                  }}
                  onBlur={formik.handleBlur}
                  fullWidth
                  margin="normal"
                  error={formik.touched.video_url && Boolean(formik.errors.video_url)}
                  helperText={
                    formik.touched.video_url && formik.errors.video_url ? formik.errors.video_url : ""
                  }
                  InputLabelProps={{
                    shrink: !!formik.values.video_url || !!videoTitle || !!videoThumbnail,
                  }}
                  sx={customInputSx}
                />
                {formik.values.video_url && (
                  <div className="flex flex-col items-start gap-2 max-w-[300px]">
                    {videoLoading && (
                      <span className="text-gray-500 text-sm">Checking video...</span>
                    )}
                    {videoError && (
                      <span className="text-red-500 text-sm">{videoError}</span>
                    )}
                    {videoThumbnail && (
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '16/9',
                          position: 'relative',
                          background: '#f3f3f3',
                          border: '1px solid #e0e0e0',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px'
                        }}
                      >
                        <img
                          src={videoThumbnail}
                          alt="YouTube video thumbnail"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0
                          }}
                        />
                      </div>
                    )}
                    {videoTitle && (
                      <span className={`font-medium text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {videoTitle}
                      </span>
                    )}
                  </div>
                )}

                <Box
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    border: '2px dashed',
                    borderColor: dragActive ? '#10b981' : isDarkMode ? '#4b5563' : '#d1d5db',
                    borderRadius: '4px',
                    padding: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: dragActive ? (isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)') : 'transparent',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    disabled={isLoading}
                  />
                  <Typography variant="body2" sx={{ mb: 1, color: isDarkMode ? '#d1d5db' : '#6b7280' }}>
                    {formik.values.image || imagePreview ? 'Change Image' : 'Upload Recipe Image (optional)'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#9ca3af' }}>
                    or drag and drop image here
                  </Typography>
                  {imagePreview && (
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Recipe image preview"
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
              </Box>
            </Box>

          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              px: 3,
              py: 2,
            }}
          >
            <Button
              onClick={() => navigate(returnToUrl)}
              disabled={isLoading}
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
                },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : null}
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
              {isLoading
                ? (mode === 'add' ? 'Adding...' : 'Updating...')
                : (mode === 'add' ? 'Add' : 'Update')}
            </Button>
          </Box>
        </Paper>
      </form>
      
      <ConfirmDialog
        open={isClearDraftDialogOpen}
        onClose={() => setIsClearDraftDialogOpen(false)}
        onConfirm={confirmClearDraft}
        title="Clear Saved Draft"
        message="Are you sure you want to clear your saved draft? This will reset the form and cannot be undone."
        confirmText="Clear"
        cancelText="Cancel"
        isLoading={isClearingDraft}
        loadingText="Clearing..."
        severity="error"
      />
    </Box>
  );
};

export default AddEditRecipePage;

