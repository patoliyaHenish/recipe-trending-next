d "use client";
import React, { useState, useEffect } from 'react'
import { Box, Typography, Skeleton, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useGetPublicRecipesByKeywordsQuery } from '../../features/api/recipeDetailsApi';
import { useGetPublicCollectionDetailsQuery } from '../../features/api/homeSectionApi';
import RecipeCard from '../../components/common/RecipeCard';
import { useTheme } from '../../context/ThemeContext';
import { getImage } from '../../utils/helper';
import noImageFound from '../../assets/no-image-found.png';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { toast } from '../../utils/toast';

const RECIPES_PER_PAGE    = 12;
const COLLECTION_PER_PAGE = 12;

const BannerRecipes = () => {
  const { isDarkMode } = useTheme();
  const pathname = usePathname();

  const { collectionName } = useParams();

  const { data: sectionData, isLoading: isLoadingSection } = useGetPublicCollectionDetailsQuery(
    collectionName, 
    { skip: !collectionName }
  );

  const navState = typeof window !== 'undefined' ? window.history.state : {};

  const section      = sectionData?.data || navState?.section || null;
  const isCollection = !!section || !!collectionName;

  const collectionTitle       = section?.name        || collectionName?.split('-').join(' ') || 'Collection';
  const collectionDescription = section?.description || '';
  const collectionItems       = section?.items       || [];

  const keywords  = navState?.keywords || '';
  const pageTitle = isCollection ? collectionTitle : (navState?.title || 'Recipe Spotlight');

  const [userPreference, setUserPreference] = useState(Cookies.get('userPreference') || '');
  const [page, setPage]               = useState(1);
  const [allRecipes, setAllRecipes]   = useState([]);
  const [hasMore, setHasMore]         = useState(true);
  const [collectionPage, setCollectionPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleCollectionItems = collectionItems.slice(0, collectionPage * COLLECTION_PER_PAGE);
  const collectionHasMore      = visibleCollectionItems.length < collectionItems.length;
  const displayRecipes         = isCollection ? visibleCollectionItems : allRecipes;

  useEffect(() => {
    document.title = `${pageTitle} | Recipe Trending`;
    
    // SEO & Social Sharing Meta Tags
    const imgVal = section?.image || section?.background_image || navState?.image;
    const recipeImg = displayRecipes?.[0]?.image || displayRecipes?.[0]?.background_image;
    const finalImg = imgVal || recipeImg;
    const imgUrl = (typeof finalImg === 'string' ? finalImg.trim() : '') || '';
    const shareImageUrl = imgUrl && imgUrl.toLowerCase() !== 'null' ? getImage(imgUrl) : '';
    
    const metaDesc = (collectionDescription || `Explore the ${pageTitle} collection on Recipe Trending.`).replace(/^"|"$/g, '').trim();

    // Update Meta Description
    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.name = "description";
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute('content', metaDesc);

    // Update Open Graph Tags
    const updateOgTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateOgTag('og:title', pageTitle);
    updateOgTag('og:description', metaDesc);
    updateOgTag('og:url', window.location.href);
    updateOgTag('og:type', 'website');
    if (shareImageUrl) updateOgTag('og:image', shareImageUrl);
    
    return () => { document.title = 'Recipe Trending'; };
  }, [pageTitle, collectionDescription, section, navState, displayRecipes]);

  useEffect(() => {
    const handler = () => setUserPreference(Cookies.get('userPreference') || '');
    window.addEventListener('userPreferenceChanged', handler);
    return () => window.removeEventListener('userPreferenceChanged', handler);
  }, []);

  useEffect(() => {
    setPage(1);
    setAllRecipes([]);
    setHasMore(true);
  }, [keywords, userPreference]);

  const { data, isLoading, isFetching, error } = useGetPublicRecipesByKeywordsQuery(
    { keywords, page, limit: RECIPES_PER_PAGE, preference: userPreference },
    { skip: isCollection }        
  );

  const isInitialLoading = isCollection 
    ? (isLoadingSection && (!section || (section.items?.length === 0)))
    : (isLoading || isFetching) && allRecipes.length === 0 && page === 1;

  const responseData = data?.data;
  const pageData     = responseData?.recipes || [];
  const pagination   = responseData?.pagination;

  useEffect(() => {
    if (isCollection || !responseData) return;
    if (page === 1) {
      setAllRecipes(pageData);
    } else {
      setAllRecipes(prev => {
        const existingIds = new Set(prev.map(r => r.id));
        return [...prev, ...pageData.filter(r => !existingIds.has(r.id))];
      }); 
    }
    setHasMore(pagination ? pagination.currentPage < pagination.totalPages : false);
  }, [responseData, page, isCollection]);

  const loadMore = () => {
    if (!isFetching && hasMore) setPage(prev => prev + 1);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const imgVal = section?.image || section?.background_image || navState?.image;
    const recipeImg = displayRecipes?.[0]?.image || displayRecipes?.[0]?.background_image;
    const finalImg = imgVal || recipeImg;
    const imgUrl = (typeof finalImg === 'string' ? finalImg.trim() : '') || '';
    const shareImageUrl = imgUrl && imgUrl.toLowerCase() !== 'null' ? getImage(imgUrl) : null;

    const shortDesc = collectionDescription 
      ? (collectionDescription.length > 200 ? collectionDescription.substring(0, 197) + "..." : collectionDescription) 
      : `${pageTitle}`;

    const shareData = { 
      title: pageTitle, 
      text: `${pageTitle}\n\n${shortDesc}\n\nCheck it out here:\n${url}`, 
      url 
    };

    try {
      if (navigator.share) {
        // Try to include the image as a file if supported
        if (shareImageUrl) {
          try {
            const response = await fetch(shareImageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'collection-share.jpg', { type: blob.type });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch (e) {
            console.warn('Image fetch failed for sharing:', e);
          }
        }
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Collection link copied to clipboard!", {
          position: "bottom-center",
          autoClose: 2000,
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error("Failed to share collection");
      }
    }
  };



  const SkeletonCard = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Skeleton
        variant="rectangular"
        sx={{
          width: '100%', pt: '58%',
          borderRadius: { xs: '16px', sm: '24px' },
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, px: 2 }}>
        <Skeleton variant="text" width="80%" height={30} sx={{ borderRadius: '4px' }} />
        <Skeleton variant="text" width="50%" height={24} sx={{ borderRadius: '4px' }} />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 9, sm: 10, md: 17, lg: 18 }, pb: 6, width: '100%' }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mb: { xs: 3, sm: 4, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Typography sx={{
                fontFamily: "'Basic', sans-serif !important",
                fontSize: { xs: '0.85rem', md: '0.95rem' },
                color: '#CA6014', fontWeight: 500,
                '&:hover': { textDecoration: 'underline' },
              }}>
                Home
              </Typography>
            </Link>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <NavigateNextIcon sx={{ fontSize: '1rem', color: isDarkMode ? '#888' : '#999' }} />
            <Typography sx={{
              fontFamily: "'Basic', sans-serif !important",
              fontSize: { xs: '0.85rem', md: '0.95rem' },
              color: isDarkMode ? '#ccc' : '#666', fontWeight: 400,
            }}>
              {pageTitle}
            </Typography>
          </Box>
        </Box>

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
            <Box
              component="img"
              src={(() => {
                const imgVal = section?.image || section?.background_image || navState?.image;
                const recipeImg = displayRecipes?.[0]?.image || displayRecipes?.[0]?.background_image;
                const finalImg = imgVal || recipeImg;
                const imgUrl = (typeof finalImg === 'string' ? finalImg.trim() : '') || '';
                return imgUrl && imgUrl.toLowerCase() !== 'null' ? getImage(imgUrl) : noImageFound;
              })()}
              alt={pageTitle}
              title={pageTitle}
              onError={(event) => {
                event.currentTarget.src = noImageFound;
              }}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '12px',
                display: isInitialLoading ? 'none' : 'block'
              }}
              loading="lazy"
            />
            {isInitialLoading && (
              <Skeleton
                variant="rectangular"
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                }}
              />
            )}
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
              {isCollection ? 'Collection' : 'Recipe Spotlight'}
            </Typography>

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
                  flex: 1,
                  position: 'relative',
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
                        background: 'rgba(16,185,129,0.1)',
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

            {collectionDescription && (
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
                  {collectionDescription}
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

        <Box sx={{ pb: 8 }}>
          {isInitialLoading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: { xs: 2, sm: 2.5, md: 3 } }}>
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </Box>
          ) : error ? (
            <Typography className="text-center text-red-500 py-20 font-medium">
              Failed to load recipes. Please try again later.
            </Typography>
          ) : (
            <>
              {displayRecipes.length > 0 ? (
                <>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: { xs: 2, sm: 2.5, md: 3 } }}>
                    {displayRecipes.map(recipe => (
                      <RecipeCard
                        key={recipe.recipe_id || recipe.id}
                        recipe={recipe}
                        mobileLayout="vertical"
                      />
                    ))}
                  </Box>

                  {isCollection ? (
                    collectionHasMore && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 5, md: 7 }, mb: 4 }}>
                        <Box
                          component="button"
                          onClick={() => setCollectionPage(prev => prev + 1)}
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
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: isDarkMode ? 'none' : '0 4px 14px rgba(202, 96, 20, 0.15)',
                            '&:hover': {
                              bgcolor: '#CA6014',
                              color: '#fff',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 6px 20px rgba(202, 96, 20, 0.25)',
                            },
                            '&:active': {
                              transform: 'translateY(0)',
                            }
                          }}
                        >
                          {isLoadingSection ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <CircularProgress size={18} color="inherit" thickness={6} />
                              <span>Loading...</span>
                            </Box>
                          ) : (
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                              <span>Load More</span>
                              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>↓</span>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )
                  ) : (
                    hasMore && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 5, md: 7 }, mb: 4 }}>
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <CircularProgress size={18} color="inherit" thickness={6} />
                              <span>Loading...</span>
                            </Box>
                          ) : (
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                              <span>Load More</span>
                              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>↓</span>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )
                  )}
                </>
              ) : !isFetching && (
                <Typography className="text-center text-gray-500 py-20 font-medium italic">
                  No recipes found{isCollection ? ' in this collection' : ' for this spotlight'}.
                </Typography>
              )}
            </>
          )}
        </Box>
      </div>
    </Box>
  );
};

export default BannerRecipes;

