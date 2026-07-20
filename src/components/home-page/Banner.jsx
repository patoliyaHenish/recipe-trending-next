"use client";
import React from 'react'
import { useRouter } from 'next/navigation';
import { useGetHeroBannerQuery } from '../../features/api/bannerApi'
import { CircularProgress, Button, Box, Typography } from '@mui/material'
import BannerSkeleton from './BannerSkeleton'
import { getImage } from '../../utils/helper'
import noImageFound from '../../assets/no-image-found.png'
import { useTheme } from '../../context/ThemeContext'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Fade from 'embla-carousel-fade';
import { useCallback, useEffect, useState } from 'react';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
const  Banner = () => {
  const { data: heroBanner, isLoading } = useGetHeroBannerQuery()
  const router = useRouter();
  const { isDarkMode: _isDarkMode } = useTheme();
  const banners = Array.isArray(heroBanner?.data) ? heroBanner.data : (heroBanner?.data ? [heroBanner.data] : [])

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: banners.length > 1 }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
    Fade()
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  if (isLoading) {
    return <BannerSkeleton />
  }
  if (!heroBanner?.data || heroBanner.data.length === 0) return null


  return (
    <Box sx={{ 
      paddingTop: { xs: '72px', sm: '80px', md: '88px', lg: '144px' },
      backgroundColor: 'var(--bg-primary)',
      transition: 'background-color 0.3s ease'
    }}>
      <style>{`
        @keyframes floatPill {
            0%,100% { transform: translateY(0px);  }
            50%      { transform: translateY(-10px); }
        }
      `}</style>
      <Box
        className="w-full relative overflow-hidden"
        sx={{ 
          height: { xs: 280, sm: 320, md: 480, lg: 630 },
          borderRadius: '8px',
          transition: 'all 0.3s ease'
        }}
      >
        <div
          className="h-full w-full overflow-hidden"
          ref={emblaRef}
        >
        <div className="flex h-full w-full touch-pan-y" style={{ touchAction: 'pan-y' }}>
          {banners.map((banner, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 h-full">
              <div
                className="relative w-full overflow-hidden flex items-stretch h-full"
              >
        <div className="relative w-full h-full sm:hidden">
          <img
            src={banner.image ? getImage(banner.image) : noImageFound}
            alt={banner.title}
            title={banner.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(event) => { event.currentTarget.src = noImageFound; }}
            loading="lazy"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.0) 100%)' }} />
          <div className="absolute bottom-10 left-0 right-0 px-5 flex flex-col items-start">
            <Typography
              variant="h5"
              className="font-black leading-tight break-words mb-2"
              sx={{ 
                fontWeight: 700,
                color: '#ffffff',
                textShadow: '1px 1px 4px rgba(0,0,0,0.7)',
                fontFamily: "'Basic', sans-serif",
                fontSize: '1.4rem'
              }}
            >
              {banner.title}
            </Typography>
            {banner.button_text && (
              <Button
                variant="contained"
                size="small"
                sx={{
                  background: '#FFEFD9',
                  color: '#ca6014',
                  fontWeight: 700,
                  fontSize: '12px',
                  padding: '4px 14px',
                  borderRadius: '6px',
                  fontFamily: "'Basic', sans-serif",
                    textTransform: 'none',
                  letterSpacing: 1.2,
                  boxShadow: 'none',
                  '&:hover': { background: '#ffffff' }
                }}
                onClick={() => {
                  router.push('/recipe-spotlight', {
                    state: { 
                      keywords: banner.keywords || banner.title, 
                      title: banner.title,
                      image: banner.image 
                    }
                  });
                }}
              >
                {banner.button_text}
              </Button>
            )}
          </div>
        </div>
        <>
          <Box
            component="img"
            src={banner.image ? getImage(banner.image) : noImageFound}
            alt={banner.title}
            title={banner.title}
            className="absolute inset-0 w-full h-full hidden sm:block"
            onError={(event) => {
              event.currentTarget.src = noImageFound;
            }}
            sx={{
              objectFit: 'cover',
              zIndex: 1
            }}
            loading="lazy"
          />
          <Box
            className="absolute left-0 top-0 bottom-0 hidden sm:flex flex-col justify-center h-full py-4"
            sx={{
              pl: { sm: 8, md: 8, lg: 10 },
              pr: { sm: 8, md: 8, lg: 10 },
              width: { xs: '100%', sm: '75%', md: '58%', lg: '52%' },
              background: 'linear-gradient(90deg, rgba(0,0,0,0.72) 65%, rgba(0,0,0,0.0) 100%)',
              zIndex: 2
            }}
          >
            <Typography
              variant="h3"
              className="font-black leading-tight mb-1 sm:mb-2 w-full break-words"
              sx={{ 
                fontWeight: 700,
                color: '#ffffff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                fontFamily: "'Basic', sans-serif",
                fontSize: { xs: '2.2rem', sm: '2.5rem', md: '3rem' },
                transition: 'all 0.3s ease'
              }}
            >
              {banner.title}
            </Typography>
            {banner.button_text && (
              <Button
                variant="contained"
                className="font-semibold shadow-lg mt-1"
                sx={{
                  background: '#FFEFD9',
                  color: '#ca6014',
                  fontWeight: 600,
                  fontSize: { xs: '14px', sm: '14px', md: '15px', lg: '16px' },
                  padding: { xs: '5px 12px', sm: '5px 16px', md: '6px 20px', lg: '8px 24px' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  letterSpacing: 1.5,
                  fontFamily: "'Basic', sans-serif",
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: _isDarkMode ? '0 4px 20px 0 rgba(0, 0, 0, 0.3)' : '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
                  mt: 3,
                  width: 'fit-content',
                  maxWidth: 'none',
                  alignSelf: 'flex-start',
                  position: 'relative',
                  overflow: 'hidden',
                  zIndex: 2,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
                    transition: 'none',
                    zIndex: 1,
                  },
                  '&:hover': {
                    background: '#ffffff',
                    color: '#ca6014',
                    boxShadow: _isDarkMode ? '0 12px 40px 0 rgba(0, 0, 0, 0.5)' : '0 12px 40px 0 rgba(202, 96, 20, 0.25)',
                    letterSpacing: 2,
                  },
                  '&:hover::before': {
                    left: '100%',
                    transition: 'left 0.7s ease-in-out',
                  }
                }}
                onClick={() => {
                  router.push('/recipe-spotlight', {
                    state: { 
                      keywords: banner.keywords || banner.title,
                      title: banner.title,
                      image: banner.image
                    }
                  });
                }}
              >
                {banner.button_text}
              </Button>
            )}
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: { sm: 16, md: 24, lg: 32 },
              left: '50%',
              transform: 'translateX(-50%)',
              display: { xs: 'none', sm: 'flex' },
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              opacity: 0.6,
              animation: 'floatPill 2.5s ease-in-out infinite',
              zIndex: 3,
            }}
          >
            <Typography sx={{
              fontFamily: "'Basic', sans-serif",
              fontSize: "0.72rem",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#ffffff",
              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
            }}>
              Scroll
            </Typography>
            <KeyboardArrowDownIcon sx={{ fontSize: 24, color: "#ffffff", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.5))" }} />
          </Box>
        </>
      </div>
            </div>
          ))}
        </div>
        </div>
        {banners.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white transition-all"
              onClick={scrollPrev}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white transition-all"
              onClick={scrollNext}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${
                    index === selectedIndex ? 'bg-white w-6' : 'w-2.5 bg-white/40 hover:bg-white/60'
                  }`}
                  onClick={() => scrollTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </Box>
    </Box>
  )
}

export default Banner


