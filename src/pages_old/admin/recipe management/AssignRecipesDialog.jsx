"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Autocomplete,
  Box,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from '../../../utils/toast';
import { useTheme } from "../../../context/ThemeContext";
import { useGetAllUsersQuery } from "../../../features/api/authApi";
import { useBatchAssignRecipesMutation } from "../../../features/api/assignedRecipeApi";

const validationSchema = Yup.object({
  assign_user_id: Yup.number().required("Please select a user"),
  count: Yup.number()
    .required("Please enter the number of recipes")
    .min(1, "Must assign at least 1 recipe")
    .max(100, "Cannot assign more than 100 at a time"),
});

const AssignRecipesDialog = ({
  open,
  onClose,
}) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  const [assignUserOption, setAssignUserOption] = useState(null);

  const { data: usersData, isLoading: isLoadingUsers } = useGetAllUsersQuery(
    { page: 1, limit: 300, search: "", verified: "", blocked: "", google: "", preference: "", role: "" },
    { skip: !open }
  );
  const users = usersData?.data || [];

  const [batchAssignRecipes, { isLoading: isAssigning }] = useBatchAssignRecipesMutation();

  const formik = useFormik({
    initialValues: {
      assign_user_id: null,
      count: 1,
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        await batchAssignRecipes(values).unwrap();
        toast.success(`Successfully assigned ${values.count} recipes`);
        handleClose();
      } catch (err) {
        toast.error(err?.data?.message || "Failed to assign recipes");
      }
    },
  });

  const { resetForm } = formik;

  const handleClose = () => {
    resetForm();
    setAssignUserOption(null);
    onClose();
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

  return (
    <Dialog
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
                  Batch Assign Recipes
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
              gap: 3
          }}
        >
          
          <Autocomplete
            fullWidth
            options={users}
            getOptionLabel={(opt) => (opt && opt.email ? `${opt.name} (${opt.email})` : opt?.name || "")}
            isOptionEqualToValue={(a, b) => Number(a?.user_id) === Number(b?.user_id)}
            value={assignUserOption}
            onChange={(_, v) => {
              setAssignUserOption(v);
              formik.setFieldValue("assign_user_id", v?.user_id ?? null);
            }}
            disabled={isAssigning || isLoadingUsers}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assign to user"
                margin="none"
                error={Boolean(formik.touched.assign_user_id && formik.errors.assign_user_id)}
                helperText={formik.touched.assign_user_id && formik.errors.assign_user_id}
                sx={customInputSx}
              />
            )}
            sx={autocompleteSx}
            slotProps={autocompleteSlotProps}
          />

          <TextField
            label="No of recipes"
            type="number"
            name="count"
            value={formik.values.count}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(formik.touched.count && formik.errors.count)}
            helperText={formik.touched.count && formik.errors.count}
            fullWidth
            margin="none"
            disabled={isAssigning}
            sx={customInputSx}
            inputProps={{ min: 1, max: 100 }}
          />

        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleClose}
            disabled={isAssigning}
            sx={{
              color: isDarkMode ? '#9ca3af' : '#6e6b7b',
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isAssigning}
            sx={{
              backgroundColor: '#7367f0',
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              '&:hover': { backgroundColor: '#5e50ee' },
            }}
          >
            {isAssigning ? "Assigning..." : "Assign"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AssignRecipesDialog;
