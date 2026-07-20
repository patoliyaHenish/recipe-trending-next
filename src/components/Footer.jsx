"use client";
import React from 'react';
import { Box, Typography, Grid, Link as MuiLink, Container, Skeleton } from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import NextLink from 'next/link';
import { useGetLiveFooterItemsQuery } from '../features/api/footerApi';

const Footer = ({ initialFooterItems = [] }) => {
  const { isDarkMode } = useTheme();
  const { data: queryData, isLoading: isQueryLoading } = useGetLiveFooterItemsQuery();
  const footerData = queryData || { data: initialFooterItems };
  const isLoading = isQueryLoading && (!initialFooterItems || initialFooterItems.length === 0);

  const footerLinks = footerData?.data || [];

  const defaultLinks = [
    { label: 'About Us', to: '/about-us' },
    { label: 'Contact Us', to: '/contact-us' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms & Conditions', to: '/terms' },
    { label: 'Search by Ingredient', to: '/search-by-ingredient' },
  ];

  const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const footerLinkChunks = chunkArray(footerLinks, 4);

  return (
    <Box
      component="footer"
      className="w-full mt-auto"
      sx={{
        backgroundColor: isDarkMode ? 'var(--navbar-bg)' : '#ca6014',
        color: '#ffffff',
        borderTop: isDarkMode ? '1px solid var(--border-color)' : 'none',
        transition: 'background-color 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4} sx={{ justifyContent: 'space-between' }}>


          <Grid size={{ xs: 12 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: { xs: 3, md: 4 },
              justifyContent: 'center'
            }}>
              {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="text" width={120} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                  ))}
                </Box>
              ) : (
                footerLinkChunks.map((chunk, chunkIndex) => (
                  <Box key={`chunk-${chunkIndex}`} sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: '100px' }}>
                    {chunk.map((link, index) => (
                      <MuiLink
                        key={index}
                        component={link.path ? NextLink : 'button'}
                        href={link.path ? (link.path.startsWith('/') ? link.path : `/${link.path}`) : undefined}
                        target={link.open_in_new_tab ? '_blank' : undefined}
                        rel={link.open_in_new_tab ? 'noopener noreferrer' : undefined}
                        underline="none"
                        sx={{
                          color: '#ffffff',
                          textAlign: 'left',
                          fontFamily: "'Basic', sans-serif",
                          fontSize: '1rem',
                          '&:hover': { opacity: 0.8 }
                        }}
                      >
                        {link.label}
                      </MuiLink>
                    ))}
                  </Box>
                ))
              )}

              <Box
                sx={{
                  minWidth: '100px',
                  display: { xs: 'grid', md: 'flex' },
                  gridTemplateColumns: { xs: 'repeat(2, minmax(120px, 1fr))', md: 'none' },
                  gap: 1,
                  flexDirection: { md: 'column' },
                  width: { xs: '100%', md: 'auto' },
                  maxWidth: { xs: '320px', md: 'none' }
                }}
              >
                {defaultLinks.map((link, index) => (
                  <MuiLink
                    key={index}
                    component={NextLink}
                    href={link.to}
                    underline="none"
                    sx={{
                      color: '#ffffff',
                      textAlign: 'left',
                      fontFamily: "'Basic', sans-serif",
                      fontSize: '1rem',
                      '&:hover': { opacity: 0.8 }
                    }}
                  >
                    {link.label}
                  </MuiLink>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Box
        sx={{
          py: 2,
          backgroundColor: '#FFF6EA',
          textAlign: 'center'
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontFamily: "'Basic', sans-serif",
            color: '#ca6014',
            fontSize: '1rem'
          }}
        >
          © {new Date().getFullYear()} Recipe Trending. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;
