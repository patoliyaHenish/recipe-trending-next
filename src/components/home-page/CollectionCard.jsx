"use client";
import React from 'react';
import { Box, Typography } from '@mui/material';
import { getImage } from '../../utils/helper';
import noImageFound from '../../assets/no-image-found.png';

const CollectionCard = ({ image, title, description, isDarkMode, onClick }) => {
  const imgVal = (typeof image === 'string' ? image.trim() : '') || '';
  const imageSrc = imgVal && imgVal.toLowerCase() !== 'null' ? getImage(imgVal) : noImageFound;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        overflow: 'hidden',
        border: `1px solid ${isDarkMode ? '#2d3748' : '#e2e8f0'}`,
        backgroundColor: isDarkMode ? '#111827' : '#ffffff',
        borderRadius: 2,
        boxShadow: isDarkMode
          ? '0 4px 24px rgba(0,0,0,0.4)'
          : '0 4px 24px rgba(0,0,0,0.07)',
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: isDarkMode
            ? '0 8px 36px rgba(0,0,0,0.55)'
            : '0 8px 36px rgba(0,0,0,0.13)',
        },
        cursor: 'pointer',
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: { xs: '100%', sm: '58%', md: '60%' },
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: 220, sm: 320, md: 400 },
        }}
      >
        <Box
          component="img"
          src={imageSrc}
          alt={title || 'Collection'}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = noImageFound;
          }}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            transition: 'transform 0.5s ease',
            '&:hover': {
              transform: 'scale(1.04)',
            },
          }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 3, sm: 4, md: 6 },
          py: { xs: 3, sm: 4, md: 5 },
          borderLeft: { sm: `1px solid ${isDarkMode ? '#2d3748' : '#e2e8f0'}` },
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Basic', sans-serif",
            fontSize: { xs: '0.65rem', md: '0.72rem' },
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            mb: 1.5,
          }}
        >
          Collection
        </Typography>

        <Typography
          component="h2"
          sx={{
            fontFamily: "'Basic', sans-serif !important",
            fontWeight: 700,
            fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.3rem' },
            lineHeight: 1.18,
            color: isDarkMode ? '#fef3e2' : '#1a1a1a',
            mb: 2,
            textTransform: 'capitalize',
            letterSpacing: '0.01em',
          }}
        >
          {title || 'Untitled Collection'}
        </Typography>

        {description && (
          <Typography
            sx={{
              fontFamily: "'Basic', sans-serif",
              fontSize: { xs: '0.92rem', md: '1rem' },
              lineHeight: 1.75,
              color: isDarkMode ? '#9ca3af' : '#4b5563',
              maxWidth: 380,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default CollectionCard;

