"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Typography, Skeleton, Grid, CircularProgress, IconButton, Tooltip, Button } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RecipeCard from '../../components/common/RecipeCard';
import RecipeGridSkeleton from '../../components/common/RecipeGridSkeleton';
import LoadMoreButton from '../../components/common/LoadMoreButton';
import { useGetCategoryPageQuery, useGetSubCategoryPageQuery } from '../../features/api/recipeDetailsApi';
import { useTheme } from '../../context/ThemeContext';
import { getImage } from '../../utils/helper';
import noImageFound from '../../assets/no-image-found.png';
import Cookies from 'js-cookie';
import useTrackEngagement from '../../hooks/useTrackEngagement';
import { trackEvent } from '../../utils/analytics';
import { toast } from '../../utils/toast';
import { AdsterraBanner728x90, AdsterraBanner300x250, AdsterraBanner320x50, AdsterraNativeBanner } from '../../components/ads';

const RECIPES_PER_PAGE = 12;

const normalizePreferenceValue = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item).trim())
      .filter(item => item && item.toLowerCase() !== 'all')
      .join(',');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed && trimmed.toLowerCase() !== 'all' ? trimmed : '';
  }

  return '';
};

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

const CategoryPage = ({ categorySlug: propCategorySlug, subCategorySlug: propSubCategorySlug, initialData, initialPreference = '' }) => {
  const categorySlug = propCategorySlug;
  const subCategorySlug = propSubCategorySlug;
  const { isDarkMode } = useTheme();
  const [userPreference, setUserPreference] = useState(() => normalizePreferenceValue(initialPreference));
  const [isPreferenceChanged, setIsPreferenceChanged] = useState(false);
  const [page, setPage] = useState(1);
  
  // Initialize with initialData
  const initialPageData = initialData?.data;
  const [allRecipes, setAllRecipes] = useState(initialPageData?.recipes || []);
  const [hasMore, setHasMore] = useState(initialPageData?.pagination ? initialPageData.pagination.currentPage < initialPageData.pagination.totalPages : true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [headerData, setHeaderData] = useState({
    category: initialPageData?.category,
    subCategory: initialPageData?.subCategory,
    subCategories: initialPageData?.subCategories,
    type: initialPageData?.type
  });
  
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const hasMountedRef = useRef(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shortDesc = (pageData?.meta_description || pageData?.description || "").replace(/^"|"$/g, '').trim();
    const truncatedDesc = shortDesc.length > 160 ? shortDesc.substring(0, 157) + "..." : shortDesc;
    const shareData = {
      title: pageTitle,
      text: truncatedDesc,
      url,
    };

    try {
      if (navigator.share) {
        const firstImage = allRecipes?.[0]?.image;
        const imgUrl = firstImage ? getImage(firstImage) : null;
        if (imgUrl) {
          try {
            const response = await fetch(imgUrl, { mode: 'cors' });
            if (response.ok) {
              const blob = await response.blob();
              const ext = blob.type.split('/')[1] || 'jpg';
              const file = new File([blob], `category-${pageTitle}.${ext}`, { type: blob.type });
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                shareData.files = [file];
              }
            }
          } catch (err) {
            console.warn("Category image share failed:", err);
          }
        }
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Error sharing:", err);
      }
    }
  };

  useEffect(() => {
    // If client cookie differs from server cookie on mount, mark as changed
    const clientPref = normalizePreferenceValue(Cookies.get('userPreference') || '');
    if (clientPref !== normalizePreferenceValue(initialPreference)) {
      setUserPreference(clientPref);
      setIsPreferenceChanged(true);
    }
    
    const handler = () => {
      setUserPreference(normalizePreferenceValue(Cookies.get('userPreference') || ''));
      setIsPreferenceChanged(true);
    };
    window.addEventListener('userPreferenceChanged', handler);
    return () => window.removeEventListener('userPreferenceChanged', handler);
  }, [initialPreference]);

  useEffect(() => {
    // Skip the first mount — the component remounts via key prop on slug change,
    // so we only need this for edge-case client-side navigation without remount.
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setPage(1);
    setAllRecipes([]);
    setHasMore(true);
    setIsPreferenceChanged(false);
  }, [categorySlug, subCategorySlug]);

  const isSubCategoryView = !!subCategorySlug;

  // For CATEGORY pages: skip client API only if SSR already returned recipes or sub-category lists.
  // For SUB-CATEGORY pages: ALWAYS call the client API — SSR only provides the header metadata,
  // the recipe list must be fetched client-side so it respects saved-state, auth, and is fresh.
  const ssrHasRecipes = Array.isArray(initialPageData?.recipes) && initialPageData.recipes.length > 0;
  const ssrHasSubCategories = initialPageData?.type === 'sub_categories' && Array.isArray(initialPageData?.subCategories) && initialPageData.subCategories.length > 0;
  const skipQuery = !isSubCategoryView && page === 1 && !isPreferenceChanged && (ssrHasRecipes || ssrHasSubCategories);

  const {
    data: categoryData,
    isLoading: isCategoryLoading,
    isFetching: isCategoryFetching,
    isError: isCategoryError,
    refetch: refetchCategory,
  } = useGetCategoryPageQuery(
    { slug: categorySlug, page, limit: RECIPES_PER_PAGE, preference: userPreference },
    { skip: isSubCategoryView || skipQuery }
  );

  const {
    data: subCategoryData,
    isLoading: isSubCategoryLoading,
    isFetching: isSubCategoryFetching,
    isError: isSubCategoryError,
    refetch: refetchSubCategory,
  } = useGetSubCategoryPageQuery(
    { slug: subCategorySlug, page, limit: RECIPES_PER_PAGE, preference: userPreference },
    { skip: !isSubCategoryView }  // Always fetch for sub-category pages
  );

  const isLoading = isSubCategoryView
    ? isSubCategoryLoading
    : (skipQuery ? false : isCategoryLoading);
  const isFetching = isSubCategoryView
    ? isSubCategoryFetching
    : (skipQuery ? false : isCategoryFetching);
  const isError = isSubCategoryView
    ? isSubCategoryError
    : (skipQuery ? !initialData : isCategoryError);

  // For sub-category: use live RTK Query data; for category with SSR: use SSR data when query is skipped
  const responseData = isSubCategoryView
    ? subCategoryData
    : (skipQuery ? initialData : categoryData);

  const isInitialLoading = (isLoading || isFetching) && allRecipes.length === 0 && page === 1;

  const pageData = responseData?.data || initialPageData;
  const showSubCategories = !isSubCategoryView && pageData?.type === 'sub_categories';
  const showRecipes = pageData?.type === 'recipes' || (!isInitialLoading && allRecipes.length > 0);
 
  useEffect(() => {
    if (pageData) {
      if (isSubCategoryView && pageData.subCategory?.sub_category_id) {
        trackEvent('sub_category_view', { 
            sub_category_id: pageData.subCategory.sub_category_id, 
            sub_category_name: pageData.subCategory.name 
        });
      } else if (!isSubCategoryView && pageData.category?.category_id) {
        trackEvent('category_view', { 
            category_id: pageData.category.category_id, 
            category_name: pageData.category.name 
        });
      }
    }
  }, [pageData, isSubCategoryView]);

  const engagementData = useMemo(() => {
    if (!pageData) return null;
    
    if (isSubCategoryView && pageData.subCategory?.sub_category_id) {
      return {
        page_type: "sub_category",
        category_id: pageData.subCategory.category_id,
        category_name: pageData.subCategory.category_name,
        sub_category_id: pageData.subCategory.sub_category_id,
        sub_category_name: pageData.subCategory.name,
      };
    } else if (!isSubCategoryView && pageData.category?.category_id) {
      return {
        page_type: "category",
        category_id: pageData.category.category_id,
        category_name: pageData.category.name,
      };
    }
    return null;
  }, [pageData, isSubCategoryView]);

  useTrackEngagement(engagementData);

  useEffect(() => {
    if (!pageData) return;

    if (pageData.category || pageData.subCategory) {
      setHeaderData({
        category: pageData.category,
        subCategory: pageData.subCategory,
        subCategories: pageData.subCategories,
        type: pageData.type
      });
    }

    if (pageData.type !== 'recipes') return;

    const newRecipes = pageData.recipes || [];
    const pagination = pageData.pagination;

    if (page === 1) {
      // Always set recipes on page 1 — covers both SSR hydration and fresh client fetches
      setAllRecipes(newRecipes);
      if (pagination) {
        setHasMore(pagination.currentPage < pagination.totalPages);
      } else {
        setHasMore(false);
      }
    } else {
      setAllRecipes(prev => {
        const existingIds = new Set(prev.map(r => r.id || r.recipe_id));
        const uniqueNew = newRecipes.filter(r => !existingIds.has(r.id || r.recipe_id));
        return [...prev, ...uniqueNew];
      });
      if (pagination) {
        setHasMore(pagination.currentPage < pagination.totalPages);
      } else {
        setHasMore(false);
      }
    }
  }, [pageData, page]);

  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isFetching, hasMore]);

  const retryLoadMore = useCallback(() => {
    if (isSubCategoryView) {
      refetchSubCategory();
    } else {
      refetchCategory();
    }
  }, [isSubCategoryView, refetchSubCategory, refetchCategory]);

  const desktopAdIndices = useMemo(() => getDesktopAdIndices(allRecipes, 42), [allRecipes]);
  const mobileAdIndices = useMemo(() => getMobileAdIndices(allRecipes, 42), [allRecipes]);

  const category = headerData?.category;
  const subCategory = headerData?.subCategory;
  const subCategories = headerData?.subCategories || [];

  const pageTitle = isSubCategoryView
    ? subCategory?.name
    : category?.name;

  useEffect(() => {
    const title = isSubCategoryView ? subCategory?.name : category?.name;
      
    const metaDesc = isSubCategoryView 
      ? (subCategory?.meta_description || subCategory?.description || 'Delicious recipes from Recipe Trending')
      : (category?.meta_description || category?.description || 'Delicious recipes from Recipe Trending');

    if (title) {
      document.title = title;
    }

    let metaDescriptionTag = document.querySelector('meta[name="description"]');
    if (!metaDescriptionTag) {
        metaDescriptionTag = document.createElement('meta');
        metaDescriptionTag.name = "description";
        document.head.appendChild(metaDescriptionTag);
    }
    
    if (metaDesc) {
        metaDescriptionTag.setAttribute('content', metaDesc);
    }
    
    return () => {
      document.title = "Recipe Trending";
    };
  }, [pageTitle, category, subCategory, isSubCategoryView]);

  const pageDescription = isSubCategoryView
    ? subCategory?.description
    : category?.description;

  const renderBreadcrumbs = () => {
    const crumbs = [
      { label: 'Home', to: '/' },
    ];

    if (isSubCategoryView && subCategory) {
      crumbs.push({
        label: subCategory.category_name || 'Category',
        to: `/category/${subCategory.category_slug}`
      });
      crumbs.push({ label: subCategory.name });
    } else if (category) {
      crumbs.push({ label: category.name });
    }

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.5,
          mb: { xs: 3, sm: 4, md: 3 },
        }}
      >
        {crumbs.map((crumb, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {index > 0 && (
              <NavigateNextIcon
                sx={{
                  fontSize: '1rem',
                  color: isDarkMode ? '#888' : '#999',
                }}
              />
            )}
            {crumb.to ? (
              <Link
                href={crumb.to}
                style={{ textDecoration: 'none' }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Basic', sans-serif !important",
                    fontSize: { xs: '0.85rem', md: '0.95rem' },
                    color: '#CA6014',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {crumb.label}
                </Typography>
              </Link>
            ) : (
              <Typography
                sx={{
                  fontFamily: "'Basic', sans-serif !important",
                  fontSize: { xs: '0.85rem', md: '0.95rem' },
                  color: isDarkMode ? '#ccc' : '#666',
                  fontWeight: 400,
                }}
              >
                {crumb.label}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  const renderSubCategoryCard = (subCat) => {
    const imgVal = (typeof subCat.image === 'string' ? subCat.image.trim() : '') || '';
    const imgUrl = imgVal && imgVal.toLowerCase() !== 'null' ? getImage(imgVal) : '';
    const imageSrc = imgUrl || noImageFound;

    return (
      <Link
        key={subCat.sub_category_id}
        href={`/category/${categorySlug}/${subCat.slug}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            cursor: 'pointer',
            '&:hover .sub-category-image': {
              transform: 'scale(1.1)',
            },
          }}
        >
          <Box
            className="sub-category-container"
            sx={{
              width: { xs: 128, sm: 120, md: 160 },
              height: { xs: 128, sm: 120, md: 160 },
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              bgcolor: isDarkMode ? '#1a1a1a' : 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Image
              src={imageSrc}
              alt={subCat.name}
              title={subCat.name}
              className="sub-category-image"
              fill
              sizes="(max-width: 600px) 128px, (max-width: 900px) 120px, 160px"
              style={{
                objectFit: 'cover',
                transition: 'transform 0.5s ease',
              }}
            />
          </Box>
          <Typography
            variant="h6"
            className="font-semibold text-lg md:text-xl leading-tight px-2"
            sx={{
              fontFamily: "'Basic', sans-serif !important",
              color: isDarkMode ? '#FFF7EC' : '#111827',
              textAlign: 'center',
            }}
          >
            {subCat.name}
          </Typography>
        </Box>
      </Link>
    );
  };

  if (isInitialLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          pt: { xs: 9, sm: 10, md: 17, lg: 18 },
          pb: 6,
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Skeleton variant="text" width={50} height={24} />
            <Skeleton variant="text" width={20} height={24} />
            <Skeleton variant="text" width={100} height={24} />
          </Box>

    
          <Box 
            sx={{ 
              mb: { xs: 4, md: 6 },
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FEE7D6',
              borderRadius: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: 0,
              minHeight: { sm: '200px', md: '260px' },
            }}
          >
            <Box
              sx={{
                width: { xs: '100%', sm: '250px', md: '300px' },
                height: { xs: '220px', sm: '190px', md: '240px' },
                px: { xs: 2, sm: 2.5, md: 3 },
                py: { xs: 1.5, sm: 1.5, md: 1.5 },
                pl: { xs: 3, sm: 4, md: 5 },
                pr: 0,
              }}
            >
              <Skeleton
                variant="rectangular"
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                }}
              />
            </Box>
            <Box sx={{ p: { xs: 3, sm: 4, md: 5 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Skeleton variant="text" width="60%" height={60} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="80%" height={30} />
              <Skeleton variant="text" width="40%" height={30} />
            </Box>
          </Box>

        
          <RecipeGridSkeleton count={8} mobileLayout="vertical" />
        </div>
      </Box>
    );
  }

  const hasLoadedData = allRecipes.length > 0 || (initialPageData?.recipes?.length > 0);

  if (isError && !hasLoadedData) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Basic', sans-serif !important",
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontWeight: 600,
            color: isDarkMode ? '#FFF7EC' : '#2B2828',
          }}
        >
          {isSubCategoryView ? 'Sub-category not found' : 'Category not found'}
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Basic', sans-serif !important",
            fontSize: '1rem',
            color: isDarkMode ? '#aaa' : '#666',
            mb: 2,
          }}
        >
          {isSubCategoryView
            ? "The sub-category you're looking for doesn't exist or has been removed."
            : "The category you're looking for doesn't exist or has been removed."}
        </Typography>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Box
            sx={{
              px: 4,
              py: 1.5,
              bgcolor: '#CA6014',
              color: '#fff',
              borderRadius: '12px',
              fontFamily: "'Basic', sans-serif !important",
              fontWeight: 600,
              fontSize: '1rem',
              '&:hover': {
                bgcolor: '#A04E10',
              },
            }}
          >
            Back to Home
          </Box>
        </Link>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: { xs: 9, sm: 10, md: 17, lg: 18 },
        pb: 6,
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {renderBreadcrumbs()}

        
        <Box 
          sx={{ 
            mb: { xs: 4, md: 6 },
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(202, 96, 20, 0.15) 0%, rgba(20, 20, 20, 0.4) 100%)' 
              : 'linear-gradient(135deg, #FEE7D6 0%, #FFF5ED 100%)',
            borderRadius: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            gap: 0,
            minHeight: { sm: '200px', md: '260px' },
            boxShadow: isDarkMode ? 'none' : '0 4px 15px rgba(0,0,0,0.03)',
            border: isDarkMode ? '1px solid rgba(202, 96, 20, 0.2)' : 'none',
          }}
        >
        
          <Box
            sx={{
              width: { xs: '100%', sm: '250px', md: '300px' },
              height: { xs: '220px', sm: '190px', md: '240px' },
              flexShrink: 0,
              px: { xs: 2, sm: 2.5, md: 3 },
              pt: { xs: 3, sm: 2, md: 1.5 }, 
              pb: { xs: 1, sm: 2, md: 1.5 },
              pl: { xs: 3, sm: 4, md: 5 }, 
              pr: 0,
            }}
          >
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
              <Image
                src={(() => {
                  const imgVal = isSubCategoryView ? subCategory?.image : category?.image;
                  const imgUrl = (typeof imgVal === 'string' ? imgVal.trim() : '') || '';
                  return imgUrl && imgUrl.toLowerCase() !== 'null' ? getImage(imgUrl) : noImageFound;
                })()}
                alt={pageTitle}
                title={pageTitle}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 250px, 300px"
                style={{
                  objectFit: 'cover',
                  borderRadius: '12px',
                }}
                priority
              />
            </Box>
          </Box>

        
          <Box 
            sx={{ 
              px: { xs: 3, sm: 4, md: 5 },
              pt: { xs: 1, sm: 4, md: 5 },
              pb: { xs: 3, sm: 4, md: 5 },
              pl: { xs: 2, sm: 3, md: 4 }, 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1
            }}
          >
            {isSubCategoryView && subCategory?.category_name && (
              <Typography
                sx={{
                  fontFamily: "'Basic', sans-serif !important",
                  fontSize: { xs: '0.8rem', md: '0.9rem' },
                  color: '#CA6014',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  mb: 1
                }}
              >
                {subCategory.category_name}
              </Typography>
            )}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: 2,
              width: '100%',
              mb: 1.5
            }}>
              <Typography
                component="h1"
                sx={{
                  fontFamily: "'Basic', sans-serif !important",
                  fontWeight: 600,
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '3rem' },
                  color: isDarkMode ? '#FFF7EC' : '#2B2828',
                  lineHeight: 1.1,
                  cursor: 'default',
                  display: 'inline-block',
                  position: 'relative',
                  flex: 1,
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '0%',
                    height: '3px',
                    bottom: { xs: -2, md: -4 },
                    left: 0,
                    backgroundColor: '#CA6014',
                    transition: 'width 0.3s ease-in-out',
                    borderRadius: '2px',
                  },
                  '&:hover::after': {
                    width: '100%',
                  },
                }}
              >
                {pageTitle}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Share collection" arrow>
                  <IconButton 
                    onClick={handleShare}
                    sx={{ 
                      p: 1,
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)',
                        transform: 'scale(1.1)'
                      }
                    }}
                    aria-label="Share page"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '26px', height: '26px' }}>
                      <path d="M15 5L22 12L15 19V14.5C10 14.5 6.5 16 4 20C5 15 8 10 15 9V5Z" fill="#4D9CFF"/>
                    </svg>
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {pageDescription && (
              <Box sx={{ position: 'relative' }}>
                <Typography
                  sx={{
                    fontFamily: "'Basic', sans-serif !important",
                    fontSize: { xs: '0.9rem', md: '1.05rem' },
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    maxWidth: 800,
                    lineHeight: 1.6,
                    display: {
                      xs: isExpanded ? 'block' : '-webkit-box',
                      md: 'block'
                    },
                    WebkitLineClamp: {
                      xs: isExpanded ? 'none' : 2,
                      md: 'none'
                    },
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {pageDescription}
                </Typography>
                
                <Box
                  onClick={() => setIsExpanded(!isExpanded)}
                  sx={{
                    display: { xs: 'flex', md: 'none' },
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 1,
                    cursor: 'pointer',
                    color: '#CA6014',
                    width: 'fit-content',
                    '&:hover': { color: '#A04E10' },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "'Basic', sans-serif !important",
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    {isExpanded ? 'Show Less' : 'Read More'}
                  </Typography>
                  {isExpanded ? (
                    <ExpandLessIcon sx={{ fontSize: '1.1rem' }} />
                  ) : (
                    <ExpandMoreIcon sx={{ fontSize: '1.1rem' }} />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {!isSubCategoryView && (
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
            <AdsterraBanner300x250 />
          </Box>
        )}

        
        {showSubCategories && (
          <Box>
            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
              {subCategories.map((subCat) => (
                <Grid
                  size={{ xs: 6, sm: 4, md: 3, lg: 2 }}
                  key={subCat.sub_category_id}
                >
                  {renderSubCategoryCard(subCat)}
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        
        {showRecipes && (
          <Box sx={{ }}>
            {allRecipes.length > 0 || (page === 1 && pageData?.recipes?.length > 0) ? (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                      lg: 'repeat(4, 1fr)',
                    },
                    gap: { xs: 2, sm: 2.5, md: 3 },
                  }}
                >
                  {allRecipes.map((recipe, index) => {
                    const isLastItem = index === allRecipes.length - 1;
                    const showMobileAd = mobileAdIndices.has(index);
                    const showDesktopAd = desktopAdIndices.has(index) && !isLastItem;

                    return (
                      <React.Fragment key={recipe.id || recipe.recipe_id || index}>
                        <RecipeCard
                          recipe={recipe}
                          mobileLayout="vertical"
                        />
                        {(showMobileAd || showDesktopAd) && (
                          <Box
                            sx={{
                              gridColumn: '1 / -1',
                              display: {
                                xs: showMobileAd ? 'flex' : 'none',
                                md: showDesktopAd ? 'flex' : 'none',
                              },
                              justifyContent: 'center',
                              my: { xs: 1.5, md: 3 },
                            }}
                          >
                            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                              <AdsterraBanner320x50 />
                            </Box>
                            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                              <AdsterraBanner728x90 />
                            </Box>
                          </Box>
                        )}
                      </React.Fragment>
                    );
                  })}
                </Box>

                {hasMore && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mt: 6,
                      mb: 2 
                    }}
                  >
                    {isFetching ? (
                      <Button
                        variant="contained"
                        disabled
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
                          cursor: 'not-allowed',
                          opacity: 0.7,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CircularProgress size={20} sx={{ color: 'inherit' }} />
                          <span>Loading...</span>
                        </Box>
                      </Button>
                    ) : isError && page > 1 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ color: isDarkMode ? '#FF8A65' : '#D32F2F', fontSize: '0.9rem' }}>
                          Failed to load more recipes
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={retryLoadMore}
                          sx={{
                            color: isDarkMode ? '#FF8A65' : '#D32F2F',
                            borderColor: isDarkMode ? 'rgba(255,138,101,0.5)' : '#D32F2F',
                            fontFamily: "'Basic', sans-serif",
                            fontSize: { xs: '0.85rem', md: '0.95rem' },
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': {
                              borderColor: isDarkMode ? '#FF8A65' : '#B71C1C',
                              backgroundColor: isDarkMode ? 'rgba(255,138,101,0.08)' : 'rgba(211,47,47,0.04)',
                            },
                          }}
                        >
                          Retry
                        </Button>
                      </Box>
                    ) : (
                      <LoadMoreButton
                        onClick={loadMore}
                        isLoading={isFetching}
                      />
                    )}
                  </Box>
                )}
              </>
            ) : null}
          </Box>
        )}

        {/* Bottom Banner Ad above Footer */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', mt: 5, mb: 1 }}>
          <AdsterraBanner728x90 />
        </Box>
      </div>
    </Box>
  );
};

export default CategoryPage;

