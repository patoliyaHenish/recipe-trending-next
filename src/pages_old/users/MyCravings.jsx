"use client";
import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import RecipeCard from '../../components/common/RecipeCard';
import RecipeGridSkeleton from '../../components/common/RecipeGridSkeleton';
import { useGetSavedRecipesQuery } from '../../features/api/recipeDetailsApi';
import { useTheme } from '../../context/ThemeContext';

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
    return () => {
      document.title = "Recipe Trending";
    };
  }, []);

  useEffect(() => {
    if (!data?.data) return;

    const newRecipes = data.data.recipes || [];
    const totalPages = data.data.pagination?.totalPages || 0;

    setHasMore(page < totalPages);
    setIsInitialized(true);

    setRecipes((prev) => {
      if (page === 1) {
        return newRecipes;
      }
      const existingIds = new Set(prev.map((item) => item.recipe_id || item.id));
      const merged = [...prev];
      newRecipes.forEach((item) => {
        const itemId = item.recipe_id || item.id;
        if (!existingIds.has(itemId)) {
          merged.push(item);
        }
      });
      return merged;
    });
  }, [data, page]);

  const handleLoadMore = () => {
    if (!isFetching && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleSaveChange = (saved, recipeId) => {
    if (saved) return;
    setRecipes((prev) => prev.filter((item) => (item.recipe_id || item.id) !== recipeId));
  };

  return (
    <div className="w-full">
      <Box
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10"
        sx={{
          pt: '72px',
          '@media (min-width:1140px)': {
            pt: '132px',
          },
        }}
      >
        <Box
          sx={{
            mb: 2,
            pb: 1.5,
            borderBottom: '1px solid',
            borderColor: isDarkMode ? 'rgba(2598945, 255, 255, 0.15)' : '#e5e7eb',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontFamily: "'Basic', sans-serif !important",
              color: isDarkMode ? '#f8fafc' : '#0f172a',
              mb: 0.5,
            }}
          >
            My Cravings
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Basic', sans-serif !important",
              color: isDarkMode ? '#94a3b8' : '#475569'
            }}
          >
            The recipes I’m coming back to.
          </Typography>
        </Box>

        {isInitialLoading && <RecipeGridSkeleton count={8} mobileLayout="vertical" />}

        {!isLoading && isError && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography sx={{ color: isDarkMode ? '#fca5a5' : '#dc2626' }}>
              Failed to load saved recipes.
            </Typography>
          </Box>
        )}

        {!isInitialLoading
          && !isError
          && Array.isArray(displayedRecipes)
          && displayedRecipes.length === 0 && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography sx={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                You have not saved any recipes yet.
              </Typography>
            </Box>
        )}

        {Array.isArray(displayedRecipes) && displayedRecipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {displayedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.recipe_id || recipe.id}
                recipe={recipe}
                onSaveChange={handleSaveChange}
                showRemoveIcon={true}
                hideBadge={true}
                mobileLayout="vertical"
              />
            ))}
          </div>
        )}

        {hasMore && !isInitialLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleLoadMore}
              disabled={isFetching}
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
                cursor: isFetching ? 'not-allowed' : 'pointer',
                opacity: isFetching ? 0.7 : 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isDarkMode ? 'none' : '0 4px 14px rgba(202, 96, 20, 0.15)',
                '&:hover': {
                  bgcolor: isFetching ? undefined : '#CA6014',
                  color: isFetching ? undefined : '#fff',
                  transform: isFetching ? 'none' : 'translateY(-2px)',
                  boxShadow: isFetching ? 'none' : '0 6px 20px rgba(202, 96, 20, 0.25)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                }
              }}
            >
              {isFetching ? (
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
    </div>
  );
};

export default MyCravings;
