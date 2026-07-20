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
  Autocomplete,
  CircularProgress,
  Box,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from '../../../utils/toast';
import { useTheme } from "../../../context/ThemeContext";
import { useGetAllRecipesSimpleQuery } from "../../../features/api/recipeApi";
import { useGetAllUsersQuery } from "../../../features/api/authApi";
import {
  useAddRecipeNoteMutation,
  useUpdateRecipeNoteMutation,
} from "../../../features/api/recipeNoteApi";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const validationSchema = Yup.object({
  recipe_id: Yup.number().required("Recipe is required").integer().positive(),
  message: Yup.string().trim().required("Message is required"),
  status: Yup.string()
    .required()
    .oneOf(["pending", "approved", "rejected"]),
  commenter_id: Yup.number().nullable().integer().positive(),
});

const AddEditRecipeNoteDialog = ({
  open,
  onClose,
  mode = "add",
  recipeNote = null,
  canUserList = false,
  currentUser = null,
}) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [commenterOption, setCommenterOption] = useState(null);
  const [recipeOption, setRecipeOption] = useState(null);

  const { data: recipesData, isLoading: isLoadingRecipes } = useGetAllRecipesSimpleQuery(undefined, {
    skip: !open,
  });
  const recipes = recipesData?.data || [];

  const { data: usersData } = useGetAllUsersQuery(
    { page: 1, limit: 300, search: "", verified: "", blocked: "", google: "", preference: "", role: "" },
    { skip: !open || !canUserList }
  );
  const users = usersData?.data || [];

  const [addRecipeNote, { isLoading: isCreating }] = useAddRecipeNoteMutation();
  const [updateRecipeNote, { isLoading: isUpdating }] = useUpdateRecipeNoteMutation();

  const emptyValues = useMemo(() => ({
    recipe_id: "",
    message: "",
    status: "pending",
    commenter_id: currentUser?.userId || currentUser?.user_id || null,
  }), [currentUser]);

  const formik = useFormik({
    initialValues: {
      recipe_id: recipeNote?.recipe_id || "",
      message: recipeNote?.message || "",
      status: recipeNote?.status || "pending",
      commenter_id: recipeNote?.commenter_id || currentUser?.userId || currentUser?.user_id || null,
    },
    enableReinitialize: true,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        if (mode === "edit" && recipeNote?.id) {
          const body = {
            noteId: recipeNote.id,
            message: values.message.trim(),
            status: values.status,
            commenterId: values.commenter_id || null,
          };
          await updateRecipeNote(body).unwrap();
          toast.success("Recipe note updated");
        } else {
          const body = {
            recipeId: values.recipe_id,
            message: values.message.trim(),
            status: values.status,
            commenterId: values.commenter_id || null,
          };
          await addRecipeNote(body).unwrap();
          toast.success("Recipe note added");
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
    if (recipeNote) {
      setValues({
        recipe_id: recipeNote.recipe_id || "",
        message: recipeNote.message || "",
        status: recipeNote.status || "pending",
        commenter_id: recipeNote.commenter_id || null,
      });
    } else {
      resetForm({ values: emptyValues });
    }
  }, [open, recipeNote, setValues, resetForm, emptyValues]);

  // Sync selected recipe Autocomplete option
  useEffect(() => {
    if (!open) {
      setRecipeOption(null);
      return;
    }
    if (formik.values.recipe_id) {
      const found = recipes.find((r) => Number(r.recipe_id) === Number(formik.values.recipe_id));
      setRecipeOption(
        found || {
          recipe_id: formik.values.recipe_id,
          title: recipeNote?.recipe_name || "Recipe",
        }
      );
    } else {
      setRecipeOption(null);
    }
  }, [open, formik.values.recipe_id, recipes, recipeNote]);

  // Sync selected commenter Autocomplete option
  useEffect(() => {
    if (!open) {
      setCommenterOption(null);
      return;
    }
    const currentCommenterId = formik.values.commenter_id;
    if (currentCommenterId) {
      const found = users.find((u) => Number(u.user_id) === Number(currentCommenterId));
      setCommenterOption(
        found || {
          user_id: currentCommenterId,
          name: recipeNote?.commenter_name || currentUser?.name || "User",
          email: recipeNote?.commenter_email || currentUser?.email || "",
        }
      );
    } else {
      setCommenterOption(null);
    }
  }, [open, formik.values.commenter_id, users, recipeNote, currentUser]);

  const handleClose = () => {
    setIsFormDirty(false);
    setCommenterOption(null);
    setRecipeOption(null);
    resetForm({ values: emptyValues });
    onClose();
  };

  const markDirty = () => setIsFormDirty(true);

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

  const title = mode === "edit" ? "Edit Recipe Note" : "Add Recipe Note";
  const submitDisabled = isCreating || isUpdating;

  return (
    <Dialog
      key={`recipe-note-dialog-${open}`}
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
          {/* Recipe Select Dropdown */}
          <Autocomplete
            fullWidth
            options={recipes}
            getOptionLabel={(opt) => opt.title || ""}
            isOptionEqualToValue={(a, b) => Number(a.recipe_id) === Number(b.recipe_id)}
            value={recipeOption}
            onChange={(_, v) => {
              setRecipeOption(v);
              formik.setFieldValue("recipe_id", v ? v.recipe_id : "");
              markDirty();
            }}
            disabled={isCreating || isUpdating || mode === "edit"}
            loading={isLoadingRecipes}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Recipe"
                margin="none"
                required
                error={formik.touched.recipe_id && Boolean(formik.errors.recipe_id)}
                helperText={formik.touched.recipe_id && formik.errors.recipe_id}
                slotProps={{
                  input: {
                    ...params.slotProps?.input,
                    endAdornment: (
                      <React.Fragment>
                        {isLoadingRecipes ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.slotProps?.input?.endAdornment}
                      </React.Fragment>
                    ),
                  }
                }}
                InputProps={params.InputProps ? {
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {isLoadingRecipes ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps?.endAdornment}
                    </React.Fragment>
                  ),
                } : undefined}
                sx={customInputSx}
              />
            )}
            sx={autocompleteSx}
            slotProps={autocompleteSlotProps}
          />

          {/* Note Message Input */}
          <TextField
            label="Note Message"
            name="message"
            multiline
            rows={4}
            value={formik.values.message}
            onChange={(e) => {
              formik.handleChange(e);
              markDirty();
            }}
            onBlur={formik.handleBlur}
            error={formik.touched.message && Boolean(formik.errors.message)}
            helperText={formik.touched.message && formik.errors.message}
            required
            fullWidth
            margin="none"
            disabled={isCreating || isUpdating}
            sx={customInputSx}
          />

          {/* Status Select Dropdown */}
          <Autocomplete
            fullWidth
            options={STATUS_OPTIONS}
            getOptionLabel={(opt) => opt.label || ""}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            value={STATUS_OPTIONS.find((s) => s.value === formik.values.status) || STATUS_OPTIONS[0]}
            onChange={(_, v) => {
              formik.setFieldValue("status", v ? v.value : "pending");
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

          {/* Commenter/User dropdown */}
          {canUserList ? (
            <Autocomplete
              fullWidth
              options={users}
              getOptionLabel={(opt) => (opt && opt.email ? `${opt.name} (${opt.email})` : opt?.name || "")}
              isOptionEqualToValue={(a, b) => Number(a?.user_id) === Number(b?.user_id)}
              value={commenterOption}
              onChange={(_, v) => {
                setCommenterOption(v);
                formik.setFieldValue("commenter_id", v?.user_id ?? null);
                markDirty();
              }}
              disabled={isCreating || isUpdating}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Commenter / User"
                  margin="none"
                  sx={customInputSx}
                />
              )}
              sx={autocompleteSx}
              slotProps={autocompleteSlotProps}
            />
          ) : (
            <TextField
              label="Commenter User ID (optional)"
              type="number"
              value={formik.values.commenter_id ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                formik.setFieldValue("commenter_id", v === "" ? null : Number(v));
                markDirty();
              }}
              onBlur={formik.handleBlur}
              helperText="Requires user.list permission to search by name"
              fullWidth
              margin="none"
              disabled={isCreating || isUpdating}
              sx={customInputSx}
            />
          )}
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

export default AddEditRecipeNoteDialog;

