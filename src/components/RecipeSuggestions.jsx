"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { useGetRecipeSuggestionsQuery } from "../features/api/recipeDetailsApi";
import { useSearchRecipesQuery } from "../features/api/searchApi";
import RecipeCard from "./common/RecipeCard";
import RecipeGridSkeleton from "./common/RecipeGridSkeleton";

const RecipeSuggestions = ({ recipeId, isDarkMode, foodType, initialSuggestions, initialFallback }) => {
  const { data: fetchedSuggestions, isLoading: isLoadingSuggestions, isError: isErrorSuggestions } = 
    useGetRecipeSuggestionsQuery({ recipeId: recipeId, limit: 16 }, { skip: !!initialSuggestions || !recipeId });

  const suggestionsData = initialSuggestions || fetchedSuggestions;
  const suggestions = suggestionsData?.data || [];
  const needFallback = !initialSuggestions && !isLoadingSuggestions && !isErrorSuggestions && suggestions.length === 0;

  const { data: fetchedFallback, isLoading: isLoadingFallback } = useSearchRecipesQuery(
    { sortBy: 'total_views', limit: 12, preference: foodType },
    { skip: !!initialFallback || !needFallback || !foodType }
  );

  const fallbackData = initialFallback || fetchedFallback;
  const fallbackRecipes = fallbackData?.recipes || fallbackData?.data?.recipes || (Array.isArray(fallbackData?.data) ? fallbackData.data : []);
  const displayRecipes = suggestions.length > 0 ? suggestions : fallbackRecipes;
  const isLoading = (!initialSuggestions && isLoadingSuggestions) || (!initialFallback && needFallback && isLoadingFallback);

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
        {suggestions.length > 0 ? "You’ll Also Love" : "Most Viewed"}
      </Typography>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {displayRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.recipe_id || recipe.id}
            recipe={recipe}
            mobileLayout="vertical"
          />
        ))}
      </div>
    </Box>
  );
};

export default RecipeSuggestions;
