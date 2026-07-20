"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
  Box,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useGetAllKeywordsQuery, useCreateKeywordMutation } from '../features/api/keywordApi';
import { toast } from '../utils/toast';
import { useTheme } from '../context/ThemeContext';

const KeywordInput = ({ value = [], onChange, disabled = false, dialogOpen, error, errorText }) => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const inputRef = useRef();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const { data: keywordsData, isFetching } = useGetAllKeywordsQuery(
    { search: debouncedSearchQuery, page, limit: 20 },
    { skip: !isOpen }
  );

  const [createKeyword] = useCreateKeywordMutation();

  useEffect(() => {
    if (dialogOpen === false) {
      setSearchQuery('');
      setPage(1);
    }
  }, [dialogOpen]);

  const handleListScroll = (event) => {
    const listNode = event.currentTarget;
    if (
      listNode.scrollTop + listNode.clientHeight >= listNode.scrollHeight - 1 &&
      !isFetching &&
      hasMore
    ) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (keywordsData?.pagination) {
      setHasMore(keywordsData.pagination.page < keywordsData.pagination.totalPages);
    }
  }, [keywordsData]);

  let options = (keywordsData?.data || []).filter(
    opt => !value.some(val => val.toLowerCase() === opt.name.toLowerCase())
  );
  


  return (
    <Box className="mb-4">
      <Autocomplete
        multiple
        freeSolo
        options={options}
        getOptionLabel={option =>
          typeof option === 'string' ? option : option.name || ''
        }
        value={value.map(val => {
          const found = options.find(opt => opt.name === val);
          return found ? found : { name: val };
        })}
        inputValue={searchQuery}
        onInputChange={(event, newInputValue) => {
          setSearchQuery(newInputValue);
        }}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onChange={(event, newValue) => {
          // newValue is an array of objects/strings
          const syncValues = [];
          newValue.forEach(item => {
             if (typeof item === 'string') {
                const exactMatch = options.find(opt => opt.name.toLowerCase() === item.toLowerCase());
                if (exactMatch) syncValues.push(exactMatch.name);
                else {
                  createKeyword({ name: item.trim() }).unwrap().then(res => {
                    if (res.success) onChange([...value, res.data.name]);
                  });
                }
             } else if (item.isAddNew) {
                createKeyword({ name: item.name.trim() }).unwrap().then(res => {
                  if (res.success) onChange([...value, res.data.name]);
                });
             } else {
                syncValues.push(item.name);
             }
          });

          onChange(syncValues);
          setSearchQuery('');
        }}
        ListboxProps={{
          onScroll: handleListScroll,
          style: { maxHeight: 300, overflow: 'auto' },
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip 
              variant="filled" 
              color="primary"
              label={typeof option === 'string' ? option : option.name} 
              {...getTagProps({ index })} 
              key={index}
              sx={{
                color: '#ffffff !important',
                backgroundColor: '#6366f1 !important',
                fontWeight: 600,
                borderRadius: '6px',
                '& .MuiChip-label': {
                  color: '#ffffff !important',
                },
                '& .MuiChip-deleteIcon': {
                  color: 'rgba(255, 255, 255, 0.7) !important',
                  '&:hover': { color: '#ffffff !important' },
                },
              }}
            />
          ))
        }
        sx={{
          '& .MuiAutocomplete-tag': {
            backgroundColor: '#6366f1 !important',
            color: '#ffffff !important',
            fontWeight: 600,
            borderRadius: '6px',
            '& .MuiChip-label': {
              color: '#ffffff !important',
            },
            '& .MuiChip-deleteIcon': {
              color: 'rgba(255, 255, 255, 0.7) !important',
              '&:hover': {
                color: '#ffffff !important',
              }
            }
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            label="Search or add keywords"
            fullWidth
            disabled={disabled}
            error={error}
            helperText={error ? errorText : "Type to search or add new keywords"}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
                color: isDarkMode ? '#e5e7eb' : '#374151',
                '& fieldset': { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                '&:hover fieldset': { borderColor: isDarkMode ? '#6b7280' : '#9ca3af' },
              },
              '& .MuiInputLabel-root': { color: isDarkMode ? '#d1d5db' : '#6b7280' },
              '& .MuiFormHelperText-root': { color: error ? (isDarkMode ? '#f87171' : '#dc2626') : (isDarkMode ? '#9ca3af' : '#6b7280') },
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <Typography>
              {option.name}
            </Typography>
          </li>
        )}
        noOptionsText={
          isFetching ? (
            <Box display="flex" alignItems="center">
              <CircularProgress size={18} sx={{ mr: 1 }} />
              Loading...
            </Box>
          ) : (
            "No keywords found. Type to create a new one."
          )
        }
        open={isOpen}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
              color: isDarkMode ? '#e2e8f0' : '#1e293b',
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
              boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              mt: 1,
              '& .MuiAutocomplete-option': {
                padding: '10px 16px',
                color: isDarkMode ? '#e2e8f0' : '#1e293b',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#f1f5f9',
                },
                '&[aria-selected="true"]': {
                  backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff',
                  color: '#6366f1',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : '#c7d2fe',
                  }
                }
              },
              '& .MuiAutocomplete-noOptions': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
            }
          }
        }}
      />
    </Box>
  );
};

export default KeywordInput;

