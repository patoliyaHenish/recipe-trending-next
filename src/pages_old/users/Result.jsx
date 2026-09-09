"use client";
import {
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Typography,
  Snackbar,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import Cookies from 'js-cookie';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  useSearchRecipesQuery,
} from "../../features/api/searchApi";
import RecipeGridSkeleton from "../../components/common/RecipeGridSkeleton";
import RecipeCard from "../../components/common/RecipeCard";
import LoadMoreButton from "../../components/common/LoadMoreButton";
import { useTheme } from "../../context/ThemeContext";
import { trackEvent } from "../../utils/analytics";
import { AdsterraBanner728x90, AdsterraBanner320x50 } from "../../components/ads";

const getDesktopAdIndices = (items, seed = 1) => {
  const indices = new Set();
  if (!items || items.length === 0) return indices;
  let curr = 0;
  let s = (seed || 1) * 16807;
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
  let s = (seed || 1) * 48271;
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}
const Result = () => {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const executedSearchQuery = searchParams.get("q") || "";
  const filters = useMemo(
    () => ({
      preference: searchParams.get("preference") || "",
      timeRange: searchParams.get("timeRange") || "",
    }),
    [searchParamsString]
  );
  const [page, setPage] = useState(1);
  const hasAnySelection = useMemo(() => {
    return !!(
      searchParams.get("categoryId") ||
      searchParams.get("subCategoryId") ||
      searchParams.get("recipeId") ||
      searchParams.get("ingredientId")
    );
  }, [searchParamsString]);
  const shouldSearch = useMemo(
    () => !!(
      executedSearchQuery ||
      filters.preference ||
      filters.timeRange ||
      hasAnySelection
    ),
    [executedSearchQuery, filters, hasAnySelection]
  );
  const [allRecipes, setAllRecipes] = useState([]);
  const [isResultsRefreshing, setIsResultsRefreshing] = useState(false);
  const observer = useRef();
  const processedDataRef = useRef(new Set());
  const scrollContainerRef = useRef();
  const isMobile = useIsMobile();
  const [showShareToast, setShowShareToast] = useState(false);

  const updateSearchParams = useCallback((newParams) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    delete currentParams.page;
    const updatedParams = { ...currentParams, ...newParams };

    Object.keys(updatedParams).forEach((key) => {
      if (!updatedParams[key] || updatedParams[key] === "") {
        delete updatedParams[key];
      }
    });

    const urlParams = new URLSearchParams(updatedParams);
    router.push(`${pathname}?${urlParams.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const handleFilterChange = useCallback((key, value) => {
    if (key === "preference" && value) {
        trackEvent("food_type", { food_type_filter: value });
    }

    if (key === 'preference') {
      if (value) {
        Cookies.set('userPreference', value, { expires: 365 });
      } else {
        Cookies.remove('userPreference');
      }
      window.dispatchEvent(new Event('userPreferenceChanged'));
    }

    updateSearchParams({ [key]: value });
    setPage(1);
    setIsResultsRefreshing(true);
    setAllRecipes([]);
    processedDataRef.current.clear();
  }, [updateSearchParams]);

  useEffect(() => {
    if (searchParams.get("page")) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("page");

      const nextUrl = nextParams.toString()
        ? `${pathname}?${nextParams.toString()}`
        : pathname;

      router.replace(nextUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  useEffect(() => {
    const getUrlPreference = () => new URLSearchParams(window.location.search).get("preference") || "";

    const handleCookieChange = () => {
      const cookiePref = Cookies.get('userPreference') || "";
      const urlPref = getUrlPreference();
      if (urlPref !== cookiePref) {
        handleFilterChange("preference", cookiePref);
      }
    };

    const initialCookie = Cookies.get('userPreference');
    if (initialCookie && !getUrlPreference()) {
        handleFilterChange("preference", initialCookie);
    }

    window.addEventListener('userPreferenceChanged', handleCookieChange);
    return () => window.removeEventListener('userPreferenceChanged', handleCookieChange);
  }, [searchParamsString, handleFilterChange]);

  const searchItems = executedSearchQuery
    ? executedSearchQuery
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item)
    : [];
  const searchItemTypes = useMemo(() => {
    const typeParam = searchParams.get("t") || "";
    return typeParam
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item);
  }, [searchParamsString]);

  const selectionIds = useMemo(() => {
    const parseIds = (value) =>
      value
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
    return {
      category: parseIds(searchParams.get("categoryId")),
      subCategory: parseIds(searchParams.get("subCategoryId")),
      recipe: parseIds(searchParams.get("recipeId")),
      ingredient: parseIds(searchParams.get("ingredientId")),
    };
  }, [searchParamsString]);

  const searchParamsForApi = useMemo(() => {
    const types = searchItemTypes;
    const items = searchItems;
    const ids = { ...selectionIds };

    const mutableIds = {
      recipe: [...(ids.recipe || [])],
      ingredient: [...(ids.ingredient || [])],
      category: [...(ids.category || [])],
      subCategory: [...(ids.subCategory || [])]
    };

    const textParts = [];

    items.forEach((item, index) => {
      const type = types[index] || 'recipe';
      let isIdBased = false;

      if (type === 'ingredient' && mutableIds.ingredient.length > 0) {
        mutableIds.ingredient.shift();
        isIdBased = true;
      } else if (type === 'category' && mutableIds.category.length > 0) {
        mutableIds.category.shift();
        isIdBased = true;
      } else if (type === 'subCategory' && mutableIds.subCategory.length > 0) {
        mutableIds.subCategory.shift();
        isIdBased = true;
      } else if (type === 'recipe' && mutableIds.recipe.length > 0) {
        mutableIds.recipe.shift();
        isIdBased = true;
      }

      if (!isIdBased) {
        textParts.push(item);
      }
    });

    return {
      q: textParts.join(', '),
      categoryId: searchParams.get("categoryId") || "",
      subCategoryId: searchParams.get("subCategoryId") || "",
      recipeId: searchParams.get("recipeId") || "",
      ingredientId: searchParams.get("ingredientId") || "",
      ...filters,
      page,
      limit: 12,
      sortBy: "created_at",
      sortOrder: "DESC",
    };
  }, [searchParamsString, executedSearchQuery, filters, page]);

  const {
    data: searchData,
    isLoading: searchLoading,
    isFetching,
    error: searchError,
  } = useSearchRecipesQuery(searchParamsForApi, {
    skip: !shouldSearch,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (executedSearchQuery) {
      document.title = `Results for: ${executedSearchQuery} | Recipe Trending`;
    } else {
      document.title = "Results | Recipe Trending";
    }
    return () => {
      document.title = "Recipe Trending";
    };
  }, [executedSearchQuery]);

  const handleRemoveSearchItem = (indexToRemove) => {
    const remainingItems = searchItems.filter(
      (_, idx) => idx !== indexToRemove,
    );
    const remainingTypes = searchItemTypes.filter(
      (_, idx) => idx !== indexToRemove,
    );
    const typeToRemove = searchItemTypes[indexToRemove] || "recipe";
    const getTypeIndex = (types, index, target) =>
      types.slice(0, index).filter((t) => t === target).length;

    const nextCategoryIds = [...selectionIds.category];
    const nextSubCategoryIds = [...selectionIds.subCategory];
    const nextRecipeIds = [...selectionIds.recipe];
    const nextIngredientIds = [...selectionIds.ingredient];

    if (typeToRemove === "category" && nextCategoryIds.length > 0) {
      const removeIndex = getTypeIndex(
        searchItemTypes,
        indexToRemove,
        "category",
      );
      nextCategoryIds.splice(removeIndex, 1);
    }
    if (typeToRemove === "subCategory" && nextSubCategoryIds.length > 0) {
      const removeIndex = getTypeIndex(
        searchItemTypes,
        indexToRemove,
        "subCategory",
      );
      nextSubCategoryIds.splice(removeIndex, 1);
    }
    if (typeToRemove === "recipe" && nextRecipeIds.length > 0) {
      const removeIndex = getTypeIndex(
        searchItemTypes,
        indexToRemove,
        "recipe",
      );
      nextRecipeIds.splice(removeIndex, 1);
    }
    if (typeToRemove === "ingredient" && nextIngredientIds.length > 0) {
      const removeIndex = getTypeIndex(
        searchItemTypes,
        indexToRemove,
        "ingredient",
      );
      nextIngredientIds.splice(removeIndex, 1);
    }


    if (remainingItems.length > 0) {
      const newQuery = remainingItems.join(", ");
      const newTypes = remainingTypes.join(", ");
      setPage(1);
      const params = new URLSearchParams();
      params.set("q", newQuery);
      if (newTypes) params.set("t", newTypes);
      if (nextCategoryIds.length > 0)
        params.set("categoryId", nextCategoryIds.join(","));
      if (nextSubCategoryIds.length > 0)
        params.set("subCategoryId", nextSubCategoryIds.join(","));
      if (nextRecipeIds.length > 0)
        params.set("recipeId", nextRecipeIds.join(","));
      if (nextIngredientIds.length > 0)
        params.set("ingredientId", nextIngredientIds.join(","));
      router.push(`/result?${params.toString()}`, { scroll: false });
    } else {
      router.push("/");
    }
  };

  const hasMore = Boolean(
    searchData?.pagination &&
    searchData.pagination.currentPage < searchData.pagination.totalPages
  );

  const handleLoadMore = () => {
    if (!isFetching && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (searchData && searchData.pagination?.currentPage === page) {
      setIsResultsRefreshing(false);
      if (page === 1) {
          trackEvent("search_query", { query: executedSearchQuery || "empty" });
          if (!searchData.recipes || searchData.recipes.length === 0) {
              trackEvent("search_no_result", { query: executedSearchQuery || "empty" });
          }
      }
      const dataKey = `${searchData.pagination.currentPage}-${searchData.recipes?.length || 0}`;
      if (processedDataRef.current.has(dataKey)) {
        return;
      }
      processedDataRef.current.add(dataKey);
      if (page === 1) {
        setAllRecipes(searchData.recipes || []);
        processedDataRef.current.clear();
        processedDataRef.current.add(dataKey);
      } else {
        setAllRecipes((prev) => {
          const existingIds = new Set(prev.map((r) => r.recipe_id || r.id));
          const uniqueNew = (searchData.recipes || []).filter(
            (r) => !existingIds.has(r.recipe_id || r.id)
          );
          return [...prev, ...uniqueNew];
        });
      }
    }
  }, [searchData, page, executedSearchQuery]);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: "Recipe Trending Results",
      text: executedSearchQuery
        ? `Check out these recipe search results for "${executedSearchQuery}" on Recipe Trending!\n${url}`
        : `Check out these recipe search results on Recipe Trending!\n${url}`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShowShareToast(true);
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Error sharing results:", err);
      }
    }
  };

  useEffect(() => {
    document.body.classList.add("custom-scrollbar");
    return () => {
      document.body.classList.remove("custom-scrollbar");
    };
  }, []);

  const preferenceFoodTypes = searchData?.preferenceFoodTypes || [];
  const preferredRecipes = useMemo(
    () => allRecipes.filter((recipe) => preferenceFoodTypes.includes(String(recipe.food_type || '').toLowerCase())),
    [allRecipes, preferenceFoodTypes]
  );
  const otherRecipes = useMemo(
    () => allRecipes.filter((recipe) => !preferenceFoodTypes.includes(String(recipe.food_type || '').toLowerCase())),
    [allRecipes, preferenceFoodTypes]
  );

  return (
    <div
      className="min-h-screen pt-[56px] sm:pt-[64px] md:pt-[96px] lg:pt-[104px]"
      style={{
        backgroundColor: isDarkMode ? "#1E1E1E" : "#f9fafb",
        transition: "background-color 0.3s ease",
      }}
    >
      <div
        className="w-full pt-8 sm:pt-10 pb-4 sm:pb-6"
        style={{
          backgroundColor: isDarkMode ? "#1e2936" : "#fff5eb",
          transition: "background-color 0.3s ease",
        }}
      >
        <div className="w-full max-w-4xl mx-auto px-3 sm:px-4">
          {executedSearchQuery && (
            <div className="max-w-5xl mx-auto">
              <div
                className="mb-4"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    fontWeight: 600,
                    color: isDarkMode ? "#9ca3af" : "#6b7280",
                    fontFamily: "'Basic', sans-serif !important",
                  }}
                >
                  Results for:
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      onClick={() => updateSearchParams({ openSearch: "1" })}
                      sx={{
                        fontSize: { xs: "0.85rem", sm: "0.95rem" },
                        fontWeight: 600,
                        color: isDarkMode ? "#fbbf24" : "#d97706",
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.6px",
                        textDecoration: "underline",
                        textUnderlineOffset: "4px",
                        "&:hover": {
                          color: isDarkMode ? "#fde68a" : "#b45309",
                        },
                        fontFamily: "'Basic', sans-serif !important",
                      }}
                    >
                      Edit search
                    </Typography>
                    <Tooltip title="Share results">
                        <IconButton 
                            onClick={handleShare}
                            size="small"
                            sx={{ 
                                "&:hover": {
                                    bgcolor: "transparent",
                                    transform: "scale(1.1)",
                                },
                                transition: "transform 0.2s",
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px' }}>
                                <path d="M15 5L22 12L15 19V14.5C10 14.5 6.5 16 4 20C5 15 8 10 15 9V5Z" fill="#4D9CFF"/>
                            </svg>
                        </IconButton>
                    </Tooltip>
                </Box>
              </div>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1.5,
                }}
              >
                {searchItems.map((item, index) => {
                  const itemType =
                    searchItemTypes[index] ||
                    searchItemTypeMap.get(item.toLowerCase()) ||
                    "recipe";

                  const typeColors = {
                    ingredient: {
                      bg: isDarkMode ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
                      border: isDarkMode ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(16, 185, 129, 0.3)",
                      text: isDarkMode ? "#6ee7b7" : "#10b981",
                    },
                    category: {
                      bg: isDarkMode ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.1)",
                      border: isDarkMode ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(139, 92, 246, 0.3)",
                      text: isDarkMode ? "#a78bfa" : "#8b5cf6",
                    },
                    subCategory: {
                      bg: isDarkMode ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.1)",
                      border: isDarkMode ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(245, 158, 11, 0.3)",
                      text: isDarkMode ? "#fbbf24" : "#f59e0b",
                    },
                    recipe: {
                      bg: isDarkMode ? "rgba(202, 96, 20, 0.15)" : "rgba(202, 96, 20, 0.1)",
                      border: isDarkMode ? "1px solid rgba(202, 96, 20, 0.4)" : "1px solid rgba(202, 96, 20, 0.3)",
                      text: isDarkMode ? "#fb923c" : "#ca6014",
                    },
                  };

                  const colors = typeColors[itemType] || typeColors.recipe;

                  return (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: colors.bg,
                        border: colors.border,
                        color: colors.text,
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        fontWeight: 500,
                        fontFamily: "'Basic', sans-serif !important",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span>{item}</span>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveSearchItem(index)}
                        sx={{
                          p: 0,
                          color: colors.text,
                          "&:hover": {
                            bgcolor: "transparent",
                            transform: "scale(1.1)",
                          },
                        }}
                        aria-label={`Remove ${item}`}
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            </div>
          )}
        </div>
      </div>
      {isDarkMode && <div className="w-full h-px bg-white opacity-20"></div>}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-6 md:py-8">
        {(searchLoading || isResultsRefreshing) && allRecipes.length === 0 && (
          <div className="py-8 sm:py-12">
            <RecipeGridSkeleton count={8} mobileLayout="vertical" />
          </div>
        )}
        {searchError && (
          <Alert severity="error" className="mb-6 sm:mb-8">
            Failed to load search results. Please try again.
          </Alert>
        )}
        {(searchData && searchData.recipes && searchData.recipes.length > 0) || (allRecipes && allRecipes.length > 0) ? (
          (() => {
            const seed = (executedSearchQuery ? executedSearchQuery.length : 1) + 17;
            const hasFoodPreference = preferenceFoodTypes.length > 0;
            const renderRecipeSection = (recipes, sectionSeed, withRef = false) => {
              if (recipes.length === 0) return null;

              const desktopAdIndices = getDesktopAdIndices(recipes, sectionSeed);
              const mobileAdIndices = getMobileAdIndices(recipes, sectionSeed);

              return (
                <Box component="section" sx={{ mb: { xs: 5, md: 7 } }}>
                  <div
                    ref={withRef ? scrollContainerRef : undefined}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
                  >
                    {recipes.map((recipe, index) => {
                      const normalizedRecipe = {
                        ...recipe,
                        recipe_id: recipe.recipe_id || recipe.id,
                        title: recipe.title || recipe.name,
                      };
                      const isLastItem = index === recipes.length - 1;
                      const showMobileAd = mobileAdIndices.has(index) && !isLastItem;
                      const showDesktopAd = desktopAdIndices.has(index) && !isLastItem;

                      return (
                        <React.Fragment key={normalizedRecipe.recipe_id || index}>
                          <div className="h-full">
                            <RecipeCard recipe={normalizedRecipe} mobileLayout="vertical" hideVideoIcon />
                          </div>
                          {(showMobileAd || showDesktopAd) && (
                            <Box
                              className="col-span-full justify-center items-center my-4 w-full"
                              sx={{ display: { xs: showMobileAd ? 'flex' : 'none', sm: showMobileAd ? 'flex' : 'none', md: showDesktopAd ? 'flex' : 'none' } }}
                            >
                              <Box className="block md:hidden w-full"><AdsterraBanner320x50 /></Box>
                              <Box className="hidden md:block"><AdsterraBanner728x90 /></Box>
                            </Box>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </Box>
              );
            };

            return (
              <>
                {hasFoodPreference && renderRecipeSection(
                  preferredRecipes,
                  seed,
                  true
                )}
                {renderRecipeSection(
                  otherRecipes,
                  seed + 101,
                  !hasFoodPreference
                )}

                {hasMore && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 5, md: 7 }, mb: 4 }}>
                    <LoadMoreButton
                      onClick={handleLoadMore}
                      isLoading={isFetching}
                      loadingText="Loading more..."
                    />
                  </Box>
                )}
              </>
            );
          })()
        ) : null}
        {searchData && searchData.recipes.length === 0 && !searchLoading && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 animate-fade-in">
            <div className="mb-6 sm:mb-8">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                className="mx-auto animate-bounce"
              >
                <circle cx="40" cy="40" r="40" fill="#f3e8ff" />
                <path
                  d="M40 18c-7 0-13 5-13 12 0 6 5 11 11 12l2 0c6-1 11-6 11-12 0-7-6-12-13-12z"
                  fill="#fff"
                />
                <path
                  d="M40 42c-7 0-13-5-13-12 0-7 6-12 13-12s13 5 13 12c0 7-6 12-13 12zm0-22c-6.1 0-11 4.5-11 10 0 5.5 4.9 10 11 10s11-4.5 11-10c0-5.5-4.9-10-11-10z"
                  fill="#a21caf"
                />
                <rect
                  x="37"
                  y="44"
                  width="6"
                  height="18"
                  rx="3"
                  fill="#a21caf"
                />
              </svg>
            </div>
            <h2
              className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight animate-fade-in-up"
              style={{ color: isDarkMode ? "var(--text-primary)" : "#111827" }}
            >
              OOPS!
            </h2>
            <Typography
              variant="h6"
              className="text-lg sm:text-xl font-semibold mb-1 animate-fade-in-up"
              style={{ color: isDarkMode ? "var(--text-primary)" : "#374151" }}
              sx={{ letterSpacing: 1 }}
            >
              No Recipes Found
            </Typography>
            <Typography
              className="text-base sm:text-lg mb-6 animate-fade-in-up"
              style={{
                color: isDarkMode ? "var(--text-secondary)" : "#6b7280",
                maxWidth: 400,
                textAlign: "center",
              }}
            >
              How about digging into some of our most popular stuff instead?
            </Typography>
            <button
              className="mt-2 px-6 py-2 rounded-full bg-[#a21caf] text-white font-semibold shadow-md hover:bg-[#86198f] transition-all duration-200 animate-fade-in-up"
              onClick={() => {
                setAllRecipes([]);
                router.push(pathname);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Explore Popular Recipes
            </button>
            <style>
              {`
                  .animate-fade-in { animation: fadeIn 0.8s ease; }
                  .animate-fade-in-up { animation: fadeInUp 0.8s ease; }
                  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                  @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px);} to { opacity: 1; transform: none; } }
                `}
            </style>
          </div>
        )}
      </div>
      <Snackbar
        open={showShareToast}
        autoHideDuration={3000}
        onClose={() => setShowShareToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowShareToast(false)} severity="success" sx={{ width: '100%' }}>
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Result;
