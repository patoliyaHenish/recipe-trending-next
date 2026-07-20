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
import { useGetCategoryPageQuery, useGetSubCategoryPageQuery } from '../../features/api/recipeDetailsApi';
import { useTheme } from '../../context/ThemeContext';
import { getImage } from '../../utils/helper';
import noImageFound from '../../assets/no-image-found.png';
import Cookies from 'js-cookie';
import useTrackEngagement from '../../hooks/useTrackEngagement';

const RECIPES_PER_PAGE = 12;

 


const CategoryPage = ({ categorySlug: propCategorySlug, subCategorySlug: propSubCategorySlug, initialData, initialPreference = '' }) => {
  const categorySlug = propCategorySlug;
  const subCategorySlug = propSubCategorySlug;
  const { isDarkMode } = useTheme();
  const [userPreference, setUserPreference] = useState(initialPreference);
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

  const handleShare = () => {
    const url = window.location.href;
    const shareData = {
      title: pageTitle,
      text: `Check out these recipes in ${pageTitle}:`,
      url,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
      }).catch(() => {});
    }
  };

  useEffect(() => {
    // If client cookie differs from server cookie on mount, mark as changed
    const clientPref = Cookies.get('userPreference') || '';
    if (clientPref !== initialPreference) {
      setUserPreference(clientPref);
      setIsPreferenceChanged(true);
    }
    
    const handler = () => {
      setUserPreference(Cookies.get('userPreference') || '');
      setIsPreferenceChanged(true);
    };
    window.addEventListener('userPreferenceChanged', handler);
    return () => window.removeEventListener('userPreferenceChanged', handler);
  }, [initialPreference]);

  useEffect(() => {
    setPage(1);
    setIsPreferenceChanged(false);
  }, [categorySlug, subCategorySlug]);

  const isSubCategoryView = !!subCategorySlug;
  
  const skipQuery = page === 1 && !isPreferenceChanged;

  const {
    data: categoryData,
    isLoading: isCategoryLoading,
    isFetching: isCategoryFetching,
    isError: isCategoryError,
  } = useGetCategoryPageQuery(
    { slug: categorySlug, page, limit: RECIPES_PER_PAGE, preference: userPreference },
    { skip: isSubCategoryView || skipQuery }
  );

  const {
    data: subCategoryData,
    isLoading: isSubCategoryLoading,
    isFetching: isSubCategoryFetching,
    isError: isSubCategoryError,
  } = useGetSubCategoryPageQuery(
    { slug: subCategorySlug, page, limit: RECIPES_PER_PAGE, preference: userPreference },
    { skip: !isSubCategoryView || skipQuery }
  );

  const isLoading = skipQuery ? false : (isSubCategoryView ? isSubCategoryLoading : isCategoryLoading);
  const isFetching = skipQuery ? false : (isSubCategoryView ? isSubCategoryFetching : isCategoryFetching);
  const isError = skipQuery ? !initialData : (isSubCategoryView ? isSubCategoryError : isCategoryError);
  
  const responseData = skipQuery ? initialData : (isSubCategoryView ? subCategoryData : categoryData);

  const isInitialLoading = (isLoading || isFetching) && allRecipes.length === 0 && page === 1;
  
  console.log("SSR DEBUG:", { skipQuery, isLoading, isFetching, isError, isInitialLoading, allRecipesLength: allRecipes.length, pageDataExists: !!responseData?.data, initialDataExists: !!initialData });

  const pageData = responseData?.data || initialPageData;
  const showSubCategories = !isSubCategoryView && pageData?.type === 'sub_categories';
  const showRecipes = pageData?.type === 'recipes' || (!isInitialLoading && allRecipes.length > 0);
 
  useEffect(() => {
    if (pageData) {
      if (isSubCategoryView && pageData.subCategory?.sub_category_id) {
        
        if (window.gtag) {
        window.gtag("event", "sub_category_view", {
          page_type: "sub_category",
          category_id: pageData.subCategory.category_id,
          category_name: pageData.subCategory.category_name,
          sub_category_id: pageData.subCategory.sub_category_id,
          sub_category_name: pageData.subCategory.name,
        });
        }
      } else if (!isSubCategoryView && pageData.category?.category_id) {
        
        if (window.gtag) {
          window.gtag("event", "category_view", {
            page_type: "category",
            category_id: pageData.category.category_id,
            category_name: pageData.category.name,
          });
        }
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

    if (!showRecipes || pageData.type !== 'recipes') return;

    const newRecipes = pageData.recipes || [];
    const pagination = pageData.pagination;

    if (page === 1) {
      setAllRecipes(newRecipes);
    } else {
      setAllRecipes(prev => {
        const existingIds = new Set(prev.map(r => r.id));
        const uniqueNew = newRecipes.filter(r => !existingIds.has(r.id));
        return [...prev, ...uniqueNew];
      });
    }

    if (pagination) {
      setHasMore(pagination.currentPage < pagination.totalPages);
    } else {
      setHasMore(false);
    }
  }, [pageData, page, showRecipes]);

  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isFetching, hasMore]);

  const category = headerData?.category;
  const subCategory = headerData?.subCategory;
  const subCategories = headerData?.subCategories || [];

  const pageTitle = isSubCategoryView
    ? subCategory?.name
    : category?.name;

  useEffect(() => {
    const metaTitle = isSubCategoryView 
      ? (subCategory?.meta_title || subCategory?.name)
      : (category?.meta_title || category?.name);
      
    const metaDesc = isSubCategoryView 
      ? (subCategory?.meta_description || subCategory?.description || 'Delicious recipes from Recipe Trending')
      : (category?.meta_description || category?.description || 'Delicious recipes from Recipe Trending');

    if (metaTitle) {
      document.title = metaTitle;
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

  if (isError || !pageData) {
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
          Category not found
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Basic', sans-serif !important",
            fontSize: '1rem',
            color: isDarkMode ? '#aaa' : '#666',
            mb: 2,
          }}
        >
          The category you're looking for doesn't exist or has been removed.
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
                  {allRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      mobileLayout="vertical"
                    />
                  ))}
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
                    <Button
                      variant="contained"
                      onClick={loadMore}
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
              </>
            ) : !isFetching && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 8,
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Basic', sans-serif !important",
                    fontSize: { xs: '1.3rem', md: '1.6rem' },
                    fontWeight: 500,
                    color: isDarkMode ? '#FFF7EC' : '#2B2828',
                    textAlign: 'center',
                  }}
                >
                  No recipes found
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Basic', sans-serif !important",
                    fontSize: '1rem',
                    color: isDarkMode ? '#aaa' : '#666',
                    textAlign: 'center',
                  }}
                >
                  There are no recipes in this {isSubCategoryView ? 'sub-category' : 'category'} yet.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </div>
    </Box>
  );
};

export default CategoryPage;

