"use client";
import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import RecipeCard from '../../components/common/RecipeCard';
import RecipeGridSkeleton from '../../components/common/RecipeGridSkeleton';
import { useGetSavedRecipesQuery } from '../../features/api/recipeDetailsApi';
import { useTheme } from '../../context/ThemeContext';
import { trackEvent } from '../../utils/analytics';

const MyCravings = () => {
  const { isDarkMode } = useTheme();
  const [page, setPage] = useState(1);
  const [recipes, setRecipes] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const limit = 12;

  const [isInitialized, setIsInitialized] = useState(false);
  const { data, isLoading, isFetching, isError } = useGetSavedRecipesQuery({ page, limit });

  const displayedRecipes = isInitialized ? recipes : (data?.data?.recipes || []);
  const isInitialLoading = (isLoading || isFetching) && !isInitialized;

  useEffect(() => {
    document.title = "My Cravings | Recipe Trending";
    trackEvent("page_view", { page: "my_cravings" });
    return () => {
      document.title = "Recipe Trending";
    };
  }, []);

  useEffect(() => {
    if (!data?.data) return;

    const newRecipes = data.data.recipes || [];
    const totalPages = data.data.pagination?.totalPages || 0;

    setHasMore(page < totalPages);
    
    if (page === 1) {
      setRecipes(newRecipes);
    } else {
      setRecipes((prev) => {
        const existingIds = new Set(prev.map(r => r.recipe_id));
        const uniqueNew = newRecipes.filter(r => !existingIds.has(r.recipe_id));
        return [...prev, ...uniqueNew];
      });
    }
    
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [data, page]);

  const handleLoadMore = () => {
    if (hasMore && !isFetching) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleRemoveSaved = (recipeId) => {
    setRecipes((prevRecipes) => prevRecipes.filter(recipe => recipe.recipe_id !== recipeId));
  };

  if (isError) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography color="error">Error loading saved recipes.</Typography>
    </Box>
  );

  return (
    <div className="w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            color: isDarkMode ? '#ffffff' : '#CA6014',
            mb: { xs: 4, md: 6 },
            textAlign: 'center',
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontFamily: "'Basic', sans-serif"
          }}
        >
          My Cravings
        </Typography>

        {isInitialLoading ? (
          <Box sx={{ mt: 4 }}>
            <RecipeGridSkeleton count={8} mobileLayout="vertical" />
          </Box>
        ) : displayedRecipes.length === 0 ? (
          <Box 
            sx={{ 
              py: { xs: 8, md: 12 }, 
              textAlign: 'center',
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: '24px',
              border: `1px dashed ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}
          >
            <Typography variant="h6" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b', mb: 2 }}>
              You haven't saved any recipes yet.
            </Typography>
            <Typography variant="body1" sx={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}>
              Explore our collection and click the bookmark icon to save your favorites here.
            </Typography>
          </Box>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {displayedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.recipe_id}
                  recipe={recipe}
                  mobileLayout="vertical"
                  onSaveChange={(isSaved) => {
                    if (!isSaved) handleRemoveSaved(recipe.recipe_id);
                  }}
                  showRemoveIcon={true}
                />
              ))}
            </div>

            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 6, md: 8 } }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={isFetching}
                  sx={{
                    px: { xs: 4, md: 6 },
                    py: 1.5,
                    borderColor: isDarkMode ? '#FFEFD9' : '#CA6014',
                    color: isDarkMode ? '#FFEFD9' : '#CA6014',
                    borderWidth: '2px',
                    borderRadius: '12px',
                    fontFamily: "'Basic', sans-serif",
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: isDarkMode ? '#ffffff' : '#A34D10',
                      bgcolor: isDarkMode ? 'rgba(255, 239, 217, 0.1)' : 'rgba(202, 96, 20, 0.05)',
                      borderWidth: '2px',
                    }
                  }}
                >
                  {isFetching ? (
                    <CircularProgress size={24} sx={{ color: isDarkMode ? '#FFEFD9' : '#CA6014' }} />
                  ) : (
                    "Load More Cravings"
                  )}
                </Button>
              </Box>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyCravings;
