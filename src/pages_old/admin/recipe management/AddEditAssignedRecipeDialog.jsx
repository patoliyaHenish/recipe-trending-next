"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Autocomplete,
  CircularProgress,
  Box,
  Chip,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from '../../../utils/toast';
import { useTheme } from "../../../context/ThemeContext";
import { useGetRecipeCategoryDropdownQuery } from "../../../features/api/categoryApi";
import { useGetAllUsersQuery } from "../../../features/api/authApi";
import {
  useCreateAssignedRecipeMutation,
  useUpdateAssignedRecipeByIdMutation,
} from "../../../features/api/assignedRecipeApi";

const STATUS_OPTIONS = [
  { value: "assigned", label: "Assigned" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "on-hold", label: "On hold" },
];

const validationSchema = Yup.object({
  recipe_name: Yup.array()
    .of(Yup.string().trim().required("Recipe name cannot be empty").max(255))
    .min(1, "At least one recipe name is required"),
  status: Yup.string()
    .required()
    .oneOf(["assigned", "in-progress", "completed", "on-hold"]),
  assign_user_id: Yup.number().nullable().integer().positive(),
  category_id: Yup.number().nullable().integer().positive(),
  sub_category_id: Yup.number().nullable().integer().positive(),
});

const emptyValues = {
  recipe_name: [],
  status: "assigned",
  assign_user_id: null,
  category_id: null,
  sub_category_id: null,
};

const AddEditAssignedRecipeDialog = ({
  open,
  onClose,
  mode = "add",
  assignedRecipe = null,
  canUserList = false,
}) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [assignUserOption, setAssignUserOption] = useState(null);
  const [inputValue, setInputValue] = useState("");

  const { data: categoryDropdown } = useGetRecipeCategoryDropdownQuery(undefined, {
    skip: !open,
  });
  const categories = categoryDropdown?.data || [];

  const { data: usersData } = useGetAllUsersQuery(
    { page: 1, limit: 300, search: "", verified: "", blocked: "", google: "", preference: "", role: "" },
    { skip: !open || !canUserList }
  );
  const users = usersData?.data || [];

  const [createAssignedRecipe, { isLoading: isCreating }] = useCreateAssignedRecipeMutation();
  const [updateAssignedRecipe, { isLoading: isUpdating }] = useUpdateAssignedRecipeByIdMutation();

  const formik = useFormik({
    initialValues: {
      recipe_name: assignedRecipe?.recipe_name ? [assignedRecipe.recipe_name] : [],
      status: assignedRecipe?.status || "assigned",
      assign_user_id: assignedRecipe?.assign_user_id || null,
      category_id: assignedRecipe?.category_id || null,
      sub_category_id: assignedRecipe?.sub_category_id || null,
    },
    enableReinitialize: true,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        if (mode === "edit" && assignedRecipe?.id) {
          const body = {
            recipe_name: values.recipe_name[0]?.trim() || "",
            status: values.status,
            assign_user_id: values.assign_user_id || null,
            category_id: values.category_id || null,
            sub_category_id: values.sub_category_id || null,
          };
          await updateAssignedRecipe({ id: assignedRecipe.id, inputData: body }).unwrap();
          toast.success("Assigned recipe updated");
        } else {
          const promises = values.recipe_name.map(name => {
            const body = {
              recipe_name: name.trim(),
              status: values.status,
              assign_user_id: values.assign_user_id || null,
              category_id: values.category_id || null,
              sub_category_id: values.sub_category_id || null,
            };
            return createAssignedRecipe(body).unwrap();
          });
          await Promise.all(promises);
          toast.success(`${values.recipe_name.length} assigned recipe(s) created`);
        }
        handleClose();
      } catch (err) {
        toast.error(err?.data?.message || "Request failed");
      }
    },
  });

  const { resetForm, setValues } = formik;

  useEffect(() => {
    if (!open) return;
    setIsFormDirty(false);
    if (assignedRecipe) {
      setValues({
        recipe_name: assignedRecipe.recipe_name ? [assignedRecipe.recipe_name] : [],
        status: assignedRecipe.status || "assigned",
        assign_user_id: assignedRecipe.assign_user_id || null,
        category_id: assignedRecipe.category_id || null,
        sub_category_id: assignedRecipe.sub_category_id || null,
      });
    } else {
      resetForm({ values: emptyValues });
    }
    setInputValue("");
  }, [open, assignedRecipe, setValues, resetForm]);

  useEffect(() => {
    if (!open) {
      setAssignUserOption(null);
      return;
    }
    if (assignedRecipe?.assign_user_id) {
      const found = users.find((u) => Number(u.user_id) === Number(assignedRecipe.assign_user_id));
      setAssignUserOption(
        found || {
          user_id: assignedRecipe.assign_user_id,
          name: assignedRecipe.assigned_user_name || "User",
          email: assignedRecipe.assigned_user_email || "",
        }
      );
    } else {
      setAssignUserOption(null);
    }
  }, [open, assignedRecipe, users]);

  const handleClose = () => {
    setIsFormDirty(false);
    setAssignUserOption(null);
    resetForm({ values: emptyValues });
    onClose();
  };

  const selectedCategory = useMemo(() => {
    if (!formik.values.category_id) return null;
    return categories.find((c) => Number(c.category_id) === Number(formik.values.category_id)) || null;
  }, [categories, formik.values.category_id]);

  const allSubCategoryOptions = useMemo(() => {
    let allSubs = [];
    categories.forEach(cat => {
      let subs = cat.sub_categories;
      if (typeof subs === "string") {
        try {
          subs = JSON.parse(subs);
        } catch {
          subs = [];
        }
      }
      if (Array.isArray(subs)) {
        subs.forEach(sub => {
          allSubs.push({
            ...sub,
            category_id: cat.category_id,
            category_name: cat.name || cat.category_name || "Unknown Category"
          });
        });
      }
    });
    return allSubs;
  }, [categories]);

  const subCategoryOptions = useMemo(() => {
    if (formik.values.category_id) {
      return allSubCategoryOptions.filter(sub => Number(sub.category_id) === Number(formik.values.category_id));
    }
    return allSubCategoryOptions;
  }, [allSubCategoryOptions, formik.values.category_id]);

  const markDirty = () => setIsFormDirty(true);

  const handleAddRecipeName = () => {
    if (inputValue.trim() !== "") {
      const currentNames = formik.values.recipe_name || [];
      if (!currentNames.includes(inputValue.trim())) {
        formik.setFieldValue("recipe_name", [...currentNames, inputValue.trim()]);
        markDirty();
      }
      setInputValue("");
    }
  };

  const customInputSx = {
    '& .MuiOutlinedInput-root': {
      color: isDarkMode ? '#e2e8f0' : '#5e5873',
      backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#ffffff',
      borderRadius: '6px',
      transition: 'all 0.2s ease-in-out',
      '& fieldset': {
        borderColor: isDarkMode ? '#334155' : '#d8d6de',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? '#475569' : '#b4b7bd',
      },
      '&.Mui-focused fieldset': {
          borderColor: '#7367f0',
          borderWidth: '1px',
      },
      '&.Mui-focused': {
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
      },
      '&.Mui-disabled': {
        color: isDarkMode ? '#9ca3af' : '#b9b9c3',
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.2)' : '#efeaee',
        '& .MuiOutlinedInput-input': {
            WebkitTextFillColor: isDarkMode ? '#9ca3af' : '#b9b9c3',
        },
        '& fieldset': {
            borderColor: isDarkMode ? '#334155' : '#d8d6de',
        },
      },
    },
    '& .MuiInputLabel-root': {
      color: isDarkMode ? '#94a3b8' : '#b4b7bd',
      '&.Mui-focused': {
          color: '#7367f0',
      },
      '&.Mui-disabled': {
        color: isDarkMode ? '#6b7280' : '#b9b9c3',
      },
    },
    '& .MuiFormHelperText-root': {
      color: isDarkMode ? '#ffffff' : '#5e5873',
      marginLeft: '4px',
      marginTop: '4px',
      '&.Mui-error': {
        color: '#ea5455',
      }
    },
    '& .MuiSelect-icon': {
        color: isDarkMode ? '#94a3b8' : '#b4b7bd',
    },
    '& .MuiTypography-root': {
        color: isDarkMode ? '#e2e8f0' : '#5e5873',
    }
  };

  const autocompleteSx = {
    "& .MuiAutocomplete-popupIndicator": {
      color: isDarkMode ? "#9ca3af" : "#b4b7bd",
    },
    "& .MuiAutocomplete-clearIndicator": {
      color: isDarkMode ? "#9ca3af" : "#b4b7bd",
    },
    "& .MuiAutocomplete-listbox": {
      backgroundColor: isDarkMode ? "#23272f" : "#ffffff",
      color: isDarkMode ? "#e5e7eb" : "#5e5873",
    },
    "& .MuiAutocomplete-noOptions": {
      backgroundColor: isDarkMode ? "#23272f" : "#ffffff",
      color: isDarkMode ? "#9ca3af" : "#b4b7bd",
    },
    "& .MuiAutocomplete-loading": {
      backgroundColor: isDarkMode ? "#23272f" : "#ffffff",
      color: isDarkMode ? "#e5e7eb" : "#5e5873",
    },
    "& .MuiAutocomplete-option": {
      backgroundColor: isDarkMode ? "#23272f" : "#ffffff",
      color: isDarkMode ? "#e5e7eb" : "#5e5873",
      '&[aria-selected="true"]': {
        backgroundColor: isDarkMode ? "#374151" : "rgba(115, 103, 240, 0.12)",
        color: isDarkMode ? "#ffffff" : "#7367f0",
      },
      "&.Mui-focused": {
        backgroundColor: isDarkMode ? "#374151" : "#f8f8f8",
      },
      "&:hover": {
        backgroundColor: isDarkMode ? "#374151" : "#f8f8f8",
      },
    },
  };

  const autocompleteSlotProps = {
    paper: {
      sx: {
        backgroundColor: isDarkMode ? "#23272f" : "#ffffff",
        color: isDarkMode ? "#e5e7eb" : "#5e5873",
        borderRadius: "4px",
        border: `1px solid ${isDarkMode ? "#4b5563" : "#d8d6de"}`,
        boxShadow: isDarkMode
          ? "0 10px 40px rgba(0,0,0,0.45)"
          : "0 10px 40px rgba(0,0,0,0.08)",
      },
    },
  };

  const title = mode === "view" ? "View Assigned Recipe" : mode === "edit" ? "Edit Assigned Recipe" : "Add Assigned Recipe";
  const recipeNameOk = formik.values.recipe_name?.length > 0;
  const submitDisabled = isCreating || isUpdating;

  return (
    <Dialog
      key={`assigned-recipe-dialog-${open}`}
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
              <Typography 
                  variant="h5" 
                  sx={{ 
                      fontWeight: 700, 
                      color: isDarkMode ? '#e2e8f0' : '#1e293b', 
                      letterSpacing: '0.5px',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
              >
                  {title}
              </Typography>
          </Box>
          <IconButton 
              onClick={handleClose}
              size="small"
              sx={{ 
                  color: isDarkMode ? '#94a3b8' : '#b4b7bd',
                  backgroundColor: isDarkMode ? '#1e293b' : 'transparent',
                  '&:hover': {
                      backgroundColor: isDarkMode ? '#334155' : '#f8f8f8',
                      color: isDarkMode ? '#f8fafc' : '#5e5873',
                  }
              }}
          >
              <CloseIcon fontSize="small" />
          </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogContent
          sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5
          }}
        >
          <Box sx={{ mb: 0 }}>
            <Autocomplete
              freeSolo
              options={[]}
              value={mode === "add" ? null : (formik.values.recipe_name[0] || "")}
              inputValue={inputValue}
              onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
              }}
              onChange={(e, newValue) => {
                if (mode === "add") {
                  if (newValue) {
                    const currentNames = formik.values.recipe_name || [];
                    if (!currentNames.includes(newValue)) {
                      formik.setFieldValue("recipe_name", [...currentNames, newValue]);
                      markDirty();
                    }
                  }
                } else {
                  formik.setFieldValue("recipe_name", newValue ? [newValue] : []);
                  markDirty();
                }
              }}
              onKeyDown={(e) => {
                if (mode === "add" && e.key === "Enter") {
                  e.preventDefault();
                  handleAddRecipeName();
                }
              }}
              disabled={isCreating || isUpdating}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={mode === "add" ? "Recipe names" : "Recipe name"}
                  placeholder={mode === "add" ? "Type and click + or press enter" : ""}
                  error={formik.touched.recipe_name && Boolean(formik.errors.recipe_name)}
                  helperText={formik.touched.recipe_name && formik.errors.recipe_name}
                  required={mode === "add" ? (formik.values.recipe_name.length === 0) : true}
                  margin="none"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {params.InputProps?.endAdornment}
                        {mode === "add" && (
                          <IconButton onClick={handleAddRecipeName} edge="end" size="small" sx={{ color: isDarkMode ? "#93c5fd" : "#2563eb", mr: 0.5 }}>
                            <AddIcon />
                          </IconButton>
                        )}
                      </React.Fragment>
                    ),
                  }}
                  sx={customInputSx}
                />
              )}
            />
            {mode === "add" && formik.values.recipe_name.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                {formik.values.recipe_name.map((name, index) => (
                  <Chip
                    key={index}
                    label={name}
                    onDelete={() => {
                      const newNames = formik.values.recipe_name.filter((_, i) => i !== index);
                      formik.setFieldValue("recipe_name", newNames);
                      markDirty();
                    }}
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)',
                      color: '#7367f0',
                      fontWeight: 600,
                      borderRadius: '6px',
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(115, 103, 240, 0.7)',
                        '&:hover': {
                          color: '#7367f0',
                        },
                      },
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Autocomplete
            fullWidth
            options={STATUS_OPTIONS}
            getOptionLabel={(opt) => opt.label || ""}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            value={STATUS_OPTIONS.find((s) => s.value === formik.values.status) || STATUS_OPTIONS[0]}
            onChange={(_, v) => {
              formik.setFieldValue("status", v ? v.value : "assigned");
              markDirty();
            }}
            disabled={isCreating || isUpdating}
            disableClearable
            renderInput={(params) => (
              <TextField
                {...params}
                label="Status"
                margin="none"
                error={Boolean(formik.touched.status && formik.errors.status)}
                helperText={formik.touched.status && formik.errors.status}
                sx={customInputSx}
              />
            )}
            sx={autocompleteSx}
            slotProps={autocompleteSlotProps}
          />

          {canUserList ? (
            <Autocomplete
              fullWidth
              options={users}
              getOptionLabel={(opt) => (opt && opt.email ? `${opt.name} (${opt.email})` : opt?.name || "")}
              isOptionEqualToValue={(a, b) => Number(a?.user_id) === Number(b?.user_id)}
              value={assignUserOption}
              onChange={(_, v) => {
                setAssignUserOption(v);
                formik.setFieldValue("assign_user_id", v?.user_id ?? null);
                markDirty();
              }}
              disabled={isCreating || isUpdating}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assign to user (optional)"
                  margin="none"
                  sx={customInputSx}
                />
              )}
              sx={autocompleteSx}
              slotProps={autocompleteSlotProps}
            />
          ) : (
            <TextField
              label="Assign user ID (optional)"
              type="number"
              value={formik.values.assign_user_id ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                formik.setFieldValue("assign_user_id", v === "" ? null : Number(v));
                markDirty();
              }}
              onBlur={formik.handleBlur}
              helperText="Requires user.list to search by name"
              fullWidth
              margin="none"
              disabled={isCreating || isUpdating}
              sx={customInputSx}
            />
          )}

          <Autocomplete
            fullWidth
            options={categories}
            getOptionLabel={(opt) => opt.name || ""}
            isOptionEqualToValue={(a, b) => Number(a.category_id) === Number(b.category_id)}
            value={categories.find((c) => Number(c.category_id) === formik.values.category_id) || null}
            onChange={(_, v) => {
              formik.setFieldValue("category_id", v ? v.category_id : null);
              formik.setFieldValue("sub_category_id", null);
              markDirty();
            }}
            disabled={isCreating || isUpdating}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Category (optional)"
                margin="none"
                sx={customInputSx}
              />
            )}
            sx={autocompleteSx}
            slotProps={autocompleteSlotProps}
          />

          <Autocomplete
            fullWidth
            options={subCategoryOptions}
            getOptionLabel={(opt) => opt.name ? `${opt.name} (${opt.category_name})` : ""}
            isOptionEqualToValue={(a, b) => Number(a.sub_category_id) === Number(b.sub_category_id)}
            value={subCategoryOptions.find((sc) => Number(sc.sub_category_id) === formik.values.sub_category_id) || null}
            onChange={(_, v) => {
              formik.setFieldValue("sub_category_id", v ? v.sub_category_id : null);
              if (v && v.category_id && !formik.values.category_id) {
                formik.setFieldValue("category_id", v.category_id);
              }
              markDirty();
            }}
            disabled={isCreating || isUpdating}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sub-category (optional)"
                margin="none"
                sx={customInputSx}
              />
            )}
            sx={autocompleteSx}
            slotProps={autocompleteSlotProps}
          />
        </DialogContent>

        <DialogActions
          sx={{
              p: 3,
              pt: 2,
              borderTop: isDarkMode ? '1px solid #1e293b' : 'none',
              backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
              gap: 2,
          }}
        >
          <Button 
            onClick={handleClose} 
            variant="outlined"
            sx={{ 
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                color: isDarkMode ? '#94a3b8' : '#b4b7bd',
                borderColor: isDarkMode ? '#334155' : '#d8d6de',
                '&:hover': {
                    borderColor: isDarkMode ? '#475569' : '#b4b7bd',
                    backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.2)' : 'rgba(34, 41, 47, 0.04)',
                    color: isDarkMode ? '#94a3b8' : '#5e5873',
                }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitDisabled}
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
                "&:disabled": {
                  backgroundColor: isDarkMode ? "#6b7280" : "#d8d6de",
                  color: isDarkMode ? "#9ca3af" : "#b4b7bd",
                },
            }}
          >
            {isCreating || isUpdating ? (
              <CircularProgress size={16} color="inherit" />
            ) : mode === "edit" ? (
              "Update"
            ) : (
              "Add"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddEditAssignedRecipeDialog;

