"use client";
import { mdiChefHat } from "@mdi/js";
import { Icon } from "@mdi/react";
import {
  AccessTime as AccessTimeIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  Email as EmailIcon,
  Facebook as FacebookIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  People as PeopleIcon,
  Timer as TimerIcon,
  Twitter as TwitterIcon,
  WhatsApp as WhatsAppIcon,
  LightbulbOutlined as LightbulbOutlinedIcon,
  SaveOutlined as SaveOutlinedIcon,
  NavigateNext as NavigateNextIcon,
  Whatshot as WhatshotIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Speed as SpeedIcon,
  HourglassEmpty as HourglassEmptyIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Container,
  Fab,
  Fade,
  Grid,
  Grow,
  Paper,
  Tooltip,
  Typography,
  Zoom,
  IconButton,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../../context/useUser";
import NutritionInfoSection from "../../components/NutritionInfoSection";
import StepByStepModal from "../../components/StepByStepModal";
import { toast } from '../../utils/toast';
import AuthModal from "../../components/AuthModal";
import { useTheme } from "../../context/ThemeContext";
import {
  useGetRecipeDetailsBySlugQuery,
  useSaveRecipeMutation,
  useUnsaveRecipeMutation,
} from "../../features/api/recipeDetailsApi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getImage, formatFraction } from "../../utils/helper";
import Footer from "../../components/Footer";
import Image from "next/image";

import RecipeSuggestions from "../../components/RecipeSuggestions";
import ThreeDotsLoader from "../../components/ThreeDotsLoader";
import RecipeGridSkeleton from "../../components/common/RecipeGridSkeleton";
import { useCallback, useMemo } from "react";
import useTrackEngagement from "../../hooks/useTrackEngagement";

const isStagingHost = () => {
  return process.env.NODE_ENV === "staging" || window.location.hostname === "staging.recipetrending.com";
};

const RecipeDetail = ({ initialData, recipeSlug, initialSuggestions, initialFallback }) => {
    const [wakeLock, setWakeLock] = useState(null);
    const [isWakeLockActive, setIsWakeLockActive] = useState(false);

    const handleWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          if (!isWakeLockActive) {
            const lock = await navigator.wakeLock.request('screen');
            setWakeLock(lock);
            setIsWakeLockActive(true);
            toast.success('Screen will stay awake!', {autoClose: 2000 });
            lock.addEventListener('release', () => {
              setIsWakeLockActive(false);
            });
          } else if (wakeLock) {
            await wakeLock.release();
            setWakeLock(null);
            setIsWakeLockActive(false);
          }
        } catch {
          toast.error('Failed to change screen wake state.');
        }
      } else {
        toast.info('Screen wake lock is not supported in this browser.');
      }
    };
  const router = useRouter();

  const { isDarkMode } = useTheme();

  const toastShownRef = useRef(false);
  const { user, authModalOpen, setAuthModalOpen } = useUser();
  const isAuthenticated = !!user;

  const {
    data: fetchedData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetRecipeDetailsBySlugQuery(recipeSlug, {
    skip: (!isAuthenticated && !!initialData) || !recipeSlug,
  });

  const recipeData = fetchedData || initialData;
  const [saveRecipe, { isLoading: isSaving }] = useSaveRecipeMutation();

  const recipe = recipeData?.data || recipeData;

  const slugMismatch =
    recipe &&
    recipe.slug != null &&
    String(recipe.slug) !== String(recipeSlug);

  const showRecipeLoading =
    !!recipeSlug &&
    !isError &&
    !initialData &&
    (isLoading ||
      (!recipe && isFetching) ||
      !recipe ||
      slugMismatch);

  const engagementData = useMemo(() => {
    if (!recipe?.recipe_id) return null;
    return {
      page_type: "recipe",
      recipe_id: recipe.recipe_id,
      recipe_name: recipe.title,
      category_id: recipe.category_id,
      category_name: recipe.category_name,
      sub_category_id: recipe.sub_category_id,
      sub_category_name: recipe.sub_category_name,
      food_type: recipe.food_type,
    };
  }, [recipe]);

  useTrackEngagement(engagementData);

  const [unsaveRecipe, { isLoading: isUnsaving }] = useUnsaveRecipeMutation();
  const isUpdating = isSaving || isUnsaving;
  const [isRecipeSaved, setIsRecipeSaved] = useState(false);
  const recipeImageUrl = getImage(recipe?.image || recipe?.image_url);

  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    setShowVideo(false);
  }, [recipe?.recipe_id, recipe?.video_url]);

  const handleKeywordClick = (keyword) => {
    router.push(`/result?q=${encodeURIComponent(keyword)}`);
  };

  useEffect(() => {
    if (recipeData?.data?.is_saved !== undefined) {
      setIsRecipeSaved(!!recipeData.data.is_saved);
    }
  }, [recipeData?.data?.is_saved]);

    useEffect(() => {
      if (!recipe) return;
      const metaTitle = recipe?.meta_title 
        ? recipe.meta_title
        : (recipe?.title || "Recipe Trending");
      document.title = metaTitle;

      let metaDescriptionTag = document.querySelector('meta[name="description"]');
      if (!metaDescriptionTag) {
          metaDescriptionTag = document.createElement('meta');
          metaDescriptionTag.name = "description";
          document.head.appendChild(metaDescriptionTag);
      }
      
      const metaDesc = (recipe?.meta_description || recipe?.description || 'Delicious recipe from Recipe Trending').replace(/^"|"$/g, '').trim();
      metaDescriptionTag.setAttribute('content', metaDesc);

      let metaKeywordsTag = document.querySelector('meta[name="keywords"]');
      if (!metaKeywordsTag) {
          metaKeywordsTag = document.createElement('meta');
          metaKeywordsTag.name = "keywords";
          document.head.appendChild(metaKeywordsTag);
      }
      
      const metaKeywords = (Array.isArray(recipe?.keywords) && recipe?.keywords.length > 0) 
        ? recipe.keywords.join(', ') 
        : 'recipe, recipe trending, food, cooking';
      metaKeywordsTag.setAttribute('content', metaKeywords);

      // Meta Tags Management
      const updateTag = (attr, value, content) => {
        let tag = document.querySelector(`meta[${attr}="${value}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute(attr, value);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
      };

      updateTag('property', 'og:title', metaTitle);
      updateTag('property', 'og:description', metaDesc);
      updateTag('property', 'og:url', window.location.href);
      updateTag('property', 'og:type', 'article');
      if (recipeImageUrl) {
        updateTag('property', 'og:image', recipeImageUrl);
        updateTag('property', 'og:image:secure_url', recipeImageUrl);
        updateTag('name', 'twitter:image', recipeImageUrl);
        updateTag('itemprop', 'image', recipeImageUrl);
        
        // Also update link tags for image_src
        let imageSrcLink = document.querySelector('link[rel="image_src"]');
        if (!imageSrcLink) {
          imageSrcLink = document.createElement('link');
          imageSrcLink.rel = 'image_src';
          document.head.appendChild(imageSrcLink);
        }
        imageSrcLink.href = recipeImageUrl;
      }
      updateTag('name', 'twitter:card', 'summary_large_image');
      updateTag('name', 'twitter:title', metaTitle);
      updateTag('name', 'twitter:description', metaDesc);

      let metaAuthorTag = document.querySelector('meta[name="author"]');
      if (!metaAuthorTag) {
          metaAuthorTag = document.createElement('meta');
          metaAuthorTag.name = "author";
          document.head.appendChild(metaAuthorTag);
      }
      metaAuthorTag.setAttribute('content', 'Recipe Trending');

      let metaPublisherTag = document.querySelector('meta[name="publisher"]');
      if (!metaPublisherTag) {
          metaPublisherTag = document.createElement('meta');
          metaPublisherTag.name = "publisher";
          document.head.appendChild(metaPublisherTag);
      }
      metaPublisherTag.setAttribute('content', 'Recipe Trending');

      if (recipe?.public_approved_time) {
          let metaPublishedTimeTag = document.querySelector('meta[property="article:published_time"]');
          if (!metaPublishedTimeTag) {
              metaPublishedTimeTag = document.createElement('meta');
              metaPublishedTimeTag.setAttribute('property', "article:published_time");
              document.head.appendChild(metaPublishedTimeTag);
          }
          metaPublishedTimeTag.setAttribute('content', new Date(recipe.public_approved_time).toISOString());
      }

      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      const canonicalUrl = `https://www.recipetrending.com${window.location.pathname}`;
      canonicalLink.setAttribute('href', canonicalUrl);

      let robotsMetaTag = document.querySelector('meta[name="robots"]');
      if (!robotsMetaTag) {
        robotsMetaTag = document.createElement('meta');
        robotsMetaTag.setAttribute('name', 'robots');
        document.head.appendChild(robotsMetaTag);
      }
      robotsMetaTag.setAttribute('content', isStagingHost() ? 'noindex, nofollow' : 'index, follow');

      document.documentElement.lang = 'en';

      return () => {
        document.title = "Recipe Trending";
      };
    }, [recipe, recipeImageUrl]);

  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [showScroll, setShowScroll] = useState(false);
  const emojiSectionRef = useRef(null);
  const [stepModalOpen, setStepModalOpen] = useState(false);

  useEffect(() => {
    if (!recipe?.recipe_id || !recipe?.ingredients) return;
    const completed = JSON.parse(
      localStorage.getItem("completedRecipes") || "[]"
    );
    if (completed.includes(recipe.recipe_id)) {
      setCheckedIngredients(
        new Set(Array.from({ length: recipe.ingredients.length }, (_, i) => i))
      );
    }
  }, [recipe?.ingredients, recipe?.recipe_id]);

  const handleScroll = () => {
    if (window.scrollY > 300) {
      setShowScroll(true);
    } else {
      setShowScroll(false);
    }
  };

  const handleSaveOrUnsaveRecipe = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (!recipe?.recipe_id) {
      toast.error("Recipe not found");
      return;
    }
    try {
      if (isRecipeSaved) {
        const res = await unsaveRecipe(recipe.recipe_id).unwrap();
        if (res.success) {
          setIsRecipeSaved(false);
        }
        toast.success(res.message || "Recipe removed from saved!");
      } else {
        const res = await saveRecipe(recipe.recipe_id).unwrap();
        if (res.success) {
          setIsRecipeSaved(true);
        }
        toast.success(res.message || "Recipe saved!");
      }
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update save status");
    }
  };

  const handleShare = useCallback(async () => {
    const recipeUrl = window.location.href;
    const shortDesc = (recipe?.meta_description || recipe?.description || "").replace(/^"|"$/g, '').trim();
    const truncatedDesc = shortDesc.length > 160 ? shortDesc.substring(0, 157) + "..." : shortDesc;
    const recipeTitle = recipe?.title || "Recipe";
    const messageText = `${recipeTitle}\n\n${truncatedDesc}\n\nCheck out this recipe at Recipe Trending!\n${recipeUrl}`;

    try {
      if (navigator.share) {
        // Try sharing with image file first for better preview in WhatsApp/Social Apps
        if (recipeImageUrl) {
          try {
            const response = await fetch(recipeImageUrl, { mode: 'cors' });
            if (response.ok) {
              const blob = await response.blob();
              const ext = blob.type.split('/')[1] || 'jpg';
              const file = new File([blob], `recipe-${recipe?.recipe_id || 'share'}.${ext}`, { type: blob.type });

              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: recipeTitle,
                  text: messageText,
                  url: recipeUrl,
                  files: [file],
                });
                return;
              }
            }
          } catch (imageErr) {
            console.warn("Image sharing failed, falling back to link share:", imageErr);
          }
        }

        // Fallback to standard link share
        await navigator.share({
          title: recipeTitle,
          text: messageText,
          url: recipeUrl,
        });
      } else {
        await navigator.clipboard.writeText(recipeUrl);
        toast.success("Link copied to clipboard!", {
          position: "bottom-center",
          autoClose: 2000,
        });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error sharing:", err);
      }
    }
  }, [recipe, recipeImageUrl]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatTime = (minutes) => {
    if (!minutes || String(minutes).toLowerCase() === 'none' || String(minutes).toLowerCase() === 'null') return "N/A";
    const mins = parseInt(minutes);
    if (isNaN(mins)) return "N/A";
    if (mins < 60) {
      return `${mins} min`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  const formatQuantity = (quantity, unit) => {
    const isNone = (val) => !val || String(val).toLowerCase() === 'none' || String(val).toLowerCase() === 'null';
    const q = isNone(quantity) ? "" : formatFraction(quantity);
    const u = isNone(unit) ? "" : unit;

    if (!q && !u) return "";
    if (!q) return u;
    if (!u) return q;
    return `${q} ${u}`;
  };

  const isCheckableIngredient = (ing) => {
    const isSectionHeader =
      (ing.is_free_text && typeof ing.free_text === 'string' && ing.free_text.trim().endsWith(':')) ||
      (typeof ing.ingredient_name === 'string' && ing.ingredient_name.trim().endsWith(':'));
    return !isSectionHeader;
  };

  const handleIngredientCheck = (ingredientIndex) => {
    setCheckedIngredients((prev) => {
      const newSet = new Set(prev);
      const wasChecked = newSet.has(ingredientIndex);

      if (wasChecked) {
        newSet.delete(ingredientIndex);
        toastShownRef.current = false;
      } else {
        newSet.add(ingredientIndex);
      }

      const checkableCount = recipe?.ingredients?.filter(isCheckableIngredient).length || 0;
      const allChecked =
        newSet.size === checkableCount && checkableCount > 0;

      if (allChecked && !toastShownRef.current) {
        toastShownRef.current = true;
        if (recipe?.recipe_id) {
          const completed = JSON.parse(
            localStorage.getItem("completedRecipes") || "[]"
          );
          if (!completed.includes(recipe.recipe_id)) {
            completed.push(recipe.recipe_id);
            localStorage.setItem("completedRecipes", JSON.stringify(completed));
          }
        }
        setTimeout(() => {
          toast.success("🎉 All ingredients ready!", {
            position: "bottom-center",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: isDarkMode ? "dark" : "light",
            toastId: "ingredients-complete",
            style: {
              backgroundColor: isDarkMode ? "#10b981" : "#059669",
              color: "white",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              boxShadow: isDarkMode
                ? "0 8px 32px rgba(0, 0, 0, 0.4)"
                : "0 8px 32px rgba(0, 0, 0, 0.15)",
            },
          });
        }, 100);
      }

      return newSet;
    });
  };

  const isIngredientChecked = (ingredientIndex) => {
    return checkedIngredients.has(ingredientIndex);
  };



  if (isError || !recipe) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Alert
          severity="error"
          sx={{
            maxWidth: 400,
            borderRadius: 3,
            boxShadow: 3,
            "& .MuiAlert-message": {
              py: 2,
            },
            "& *": {
               fontFamily: "'Basic', sans-serif !important"
            }
          }}
        >
          <Typography variant="h6" gutterBottom>
            Recipe Not Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The recipe you are looking for does not exist or has been removed.
          </Typography>
        </Alert>
      </Box>
    );
  }


  return (
    <Box sx={{ 
      minHeight: '100vh',
      pt: { xs: 9, sm: 10, md: 11 },
      '@media (min-width:1140px)': {
        pt: '132px',
      },
      pb: 6,
      "& *": {
        fontFamily: "'Basic', sans-serif !important",
      }
    }}>
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">

          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 0.5,
                py: { xs: 1.5, sm: 1.5, md: 1.5 },
                mb: 0,
              }}
            >
              {[
                { label: recipe?.category_name || "Category", to: `/category/${recipe?.category_slug}` },
                ...(recipe?.sub_category_name ? [{ label: recipe.sub_category_name, to: `/category/${recipe.category_slug}/${recipe.sub_category_slug}`, grey: true }] : []),
              ].map((crumb, index) => (
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
                    <Link href={crumb.to} style={{ textDecoration: 'none' }}>
                      <Typography
                        sx={{
                          fontFamily: "'Basic', sans-serif !important",
                          fontSize: { xs: '0.85rem', md: '0.95rem' },
                          color: crumb.grey ? (isDarkMode ? '#ccc' : '#666') : '#CA6014',
                          fontWeight: crumb.grey ? 400 : 500,
                          '&:hover': { textDecoration: 'underline' },
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

            <Box sx={{ width: '100%' }}>
              <Box sx={{ 
                display: "grid", 
                gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, 
                gap: 3,
                mb: 0
              }}>
                <Box
                  sx={{
                    mb: 3,
                    p: 0,
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                    <Box
                      sx={{
                        position: "absolute",
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        background: "transparent",
                        pointerEvents: "none",
                      }}
                    />

                    {recipe?.badge && (() => {
                      const bgColor =
                        recipe.badge === 'Popular' ? '#ef4444' :
                        recipe.badge === 'Trending' ? '#3b82f6' :
                        recipe.badge === 'Beginner' ? '#10b981' :
                        recipe.badge === 'Quick' ? '#f59e0b' : '#CA6014';
                      return (
                        <Box sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mb: 1,
                          backgroundColor: bgColor,
                          borderRadius: '20px',
                          px: '10px',
                          py: '5px',
                        }}>
                          {recipe.badge === 'Popular' && <WhatshotIcon sx={{ color: '#fff', fontSize: '16px' }} />}
                          {recipe.badge === 'Trending' && <TrendingUpIcon sx={{ color: '#fff', fontSize: '16px' }} />}
                          {recipe.badge === 'Beginner' && <SchoolIcon sx={{ color: '#fff', fontSize: '16px' }} />}
                          {recipe.badge === 'Quick' && <SpeedIcon sx={{ color: '#fff', fontSize: '16px' }} />}
                          <Typography sx={{
                            color: '#fff',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            fontFamily: "'Basic', sans-serif !important",
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            lineHeight: 1,
                          }}>
                            {recipe.badge}
                          </Typography>
                        </Box>
                      );
                    })()}

                    <Box
                      sx={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="h1"
                        component="h1"
                        sx={{
                          fontFamily: "'Basic', sans-serif !important",
                          letterSpacing: '0.2px',
                          fontSize: { xs: '1.8rem', sm: '2.2rem', md: '3rem' },
                          lineHeight: 1.1,
                          color: isDarkMode ? '#FFF7EC' : '#2B2828',
                          position: "relative",
                          zIndex: 1,
                          wordWrap: "break-word",
                          overflowWrap: "break-word",
                          hyphens: "auto",
                          textAlign: "left",
                          alignSelf: "flex-start",
                          flex: 1,
                          cursor: 'default',
                          display: 'inline-block',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            width: '0%',
                            height: '3px',
                            bottom: { xs: -2, md: -4 },
                            left: 0,
                            backgroundColor: '#CA6014',
                            borderRadius: '2px',
                          },
                        }}
                        className="text-left align-self-start"
                      >
                        {recipe?.title || "Recipe Title"}
                        {recipe?.food_type && (() => {
                          const ft = (recipe.food_type || '').toLowerCase();
                          const isNonVeg = ft.includes('non');
                          const isEgg = ft.includes('egg');
                          const color = isNonVeg ? '#e53935' : isEgg ? '#ffb300' : '#43a047';
                          const label = isNonVeg ? 'Non-Veg' : isEgg ? 'Egg' : 'Veg';
                          return (
                            <Box component="span" sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              ml: 1.2,
                              verticalAlign: 'middle',
                              position: 'relative',
                              top: '-2px',
                            }}>
                              <Box component="span" sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: color,
                                display: 'inline-block',
                                flexShrink: 0,
                                boxShadow: `0 0 0 2px ${color}33`,
                              }} />
                              <Box component="span" sx={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color,
                                fontFamily: "'Basic', sans-serif !important",
                                letterSpacing: '0.5px',
                              }}>
                                {label}
                              </Box>
                            </Box>
                          );
                        })()}
                      </Typography>

                      {!authModalOpen && (
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}>
                          <Tooltip title={isRecipeSaved ? 'Saved' : 'Save this recipe'} arrow>
                            <IconButton 
                              onClick={handleSaveOrUnsaveRecipe}
                              sx={{ 
                                color: isRecipeSaved ? '#CA6014' : '#8A4A1C',
                                background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#FFF7EC',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '8px',
                                boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(202, 96, 20, 0.12)',
                                p: 1,
                                width: { xs: 42, sm: 46 },
                                height: { xs: 42, sm: 46 },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s',
                                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #FFEFD9',
                                '&:hover': {
                                  background: isDarkMode ? 'rgba(255,255,255,0.2)' : '#FFEFD9',
                                  boxShadow: isDarkMode ? 'none' : '0 4px 15px rgba(202, 96, 20, 0.18)',
                                }
                              }}
                              aria-label={isRecipeSaved ? 'Unsave this recipe' : 'Save this recipe'}
                            >
                              {isUpdating ? (
                                <CircularProgress size={24} sx={{ color: isRecipeSaved ? '#CA6014' : '#8A4A1C' }} />
                              ) : isRecipeSaved ? (
                                <BookmarkIcon sx={{ fontSize: { xs: 26, sm: 30 } }} />
                              ) : (
                                <BookmarkBorderIcon sx={{ fontSize: { xs: 26, sm: 30 } }} />
                              )}
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Share with love" arrow>
                            <IconButton 
                              onClick={handleShare}
                              sx={{ 
                                background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#FFF7EC',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '8px',
                                boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(202, 96, 20, 0.12)',
                                p: 1,
                                transition: 'all 0.2s',
                                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #FFEFD9',
                                '&:hover': {
                                  background: isDarkMode ? 'rgba(16,185,129,0.1)' : '#FFEFD9',
                                  boxShadow: isDarkMode ? 'none' : '0 4px 15px rgba(202, 96, 20, 0.18)',
                                }
                              }}
                              aria-label="Share recipe"
                            >
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '26px', height: '26px' }}>
                                <path d="M15 5L22 12L15 19V14.5C10 14.5 6.5 16 4 20C5 15 8 10 15 9V5Z" fill="#4D9CFF"/>
                              </svg>
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>

                    {recipe?.description && (
                      <Box
                        sx={{
                          position: "relative",
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "'Basic', sans-serif !important",
                            fontSize: { xs: "0.9rem", md: "1.05rem" },
                            lineHeight: 1.6,
                            position: "relative",
                            zIndex: 1,
                            display: "-webkit-box",
                            WebkitLineClamp: {
                              xs: "unset",
                              sm: isDescExpanded ? "unset" : 8,
                            },
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textAlign: "left",
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                            maxWidth: 800,
                          }}
                        >
                          {recipe.description.replace(/^"|"$/g, '').trim()}
                        </Typography>
                        {recipe.description.trim().split(/\s+/).length > 30 && (
                          <Button
                            onClick={() => setIsDescExpanded((v) => !v)}
                            size="small"
                            sx={{
                              mt: 0.5,
                              px: 1,
                              minWidth: "auto",
                              textTransform: "none",
                              fontWeight: 700,
                              color: isDarkMode ? "#f4c542" : "#e06b00",
                              display: { xs: "none", sm: "none" },
                            }}
                          >
                            {isDescExpanded ? "See less" : "See more"}
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  mb: 2,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
                  gap: 3,
                  alignItems: "stretch",
                }}
              >
                <Box>

                        <Card
                          sx={{
                            backgroundColor: isDarkMode ? "grey.800" : "white",
                            background: isDarkMode
                              ? "linear-gradient(145deg, #1e293b 0%, #334155 100%)"
                              : "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                            border: "none",
                            borderRadius: 0,
                            boxShadow: "none",
                            overflow: "hidden",
                            height: "100%",
                            minHeight: { xs: "auto", lg: "400px" },
                            transition: "all 0.3s ease",
                          }}
                        >
                          <Box
                              sx={{
                                position: "relative",
                                width: "100%",
                                paddingTop: { xs: "54%", sm: "58%", md: "58%" },
                              }}
                            >
                              <Image
                                src={recipeImageUrl || "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&h=600&fit=crop"}
                                alt={recipe.title || "Recipe Image"}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                style={{
                                  objectFit: "cover",
                                  objectPosition: "center",
                                  transition: "transform 0.5s ease-in-out",
                                }}
                                priority
                              />
                            </Box>
                        </Card>

                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
                      gap: 3,
                      alignItems: "start",
                    }}
                  >
                    <Box>

                        <Card
                          sx={{
                            backgroundColor: "transparent",
                            background: "transparent",
                            border: "none",
                            borderRadius: 0,
                            boxShadow: "none",
                            overflow: "visible",
                            transition: "all 0.3s ease",
                          }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              mb: 3,
                              backgroundColor: isDarkMode ? "#1E1E1E" : "white",
                              borderRadius: 0,
                              overflow: "hidden",
                              border: isDarkMode
                                ? "1px solid #333333"
                                : "1px solid #e5e7eb",
                              width: "100%",
                              maxWidth: "100%",
                              boxShadow: "none",
                            }}
                          >
                            <Box
                              sx={{
                                height: 4,
                                background:
                                  "linear-gradient(90deg, #e06b00, #f4c542)",
                                width: "100%",
                              }}
                            />

                            <Box sx={{ px: { xs: 0.5, sm: 3, md: 8, lg: 12 }, py: 2.2 }}>
                              <Box className={`grid ${recipe.rest_time > 0 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'} gap-x-2 gap-y-3 sm:gap-3`}>
                                <Box className="flex items-center space-x-1 sm:space-x-2">
                                  <TimerIcon
                                    sx={{
                                      fontSize: "1.4rem",
                                      color: isDarkMode ? "#fbbf24" : "#f59e42",
                                    }}
                                    className={
                                      isDarkMode
                                        ? "text-amber-400"
                                        : "text-amber-500"
                                    }
                                  />
                                  <span
                                    className={`text-[0.82rem] sm:text-base font-medium ${
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    Prep:
                                  </span>
                                  <span
                                    className={`text-[0.82rem] sm:text-base font-medium ml-0.5 sm:ml-1 ${
                                      isDarkMode ? "text-white" : "text-black"
                                    }`}
                                  >
                                    {formatTime(recipe.prep_time)}
                                  </span>
                                </Box>

                                <Box className="flex items-center space-x-1 sm:space-x-2">
                                  <Box sx={{ lineHeight: 0 }}>
                                    <Icon
                                      path={mdiChefHat}
                                      size={0.7}
                                      style={{
                                        color: isDarkMode ? "#34d399" : "#059669",
                                      }}
                                      className={
                                        isDarkMode
                                          ? "text-emerald-400"
                                          : "text-emerald-600"
                                      }
                                    />
                                  </Box>
                                  <span
                                    className={`text-[0.82rem] sm:text-base font-medium ${
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    Cook:
                                  </span>
                                  <span
                                    className={`text-[0.82rem] sm:text-base font-medium ml-0.5 sm:ml-1 ${
                                      isDarkMode ? "text-white" : "text-black"
                                    }`}
                                  >
                                    {formatTime(recipe.cook_time)}
                                  </span>
                                </Box>

                                {recipe.rest_time > 0 && (
                                  <Box className="flex items-center space-x-1 sm:space-x-2">
                                    <HourglassEmptyIcon
                                      sx={{
                                        fontSize: "1.4rem",
                                        color: isDarkMode ? "#f472b6" : "#db2777",
                                      }}
                                      className={
                                        isDarkMode
                                          ? "text-pink-400"
                                          : "text-pink-600"
                                      }
                                    />
                                    <span
                                      className={`text-[0.82rem] sm:text-base font-medium ${
                                        isDarkMode
                                          ? "text-gray-300"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      Rest:
                                    </span>
                                    <span
                                      className={`text-[0.82rem] sm:text-base font-medium ml-0.5 sm:ml-1 ${
                                        isDarkMode ? "text-white" : "text-black"
                                      }`}
                                    >
                                      {formatTime(recipe.rest_time)}
                                    </span>
                                  </Box>
                                )}

                                <Box className="flex items-center space-x-1 sm:space-x-2">
                                  <AccessTimeIcon
                                    sx={{
                                      fontSize: "1.4rem",
                                      color: isDarkMode ? "#38bdf8" : "#0ea5e9",
                                    }}
                                    className={
                                      isDarkMode
                                        ? "text-sky-400"
                                        : "text-sky-500"
                                    }
                                  />
                                  <span
                                    className={`text-[0.82rem] sm:text-base font-medium ${
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    Total:
                                  </span>
                                  <span
                                    className={`text-[0.82rem] sm:text-base font-medium ml-0.5 sm:ml-1 ${
                                      isDarkMode ? "text-white" : "text-black"
                                    }`}
                                  >
                                    {formatTime(
                                      (recipe.prep_time || 0) +
                                        (recipe.cook_time || 0) +
                                        (recipe.rest_time || 0)
                                    )}
                                  </span>
                                </Box>

                                <Box className="flex items-center space-x-1 sm:space-x-2">
                                  <PeopleIcon
                                    sx={{
                                      fontSize: { xs: "1.15rem", sm: "1.4rem" },
                                      color: isDarkMode ? "#a78bfa" : "#7c3aed",
                                    }}
                                    className={
                                      isDarkMode
                                        ? "text-violet-400"
                                        : "text-violet-600"
                                    }
                                  />
                                  <span
                                    className={`text-[0.82rem] sm:text-base font-medium ${
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    Serves:
                                  </span>
                                  <span
                                    className={`text-[0.82rem] sm:text-base font-medium ml-0.5 sm:ml-1 ${
                                      isDarkMode ? "text-white" : "text-black"
                                    }`}
                                  >
                                    {recipe.serving_size && String(recipe.serving_size).toLowerCase() !== 'none' && String(recipe.serving_size).toLowerCase() !== 'null' ? recipe.serving_size : "N/A"}
                                  </span>
                                </Box>
                              </Box>
                            </Box>
                          </Paper>

                          {recipe?.note && recipe.note.trim() !== "" && recipe.note.toLowerCase() !== "null" && (
                            <Box
                              sx={{
                                w: "100%",
                                mb: 3,
                                p: 2.5,
                                borderRadius: 0,
                                border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                                background: isDarkMode ? "#1e293b" : "#f8fafc",
                                transition: "all 0.3s ease",
                              }}
                            >
                              <div className="flex items-center mb-2">
                                <LightbulbOutlinedIcon
                                  className={`mr-2 text-[1.4rem] ${
                                    isDarkMode
                                      ? "text-amber-400"
                                      : "text-amber-600"
                                  }`}
                                />
                                <span
                                  className={`font-bold tracking-wide text-base ${
                                    isDarkMode
                                      ? "text-white"
                                      : "text-slate-900"
                                  }`}
                                  style={{
                                    fontFamily: "'Basic', sans-serif !important",
                                  }}
                                >
                                  Special Note by chef:
                                </span>
                              </div>
                              <div
                                className={`text-[0.95rem] whitespace-pre-line text-left leading-relaxed ${
                                  isDarkMode ? "text-slate-300" : "text-slate-600"
                                }`}
                              >
                                {recipe.note}
                              </div>
                            </Box>
                          )}
                          <Box sx={{ mt: 2, mb: 3, display: 'flex', gap: 0.75, flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                background: isDarkMode ? '#23272f' : '#f1f5f9',
                                border: `1.5px solid ${isWakeLockActive ? '#22c55e' : (isDarkMode ? '#334155' : '#cbd5e1')}`,
                                borderRadius: 3,
                                px: 2,
                                py: 1,
                                boxShadow: isWakeLockActive ? '0 2px 8px 0 #22c55e33' : 'none',
                                transition: 'all 0.2s',
                              }}
                            >
                              <span style={{ fontWeight: 500, fontSize: '1.08rem', marginRight: 12, color: isDarkMode ? '#fff' : '#0f172a' }}>
                                Keep Screen Awake
                              </span>
                              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={isWakeLockActive}
                                  onChange={handleWakeLock}
                                  style={{ display: 'none' }}
                                />
                                <span
                                  style={{
                                    width: 58,
                                    height: 26,
                                    background: isWakeLockActive ? '#22c55e' : (isDarkMode ? '#334155' : '#cbd5e1'),
                                    borderRadius: 24,
                                    position: 'relative',
                                    transition: 'background 0.2s',
                                    display: 'inline-block',
                                    flexShrink: 0,
                                  }}
                                >
                                  <span style={{ 
                                    position: 'absolute',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    left: isWakeLockActive ? 8 : 'auto',
                                    right: isWakeLockActive ? 'auto' : 7,
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    color: isWakeLockActive ? '#fff' : (isDarkMode ? '#cbd5e1' : '#64748b'),
                                    pointerEvents: 'none',
                                    transition: 'all 0.2s'
                                  }}>
                                    {isWakeLockActive ? 'ON' : 'OFF'}
                                  </span>
                                  <span
                                    style={{
                                      position: 'absolute',
                                      left: isWakeLockActive ? 34 : 2,
                                      top: 2,
                                      width: 22,
                                      height: 22,
                                      background: '#fff',
                                      borderRadius: '50%',
                                      boxShadow: '0 1px 4px #0002',
                                      transition: 'left 0.2s',
                                    }}
                                  />
                                </span>
                              </label>
                            </Box>
                            <span
                              style={{ fontSize: '0.8rem', marginLeft: '2px', color: isDarkMode ? '#B3B3B3' : 'rgba(0,0,0,0.6)' }}
                            >
                              <em>Note: This will be reset if you refresh or leave the page.</em>
                            </span>
                          </Box>
                          <Box sx={{ mb: 4 }}>
                            <Box
                              sx={{
                                  display: { xs: "block", md: "flex" },
                                gap: 3,
                                alignItems: "flex-start",
                              }}
                            >
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                {recipe.ingredients &&
                                  recipe.ingredients.length > 0 && (
                                    <Box>
                                      <Box sx={{ mb: 3 }}>
                                        <Typography
                                          variant="h4"
                                          sx={{
                                            fontFamily:
                                              "'Basic', sans-serif !important",
                                            fontWeight: 600,
                                            color: isDarkMode
                                              ? "#EAEAEA"
                                              : "#111111",
                                            letterSpacing: "1px",
                                          }}
                                          className="text-3xl md:text-4xl"
                                        >
                                          Ingredients
                                           {checkedIngredients.size === recipe?.ingredients?.filter(isCheckableIngredient).length && recipe?.ingredients?.length > 0 && (
                                             <svg
                                               xmlns="http://www.w3.org/2000/svg"
                                               className="h-6 w-6 text-green-500 inline-block ml-2"
                                               fill="none"
                                               viewBox="0 0 24 24"
                                               stroke="currentColor"
                                               strokeWidth="2"
                                             >
                                               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                             </svg>
                                           )}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 1.5,
                                          ...(recipe.ingredients.length > 10 && {
                                            maxHeight: 480,
                                            overflowY: 'auto',
                                            pr: 1,
                                          }),
                                        }}
                                      >
                                        {recipe.ingredients.map(
                                          (ingredient, index) => {
                                            const isSectionHeader =
                                              (ingredient.is_free_text &&
                                              typeof ingredient.free_text === 'string' &&
                                              ingredient.free_text.trim().endsWith(':')) ||
                                              (typeof ingredient.ingredient_name === 'string' &&
                                              ingredient.ingredient_name.trim().endsWith(':'));

                                            if (isSectionHeader) {
                                              return (
                                                <Box
                                                  key={index}
                                                  sx={{
                                                    mt: 1.5,
                                                    mb: 0.5,
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      backgroundColor: isDarkMode
                                                        ? 'rgba(245, 158, 11, 0.15)'
                                                        : 'rgba(245, 158, 11, 0.1)',
                                                      borderLeft: `3px solid ${isDarkMode ? '#f59e0b' : '#d97706'}`,
                                                      padding: '6px 14px',
                                                      borderRadius: '0 4px 4px 0',
                                                    }}
                                                  >
                                                    <Typography
                                                      variant="body1"
                                                      sx={{
                                                        fontFamily: "'Basic', sans-serif !important",
                                                        fontWeight: 700,
                                                        fontSize: '1rem',
                                                        color: isDarkMode ? '#fcd34d' : '#92400e',
                                                        letterSpacing: '0.3px',
                                                      }}
                                                    >
                                                      {ingredient.free_text || ingredient.ingredient_name}
                                                    </Typography>
                                                  </div>
                                                </Box>
                                              );
                                            }

                                            const isChecked =
                                              isIngredientChecked(index);
                                            return (
                                              <Box
                                                key={index}
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  py: 1,
                                                  borderBottom: "1px solid",
                                                  borderColor: isDarkMode
                                                    ? "rgba(255,255,255,0.1)"
                                                    : "rgba(0,0,0,0.1)",
                                                  "&:last-child": {
                                                    borderBottom: "none",
                                                  },
                                                  transition:
                                                    "opacity 0.3s ease",
                                                  opacity: isChecked ? 0.6 : 1,
                                                }}
                                              >
                                                <Checkbox
                                                  checked={isChecked}
                                                  onChange={() =>
                                                    handleIngredientCheck(index)
                                                  }
                                                  sx={{
                                                    color: isDarkMode
                                                      ? "#9ca3af"
                                                      : "#6b7280",
                                                    "&.Mui-checked": {
                                                      color: isDarkMode
                                                        ? "#9ca3af"
                                                        : "#6b7280",
                                                    },
                                                    "&:hover": {
                                                      backgroundColor:
                                                        isDarkMode
                                                          ? "rgba(156, 163, 175, 0.1)"
                                                          : "rgba(107, 114, 128, 0.1)",
                                                      transform: "scale(1.05)",
                                                    },
                                                     ml: 0,
                                                     mr: 1.5,
                                                     p: 0,
                                                     borderRadius: 1.5,
                                                    transition:
                                                      "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    "& .MuiSvgIcon-root": {
                                                      fontSize: "1.3rem",
                                                    },
                                                  }}
                                                />
                                                <Typography
                                                  variant="body1"
                                                  sx={{
                                                    color: isChecked
                                                      ? isDarkMode
                                                        ? "rgba(255,255,255,0.5)"
                                                        : "rgba(0,0,0,0.5)"
                                                      : "text.primary",
                                                    lineHeight: 1.5,
                                                    fontSize: "1rem",
                                                    fontWeight: 400,
                                                    textDecoration: isChecked
                                                      ? "line-through"
                                                      : "none",
                                                    transition:
                                                      "color 0.3s ease, text-decoration 0.3s ease",
                                                    flex: 1,
                                                  }}
                                                >
                                                  {ingredient.is_free_text ? (
                                                    ingredient.free_text && String(ingredient.free_text).toLowerCase() !== 'none' && String(ingredient.free_text).toLowerCase() !== 'null' ? (
                                                      <Box
                                                        component="span"
                                                        sx={{
                                                          color: isChecked
                                                            ? isDarkMode
                                                              ? "rgba(234, 234, 234, 0.5)"
                                                              : "rgba(30, 41, 59, 0.5)"
                                                            : isDarkMode
                                                            ? "#EAEAEA"
                                                            : "#1e293b",
                                                          fontWeight: 500,
                                                          fontSize: "1.1rem",
                                                        }}
                                                      >
                                                        {ingredient.free_text}
                                                      </Box>
                                                    ) : null
                                                  ) : (
                                                    <>
                                                      {formatQuantity(ingredient.quantity, ingredient.unit) && (
                                                        <>
                                                          <Box
                                                            component="span"
                                                            sx={{
                                                              fontWeight: 700,
                                                              color: isChecked
                                                                ? isDarkMode
                                                                  ? "rgba(177, 120, 81, 0.5)"
                                                                  : "rgba(177, 120, 81, 0.5)"
                                                                : isDarkMode
                                                                ? "#B17851"
                                                                : "#B17851",
                                                              fontSize: "1.1rem",
                                                              letterSpacing: "0.5px",
                                                              transition:
                                                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                              "&:hover": {
                                                                color: isDarkMode
                                                                  ? "#B17851"
                                                                  : "#B17851",
                                                                transform:
                                                                  "translateY(-1px)",
                                                              },
                                                            }}
                                                          >
                                                            {formatQuantity(
                                                              ingredient.quantity,
                                                              ingredient.unit
                                                            )}
                                                          </Box>{" "}
                                                        </>
                                                      )}
                                                      <Box
                                                        component="span"
                                                        sx={{
                                                          color: isChecked
                                                            ? isDarkMode
                                                              ? "rgba(156, 163, 175, 0.6)"
                                                              : "rgba(107, 114, 128, 0.6)"
                                                            : isDarkMode
                                                            ? "#EAEAEA"
                                                            : "#1e293b",
                                                          fontWeight: 500,
                                                          fontSize: "1.1rem",
                                                          transition:
                                                            "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                          "&:hover": {
                                                            color: isDarkMode
                                                              ? "#ffffff"
                                                              : "#0f172a",
                                                            transform:
                                                              "translateY(-1px)",
                                                          },
                                                        }}
                                                      >
                                                        {ingredient.ingredient_name}
                                                      </Box>
                                                    </>
                                                  )}
                                                </Typography>
                                                {isChecked && (
                                                  <CheckIcon
                                                    sx={{
                                                      color: isDarkMode
                                                        ? "#14b8a6"
                                                        : "#0d9488",
                                                      fontSize: "1.5rem",
                                                      ml: 1,
                                                      animation:
                                                        "checkmarkBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                                                      "@keyframes checkmarkBounce":
                                                        {
                                                          "0%": {
                                                            transform:
                                                              "scale(0) rotate(-45deg)",
                                                            opacity: 0,
                                                            filter: "blur(4px)",
                                                          },
                                                          "20%": {
                                                            transform:
                                                              "scale(0.3) rotate(-30deg)",
                                                            opacity: 0.3,
                                                            filter: "blur(2px)",
                                                          },
                                                          "40%": {
                                                            transform:
                                                              "scale(0.8) rotate(-15deg)",
                                                            opacity: 0.7,
                                                            filter: "blur(1px)",
                                                          },
                                                          "60%": {
                                                            transform:
                                                              "scale(1.3) rotate(0deg)",
                                                            opacity: 1,
                                                            filter: "blur(0px)",
                                                          },
                                                          "80%": {
                                                            transform:
                                                              "scale(0.9) rotate(0deg)",
                                                            opacity: 1,
                                                            filter: "blur(0px)",
                                                          },
                                                          "100%": {
                                                            transform:
                                                              "scale(1) rotate(0deg)",
                                                            opacity: 1,
                                                            filter: "blur(0px)",
                                                          },
                                                        },
                                                      "&:hover": {
                                                        transform: "scale(1.1)",
                                                        transition:
                                                          "transform 0.2s ease",
                                                      },
                                                    }}
                                                  />
                                                )}
                                              </Box>
                                            );
                                          }
                                        )}
                                      </Box>
                                    </Box>
                                  )}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0, mt: { xs: 4, sm: 0 } }}>
                                {recipe.instructions &&
                                  recipe.instructions.length > 0 && (
                                    <Box>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          mb: 3,
                                          gap: 0.5,
                                        }}
                                      >
                                        <div className="flex items-center justify-between w-full gap-4 mb-2">
                                          <Typography
                                            variant="h4"
                                            sx={{
                                              fontFamily:
                                                "'Basic', sans-serif !important",
                                              fontWeight: 600,
                                              color: isDarkMode
                                                ? "#EAEAEA"
                                                : "#111111",
                                              letterSpacing: "1px",
                                            }}
                                            className="text-3xl md:text-4xl"
                                          >
                                             Instructions
                                            </Typography>
                                          <Tooltip title="View step-by-step directions" arrow>
                                            <button
                                              className="ml-2 p-2 rounded-lg text-white font-semibold shadow transition-all duration-200 focus:outline-none flex items-center justify-center"
                                              style={{
                                                backgroundColor: "#3B82F6",
                                                cursor: "pointer",
                                                outline: "none",
                                                border: "none",
                                                WebkitTapHighlightColor: "transparent",
                                              }}
                                              onMouseOver={(e) =>
                                                (e.currentTarget.style.backgroundColor =
                                                  "#2563EB")
                                              }
                                              onMouseOut={(e) =>
                                                (e.currentTarget.style.backgroundColor =
                                                  "#3B82F6")
                                              }
                                              onClick={() =>
                                                setStepModalOpen(true)
                                              }
                                            >
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M5 3v18l15-9L5 3z"
                                                />
                                              </svg>
                                            </button>
                                          </Tooltip>
                                        </div>
                                        <StepByStepModal
                                          open={stepModalOpen}
                                          onClose={() =>
                                            setStepModalOpen(false)
                                          }
                                          instructions={recipe.instructions.map(
                                            (i) => i.instruction_text || i
                                          )}
                                          recipeTitle={recipe.title}
                                          isWakeLockActive={isWakeLockActive}
                                          onToggleWakeLock={handleWakeLock}
                                        />
                                      </Box>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 2.5,
                                        }}
                                      >
                                        {(() => {
                                          let subStepCounter = 0;
                                          return recipe.instructions.map(
                                            (instruction, index) => {
                                              const text =
                                                typeof instruction === 'string'
                                                  ? instruction
                                                  : instruction?.instruction_text ||
                                                    instruction?.text ||
                                                    '';

                                              const isStepHeader = /^step\s+\d+/i.test(text.trim());

                                              if (isStepHeader) {
                                                subStepCounter = 0;
                                                const match = text.match(/^(step\s+\d+)\s*[:\-–—]?\s*(.*)/i);
                                                const stepLabel = match ? match[1] : text;
                                                const stepTitle = match ? match[2] : '';

                                                return (
                                                  <Box
                                                    key={index}
                                                    sx={{ mt: index === 0 ? 0 : 2, mb: 1 }}
                                                  >
                                                    <div
                                                      style={{
                                                        backgroundColor: isDarkMode
                                                          ? 'rgba(255, 140, 0, 0.1)'
                                                          : 'rgba(255, 140, 0, 0.07)',
                                                        borderLeft: '4px solid #FF8C00',
                                                        borderRadius: '0 6px 6px 0',
                                                        padding: '8px 14px',
                                                      }}
                                                    >
                                                      <Typography
                                                        sx={{
                                                          fontFamily: "'Basic', sans-serif !important",
                                                          fontWeight: 700,
                                                          fontSize: '1.05rem',
                                                          color: isDarkMode ? '#fbbf24' : '#b45309',
                                                          letterSpacing: '0.3px',
                                                          lineHeight: 1.4,
                                                        }}
                                                      >
                                                        <Box component="span" sx={{ textTransform: 'capitalize' }}>
                                                          {stepLabel}
                                                        </Box>
                                                        {stepTitle && (
                                                          <Box component="span" sx={{ color: isDarkMode ? '#e5e7eb' : '#1e293b', fontWeight: 600, ml: 1 }}>
                                                            — {stepTitle}
                                                          </Box>
                                                        )}
                                                      </Typography>
                                                    </div>
                                                  </Box>
                                                );
                                              }

                                              subStepCounter += 1;
                                              const displayNum = subStepCounter;

                                              return (
                                                <Box
                                                  key={index}
                                                  sx={{
                                                    display: 'flex',
                                                    gap: 2,
                                                    alignItems: 'flex-start',
                                                  }}
                                                >
                                                  <Typography
                                                    sx={{
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      color: isDarkMode ? '#FF8C00' : '#CA6014',
                                                      background: isDarkMode ? 'rgba(255, 140, 0, 0.1)' : 'rgba(202, 96, 20, 0.05)',
                                                      border: `2px solid ${isDarkMode ? 'rgba(255, 140, 0, 0.3)' : 'rgba(202, 96, 20, 0.2)'}`,
                                                      fontWeight: 800,
                                                      fontSize: '0.95rem',
                                                      flexShrink: 0,
                                                      mt: 0.5,
                                                      minWidth: '34px',
                                                      minHeight: '34px',
                                                      borderRadius: '10px',
                                                      mr: 1,
                                                      textAlign: 'center',
                                                      lineHeight: 1,
                                                      userSelect: 'none',
                                                      fontFamily: "'Basic', sans-serif !important",
                                                    }}
                                                  >
                                                    {displayNum}
                                                  </Typography>
                                                  <Typography
                                                    variant="body1"
                                                    sx={{
                                                      color: isDarkMode ? '#EAEAEA' : '#1e293b',
                                                      lineHeight: 1.6,
                                                      fontSize: '1.1rem',
                                                      fontWeight: 500,
                                                      transition: 'all 0.3s ease',
                                                      flex: 1,
                                                    }}
                                                  >
                                                    {text}
                                                  </Typography>
                                                </Box>
                                              );
                                            }
                                          );
                                        })()}
                                      </Box>
                                    </Box>
                                  )}
                              </Box>
                            </Box>
                          </Box>
                          {recipe.ingredients &&
                            recipe.ingredients.length > 0 && (
                              <>
                                <div ref={emojiSectionRef} />

                                <NutritionInfoSection
                                  recipeSlug={recipeSlug}
                                  servings={recipe.serving_size}
                                />
                              </>
                            )}
                        </Card>

                </Box>
              </Box>
                <Box sx={{ mt: 3, width: '100%' }}>
                  {recipe?.keywords && recipe.keywords.length > 0 && (
                    <Box sx={{ mt: 0, mb: 1.5 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          color: isDarkMode ? '#EAEAEA' : '#374151',
                          fontFamily: "'Basic', sans-serif !important",
                          mb: 2,
                          fontSize: '1.1rem'
                        }}
                      >
                        Keywords for this recipe:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        {recipe.keywords.map((kw, i) => (
                          <Box
                            key={i}
                            component="span"
                            onClick={() => handleKeywordClick(kw)}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 2,
                              py: 0.8,
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              borderRadius: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              userSelect: 'none',
                              color: isDarkMode ? '#FFB870' : '#CA6014',
                              backgroundColor: isDarkMode ? 'rgba(202, 96, 20, 0.1)' : '#FFF7EC',
                              border: `1.5px solid ${isDarkMode ? 'rgba(202, 96, 20, 0.2)' : '#FFEFD9'}`,
                              '&:hover': {
                                color: '#fff',
                                backgroundColor: '#CA6014',
                                borderColor: '#CA6014',
                                boxShadow: isDarkMode 
                                  ? '0 8px 16px -4px rgba(0, 0, 0, 0.5), 0 0 12px rgba(202, 96, 20, 0.3)'
                                  : '0 8px 16px -4px rgba(202, 96, 20, 0.2)',
                                '& .hash': {
                                  color: '#fff',
                                  opacity: 1,
                                }
                              },
                              '& .hash': {
                                color: isDarkMode ? '#FFB870' : '#CA6014',
                                opacity: 0.6,
                                mr: 0.5,
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                transition: 'all 0.3s ease',
                              }
                            }}
                          >
                            <span className="hash">#</span>
                            {kw}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>



          <AuthModal
            open={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />

          {recipe?.recipe_id && !authModalOpen && (
            <Zoom in={showScroll}>
              <Box
                sx={{
                  position: 'fixed',
                  right: { xs: 14, sm: 22 },
                  bottom: { xs: 18, sm: 24 },
                  zIndex: 1400,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.2,
                }}
              >
                {!isRecipeSaved && (
                  <Tooltip title="Save this recipe" arrow placement="left">
                    <Fab
                      size="medium"
                      onClick={handleSaveOrUnsaveRecipe}
                      aria-label="Save this recipe"
                      sx={{
                        width: 52,
                        height: 52,
                        minHeight: 52,
                        color: '#8A4A1C',
                        background: isDarkMode ? 'rgba(23, 23, 23, 0.92)' : '#FFF7EC',
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.14)' : '1px solid #FFEFD9',
                        boxShadow: isDarkMode
                          ? '0 8px 20px rgba(0,0,0,0.45)'
                          : '0 8px 20px rgba(202, 96, 20, 0.22)',
                        '&:hover': {
                          background: isDarkMode ? 'rgba(255,255,255,0.14)' : '#FFEFD9',
                        },
                      }}
                    >
                      {isUpdating ? (
                        <CircularProgress size={22} sx={{ color: '#8A4A1C' }} />
                      ) : (
                        <BookmarkBorderIcon sx={{ fontSize: 28 }} />
                      )}
                    </Fab>
                  </Tooltip>
                )}

                <Tooltip title="Share recipe" arrow placement="left">
                  <Fab
                    size="medium"
                    onClick={handleShare}
                    aria-label="Share recipe"
                    sx={{
                      width: 52,
                      height: 52,
                      minHeight: 52,
                      background: isDarkMode ? 'rgba(23, 23, 23, 0.92)' : '#FFF7EC',
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.14)' : '1px solid #FFEFD9',
                      boxShadow: isDarkMode
                        ? '0 8px 20px rgba(0,0,0,0.45)'
                        : '0 8px 20px rgba(202, 96, 20, 0.22)',
                      '&:hover': {
                        background: isDarkMode ? 'rgba(16,185,129,0.18)' : '#FFEFD9',
                      },
                    }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 5L22 12L15 19V14.5C10 14.5 6.5 16 4 20C5 15 8 10 15 9V5Z" fill="#4D9CFF"/>
                    </svg>
                  </Fab>
                </Tooltip>
              </Box>
            </Zoom>
          )}


          {recipe?.recipe_id && (
            <React.Suspense fallback={<RecipeGridSkeleton count={4} mobileLayout="vertical" />}> 
              <RecipeSuggestions
                recipeId={recipe.recipe_id}
                isDarkMode={isDarkMode}
                foodType={recipe.food_type}
                initialSuggestions={initialSuggestions}
                initialFallback={initialFallback}
                mobileLayout="vertical"
              />
            </React.Suspense>
          )}

        </Box>

      </div>
    </Box>
  );
};

export default RecipeDetail;


