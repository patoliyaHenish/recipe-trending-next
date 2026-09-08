"use client";
import React, { useState } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { useGetRecipeSuggestionsQuery } from "../features/api/recipeDetailsApi";
import { useSearchRecipesQuery } from "../features/api/searchApi";
import RecipeCard from "./common/RecipeCard";
import RecipeGridSkeleton from "./common/RecipeGridSkeleton";
import { AdsterraNativeBanner, AdsterraBanner728x90, AdsterraBanner320x50 } from "./ads";

const getDesktopAdIndices = (items, seed = 1) => {
  const indices = new Set();
  if (!items || items.length === 0) return indices;
  let curr = 0;
  let s = seed * 16807;
  while (curr < items.length) {
    s = (s * 9301 + 49297) % 233280;
    const step = (s / 233280) > 0.5 ? 8 : 12;
    curr += step;
    if (curr <= items.length && curr - 1 !== items.length - 1) {
      indices.add(curr - 1);
    }
  }
  return indices;
};

const getMobileAdIndices = (items, seed = 1) => {
  const indices = new Set();
  if (!items || items.length === 0) return indices;
  let curr = 0;
  let s = seed * 48271;
  while (curr < items.length) {
    s = (s * 9301 + 49297) % 233280;
    const step = (s / 233280) > 0.5 ? 4 : 6;
    curr += step;
    if (curr <= items.length && curr - 1 !== items.length - 1) {
      indices.add(curr - 1);
    }
  }
  return indices;
};

const RecipeSuggestions = ({ recipeId, isDarkMode, foodType, initialSuggestions, initialFallback }) => {
  const [limit, setLimit] = useState(16);

  const { data: fetchedSuggestions, isLoading: isLoadingSuggestions, isFetching: isFetchingSuggestions, isError: isErrorSuggestions } = 
    useGetRecipeSuggestionsQuery({ recipeId: recipeId, limit }, { skip: (!!initialSuggestions && limit === 16) || !recipeId });

  const suggestionsData = (initialSuggestions && limit === 16) ? initialSuggestions : fetchedSuggestions;
  const suggestions = suggestionsData?.data || [];
  const needFallback = !(initialSuggestions && limit === 16) && !isLoadingSuggestions && !isErrorSuggestions && suggestions.length === 0;

  const { data: fetchedFallback, isLoading: isLoadingFallback } = useSearchRecipesQuery(
    { limit: 12, preference: foodType },
    { skip: !!initialFallback || !needFallback || !foodType }
  );

  const fallbackData = initialFallback || fetchedFallback;
  const fallbackRecipes = fallbackData?.recipes || fallbackData?.data?.recipes || (Array.isArray(fallbackData?.data) ? fallbackData.data : []);
  const displayRecipes = suggestions.length > 0 ? suggestions : fallbackRecipes;
  
  const desktopAdIndices = getDesktopAdIndices(displayRecipes, Number(recipeId) || 42);
  const mobileAdIndices = getMobileAdIndices(displayRecipes, Number(recipeId) || 42);

  // isLoading is for the initial load
  const isLoading = ((!initialSuggestions && limit === 16) && isLoadingSuggestions) || (!initialFallback && needFallback && isLoadingFallback);

  const handleLoadMore = () => {
    setLimit((prev) => prev + 16);
  };

  if (isLoading) {
    return (
      <Box sx={{ mt: 5 }}>
        <RecipeGridSkeleton count={16} mobileLayout="vertical" />
      </Box>
    );
  }

  if (displayRecipes.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 5 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 2,
          color: isDarkMode ? "#ffffff" : "#000000",
          fontFamily: "'Basic', sans-serif !important",
        }}
        className="text-5xl md:text-6xl"
      >
        {suggestions.length > 0 ? "You’ll Also Love" : "Recommended"}
      </Typography>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {displayRecipes.map((recipe, index) => {
          const showMobileAd = mobileAdIndices.has(index);
          const showDesktopAd = desktopAdIndices.has(index);

          return (
            <React.Fragment key={recipe.recipe_id || recipe.id || index}>
              <RecipeCard
                recipe={recipe}
                mobileLayout="vertical"
                isRelated={true}
              />
              {(showMobileAd || showDesktopAd) && (
                <Box
                  className="col-span-full justify-center items-center my-4 w-full"
                  sx={{
                    display: {
                      xs: showMobileAd ? 'flex' : 'none',
                      md: showDesktopAd ? 'flex' : 'none'
                    }
                  }}
                >
                  <Box className="block md:hidden w-full">
                    <AdsterraBanner320x50 />
                  </Box>
                  <Box className="hidden md:block">
                    <AdsterraBanner728x90 />
                  </Box>
                </Box>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {suggestions.length > 0 && suggestions.length >= limit && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 5, md: 7 }, mb: 4 }}>
          <Button
            variant="contained"
            onClick={handleLoadMore}
            disabled={isFetchingSuggestions}
            sx={{
              px: { xs: 3, md: 5 },
              py: { xs: 0.8, md: 1.1 },
              bgcolor: isDarkMode ? 'rgba(202,96,20,0.15)' : '#FEE7D6',
              color: isDarkMode ? '#FFEFD9' : '#CA6014',
              border: `1.5px solid ${isDarkMode ? 'rgba(202,96,20,0.4)' : '#CA6014'}`,
              borderRadius: '8px',
              fontFamily: "'Basic', sans-serif",
              fontSize: { xs: '0.9rem', md: '1rem' },
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'none',
              cursor: isFetchingSuggestions ? 'not-allowed' : 'pointer',
              opacity: isFetchingSuggestions ? 0.7 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isDarkMode ? 'none' : '0 4px 14px rgba(202, 96, 20, 0.15)',
              '&:hover': {
                bgcolor: isFetchingSuggestions ? undefined : '#CA6014',
                color: isFetchingSuggestions ? undefined : '#fff',
                transform: isFetchingSuggestions ? 'none' : 'translateY(-2px)',
                boxShadow: isFetchingSuggestions ? 'none' : '0 6px 20px rgba(202, 96, 20, 0.25)',
              },
              '&:active': {
                transform: 'translateY(0)',
              }
            }}
          >
            {isFetchingSuggestions ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={20} sx={{ color: 'inherit' }} />
                <span>Loading...</span>
              </Box>
            ) : (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <span>Load More</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>↓</span>
              </Box>
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default RecipeSuggestions;
