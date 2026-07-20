"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, InputBase, Button, Chip, Stack, CircularProgress, IconButton, Paper, ClickAwayListener } from '@mui/material';
import { Search as SearchIcon, ArrowUpward, Clear, LocalFireDepartment } from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';
import { useSearchIngredientsSimpleQuery, useGetPopularIngredientsQuery } from '../../features/api/ingredientApi';
import { useRouter } from 'next/navigation';

const HIDDEN_INGREDIENT_LABELS = new Set(['none/free text']);

const isHiddenIngredient = (ingredient) => {
  const label = String(ingredient?.name || ingredient?.displayText || ingredient?.text || '').trim().toLowerCase();
  return HIDDEN_INGREDIENT_LABELS.has(label);
};

const SearchByIngredients = () => {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 800);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchResponse, isFetching: isSearching } = useSearchIngredientsSimpleQuery(
    { 
      query: debouncedTerm, 
      exclude: selectedIngredients.map(i => i.ingredient_id).join(',') 
    },
    { skip: debouncedTerm.length < 2 }
  );

  const { data: defaultIngredientsResponse, isFetching: isLoadingDefaults } = useGetPopularIngredientsQuery(
    undefined,
    { skip: debouncedTerm.length >= 2 }
  );

  const rawSuggestions = debouncedTerm.length >= 2 
    ? (searchResponse?.data || []) 
    : (defaultIngredientsResponse?.data || []);

  const filteredSuggestions = rawSuggestions.filter(
    s => !isHiddenIngredient(s) && !selectedIngredients.some(selected => selected.ingredient_id === s.ingredient_id)
  ).slice(0, 7);

  const isFetching = debouncedTerm.length >= 2 ? isSearching : isLoadingDefaults;

  const handleSelectIngredient = (ingredient) => {
    setSelectedIngredients([...selectedIngredients, ingredient]);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleRemoveIngredient = (ingredientId) => {
    setSelectedIngredients(selectedIngredients.filter(i => i.ingredient_id !== ingredientId));
  };

  const handleSearch = () => {
    if (selectedIngredients.length > 0) {
        const names = selectedIngredients.map(i => i.name).join(',');
        const types = selectedIngredients.map(() => 'ingredient').join(',');
        const ids = selectedIngredients.map(i => i.ingredient_id).join(',');
        router.push(`/result?q=${encodeURIComponent(names)}&t=${encodeURIComponent(types)}&ingredientId=${encodeURIComponent(ids)}`);
    }
  };

  return (
    <div className="pt-4 pb-8 sm:py-8 w-full">
      <Box
        className="w-full"
        sx={{
          backgroundColor: isDarkMode ? 'var(--card-bg)' : '#FFF5EB',
          borderRadius: '8px',
          padding: { xs: '24px', md: '40px' },
          paddingBottom: { xs: '24px', md: '32px' },
          position: 'relative',
          overflow: 'visible',
          boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
          border: isDarkMode ? '1px solid var(--border-color)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        <Typography
          component="h2"
          variant="h3"
          className="font-bold mb-6"
          sx={{
            fontFamily: "'Basic', sans-serif !important",
            fontWeight: 500,
            color: isDarkMode ? 'var(--text-primary)' : '#6C3108',
            fontSize: { xs: '2.2rem', sm: '2.5rem', md: '3rem' },
            marginBottom: '8px',
            transition: 'color 0.3s ease'
          }}
        >
          Search By Ingredients
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Basic', sans-serif !important",
            fontSize: { xs: '0.9rem', md: '1rem' },
            fontWeight: 400,
            color: isDarkMode ? 'var(--text-muted)' : '#6b7280',
            marginBottom: '24px',
            opacity: 0.85
          }}
        >
          💡 Type ingredients you have, click on suggestions to add them, and find recipes that match!
        </Typography>

         <div className="flex flex-row gap-2 md:gap-4 mb-6">
           <Box
             className="flex-grow"
             sx={{ position: 'relative' }}
           >
             <ClickAwayListener onClickAway={() => setShowDropdown(false)}>
               <Box>
                 <Box
                   className="flex items-center px-4 rounded-lg"
                   sx={{
                     backgroundColor: isDarkMode ? 'var(--bg-tertiary)' : '#FFF0E5',
                     height: '48px',
                     boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                     border: isDarkMode ? '1px solid var(--border-color)' : '1px solid rgba(202, 96, 20, 0.3)',
                     transition: 'background-color 0.3s ease, border-color 0.3s ease',
                     '&:focus-within': {
                        borderColor: '#ca6014',
                        boxShadow: '0 0 0 2px rgba(202, 96, 20, 0.2)',
                     }
                   }}
                 >
                   <SearchIcon sx={{ color: '#ca6014', marginRight: '12px' }} />
                   <InputBase
                     placeholder="Search for Potato, tomato, etc..."
                     value={searchTerm}
                     onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (e.target.value.length >= 2) setShowDropdown(true);
                     }}
                     onFocus={() => {
                        if (searchTerm.length >= 2) setShowDropdown(true);
                     }}
                     fullWidth
                     sx={{
                       fontSize: '16px',
                       color: isDarkMode ? 'var(--text-primary)' : '#4a4a4a',
                       fontFamily: "'Basic', sans-serif !important",
                       '& input::placeholder': {
                         color: isDarkMode ? 'var(--text-muted)' : '#ca6014',
                         opacity: 1,
                         fontFamily: "'Basic', sans-serif !important",
                       },
                     }}
                   />
                   {searchTerm && (
                     <IconButton 
                       size="small" 
                       onClick={() => {
                          setSearchTerm('');
                          setShowDropdown(false);
                       }}
                       sx={{ 
                         color: isDarkMode ? 'var(--text-muted)' : '#ca6014',
                         marginRight: '8px' 
                       }}
                     >
                       <Clear fontSize="small" />
                     </IconButton>
                   )}
                   {isFetching && <CircularProgress size={20} sx={{ color: '#ca6014' }} />}
                 </Box>
 
                 {/* Dropdown for Search Results */}
                 {showDropdown && searchTerm.length >= 2 && (
                   <Paper
                     elevation={3}
                     sx={{
                       position: 'absolute',
                       top: 'calc(100% + 4px)',
                       left: 0,
                       right: 0,
                       zIndex: 1000,
                       maxHeight: '300px',
                       overflowY: 'auto',
                       borderRadius: '8px',
                       backgroundColor: isDarkMode ? 'var(--bg-secondary)' : '#ffffff',
                       border: isDarkMode ? '1px solid var(--border-color)' : '1px solid #e0e0e0',
                       boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.1)',
                     }}
                   >
                     {filteredSuggestions.length > 0 ? (
                       filteredSuggestions.map((item, index) => (
                         <Box
                           key={`search-${item.ingredient_id}`}
                           onClick={() => handleSelectIngredient(item)}
                           sx={{
                             px: 2,
                             py: 1.5,
                             cursor: 'pointer',
                             display: 'flex',
                             alignItems: 'center',
                             gap: 1.5,
                             borderBottom: index < filteredSuggestions.length - 1 ? (isDarkMode ? '1px solid var(--border-color)' : '1px solid #f0f0f0') : 'none',
                             transition: 'all 0.2s ease',
                             '&:hover': {
                               backgroundColor: isDarkMode ? 'rgba(202, 96, 20, 0.15)' : '#f8f9fa',
                             }
                           }}
                         >
                           <SearchIcon sx={{ fontSize: 18, color: '#ca6014' }} />
                           <Typography sx={{ 
                             flex: 1, 
                             fontFamily: "'Basic', sans-serif",
                             color: isDarkMode ? 'var(--text-primary)' : '#2d2d2d' 
                           }}>
                             {item.name}
                           </Typography>
                         </Box>
                       ))
                     ) : !isFetching ? (
                       <Box sx={{ p: 3, textAlign: 'center' }}>
                         <Typography sx={{ color: 'var(--text-muted)', fontFamily: "'Basic', sans-serif" }}>
                           Oops! We couldn't find that ingredient.
                         </Typography>
                       </Box>
                     ) : null}
                   </Paper>
                 )}
               </Box>
             </ClickAwayListener>
           </Box>
           <Button
             variant="contained"
             onClick={handleSearch}
             endIcon={<ArrowUpward sx={{ transform: 'rotate(35deg)', fontSize: '38px' }} />}
             sx={{
               backgroundColor: '#ca6014',
               color: '#fff',
               height: '48px',
               padding: { xs: '0 12px', md: '0 48px' },
               minWidth: { xs: '48px', md: 'auto' },
               borderRadius: '8px',
               textTransform: 'none',
               fontSize: '18px',
               fontWeight: 400,
               fontFamily: "'Basic', sans-serif !important",
               boxShadow: 'none',
               '&:hover': {
                 backgroundColor: '#b0500e',
                 boxShadow: 'none',
               },
               '& .MuiButton-endIcon': {
                 margin: { xs: 0, md: '8px' },
                 marginLeft: { md: '8px' }
               }
             }}
           >
             <Box component="span" sx={{ display: { xs: 'none', md: 'block' } }}>Search</Box>
           </Button>
         </div>

        {selectedIngredients.length > 0 && (
          <Box mb={3}>
            {selectedIngredients.length > 1 && (
              <Typography
                component="span"
                onClick={() => setSelectedIngredients([])}
                sx={{
                  display: 'block',
                  textAlign: 'right',
                  fontSize: '14px',
                  color: '#ca6014',
                  cursor: 'pointer',
                  fontFamily: "'Basic', sans-serif !important",
                  mb: 1,
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Clear All
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {selectedIngredients.map((item) => (
                <Chip
                  key={`selected-${item.ingredient_id}`}
                  label={item.name}
                  onDelete={() => handleRemoveIngredient(item.ingredient_id)}
                  variant="filled"
                  sx={{
                    borderColor: '#ca6014',
                    borderWidth: '1px',
                    backgroundColor: '#ca6014',
                    color: '#fff',
                    fontSize: { xs: '14px', md: '16px' },
                    fontWeight: 500,
                    fontFamily: "'Basic', sans-serif !important",
                    borderRadius: { xs: '8px', md: '12px' },
                    height: { xs: '36px', md: '40px' },
                    '&:hover': {
                      backgroundColor: '#b0500e',
                      borderColor: '#b0500e',
                    },
                    '& .MuiChip-label': {
                      padding: { xs: '0 8px', md: '0 12px' },
                    },
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        color: '#fff',
                      }
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}



        {!searchTerm && filteredSuggestions.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <LocalFireDepartment sx={{ color: '#ca6014', fontSize: '1.2rem' }} />
              <Typography
                sx={{
                  fontFamily: "'Basic', sans-serif",
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: isDarkMode ? 'var(--text-muted)' : '#6b7280',
                  letterSpacing: '0.5px'
                }}
              >
                Most Searched
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {filteredSuggestions.map((item) => (
                <Chip
                  key={`suggestion-${item.ingredient_id}`}
                  label={item.name}
                  onClick={() => handleSelectIngredient(item)}
                  variant="outlined"
                  sx={{
                    borderColor: '#ca6014',
                    borderWidth: '1px',
                    backgroundColor: 'transparent',
                    color: '#ca6014',
                    fontSize: { xs: '13px', md: '14px' },
                    fontWeight: 500,
                    fontFamily: "'Basic', sans-serif !important",
                    borderRadius: '8px',
                    height: { xs: '32px', md: '36px' },
                    transition: 'all 0.2s ease',
                    '&.MuiChip-clickable:hover': {
                      backgroundColor: '#ca6014',
                      color: '#fff',
                      borderColor: '#ca6014',
                    },
                  }}
                  clickable
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </div>
  );
};

export default SearchByIngredients;

