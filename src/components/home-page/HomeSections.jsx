"use client";
import React from 'react';
import Link from 'next/link';
import RecipeCard from '../common/RecipeCard';
import RecipeGridSkeleton from '../common/RecipeGridSkeleton';
import CollectionCard from './CollectionCard';
import { Box, Typography, Grid, Skeleton, Divider, useMediaQuery, CircularProgress } from '@mui/material';
import { useGetPublicHomeSectionsQuery } from '../../features/api/homeSectionApi';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'next/navigation';
import { getImage } from '../../utils/helper';
import noImageFound from '../../assets/no-image-found.png';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';

const SECTIONS_PER_PAGE = 2;

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')    
    .replace(/[^\w-]+/g, '')  
    .replace(/--+/g, '-');   
};

const HomeSections = () => {
  const router = useRouter();
  const [userPreference, setUserPreference] = useState(Cookies.get('userPreference') || '');
  const [page, setPage] = useState(1);
  const [allSections, setAllSections] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const { data: homeSectionsData, isLoading, isFetching } = useGetPublicHomeSectionsQuery({
    preference: userPreference,
    page,
    limit: SECTIONS_PER_PAGE,
  });
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const handler = () => {
      setUserPreference(Cookies.get('userPreference') || '');
    };
    window.addEventListener('userPreferenceChanged', handler);
    return () => window.removeEventListener('userPreferenceChanged', handler);
  }, []);

  useEffect(() => {
    setPage(1);
    setAllSections([]);
    setHasMore(true);
  }, [userPreference]);

  useEffect(() => {
    const newSections = homeSectionsData?.data || [];
    if (newSections.length === 0 && page > 1) {
      setHasMore(false);
      return;
    }

    if (newSections.length > 0) {
      setAllSections((prev) => {
        const seen = new Set(prev.map((section) => section.home_section_id));
        const uniqueIncoming = newSections.filter((section) => !seen.has(section.home_section_id));
        return [...prev, ...uniqueIncoming];
      });
    }

    const apiHasMore = homeSectionsData?.pagination?.hasMore;
    if (typeof apiHasMore === 'boolean') {
      setHasMore(apiHasMore);
    } else {
      setHasMore(newSections.length === SECTIONS_PER_PAGE);
    }
  }, [homeSectionsData, page]);

  const loadMore = () => {
    if (!isFetching && !isLoading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const isMin640 = useMediaQuery('(min-width:640px)');
  const isMin768 = useMediaQuery('(min-width:768px)');
  const isMin1024 = useMediaQuery('(min-width:1024px)');
  const isMin1280 = useMediaQuery('(min-width:1280px)');
  const isRecipeSectionType = (type) => type === 'recipe' || type === 'keyword';

  const renderLoadingSectionSkeleton = (isRecipeType, key) => (
    <Box key={key} sx={{ mb: { xs: 4, md: 6 } }}>
      <Skeleton variant="text" width={isRecipeType ? 300 : 260} height={72} sx={{ mb: 1 }} />
      {isRecipeType ? (
        <RecipeGridSkeleton count={8} mobileLayout="vertical" />
      ) : (
        <Grid container spacing={3.5}>
          {[...Array(8)].map((_, i) => (
            <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={`${key}-category-${i}`}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Skeleton
                  variant="circular"
                  sx={{
                    width: { xs: 136, sm: 130, md: 170 },
                    height: { xs: 136, sm: 130, md: 170 },
                  }}
                />
                <Skeleton variant="text" width="70%" height={30} />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );


  const CategoryCard = ({ item, type }) => {
    const imgVal = (typeof item.image === 'string' ? item.image.trim() : '') || '';
    const imgUrl = imgVal && imgVal.toLowerCase() !== 'null' ? getImage(imgVal) : '';
    const imageSrc = imgUrl || noImageFound;
    const name = item.name || item.title;
    
    let linkPath = '/';
    if (type === 'category') {
      linkPath = `/category/${item.slug}`;
    } else if (type === 'sub-category') {
      linkPath = `/category/${item.category_slug || 'category'}/${item.slug}`;
    }

    return (
      <Link href={linkPath} className="block no-underline text-inherit h-full">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 2,
          height: '100%',
          padding: 1,
          '&:hover .category-image': {
            transform: 'scale(1.1)',
          },
        }}>
          <Box className="category-container" sx={{ 
            width: { xs: 128, sm: 120, md: 160 }, 
            height: { xs: 128, sm: 120, md: 160 }, 
            borderRadius: '50%', 
            overflow: 'hidden', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
            bgcolor: 'grey.100', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Box component="img" 
              src={imageSrc} 
              alt={name} 
              title={name} 
              className="category-image"
              onError={(e) => { e.currentTarget.src = noImageFound; }} 
              sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
              loading="lazy" 
            />
          </Box>
          <Typography
            variant="h6"
            className="font-semibold text-lg md:text-xl leading-tight px-2"
            sx={{
              fontFamily: "'Basic', sans-serif !important",
              color: isDarkMode ? '#FFF7EC' : 'inherit',
              textAlign: 'center',
            }}
          >
            {name}
          </Typography>
        </Box>
      </Link>
    );
  };

  const isInitialLoading = isLoading && allSections.length === 0;

  if (isInitialLoading) {
    return (
      <Box sx={{ py: 4 }}>
        {renderLoadingSectionSkeleton(true, 'initial-recipe')}
        {renderLoadingSectionSkeleton(false, 'initial-category')}
      </Box>
    );
  }

  const sections = allSections;

  if (sections.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {sections.map((section, sectionIndex) => {
        const isCollectionSection =
          String(section.section_type || '').toLowerCase() === 'feature' ||
          String(section.type || '').toLowerCase() === 'collection';

        if (isCollectionSection) {
          return (
            <React.Fragment key={section.home_section_id}>
              {sectionIndex > 0 && (
                <Divider sx={{ my: { xs: 4, md: 6 }, borderColor: isDarkMode ? '#2d3748' : '#e5e7eb' }} />
              )}
              <Box sx={{ mb: { xs: 4, md: 6 } }}>
                <CollectionCard
                  image={section.image || section.background_image}
                  title={section.name}
                  description={section.description}
                  isDarkMode={isDarkMode}
                  onClick={() => {
                    const slug = slugify(section.name || 'collection');
                    router.push(`/collection-spotlight/${slug}`, { 
                      state: { 
                        section,
                        image: section.image || section.background_image
                      } 
                    });
                  }}
                />
              </Box>
            </React.Fragment>
          );
        }

        if (!section.items || section.items.length === 0) return null;

        const isRecipeType = isRecipeSectionType(section.type);

        return (
          <React.Fragment key={section.home_section_id}>
            {sectionIndex > 0 && (
              <Divider sx={{ my: { xs: 4, md: 6 }, borderColor: isDarkMode ? '#2d3748' : '#e5e7eb' }} />
            )}
            <Box sx={{ mb: { xs: 4, md: 6 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography
                  component="h2"
                  variant="h3"
                  sx={{
                    fontFamily: "'Basic', sans-serif !important",
                    fontWeight: 500,
                    fontSize: { xs: '2rem', md: '3.2rem' },
                    color: isDarkMode ? '#FFF7EC' : '#2B2828',
                  }}
                >
                  {section.name}
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {section.items.map((item, index) => (
                  <Grid size={{ 
                    xs: 12 / (isRecipeType ? 1 : 2),
                    sm: isRecipeType ? 6 : 4,
                    md: isRecipeType ? 4 : 3,
                    lg: isRecipeType ? 3 : 2
                  }} key={index}>
                    {isRecipeType ? (
                      <RecipeCard recipe={item} mobileLayout="vertical" />
                    ) : (
                      <CategoryCard item={item} type={section.type} />
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>
          </React.Fragment>
        );
      })}



      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 4, md: 6 }, mb: 4 }}>
          <Box
            component="button"
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
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={18} color="inherit" thickness={6} />
                <span>Loading...</span>
              </Box>
            ) : (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
                <span>Load More</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>↓</span>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default HomeSections;


