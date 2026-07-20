"use client";
import Link from 'next/link';
import Image from 'next/image';

import React, { useState } from 'react';
import { Box, Typography, IconButton, Chip, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import SpeedIcon from '@mui/icons-material/Speed';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { getImage } from '../../utils/helper';
import noImageFound from '../../assets/no-image-found.png';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/useUser';
import AuthModal from '../AuthModal';
import { useSaveRecipeMutation, useUnsaveRecipeMutation } from '../../features/api/recipeDetailsApi';
import { toast } from '../../utils/toast';

const RecipeCard = ({ recipe, mobileLayout = 'horizontal', onSaveChange, showRemoveIcon = false, hideBadge = false, hideVideoIcon = false }) => {
  const { isDarkMode } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [saveRecipe, { isLoading: isSaving }] = useSaveRecipeMutation();
  const [unsaveRecipe, { isLoading: isUnsaving }] = useUnsaveRecipeMutation();
  const isUpdating = isSaving || isUnsaving;
  const initialSaved = typeof recipe.is_saved === 'boolean' ? recipe.is_saved : showRemoveIcon;
  const [isSaved, setIsSaved] = useState(initialSaved);


  const imgUrl = getImage(recipe?.image || recipe?.image_url);
  const imageSrc = imgUrl || noImageFound;
  const name = recipe.title || recipe.name;
  const recipeId = recipe.recipe_id || recipe.id;
  const linkPath = `/${recipe.slug}`;
  const category = recipe.sub_category_name || recipe.category_name || recipe.category || 'Quick Snacks';
  const foodTypeRaw = recipe.food_type || recipe.foodType || '';
  const foodTypeText = (() => {
    const value = String(foodTypeRaw || '').trim().toLowerCase();
    if (!value) return '';
    if (value === 'veg') return 'Veg';
    if (value === 'egg') return 'Egg';
    return value
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('-');
  })();
  const isMobileVertical = mobileLayout === 'vertical';

  const handleShare = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const url = `${window.location.origin}${linkPath}`;
    const shortDesc = (recipe.meta_description || recipe.description || "").replace(/^"|"$/g, '').trim();
    const truncatedDesc = shortDesc.length > 160 ? shortDesc.substring(0, 157) + "..." : shortDesc;
    const messageText = `${name}\n\n${truncatedDesc}\n\nCheck out this recipe at Recipe Trending!`;

    try {
      if (navigator.share) {
        if (imgUrl) {
          try {
            const response = await fetch(imgUrl, { mode: 'cors' });
            if (response.ok) {
              const blob = await response.blob();
              const ext = blob.type.split('/')[1] || 'jpg';
              const file = new File([blob], `recipe-${recipeId}.${ext}`, { type: blob.type });

              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: name,
                  text: messageText,
                  url: url,
                  files: [file],
                });
                return;
              }
            }
          } catch (err) {
            console.warn("Card image share failed:", err);
          }
        }
        await navigator.share({
          title: name,
          text: messageText,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error sharing:", err);
      }
    }
  };

  const handleCategoryClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();

    if (recipe.sub_category_slug) {
      router.push(`/category/${recipe.category_slug}/${recipe.sub_category_slug}`);
    } else if (recipe.category_slug) {
      router.push(`/category/${recipe.category_slug}`);
    }
  };

  const handleSaveClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    try {
      if (isSaved) {
        const response = await unsaveRecipe(recipeId).unwrap();
        if (response.success) {
          setIsSaved(false);
          if (onSaveChange) {
            onSaveChange(false, recipeId);
          }
        }
      } else {
        const response = await saveRecipe(recipeId).unwrap();
        if (response.success) {
          setIsSaved(true);
          if (onSaveChange) {
            onSaveChange(true, recipeId);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to save recipe');
    }
  };

  return (
    <>
      <Link href={linkPath} className="recipe-card-container" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            width: '100%', 
            borderRadius: { xs: '16px', sm: '20px', md: '24px' },
            overflow: 'hidden',
            backgroundColor: isDarkMode ? '#301400' : '#FFEFD9',
            border: isDarkMode ? '1px solid #555555' : '1px solid #CA6014',
            display: 'flex',
            flexDirection: isMobileVertical ? 'column' : { xs: 'row', sm: 'column' },
            transition: 'none',
            gap: isMobileVertical ? 0 : { xs: 1, sm: 0 },
            p: isMobileVertical ? 0 : { xs: 0.75, sm: 0 },
            '&:hover .recipe-card-image': {
              transform: 'scale(1.1) !important',
            },
            '&:hover .recipe-card-image-youtube': {
              transform: 'scale(1.23) !important',
            }
          }}
        >

          <Box sx={{ display: isMobileVertical ? 'none' : { xs: 'flex', sm: 'none' }, position: 'relative', width: '108px', height: '108px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden' }}>
            <Image
              src={imageSrc}
              alt={name}
              title={name}
              fill
              sizes="(max-width: 600px) 108px, 108px"
              className={imageSrc && (imageSrc.includes('ytimg.com') || imageSrc.includes('youtube')) ? "recipe-card-image-youtube" : "recipe-card-image"}
              onError={(event) => {
                event.currentTarget.src = noImageFound;
              }}
              style={{
                objectFit: 'cover',
                transition: 'transform 0.5s ease',
              }}
              loading="lazy"
            />
            {recipe.is_video && !hideVideoIcon && (
              <Box
                sx={{
                  width: '28px',
                  height: '28px',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'rgba(255, 246, 234, 0.45)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(3px)',
                  border: '1px solid rgba(255, 246, 234, 0.7)'
                }}
              >
                <PlayArrowIcon sx={{ color: '#FFF6EA', fontSize: '20px' }} />
              </Box>
            )}
          </Box>

          <Box sx={{ display: isMobileVertical ? 'none' : { xs: 'flex', sm: 'none' }, flexDirection: 'column', flex: 1, justifyContent: 'space-between', minWidth: 0 }}>
            <Box sx={{ mb: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                <Typography
                  sx={{
                    fontFamily: "'Basic', sans-serif !important",
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    color: isDarkMode ? '#FFEFD9' : '#6C3108',
                    lineHeight: 1.2,
                    letterSpacing: 0.6,
                    textTransform: 'capitalize',
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {name}
                </Typography>
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: 'transparent', 
                  borderRadius: '6px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: 'transparent',
                  }
                }} onClick={handleSaveClick}>
                  {isUpdating ? (
                    <CircularProgress size={20} sx={{ color: isSaved ? '#CA6014' : '#8A4A1C' }} />
                  ) : isSaved ? (
                    <BookmarkIcon sx={{ color: '#CA6014', fontSize: { xs: '20px', sm: '22px', md: '24px' } }} />
                  ) : (
                    <BookmarkBorderIcon sx={{ color: '#8A4A1C', fontSize: { xs: '20px', sm: '22px', md: '24px' } }} />
                  )}
                </Box>
              </Box>


              {!hideBadge && recipe.badge && (
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', fontFamily: "'Basic', sans-serif !important", textTransform: 'capitalize' }}>
                  {recipe.badge}
                </Typography>
              )}
            </Box>


            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Box>
                <Typography
                  sx={{
                    fontFamily: "'Basic', sans-serif !important",
                    fontWeight: 200,
                    color: isDarkMode ? '#DEDEDE' : '#000000',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <Box
                    component="span"
                    className="recipe-card-category"
                    sx={{ 
                      textDecoration: 'none', 
                      textDecorationThickness: '1px', 
                      textUnderlineOffset: '2px',
                      '&:hover': {
                        textDecoration: 'underline',
                      }
                    }}
                    onClick={handleCategoryClick}
                  >
                    {category}
                  </Box>
                  {foodTypeText && (
                    <Box component="span" sx={{ ml: 0.5, textDecoration: 'none', color: '#9ca3af' }}>
                      &bull; {foodTypeText}
                    </Box>
                  )}
                </Typography>
              </Box>
              <Box sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: 'transparent', 
                borderRadius: '6px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: 'transparent',
                }
              }} onClick={handleShare}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '60%', height: '60%' }}>
                    <path d="M15 5L22 12L15 19V14.5C10 14.5 6.5 16 4 20C5 15 8 10 15 9V5Z" fill="#4D9CFF"/>
                  </svg>
              </Box>
            </Box>
          </Box>

          <Box sx={{ 
            display: isMobileVertical ? 'block' : { xs: 'none', sm: 'block' }, 
            position: 'relative', 
            pt: isMobileVertical ? { xs: '54%', sm: '58%' } : '58%', 
            m: isMobileVertical ? { xs: 0, sm: 0.35, md: 0.5 } : { sm: 0.35, md: 0.5 }, 
            borderRadius: isMobileVertical ? { xs: '0px', sm: '14px', md: '18px' } : { sm: '14px', md: '18px' }, 
            overflow: 'hidden', 
            width: 'auto', 
            boxSizing: 'border-box' 
          }}>
            {imgUrl ? (
              <Image
                src={imageSrc}
                alt={name}
                title={name}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                className={imageSrc && (imageSrc.includes('ytimg.com') || imageSrc.includes('youtube')) ? "recipe-card-image-youtube" : "recipe-card-image"}
                onError={(event) => {
                  event.currentTarget.src = noImageFound;
                }}
                style={{
                  objectFit: 'cover',
                  transition: 'transform 0.5s ease',
                }}
                loading="lazy"
              />
            ) : (
              <Image
                src={noImageFound}
                alt="No image found"
                title="No image found"
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                className="recipe-card-image"
                style={{
                  objectFit: 'cover',
                  transition: 'transform 0.5s ease',
                }}
                loading="lazy"
              />
            )}

            {!hideBadge && recipe.badge && (
              <Box
                sx={{
                  position: 'absolute',
                  top: isMobileVertical ? { xs: 10, sm: -12 } : -12,
                  left: isMobileVertical ? { xs: 10, sm: 10, md: 15 } : { sm: 10, md: 15 },
                  transform: 'none',
                  width: isMobileVertical ? { xs: 'fit-content', sm: '36px', md: '40px' } : { sm: '36px', md: '40px' },
                  height: isMobileVertical ? { xs: '26px', sm: '58px', md: '65px' } : { sm: '58px', md: '65px' },
                  px: isMobileVertical ? { xs: 1.2, sm: 0 } : 0,
                  backgroundColor: 
                    recipe.badge === 'Popular' ? '#ef4444' :
                    recipe.badge === 'Trending' ? '#3b82f6' :
                    recipe.badge === 'Beginner' ? '#10b981' :
                    recipe.badge === 'Quick' ? '#f59e0b' : '#CA6014',
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: isMobileVertical ? { xs: 'row', sm: 'column' } : 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobileVertical ? { xs: 0.5, sm: 0 } : 0,
                  pt: isMobileVertical ? { xs: 0, sm: 0.2, md: 0.4 } : { sm: 0.2, md: 0.4 },
                  clipPath: isMobileVertical ? { xs: 'none', sm: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)' } : 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
                  borderRadius: isMobileVertical ? { xs: '6px', sm: 0 } : 0,
                  boxShadow: isMobileVertical ? { xs: '0 2px 8px rgba(0,0,0,0.2)', sm: 'none' } : 'none',
                }}
              >
                {recipe.badge === 'Popular' && <WhatshotIcon sx={{ color: '#fff', fontSize: isMobileVertical ? { xs: '18px', sm: '15px', md: '18px' } : { sm: '15px', md: '18px' } }} />}
                {recipe.badge === 'Trending' && <TrendingUpIcon sx={{ color: '#fff', fontSize: isMobileVertical ? { xs: '18px', sm: '15px', md: '18px' } : { sm: '15px', md: '18px' } }} />}
                {recipe.badge === 'Beginner' && <SchoolIcon sx={{ color: '#fff', fontSize: isMobileVertical ? { xs: '18px', sm: '15px', md: '18px' } : { sm: '15px', md: '18px' } }} />}
                {recipe.badge === 'Quick' && <SpeedIcon sx={{ color: '#fff', fontSize: isMobileVertical ? { xs: '18px', sm: '15px', md: '18px' } : { sm: '15px', md: '18px' } }} />}
                
                <Typography sx={{ 
                  color: '#fff', 
                  fontSize: isMobileVertical ? { xs: '11px', sm: '7.5px', md: '8.5px' } : { sm: '7.5px', md: '8.5px' }, 
                  fontWeight: isMobileVertical ? { xs: 700, sm: 100 } : 100, 
                  fontFamily: "'Basic', sans-serif !important", 
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: isMobileVertical ? { xs: 0.5, sm: 0 } : 0
                }}>
                  {recipe.badge}
                </Typography>
              </Box>
            )}





            <Box sx={{ position: 'absolute', top: { xs: 8, sm: 10, md: 12 }, right: { xs: 8, sm: 10, md: 12 }, display: isMobileVertical ? 'flex' : { xs: 'none', sm: 'flex' }, gap: { xs: 1, sm: 1.2, md: 1.5 } }}>
              <Box sx={{ 
                width: { xs: isMobileVertical ? 35 : 32, sm: 31, md: 34 },
                height: { xs: isMobileVertical ? 35 : 32, sm: 31, md: 34 }, 
                bgcolor: 'rgba(255, 255, 255, 0.35)', 
                borderRadius: { xs: '6px', sm: '7px', md: '8px' }, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
              }} onClick={handleShare}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: isMobileVertical ? '60%' : '55%', height: isMobileVertical ? '60%' : '55%', marginLeft: '2px' }}>
                    <path d="M15 5L22 12L15 19V14.5C10 14.5 6.5 16 4 20C5 15 8 10 15 9V5Z" fill="#4D9CFF"/>
                  </svg>
              </Box>
              <Box sx={{ 
                width: { xs: isMobileVertical ? 35 : 32, sm: 31, md: 34 }, 
                height: { xs: isMobileVertical ? 35 : 32, sm: 31, md: 34 }, 
                bgcolor: 'rgba(255, 255, 255, 0.35)', 
                borderRadius: { xs: '6px', sm: '7px', md: '8px' }, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
                }} onClick={handleSaveClick}>
                  {isUpdating ? (
                    <CircularProgress size={isMobileVertical ? 18 : 16} sx={{ color: isSaved ? '#CA6014' : '#8A4A1C' }} />
                  ) : isSaved ? (
                    <BookmarkIcon sx={{ color: '#CA6014', fontSize: { xs: isMobileVertical ? '25px' : '23px', sm: '22px', md: '24px' } }} />
                  ) : (
                    <BookmarkBorderIcon sx={{ color: '#8A4A1C', fontSize: { xs: isMobileVertical ? '25px' : '23px', sm: '22px', md: '24px' } }} />
                  )}
                </Box>
            </Box>


            {recipe.is_video && !hideVideoIcon && (
              <Box
                sx={{
                  width: { sm: '40px', md: '44px' },
                  height: { sm: '40px', md: '44px' },
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'rgba(255, 246, 234, 0.4)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                  border: '1.5px solid #FFF6EA'
                }}
              >
                <PlayArrowIcon sx={{ color: '#FFF6EA', fontSize: { sm: '28px', md: '32px' } }} />
              </Box>
            )}
          </Box>


          <Box sx={{ 
            display: isMobileVertical ? 'flex' : { xs: 'none', sm: 'flex' },
            px: { xs: 2.5, sm: 2 }, 
            flexGrow: 1, 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: isMobileVertical ? { xs: 'auto', md: '80px' } : { md: '80px' },
            py: isMobileVertical ? { xs: 2, sm: 1, md: 1.5 } : { sm: 1, md: 1.5 },
            overflow: 'hidden'
          }}>
            <Typography
              sx={{
                fontFamily: "'Basic', sans-serif !important",
                fontSize: isMobileVertical ? { xs: '1.25rem', sm: '1.2rem', md: '1.4rem' } : { sm: '1.2rem', md: '1.4rem' },
                fontWeight: 600,
                color: isDarkMode ? '#FFEFD9' : '#6C3108',
                textAlign: 'center',
                lineHeight: 1.25,
                textTransform: 'capitalize',
                letterSpacing: 0.7,
                display: '-webkit-box',
                WebkitLineClamp: isMobileVertical ? { xs: 2, md: 2 } : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {name}
            </Typography>
          </Box>


          <Box sx={{ display: isMobileVertical ? 'block' : { xs: 'none', sm: 'block' }, height: '1px', bgcolor: isDarkMode ? '#DEDEDE' : 'rgba(202, 96, 20, 0.15)', mx: 2 }} />


          <Box sx={{ 
            display: isMobileVertical ? 'flex' : { xs: 'none', sm: 'flex' }, 
            px: 2.5, 
            py: isMobileVertical ? { xs: 1.5, sm: 1 } : 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            flexDirection: 'column'
          }}>
            <Typography
              sx={{
                fontFamily: "'Basic', sans-serif !important",
                fontWeight: 200,
                color: isDarkMode ? '#DEDEDE' : '#000000',
                fontSize: { xs: '0.9rem', sm: '0.85rem', md: '1rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'center',
              }}
            >
              <Box 
                component="span" 
                className="recipe-card-category"
                sx={{ 
                  textDecoration: 'none', 
                  textDecorationThickness: '1px', 
                  textUnderlineOffset: '2px',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
                onClick={handleCategoryClick}
              >
                {category}
              </Box>
              {foodTypeText && (
                <Box component="span" sx={{ ml: 0.5, color: '#9ca3af' }}>
                  &bull; {foodTypeText}
                </Box>
              )}
            </Typography>
          </Box>
        </Box>
      </Link>
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};

export default RecipeCard;

