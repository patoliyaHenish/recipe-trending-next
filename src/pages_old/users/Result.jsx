"use client";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Restaurant as RestaurantIcon,
  EmojiEvents as EmojiEventsIcon,
  AccessTime as AccessTimeIcon,
  Whatshot as WhatshotIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Speed as SpeedIcon,
  Egg as EggIcon,
  CheckRounded as CheckRoundedIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Checkbox,
  ListItemText,
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
  useGetCombinedSuggestionsQuery,
  useSearchRecipesQuery,
} from "../../features/api/searchApi";
import RecipeGridSkeleton from "../../components/common/RecipeGridSkeleton";
import RecipeCard from "../../components/common/RecipeCard";
import { useTheme } from "../../context/ThemeContext";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}
const getPreferenceIcon = (label) => {
  if (!label) return null;
  const text = label.toLowerCase();
  if (text.includes('veg') && !text.includes('non')) {
    return (
      <Box sx={{ width: 16, height: 16, border: '2px solid #43a047', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5 }}>
        <Box sx={{ width: 8, height: 8, bgcolor: '#43a047', borderRadius: '50%' }} />
      </Box>
    );
  }
  if (text.includes('egg')) {
    return <EggIcon sx={{ color: '#ffb300', fontSize: '1.2rem', mr: 1.5 }} />;
  }
  return null;
};

const Result = () => {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [isPreferenceMenuOpen, setIsPreferenceMenuOpen] = useState(false);
  const [isBadgeMenuOpen, setIsBadgeMenuOpen] = useState(false);
  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [executedSearchQuery, setExecutedSearchQuery] = useState(
    searchParams.get("q") || "",
  );
  const initialPreference = searchParams.get("preference") || Cookies.get('userPreference') || "";
  const [shouldSearch, setShouldSearch] = useState(!!(searchParams.get("q") || initialPreference || searchParams.get("categoryId") || searchParams.get("subCategoryId") || searchParams.get("recipeId") || searchParams.get("ingredientId") || searchParams.get("keywordId")));
  const [filters, setFilters] = useState({
    preference: initialPreference,
    badge: searchParams.get("badge") || "",
    timeRange: searchParams.get("timeRange") || "",
  });
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [allRecipes, setAllRecipes] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const processedDataRef = useRef(new Set());
  const scrollContainerRef = useRef();
  const closeOnScrollRafRef = useRef(null);
  const isMobile = useIsMobile();
  const searchBoxRef = useRef(null);
  const lastParamsRef = useRef("");
  const [showShareToast, setShowShareToast] = useState(false);
  const selectMenuProps = useMemo(
    () => ({
      disableScrollLock: true,
      transitionDuration: {
        enter: 140,
        exit: 220,
      },
      PaperProps: {
        sx: {
          mt: 1,
          bgcolor: isDarkMode ? "#0f172a" : "#ffffff",
          color: isDarkMode ? "#e5e7eb" : "#1f2937",
          border: isDarkMode
            ? "1px solid rgba(148, 163, 184, 0.2)"
            : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: isDarkMode
            ? "0 12px 30px rgba(0, 0, 0, 0.45)"
            : "0 12px 30px rgba(0, 0, 0, 0.12)",
          borderRadius: 2,
        },
      },
      MenuListProps: {
        sx: {
          py: 0.5,
          "& .MuiMenuItem-root": {
            borderRadius: 1.5,
            mx: 0.5,
            my: 0.25,
            fontWeight: 600,
            "&:hover": {
              bgcolor: isDarkMode
                ? "rgba(148, 163, 184, 0.12)"
                : "rgba(15, 23, 42, 0.06)",
            },
            "&.Mui-selected": {
              bgcolor: isDarkMode
                ? "rgba(56, 189, 248, 0.16)"
                : "rgba(14, 116, 144, 0.12)",
              "&:hover": {
                bgcolor: isDarkMode
                  ? "rgba(56, 189, 248, 0.22)"
                  : "rgba(14, 116, 144, 0.18)",
              },
            },
          },
        },
      },
    }),
    [isDarkMode]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const updateSearchParams = useCallback((newParams) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    const updatedParams = { ...currentParams, ...newParams };

    Object.keys(updatedParams).forEach((key) => {
      if (!updatedParams[key] || updatedParams[key] === "") {
        delete updatedParams[key];
      }
    });

    const urlParams = new URLSearchParams(updatedParams);
    router.push(`${pathname}?${urlParams.toString()}`);
  }, [searchParams, router, pathname]);

  const handleFilterChange = useCallback((key, value) => {
    if (key === 'preference') {
      if (value) {
        Cookies.set('userPreference', value, { expires: 365 });
      } else {
        Cookies.remove('userPreference');
      }
      window.dispatchEvent(new Event('userPreferenceChanged'));
    }
    setFilters(prev => {
      const nextFilters = { ...prev, [key]: value };
      updateSearchParams({ [key]: value, page: 1 });
      setPage(1);
      setAllRecipes([]);
      setHasMore(true);
      processedDataRef.current.clear();
      
      const hasAnyFilter = Object.values(nextFilters).some(v => v);
      const hasAnySelection = !!searchParams.get("categoryId") || !!searchParams.get("subCategoryId") || !!searchParams.get("recipeId") || !!searchParams.get("ingredientId") || !!searchParams.get("keywordId");
      setShouldSearch(!!(executedSearchQuery || hasAnyFilter || hasAnySelection));
      
      return nextFilters;
    });
  }, [searchParams, executedSearchQuery, updateSearchParams]);

  useEffect(() => {
    const handleCookieChange = () => {
      const cookiePref = Cookies.get('userPreference') || "";
      if (searchParams.get("preference") !== cookiePref) {
        handleFilterChange("preference", cookiePref);
      }
    };

    const initialCookie = Cookies.get('userPreference');
    if (initialCookie && !searchParams.get("preference")) {
        handleFilterChange("preference", initialCookie);
    }

    window.addEventListener('userPreferenceChanged', handleCookieChange);
    return () => window.removeEventListener('userPreferenceChanged', handleCookieChange);
  }, [searchParams, handleFilterChange]);

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
  }, [searchParams]);

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
      keyword: parseIds(searchParams.get("keywordId")),
    };
  }, [searchParams]);

  const searchParamsForApi = {
    q: (() => {
      const types = searchItemTypes;
      const items = searchItems;
      const ids = { ...selectionIds };
      
      const mutableIds = {
        recipe: [...(ids.recipe || [])],
        ingredient: [...(ids.ingredient || [])],
        category: [...(ids.category || [])],
        subCategory: [...(ids.subCategory || [])],
        keyword: [...(ids.keyword || [])]
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
        } else if (type === 'keyword' && mutableIds.keyword.length > 0) {
          mutableIds.keyword.shift();
          isIdBased = true;
        } else if (type === 'recipe' && mutableIds.recipe.length > 0) {
          mutableIds.recipe.shift();
          isIdBased = true;
        }

        if (!isIdBased) {
          textParts.push(item);
        }
      });

      return textParts.join(', ');
    })(),
    categoryId: searchParams.get("categoryId") || "",
    subCategoryId: searchParams.get("subCategoryId") || "",
    recipeId: searchParams.get("recipeId") || "",
    ingredientId: searchParams.get("ingredientId") || "",
    keywordId: searchParams.get("keywordId") || "",
    ...filters,
    page,
    limit: 12,
    sortBy: "created_at",
    sortOrder: "DESC",
  };

  const {
    data: searchData,
    isLoading: searchLoading,
    error: searchError,
  } = useSearchRecipesQuery(searchParamsForApi, {
    skip: !shouldSearch,
    refetchOnMountOrArgChange: true,
  });

  const { data: suggestionsDataRaw } = useGetCombinedSuggestionsQuery(
    debouncedSearchQuery,
    {
      skip:
        debouncedSearchQuery.length === 0 || debouncedSearchQuery.length < 1,
    },
  );

  const combinedSuggestions = suggestionsDataRaw || [];

  const shouldShowSuggestions =
    searchQuery.length > 0 &&
    combinedSuggestions &&
    combinedSuggestions.length > 0;

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

  const searchItemTypeMap = useMemo(() => {
    const map = new Map();
    (combinedSuggestions || []).forEach((suggestion) => {
      const label = (
        suggestion.displayText ||
        suggestion.text ||
        suggestion.name ||
        ""
      )
        .trim()
        .toLowerCase();
      if (label) {
        map.set(label, suggestion.type || "recipe");
      }
    });
    return map;
  }, [combinedSuggestions]);

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
    const nextKeywordIds = [...selectionIds.keyword];

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
    if (typeToRemove === "keyword" && nextKeywordIds.length > 0) {
        const removeIndex = getTypeIndex(
          searchItemTypes,
          indexToRemove,
          "keyword",
        );
        nextKeywordIds.splice(removeIndex, 1);
      }

    if (remainingItems.length > 0) {
      const newQuery = remainingItems.join(", ");
      const newTypes = remainingTypes.join(", ");
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
      if (nextKeywordIds.length > 0)
        params.set("keywordId", nextKeywordIds.join(","));
      router.push(`/result?${params.toString()}`);
    } else {
      router.push("/");
    }
  };

  const handleLoadMore = () => {
    if (!searchLoading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (searchData && searchData.pagination?.currentPage === page) {
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
          const existingIds = new Set(prev.map((recipe) => recipe.id));
          const newRecipes = searchData.recipes || [];
          const uniqueNewRecipes = newRecipes.filter(
            (recipe) => !existingIds.has(recipe.id),
          );
          const combinedRecipes = [...prev, ...uniqueNewRecipes];
          return combinedRecipes;
        });
      }
      const hasMorePages =
        searchData.pagination?.currentPage < searchData.pagination?.totalPages;
      setHasMore(hasMorePages);
    }
  }, [searchData, page]);

  const handleSearch = (query, type = 'recipe', id = null) => {
    if (query.trim()) {
      const currentQuery = executedSearchQuery ? executedSearchQuery + ', ' + query : query;
      const currentTypes = searchParams.get("t") ? searchParams.get("t") + ',' + type : type;
      
      const newParams = { q: currentQuery, t: currentTypes, openSearch: "0", page: 1 };

      if (id) {
        if (type === 'ingredient') {
            const currentIds = (searchParams.get("ingredientId") || '').split(',').filter(Boolean);
            if (!currentIds.includes(String(id))) currentIds.push(String(id));
            newParams.ingredientId = currentIds.join(',');
        } else if (type === 'category') {
            const currentIds = (searchParams.get("categoryId") || '').split(',').filter(Boolean);
            if (!currentIds.includes(String(id))) currentIds.push(String(id));
            newParams.categoryId = currentIds.join(',');
        } else if (type === 'subCategory') {
            const currentIds = (searchParams.get("subCategoryId") || '').split(',').filter(Boolean);
            if (!currentIds.includes(String(id))) currentIds.push(String(id));
            newParams.subCategoryId = currentIds.join(',');
        } else if (type === 'recipe') {
             const currentIds = (searchParams.get("recipeId") || '').split(',').filter(Boolean);
             if (!currentIds.includes(String(id))) currentIds.push(String(id));
             newParams.recipeId = currentIds.join(',');
        } else if (type === 'keyword') {
             const currentIds = (searchParams.get("keywordId") || '').split(',').filter(Boolean);
             if (!currentIds.includes(String(id))) currentIds.push(String(id));
             newParams.keywordId = currentIds.join(',');
        }
      }

      setSearchQuery(query);
      setExecutedSearchQuery(currentQuery);
      setShouldSearch(true);
      setPage(1);
      setAllRecipes([]);
      setHasMore(true);
      updateSearchParams(newParams);
      setShowSuggestionsDropdown(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setExecutedSearchQuery("");
    setShouldSearch(false);
    setPage(1);
    setAllRecipes([]);
    setHasMore(true);
    setFilters({
      preference: "",
      badge: "",
      timeRange: "",
    });
    router.push(pathname);
    setShowSuggestionsDropdown(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch(searchQuery, 'recipe');
    }
  };

  useEffect(() => {
    const query = searchParams.get("q");
    const preference = searchParams.get("preference");
    const badge = searchParams.get("badge");
    const timeRange = searchParams.get("timeRange");
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const recipeId = searchParams.get("recipeId");
    const ingredientId = searchParams.get("ingredientId");
    const keywordId = searchParams.get("keywordId");
    const pageParam = searchParams.get("page");
    const hasAnySelection = !!categoryId || !!subCategoryId || !!recipeId || !!ingredientId || !!keywordId;
    const hasAnyFilterParam = !!(preference || badge || timeRange || filters.preference);

    const currentParamsObj = {
      q: query || "",
      preference: preference || "",
      badge: badge || "",
      timeRange: timeRange || "",
      categoryId: categoryId || "",
      subCategoryId: subCategoryId || "",
      recipeId: recipeId || "",
      ingredientId: ingredientId || "",
      keywordId: keywordId || ""
    };
    const currentParamsStr = JSON.stringify(currentParamsObj);

    
    if (currentParamsStr !== lastParamsRef.current) {
      lastParamsRef.current = currentParamsStr;
      
      setExecutedSearchQuery(query || "");
      setShouldSearch(!!query || hasAnySelection || hasAnyFilterParam);
      setPage(1);
      setAllRecipes([]);
      setHasMore(true);
      processedDataRef.current.clear();
    }

    setFilters((prev) => {
      const newFilters = {
        preference: preference || "",
        badge: badge || "",
        timeRange: timeRange || "",
      };

      const hasAnyFilter = Object.values(newFilters).some((value) => value);
      if (shouldSearch !== (!!query || hasAnyFilter || hasAnySelection)) {
        setShouldSearch(!!query || hasAnyFilter || hasAnySelection);
      }

      if (JSON.stringify(prev) !== JSON.stringify(newFilters)) {
        return newFilters;
      }
      return prev;
    });

    const newPage = pageParam ? parseInt(pageParam) : 1;
    if (newPage !== page) setPage(newPage);
  }, [searchParams, searchQuery, executedSearchQuery, shouldSearch]);

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target)
      ) {
        setShowSuggestionsDropdown(false);
      }
    }
    if (showSuggestionsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestionsDropdown]);

  const handleInputFocus = () => {
    if (shouldShowSuggestions) {
      setShowSuggestionsDropdown(true);
    }
  };

  const closeFilterMenus = useCallback(() => {
    setIsPreferenceMenuOpen(false);
    setIsBadgeMenuOpen(false);
    setIsTimeMenuOpen(false);
  }, []);

  useEffect(() => {
    const handleScrollCloseMenus = () => {
      if (!isPreferenceMenuOpen && !isBadgeMenuOpen && !isTimeMenuOpen) return;
      if (closeOnScrollRafRef.current) return;

      closeOnScrollRafRef.current = window.requestAnimationFrame(() => {
        closeFilterMenus();
        closeOnScrollRafRef.current = null;
      });
    };

    window.addEventListener("scroll", handleScrollCloseMenus, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScrollCloseMenus);
      if (closeOnScrollRafRef.current) {
        window.cancelAnimationFrame(closeOnScrollRafRef.current);
        closeOnScrollRafRef.current = null;
      }
    };
  }, [closeFilterMenus, isPreferenceMenuOpen, isBadgeMenuOpen, isTimeMenuOpen]);

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
          {!executedSearchQuery && (
            <div
              className="relative max-w-2xl mx-auto w-full"
              ref={searchBoxRef}
            >
              <div
                className={`flex items-center gap-2 ${isMobile ? "flex-col" : "flex-row"}`}
              >
                <div
                  className={`flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-full shadow-sm focus-within:ring-2 focus-within:ring-[#a21caf] transition hover:shadow-md ${
                    isMobile ? "px-3 py-3 h-12 w-full" : "px-4 py-2 flex-1"
                  }`}
                  style={{ minHeight: isMobile ? "48px" : "auto" }}
                >
                  <SearchIcon
                    className={`text-gray-400 dark:text-gray-300 flex-shrink-0 ${isMobile ? "mr-3" : "mr-2"}`}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (
                        e.target.value.length > 0 &&
                        combinedSuggestions &&
                        combinedSuggestions.length > 0
                      ) {
                        setShowSuggestionsDropdown(true);
                      } else {
                        setShowSuggestionsDropdown(false);
                      }
                    }}
                    onFocus={handleInputFocus}
                    onKeyPress={handleKeyPress}
                    placeholder="I want to make..."
                    className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 text-base"
                    style={{
                      fontSize: "16px",
                      height: isMobile ? "24px" : "auto",
                      lineHeight: isMobile ? "24px" : "normal",
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0 ${
                        isMobile ? "ml-3 p-1" : "ml-2"
                      }`}
                      style={{
                        width: isMobile ? "32px" : "auto",
                        height: isMobile ? "32px" : "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span className="text-lg">×</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleSearch(searchQuery, 'recipe')}
                  disabled={!searchQuery.trim()}
                  className={`flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    isMobile ? "w-full px-6 py-3 h-12" : "px-6 py-2.5"
                  }`}
                  style={{
                    backgroundColor: searchQuery.trim() ? "#a21caf" : "#d1d5db",
                    color: "#ffffff",
                    minWidth: isMobile ? "auto" : "120px",
                  }}
                >
                  <span className={isMobile ? "text-base" : "text-sm"}>
                    Search
                  </span>
                </button>
              </div>

              {showSuggestionsDropdown && shouldShowSuggestions && (
                <div
                  className={`absolute mt-2 w-full rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-sm ${
                    isMobile ? "max-h-80 overflow-y-auto" : ""
                  }`}
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(17, 24, 39, 0.95)"
                      : "rgba(255, 255, 255, 0.95)",
                    border: isDarkMode
                      ? "1px solid rgba(75, 85, 99, 0.3)"
                      : "1px solid rgba(229, 231, 235, 0.5)",
                    boxShadow: isDarkMode
                      ? "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
                      : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  {combinedSuggestions
                    .slice(0, isMobile ? 6 : 10)
                    .map((s, i) => {
                      const getBadgeLabel = (type) => {
                        switch (type) {
                          case 'ingredient': return 'Ingredient';
                          case 'category': return 'Category';
                          case 'subCategory': return 'Sub-Cat';
                          case 'keyword': return 'Keyword';
                          default: 
                            return `Recipe`; 
                        }
                      };

                      const getBadgeStyle = (type, isDark) => {
                        switch (type) {
                          case 'ingredient':
                            return {
                              bg: isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.1)",
                              color: isDark ? "#6ee7b7" : "#10b981",
                              border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(16, 185, 129, 0.2)"
                            };
                          case 'category':
                            return {
                              bg: isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)",
                              color: isDark ? "#a78bfa" : "#8b5cf6",
                              border: isDark ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(139, 92, 246, 0.2)"
                            };
                          case 'subCategory':
                            return {
                              bg: isDark ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.1)",
                              color: isDark ? "#fbbf24" : "#f59e0b",
                              border: isDark ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(245, 158, 11, 0.2)"
                            };
                          case 'keyword':
                            return {
                              bg: isDark ? "rgba(236, 72, 153, 0.2)" : "rgba(236, 72, 153, 0.1)",
                              color: isDark ? "#f472b6" : "#db2777",
                              border: isDark ? "1px solid rgba(236, 72, 153, 0.3)" : "1px solid rgba(236, 72, 153, 0.2)"
                            };
                          default:
                            return {
                              bg: isDark ? "rgba(202, 96, 20, 0.2)" : "rgba(202, 96, 20, 0.1)",
                              color: isDark ? "#fb923c" : "#ca6014",
                              border: isDark ? "1px solid rgba(202, 96, 20, 0.3)" : "1px solid rgba(202, 96, 20, 0.2)"
                            };
                        }
                      };

                      const badgeStyle = getBadgeStyle(s.type, isDarkMode);

                      return (
                      <div
                        key={`${s.type}-${i}`}
                        onClick={() =>
                          handleSearch(s.displayText || s.text || s.name, s.type, s.id)
                        }
                        className={`px-4 cursor-pointer transition-all duration-200 flex items-center gap-3 group ${
                          isMobile ? "py-4 min-h-[48px]" : "py-3"
                        }`}
                        style={{
                          backgroundColor: "transparent",
                          borderBottom:
                            i <
                            combinedSuggestions.slice(0, isMobile ? 6 : 10)
                              .length -
                              1
                              ? isDarkMode
                                ? "1px solid rgba(75, 85, 99, 0.2)"
                                : "1px solid rgba(229, 231, 235, 0.5)"
                              : "none",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = isDarkMode
                            ? "rgba(55, 65, 81, 0.8)"
                            : "rgba(249, 250, 251, 0.8)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                        }}
                      >
                        {s.image && s.type === "recipe" && (
                          <div
                            className={`flex-shrink-0 rounded-lg overflow-hidden ring-2 ring-transparent group-hover:ring-purple-200 dark:group-hover:ring-purple-800 transition-all duration-200 ${
                              isMobile ? "w-10 h-10" : "w-12 h-12"
                            }`}
                          >
                            <img
                              src={
                                s.image ||
                                "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop"
                              }
                              alt={s.displayText}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        )}
                        <div className="flex-1 flex justify-between items-center">
                          <span
                            className={`font-medium transition-colors duration-200 ${
                              isMobile ? "text-base" : "text-sm"
                            }`}
                            style={{
                              color: isDarkMode ? "#f3f4f6" : "#374151",
                            }}
                          >
                            {s.displayText || s.text || s.name}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full font-medium transition-all duration-200 text-xs`}
                            style={{
                              backgroundColor: badgeStyle.bg,
                              color: badgeStyle.color,
                              border: badgeStyle.border,
                            }}
                          >
                            {getBadgeLabel(s.type)}
                          </span>
                        </div>
                      </div>
                    )})}
                </div>
              )}
            </div>
          )}
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
                        bgcolor:
                          itemType === "ingredient"
                            ? isDarkMode
                              ? "rgba(16, 185, 129, 0.15)"
                              : "rgba(16, 185, 129, 0.1)"
                            : itemType === "category"
                              ? isDarkMode
                                ? "rgba(139, 92, 246, 0.15)"
                                : "rgba(139, 92, 246, 0.1)"
                              : itemType === "subCategory"
                                ? isDarkMode
                                  ? "rgba(245, 158, 11, 0.15)"
                                  : "rgba(245, 158, 11, 0.1)"
                                : itemType === "keyword"
                                  ? isDarkMode
                                    ? "rgba(236, 72, 153, 0.15)"
                                    : "rgba(236, 72, 153, 0.1)"
                                  : isDarkMode
                                    ? "rgba(202, 96, 20, 0.15)"
                                    : "rgba(202, 96, 20, 0.1)",
                        border:
                          itemType === "ingredient"
                            ? isDarkMode
                              ? "1px solid rgba(16, 185, 129, 0.4)"
                              : "1px solid rgba(16, 185, 129, 0.3)"
                            : itemType === "category"
                              ? isDarkMode
                                ? "1px solid rgba(139, 92, 246, 0.4)"
                                : "1px solid rgba(139, 92, 246, 0.3)"
                              : itemType === "subCategory"
                                ? isDarkMode
                                  ? "1px solid rgba(245, 158, 11, 0.4)"
                                  : "1px solid rgba(245, 158, 11, 0.3)"
                                : itemType === "keyword"
                                  ? isDarkMode
                                    ? "1px solid rgba(236, 72, 153, 0.4)"
                                    : "1px solid rgba(236, 72, 153, 0.3)"
                                  : isDarkMode
                                    ? "1px solid rgba(202, 96, 20, 0.4)"
                                    : "1px solid rgba(202, 96, 20, 0.3)",
                        color:
                          itemType === "ingredient"
                            ? isDarkMode
                              ? "#6ee7b7"
                              : "#10b981"
                            : itemType === "category"
                              ? isDarkMode
                                ? "#a78bfa"
                                : "#8b5cf6"
                              : itemType === "subCategory"
                                ? isDarkMode
                                  ? "#fbbf24"
                                  : "#f59e0b"
                                : itemType === "keyword"
                                  ? isDarkMode
                                    ? "#f472b6"
                                    : "#db2777"
                                : isDarkMode
                                  ? "#fb923c"
                                  : "#ca6014",
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        fontWeight: 500,
                        fontFamily: "'Basic', sans-serif !important",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          bgcolor:
                            itemType === "ingredient"
                              ? isDarkMode
                                ? "rgba(16, 185, 129, 0.25)"
                                : "rgba(16, 185, 129, 0.15)"
                              : itemType === "category"
                                ? isDarkMode
                                  ? "rgba(139, 92, 246, 0.25)"
                                  : "rgba(139, 92, 246, 0.15)"
                                : itemType === "subCategory"
                                  ? isDarkMode
                                    ? "rgba(245, 158, 11, 0.25)"
                                    : "rgba(245, 158, 11, 0.15)"
                                  : itemType === "keyword"
                                    ? isDarkMode
                                      ? "rgba(236, 72, 153, 0.25)"
                                      : "rgba(236, 72, 153, 0.15)"
                                    : isDarkMode
                                      ? "rgba(202, 96, 20, 0.25)"
                                      : "rgba(202, 96, 20, 0.15)",
                        },
                      }}
                    >
                      <span>{item}</span>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveSearchItem(index)}
                        sx={{
                          p: 0,
                          color: "inherit",
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
        {searchData && (
          <div className="mb-6 sm:mb-6 md:mb-8">
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2.5,
                mb: 3,
              }}
            >
              <FormControl
                size="small"
                sx={{
                  minWidth: { xs: "calc(50% - 10px)", sm: 180 },
                  flex: { xs: "1 1 calc(50% - 10px)", sm: "0 0 auto" },
                  "& .MuiInputLabel-root": {
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    fontWeight: 600,
                    letterSpacing: "0.3px",
                  },
                }}
              >
                <InputLabel
                  id="filter-preference-label"
                  shrink
                  sx={{
                    color: isDarkMode ? "#10b981" : "#059669",
                    "&.Mui-focused": {
                      color: isDarkMode ? "#34d399" : "#047857",
                    },
                  }}
                >
                  Preference
                </InputLabel>
                <Select
                  label="Preference"
                  open={isPreferenceMenuOpen}
                  onOpen={() => setIsPreferenceMenuOpen(true)}
                  onClose={() => setIsPreferenceMenuOpen(false)}
                  sx={{
                    borderRadius: 2.5,
                    bgcolor: isDarkMode
                      ? "rgba(16, 185, 129, 0.08)"
                      : "rgba(16, 185, 129, 0.05)",
                    color: isDarkMode ? "#e5e7eb" : "#1f2937",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderWidth: 2,
                      borderColor: isDarkMode
                        ? "rgba(16, 185, 129, 0.3)"
                        : "rgba(16, 185, 129, 0.25)",
                    },
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? "rgba(16, 185, 129, 0.12)"
                        : "rgba(16, 185, 129, 0.08)",
                      transform: "translateY(-1px)",
                      boxShadow: isDarkMode
                        ? "0 4px 12px rgba(16, 185, 129, 0.15)"
                        : "0 4px 12px rgba(16, 185, 129, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: isDarkMode
                        ? "rgba(16, 185, 129, 0.5)"
                        : "rgba(16, 185, 129, 0.4)",
                    },
                    "&.Mui-focused": {
                      bgcolor: isDarkMode
                        ? "rgba(16, 185, 129, 0.15)"
                        : "rgba(16, 185, 129, 0.1)",
                      boxShadow: isDarkMode
                        ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
                        : "0 0 0 3px rgba(16, 185, 129, 0.1)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: isDarkMode ? "#10b981" : "#059669",
                    },
                    "& .MuiSvgIcon-root": {
                      color: isDarkMode ? "#10b981" : "#059669",
                    },
                    "& .MuiSelect-select": {
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    },
                  }}
                  multiple
                  displayEmpty
                  value={filters.preference ? filters.preference.split(",") : []}
                  renderValue={(selected) => {
                    if (selected.length === 0 || selected.length === 2) {
                      return <Box sx={{ opacity: 0.9, fontWeight: 600 }}>All</Box>;
                    }
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        {selected.map((val) => (
                          <Box key={val} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span style={{ textTransform: 'capitalize', fontSize: '0.95rem', fontWeight: 600 }}>{val.replace('_', ' ')}</span>
                          </Box>
                        ))}
                      </Box>
                    );
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    const newValue = typeof value === "string" ? value.split(",") : value;
                    const hasAll = newValue.includes("");
                    const cleanValues = newValue.filter(v => v !== "");
                    
                    if (hasAll || cleanValues.length === 2 || cleanValues.length === 0) {
                      handleFilterChange("preference", "");
                    } else {
                      handleFilterChange("preference", cleanValues.join(","));
                    }
                  }}
                  MenuProps={selectMenuProps}
                >
                  <MenuItem value="">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', py: 0.5 }}>
                      <ListItemText primary="All" sx={{ '& .MuiTypography-root': { fontWeight: 600 } }} />
                      {!filters.preference && <CheckRoundedIcon sx={{ fontSize: '1.2rem', color: isDarkMode ? '#10b981' : '#059669' }} />}
                    </Box>
                  </MenuItem>
                  <MenuItem value="veg">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', py: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getPreferenceIcon("Veg")}
                        <ListItemText primary="Veg" sx={{ '& .MuiTypography-root': { fontWeight: 600 } }} />
                      </Box>
                      {filters.preference.split(",").includes("veg") && (
                        <CheckRoundedIcon sx={{ fontSize: '1.2rem', color: isDarkMode ? '#10b981' : '#059669' }} />
                      )}
                    </Box>
                  </MenuItem>
                  <MenuItem value="egg">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', py: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getPreferenceIcon("Egg")}
                        <ListItemText primary="Egg" sx={{ '& .MuiTypography-root': { fontWeight: 600 } }} />
                      </Box>
                      {filters.preference.split(",").includes("egg") && (
                        <CheckRoundedIcon sx={{ fontSize: '1.2rem', color: isDarkMode ? '#10b981' : '#059669' }} />
                      )}
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{
                  minWidth: { xs: "calc(50% - 10px)", sm: 160 },
                  flex: { xs: "1 1 calc(50% - 10px)", sm: "0 0 auto" },
                  "& .MuiInputLabel-root": {
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    fontWeight: 600,
                    letterSpacing: "0.3px",
                  },
                }}
              >
                <InputLabel
                  id="filter-badge-label"
                  shrink
                  sx={{
                    color: isDarkMode ? "#a78bfa" : "#8b5cf6",
                    "&.Mui-focused": {
                      color: isDarkMode ? "#c4b5fd" : "#7c3aed",
                    },
                  }}
                >
                  Badge
                </InputLabel>
                <Select
                  labelId="filter-badge-label"
                  displayEmpty
                  open={isBadgeMenuOpen}
                  onOpen={() => setIsBadgeMenuOpen(true)}
                  onClose={() => setIsBadgeMenuOpen(false)}
                  value={filters.badge}
                  label="Badge"
                  renderValue={(value) => {
                    if (value === "") return <Box sx={{ opacity: 0.9, fontWeight: 600 }}>All</Box>;
                    return <Box sx={{ fontWeight: 600 }}>{value}</Box>;
                  }}
                  onChange={(e) => handleFilterChange("badge", e.target.value)}
                  MenuProps={selectMenuProps}
                  sx={{
                    borderRadius: 2.5,
                    bgcolor: isDarkMode
                      ? "rgba(139, 92, 246, 0.08)"
                      : "rgba(139, 92, 246, 0.05)",
                    color: isDarkMode ? "#e5e7eb" : "#1f2937",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderWidth: 2,
                      borderColor: isDarkMode
                        ? "rgba(139, 92, 246, 0.3)"
                        : "rgba(139, 92, 246, 0.25)",
                    },
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? "rgba(139, 92, 246, 0.12)"
                        : "rgba(139, 92, 246, 0.08)",
                      transform: "translateY(-1px)",
                      boxShadow: isDarkMode
                        ? "0 4px 12px rgba(139, 92, 246, 0.15)"
                        : "0 4px 12px rgba(139, 92, 246, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: isDarkMode
                        ? "rgba(139, 92, 246, 0.5)"
                        : "rgba(139, 92, 246, 0.4)",
                    },
                    "&.Mui-focused": {
                      bgcolor: isDarkMode
                        ? "rgba(139, 92, 246, 0.15)"
                        : "rgba(139, 92, 246, 0.1)",
                      boxShadow: isDarkMode
                        ? "0 0 0 3px rgba(139, 92, 246, 0.15)"
                        : "0 0 0 3px rgba(139, 92, 246, 0.1)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: isDarkMode ? "#a78bfa" : "#8b5cf6",
                    },
                    "& .MuiSvgIcon-root": {
                      color: isDarkMode ? "#a78bfa" : "#8b5cf6",
                    },
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Popular">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <WhatshotIcon sx={{ fontSize: 20, color: "#ef4444" }} />
                      <span>Popular</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Quick">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <SpeedIcon sx={{ fontSize: 20, color: "#f59e0b" }} />
                      <span>Quick</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Beginner">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <SchoolIcon sx={{ fontSize: 20, color: "#10b981" }} />
                      <span>Beginner</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Trending">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TrendingUpIcon sx={{ fontSize: 20, color: "#3b82f6" }} />
                      <span>Trending</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{
                  minWidth: { xs: "100%", sm: 170 },
                  flex: { xs: "1 1 100%", sm: "0 0 auto" },
                  "& .MuiInputLabel-root": {
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    fontWeight: 600,
                    letterSpacing: "0.3px",
                  },
                }}
              >
                <InputLabel
                  id="filter-time-label"
                  shrink
                  sx={{
                    color: isDarkMode ? "#fbbf24" : "#f59e0b",
                    "&.Mui-focused": {
                      color: isDarkMode ? "#fde68a" : "#d97706",
                    },
                  }}
                >
                  Time
                </InputLabel>
                <Select
                  labelId="filter-time-label"
                  displayEmpty
                  open={isTimeMenuOpen}
                  onOpen={() => setIsTimeMenuOpen(true)}
                  onClose={() => setIsTimeMenuOpen(false)}
                  value={filters.timeRange}
                  label="Time"
                  renderValue={(value) => {
                    if (value === "") return <Box sx={{ opacity: 0.9, fontWeight: 600 }}>All</Box>;
                    const timeMap = {
                      'under-30': 'Under 30 min',
                      '30-60': '30-60 min',
                      '60-plus': '60+ min',
                    };
                    return <Box sx={{ fontWeight: 600 }}>{timeMap[value] || value}</Box>;
                  }}
                  onChange={(e) =>
                    handleFilterChange("timeRange", e.target.value)
                  }
                  MenuProps={selectMenuProps}
                  sx={{
                    borderRadius: 2.5,
                    bgcolor: isDarkMode
                      ? "rgba(245, 158, 11, 0.08)"
                      : "rgba(245, 158, 11, 0.05)",
                    color: isDarkMode ? "#e5e7eb" : "#1f2937",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderWidth: 2,
                      borderColor: isDarkMode
                        ? "rgba(245, 158, 11, 0.3)"
                        : "rgba(245, 158, 11, 0.25)",
                    },
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? "rgba(245, 158, 11, 0.12)"
                        : "rgba(245, 158, 11, 0.08)",
                      transform: "translateY(-1px)",
                      boxShadow: isDarkMode
                        ? "0 4px 12px rgba(245, 158, 11, 0.15)"
                        : "0 4px 12px rgba(245, 158, 11, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: isDarkMode
                        ? "rgba(245, 158, 11, 0.5)"
                        : "rgba(245, 158, 11, 0.4)",
                    },
                    "&.Mui-focused": {
                      bgcolor: isDarkMode
                        ? "rgba(245, 158, 11, 0.15)"
                        : "rgba(245, 158, 11, 0.1)",
                      boxShadow: isDarkMode
                        ? "0 0 0 3px rgba(245, 158, 11, 0.15)"
                        : "0 0 0 3px rgba(245, 158, 11, 0.1)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: isDarkMode ? "#fbbf24" : "#f59e0b",
                    },
                    "& .MuiSvgIcon-root": {
                      color: isDarkMode ? "#fbbf24" : "#f59e0b",
                    },
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="under-30">⏱️ Under 30 min</MenuItem>
                  <MenuItem value="30-60">⏰ 30-60 min</MenuItem>
                  <MenuItem value="60-plus">🕐 60+ min</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <h3
              className="text-xl sm:text-3xl md:text-4xl font-bold"
              style={{ color: isDarkMode ? "var(--text-primary)" : "#1E1E1E" }}
            >
              {searchData.pagination.totalCount.toLocaleString()} RESULTS
            </h3>
          </div>
        )}
        {searchLoading && allRecipes.length === 0 && (
          <div className="py-8 sm:py-12">
            <RecipeGridSkeleton count={8} />
          </div>
        )}
        {searchError && (
          <Alert severity="error" className="mb-6 sm:mb-8">
            Failed to load search results. Please try again.
          </Alert>
        )}
        {(searchData && searchData.recipes && searchData.recipes.length > 0) || (allRecipes && allRecipes.length > 0) ? (
          <>
            <div
              ref={scrollContainerRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
            >
              {allRecipes.map((recipe, index) => {
                const normalizedRecipe = {
                  ...recipe,
                  recipe_id: recipe.recipe_id || recipe.id,
                  title: recipe.title || recipe.name,
                };
                return (
                  <div
                    key={normalizedRecipe.recipe_id || index}
                    className="h-full"
                  >
                    <RecipeCard recipe={normalizedRecipe} mobileLayout="vertical" hideVideoIcon />
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 5, md: 7 }, mb: 4 }}>
                <Button
                  variant="contained"
                  onClick={handleLoadMore}
                  disabled={searchLoading}
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
                    cursor: searchLoading ? 'not-allowed' : 'pointer',
                    opacity: searchLoading ? 0.7 : 1,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isDarkMode ? 'none' : '0 4px 14px rgba(202, 96, 20, 0.15)',
                    '&:hover': {
                      bgcolor: searchLoading ? undefined : '#CA6014',
                      color: searchLoading ? undefined : '#fff',
                      transform: searchLoading ? 'none' : 'translateY(-2px)',
                      boxShadow: searchLoading ? 'none' : '0 6px 20px rgba(202, 96, 20, 0.25)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    }
                  }}
                >
                  {searchLoading ? (
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
          </>
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
                setSearchQuery("");
                setPage(1);
                setAllRecipes([]);
                setHasMore(true);
                setFilters({
                  category: "",
                  subCategory: "",
                  prepTime: null,
                  cookTime: null,
                  servingSize: null,
                });
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
