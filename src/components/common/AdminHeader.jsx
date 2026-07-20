"use client";
import React from 'react';
import { Box, Button } from '@mui/material';
import { PageHeader, SearchBar } from './index';
import { useTheme } from '../../context/ThemeContext';

const AdminHeader = ({
  title,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  searchLabel = "Search",
  onAddClick,
  addText,
  isAddDisabled = false,
  addTitle,
  hideSearch,
  children
}) => {
  const { isDarkMode } = useTheme();

  return (
    <Box className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-0 sm:gap-3 mb-2 sm:mb-2">
      <Box className="mb-[-8px] sm:mb-0">
        <PageHeader title={title} />
      </Box>
      <Box className="flex gap-2 items-center w-full sm:w-auto mt-[-8px] sm:mt-0">
        {children}
        {!hideSearch && (
          <Box className="flex-1 w-full sm:flex-none sm:w-auto">
            <SearchBar
              value={search}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              label={searchLabel}
              size="small"
            />
          </Box>
        )}
        {onAddClick && (
          <Button
            variant="contained"
            onClick={onAddClick}
            disabled={isAddDisabled}
            className="flex-shrink-0"
            sx={{
              borderRadius: 0,
              backgroundColor: isDarkMode ? '#10b981' : '#059669',
              '&:hover': {
                backgroundColor: isDarkMode ? '#059669' : '#047857',
              },
              padding: '7px 15px',
              fontSize: '0.95rem',
            }}
            title={addTitle || addText}
          >
            {addText}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default AdminHeader;

