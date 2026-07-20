"use client";
import { Alert, Box, Card, CircularProgress, IconButton, Tooltip, Typography, Collapse } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLazyGetRecipeNutritionBySlugQuery } from "../features/api/recipeDetailsApi";

const NutritionInfoSection = ({ recipeSlug, servings }) => {
  const [open, setOpen] = useState(false);
  const [hasRequestedNutrition, setHasRequestedNutrition] = useState(false);
  const { isDarkMode } = useTheme();
  const [fetchNutrition, { data, isFetching, isError }] = useLazyGetRecipeNutritionBySlugQuery();

  const nutrition = data?.data ?? null;

  const handleToggle = (event) => {
    event?.stopPropagation?.();

    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && recipeSlug && !hasRequestedNutrition) {
      setHasRequestedNutrition(true);
      fetchNutrition(recipeSlug, true);
    }
  };

  const formatNutrient = (val) => {
    if (val === undefined || val === null) return 0;
    return typeof val === 'number' ? val : Number(val) || 0;
  };

  const nutrientList = [
    { label: "Calories", value: formatNutrient(nutrition?.calories), unit: "", dv: null, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
    { label: "Total Fat", value: formatNutrient(nutrition?.total_fat), unit: "g", dv: 78, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
    { label: "Saturated Fat", value: formatNutrient(nutrition?.saturated_fat), unit: "g", dv: 20, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
    { label: "Cholesterol", value: formatNutrient(nutrition?.cholesterol), unit: "mg", dv: 300, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
    { label: "Sodium", value: formatNutrient(nutrition?.sodium), unit: "mg", dv: 2300, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
    { label: "Total Carbohydrate", value: formatNutrient(nutrition?.total_carbohydrate), unit: "g", dv: 275, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
    { label: "Dietary Fiber", value: formatNutrient(nutrition?.dietary_fiber), unit: "g", dv: 28, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
    { label: "Total Sugars", value: formatNutrient(nutrition?.total_sugars), unit: "g", dv: null, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
    { label: "Protein", value: formatNutrient(nutrition?.protein), unit: "g", dv: 50, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
    { label: "Vitamin C", value: formatNutrient(nutrition?.vitamin_c), unit: "mg", dv: 90, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
    { label: "Calcium", value: formatNutrient(nutrition?.calcium), unit: "mg", dv: 1300, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
    { label: "Iron", value: formatNutrient(nutrition?.iron), unit: "mg", dv: 18, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
    { label: "Potassium", value: formatNutrient(nutrition?.potassium), unit: "mg", dv: 4700, color: isDarkMode ? '#fb923c' : '#c2410c', bold: true },
  ];

  return (
    <Box sx={{ mt: 4 }}>
      <Card
        sx={{
          p: 3,
          boxShadow: 2,
          background: isDarkMode ? '#1A1A1A' : '#fff7ed',
          border: isDarkMode ? '1px solid #333' : '1px solid #ffedd5',
          position: 'relative',
          color: isDarkMode ? '#f3f4f6' : 'inherit',
          borderRadius: '1rem',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={handleToggle}
        tabIndex={0}
        aria-label="Toggle nutrition info"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontFamily: "'Basic', sans-serif !important",
                fontWeight: 700,
                color: isDarkMode ? '#EAEAEA' : '#000000',
                letterSpacing: '0.5px',
                mb: 0.5
              }}
              className="text-2xl md:text-3xl"
            >
              Nutrition Facts
            </Typography>
            {servings && servings > 0 && (
              <Typography sx={{ color: isDarkMode ? '#9ca3af' : '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                {servings} servings per recipe
              </Typography>
            )}
          </Box>
          <Tooltip title={open ? 'Hide details' : 'Show details'} arrow>
            <IconButton
              onClick={handleToggle}
              size="medium"
              sx={{ 
                backgroundColor: isDarkMode ? '#222' : '#ffedd5',
                color: isDarkMode ? '#fff' : '#c2410c',
                '&:hover': {
                  backgroundColor: isDarkMode ? '#333' : '#fed7aa',
                },
              }}
            >
              {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        <Collapse in={open}>
          <Box
            sx={{
              mt: 3,
              borderTop: `1px solid ${isDarkMode ? '#333' : '#ffedd5'}`,
              pt: 2,
              maxHeight: { xs: '65vh', sm: '70vh', md: 'none' },
              overflowY: { xs: 'auto', sm: 'auto', md: 'visible' },
              pr: { xs: 1, sm: 0 },
              '&::-webkit-scrollbar': {
                width: { xs: '3px', sm: '4px' },
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: isDarkMode ? 'rgba(251, 146, 60, 0.45)' : 'rgba(194, 65, 12, 0.35)',
                borderRadius: '999px',
              },
              scrollbarWidth: 'thin',
              scrollbarColor: isDarkMode ? 'rgba(251, 146, 60, 0.45) transparent' : 'rgba(194, 65, 12, 0.35) transparent',
            }}
          >
            {isFetching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} sx={{ color: isDarkMode ? '#fb923c' : '#c2410c' }} />
              </Box>
            ) : isError ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                Failed to load nutrition information.
              </Alert>
            ) : !nutrition ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                Nutrition information is not available for this recipe.
              </Alert>
            ) : (
              <>
                {servings && servings > 0 && (
                  <Typography sx={{ mb: 3, color: isDarkMode ? '#EAEAEA' : '#444', fontSize: '1.1rem', fontWeight: 600 }}>
                    Amount Per Serving
                  </Typography>
                )}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                  gap: { xs: 1.5, sm: 3 },
                  maxWidth: '800px'
                }}>
                  {nutrientList.map((nutrient, idx) => (
                    <Box 
                      key={idx} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        py: 1,
                        borderBottom: `1px solid ${isDarkMode ? '#2A2A2A' : '#fee8d1'}`
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: nutrient.bold ? 700 : 500, 
                          color: isDarkMode ? '#EAEAEA' : '#444',
                          fontSize: '1rem'
                        }}
                      >
                        {nutrient.label}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 700, 
                            color: nutrient.color,
                            fontSize: '1.1rem'
                          }}
                        >
                          {nutrient.value.toFixed(idx === 0 ? 0 : 1)}{nutrient.unit}
                        </Typography>
                        {nutrient.dv && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: isDarkMode ? '#9ca3af' : '#666',
                              fontSize: '0.9rem',
                              ml: 1
                            }}
                          >
                            {Math.round((nutrient.value / nutrient.dv) * 100)}%
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 4, color: isDarkMode ? '#6b7280' : '#888', fontStyle: 'italic', lineHeight: 1.6 }}>
                  * Values are estimates based on standard database entries for ingredients. Actual nutritional values may vary.
                  <br />
                  * Nutrient information is not available for all ingredients. Amount is based on available nutrient data.
                </Typography>
              </>
            )}
          </Box>
        </Collapse>
      </Card>
    </Box>
  );
};

export default NutritionInfoSection;

