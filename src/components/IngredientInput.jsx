"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  Button,
  IconButton,
  Typography,
  MenuItem,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Edit, Save, Cancel, Delete, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useSearchIngredientsQuery, useCreateIngredientMutation, useGetPopularIngredientsQuery } from '../features/api/ingredientApi';
import { toast } from 'react-toastify';
import { useTheme } from '../context/ThemeContext';
import { formatFraction } from '../utils/helper';
import { useGetAllIngredientUnitsQuery } from '../features/api/ingredientUnitApi';

function splitFraction(formatted) {
  if (!formatted) return { whole: '', fraction: '' };
  const knownFractions = ['1⁄2','1⁄3','2⁄3','1⁄4','3⁄4','1⁄8','3⁄8','5⁄8','7⁄8'];
  if (knownFractions.includes(formatted)) {
    return { whole: '', fraction: formatted };
  }
  const mixedMatch = formatted.match(/^(\d+)\s+([\d]+⁄[\d]+)$/);
  if (mixedMatch) {
    return { whole: mixedMatch[1], fraction: mixedMatch[2] };
  }
  if (/^\d+$/.test(formatted)) {
    return { whole: formatted, fraction: '' };
  }
  const parts = formatted.split(' ');
  if (parts.length === 2 && knownFractions.includes(parts[1])) {
    return { whole: parts[0], fraction: parts[1] };
  }
  for (const frac of knownFractions) {
    if (formatted.endsWith(frac)) {
      return { whole: formatted.replace(frac, '').trim(), fraction: frac };
    }
  }
  return { whole: formatted, fraction: '' };
}

const fractionOptions = [
  '', '1⁄2', '1⁄3', '2⁄3', '1⁄4', '3⁄4', '1⁄8', '3⁄8', '5⁄8', '7⁄8'
];

const getMenuProps = (isDarkMode) => ({
  PaperProps: {
    sx: {
      bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
      color: isDarkMode ? '#e5e7eb' : '#374151',
      borderRadius: '4px',
      boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '& .MuiMenuItem-root': {
        fontSize: '0.875rem',
        '&:hover': { bgcolor: isDarkMode ? '#374151' : '#f3f4f6' },
        '&.Mui-selected': {
          bgcolor: isDarkMode ? '#2563eb' : '#dbeafe',
          color: '#ffffff',
          '&:hover': { bgcolor: isDarkMode ? '#1d4ed8' : '#bfdbfe' },
        },
      },
    },
  },
});

const autocompleteSlotProps = (isDarkMode) => ({
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
        '&:hover': { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#f1f5f9' },
        '&[aria-selected="true"]': {
          backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff',
          color: '#6366f1',
          fontWeight: 600,
          '&:hover': { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : '#c7d2fe' },
        },
      },
      '& .MuiAutocomplete-noOptions': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
    },
  },
});

const IngredientItem = ({ ingredient, index, total, onUpdate, onRemove, onMoveUp, onMoveDown, disabled, allUnits = [] }) => {
  const { isDarkMode } = useTheme();
  const menuProps = getMenuProps(isDarkMode);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState(() => {
    const displayValue = ingredient.quantity_display || ingredient.quantity;
    const { whole, fraction } = splitFraction(displayValue);
    return { whole, fraction, unit_id: ingredient.unit_id, free_text: ingredient.free_text || '' };
  });

  useEffect(() => {
    const displayValue = ingredient.quantity_display || ingredient.quantity;
    const { whole, fraction } = splitFraction(displayValue);
    setEditValues({ whole, fraction, unit_id: ingredient.unit_id, free_text: ingredient.free_text || '' });
  }, [ingredient]);

  const handleSave = () => {
    const combined = `${editValues.whole}${editValues.fraction ? ' ' + editValues.fraction : ''}`.trim();
    const originalDisplayValue = ingredient.quantity_display || ingredient.quantity;
    const originalParsed = splitFraction(originalDisplayValue);
    const quantityChanged = (
      originalParsed.whole !== editValues.whole ||
      originalParsed.fraction !== editValues.fraction ||
      ingredient.unit_id !== editValues.unit_id
    );
    const selectedUnit = allUnits.find(u => u.unit_id === editValues.unit_id) || null;
    const unitName = selectedUnit ? selectedUnit.name : '';
    if (ingredient.is_free_text) {
      onUpdate({ ...ingredient, free_text: editValues.free_text });
    } else {
      onUpdate({
        ...ingredient,
        quantity: combined,
        quantity_display: quantityChanged ? combined : ingredient.quantity_display,
        unit_id: editValues.unit_id || 0,
        unit: unitName,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    const displayValue = ingredient.quantity_display || ingredient.quantity;
    const { whole, fraction } = splitFraction(displayValue);
    setEditValues({ whole, fraction, unit_id: ingredient.unit_id, free_text: ingredient.free_text || '' });
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
    else if (e.key === 'Escape') { handleCancel(); }
  };

  if (isEditing) {
    return (
      <div className={`flex flex-col gap-2 mb-3 p-3 border rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className={`min-w-[30px] font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{index + 1}.</span>
          
          <div className={`flex-1 w-full sm:w-auto p-2 rounded ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white'}`}>
            {ingredient.is_free_text ? (
              <TextField
                fullWidth
                value={editValues.free_text}
                onChange={(e) => setEditValues({ ...editValues, free_text: e.target.value })}
                onKeyDown={handleKeyDown}
                size="small"
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: isDarkMode ? '#e5e7eb' : '#374151',
                    '& fieldset': { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                  },
                  '& input::placeholder': { color: isDarkMode ? '#9ca3af' : '#9ca3af', opacity: 1 },
                }}
              />
            ) : (
              <Typography variant="body2" className="font-medium">{ingredient.ingredient_name}</Typography>
            )}
          </div>
          {!ingredient.is_free_text && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <div className="flex gap-1 flex-1 sm:flex-none">
                <TextField
                  value={editValues.whole}
                  onChange={(e) => setEditValues({ ...editValues, whole: e.target.value.replace(/[^\d]/g, '') })}
                  onKeyDown={handleKeyDown}
                  size="small"
                  type="text"
                  sx={{ 
                    flex: 1, 
                    sm: { width: 40 },
                    '& .MuiOutlinedInput-root': {
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                      '& fieldset': { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                    },
                    '& input::placeholder': { color: isDarkMode ? '#9ca3af' : '#9ca3af', opacity: 1 },
                  }}
                  autoFocus
                  placeholder="Qty"
                />
                <TextField
                  select
                  value={editValues.fraction}
                  onChange={(e) => setEditValues({ ...editValues, fraction: e.target.value })}
                  size="small"
                  sx={{
                    flex: 1, sm: { width: 70 },
                    '& .MuiOutlinedInput-root': {
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                      '& fieldset': { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                    },
                    '& .MuiSelect-icon': { color: isDarkMode ? '#9ca3af' : 'inherit' },
                  }}
                  SelectProps={{ MenuProps: menuProps }}
                >
                  <MenuItem value="">None</MenuItem>
                  {fractionOptions.slice(1).map((f) => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </TextField>
              </div>
              <Autocomplete
                size="small"
                options={allUnits}
                getOptionLabel={(option) => option.name || ''}
                value={allUnits.find(u => u.unit_id === editValues.unit_id) || null}
                onChange={(e, newValue) => setEditValues({ ...editValues, unit_id: newValue ? newValue.unit_id : '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Unit"
                    placeholder="Unit"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: isDarkMode ? '#e5e7eb' : '#374151',
                        '& fieldset': { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                      },
                      '& .MuiInputLabel-root': { color: isDarkMode ? '#d1d5db' : '#6b7280', fontSize: '0.75rem' },
                    }}
                  />
                )}
                sx={{ flex: 2, sm: { width: 140 } }}
                slotProps={autocompleteSlotProps(isDarkMode)}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-2">
            <Button 
              onClick={handleCancel} 
              disabled={disabled} 
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                color: isDarkMode ? '#94a3b8' : '#64748b',
                borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                '&:hover': {
                  borderColor: isDarkMode ? '#475569' : '#94a3b8',
                  backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.2)' : 'rgba(100, 116, 139, 0.04)',
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSave} 
              disabled={disabled} 
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                backgroundColor: '#7367f0',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#5e50ee',
                  boxShadow: 'none',
                },
              }}
            >
              Save
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2 mb-3 p-3 sm:p-2 rounded-lg border sm:border-none ${isDarkMode ? 'bg-gray-800 border-gray-700 sm:bg-transparent' : 'bg-gray-50 border-gray-200 sm:bg-transparent'}`}>
      <div className="flex items-center justify-between w-full sm:w-auto sm:flex-none">
        <span className={`min-w-[30px] font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{index + 1}.</span>
        <div className="flex sm:hidden items-center gap-1">
          <IconButton size="small" onClick={onMoveUp} disabled={disabled || index === 0} sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}><ArrowUpward fontSize="small" /></IconButton>
          <IconButton size="small" onClick={onMoveDown} disabled={disabled || index === total - 1} sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}><ArrowDownward fontSize="small" /></IconButton>
          <IconButton size="small" color="primary" onClick={() => setIsEditing(true)} disabled={disabled} sx={{ bgcolor: isDarkMode ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)' }}><Edit fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={onRemove} disabled={disabled} sx={{ bgcolor: isDarkMode ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)' }}><Delete fontSize="small" /></IconButton>
        </div>
      </div>
      
      <div className={`flex-1 w-full sm:w-auto p-2 rounded ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100'}`}>
        <Typography variant="body2" className="font-medium">
          {ingredient.is_free_text ? ingredient.free_text : ingredient.ingredient_name}
        </Typography>
      </div>
      
      {!ingredient.is_free_text && (
        <Typography variant="body2" className={`min-w-[60px] text-left sm:text-center mt-1 sm:mt-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <span className="inline sm:hidden text-xs uppercase tracking-wider font-semibold mr-2 opacity-70">Qty:</span>
          {[ingredient.quantity, ingredient.unit].filter(Boolean).join(' ')}
        </Typography>
      )}
      
      <div className="hidden sm:flex items-center gap-1 ml-auto">
        <IconButton size="small" onClick={onMoveUp} disabled={disabled || index === 0} sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}><ArrowUpward fontSize="small" /></IconButton>
        <IconButton size="small" onClick={onMoveDown} disabled={disabled || index === total - 1} sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}><ArrowDownward fontSize="small" /></IconButton>
        <IconButton size="small" onClick={() => setIsEditing(true)} disabled={disabled} sx={{ color: "#3b82f6" }}><Edit fontSize="small" /></IconButton>
        <IconButton size="small" onClick={onRemove} disabled={disabled} sx={{ color: "#ef4444" }}><Delete fontSize="small" /></IconButton>
      </div>
    </div>
  );
};
const IngredientInput = ({ value = [], onChange, disabled = false, dialogOpen, error, errorText }) => {
  const { isDarkMode } = useTheme();
  const menuProps = getMenuProps(isDarkMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [unit_id, setUnitId] = useState('');
  const [showQuantityInput, setShowQuantityInput] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [freeText, setFreeText] = useState('');
  const inputRef = useRef();

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearchQuery(searchQuery); }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const normalizeIngredients = (ingredients) => {
    return ingredients.map(ingredient => {
      if (ingredient.quantity_display && /^\d+\.\d+$/.test(ingredient.quantity_display)) {
        return { ...ingredient, quantity_display: formatFraction(parseFloat(ingredient.quantity_display)) };
      }
      return ingredient;
    });
  };

  useEffect(() => {
    const normalizedIngredients = normalizeIngredients(value);
    const hasChanges = normalizedIngredients.some((ingredient, index) => {
      const original = value[index];
      return original && ingredient.quantity_display !== original.quantity_display;
    });
    if (hasChanges) { onChange(normalizedIngredients); }
  }, [value]);

  const { data: searchResultsData, isFetching: isSearching } = useSearchIngredientsQuery(
    { query: debouncedSearchQuery },
    { skip: !debouncedSearchQuery || debouncedSearchQuery.length < 2 }
  );
  const searchResults = Array.isArray(searchResultsData?.data) ? searchResultsData.data : [];
  const [createIngredient] = useCreateIngredientMutation();
  const { data: popularData, isFetching: isPopularFetching } = useGetPopularIngredientsQuery(undefined, { skip: !isOpen || !!debouncedSearchQuery });
  const { data: allUnitsData } = useGetAllIngredientUnitsQuery({ limit: 500 });
  const allUnits = allUnitsData?.data || [];

  const handleIngredientSelect = (ingredient) => {
    if (ingredient) {
      setSelectedIngredient(ingredient);
      setShowQuantityInput(true);
      setUnitId('');
    }
  };

  const handleAddIngredient = async () => {
    if (isFreeMode) {
      if (!freeText.trim()) { toast.error('Please enter free text ingredient.'); return; }
      const newIngredient = {
        ingredient_id: 0, ingredient_name: null, quantity: null, quantity_display: null,
        unit: null, unit_id: 0, is_free_text: true, free_text: freeText.trim()
      };
      onChange([...value, newIngredient]);
      setFreeText('');
      return;
    }
    if (selectedIngredient) {
      const selectedUnit = allUnits.find(u => u.unit_id === unit_id) || null;
      const unitName = selectedUnit ? selectedUnit.name : '';
      const newIngredient = {
        ingredient_id: selectedIngredient.ingredient_id,
        ingredient_name: selectedIngredient.name,
        quantity: quantity, quantity_display: quantity,
        unit: unitName, unit_id: unit_id || 0,
        units: allUnits, is_free_text: false, free_text: null
      };
      onChange([...value, newIngredient]);
      setSelectedIngredient(null);
      setQuantity('');
      setUnitId('');
      setShowQuantityInput(false);
      if (inputRef.current) { inputRef.current.focus(); }
    }
  };

  const handleCreateNewIngredient = async () => {
    if (searchQuery.trim()) {
      try {
        const result = await createIngredient({ name: searchQuery.trim() }).unwrap();
        setSelectedIngredient(result.data);
        setShowQuantityInput(true);
        setUnitId('');
        setSearchQuery('');
        toast.success(`Ingredient "${result.data.name}" created successfully!`);
      } catch {
        toast.error('Failed to create ingredient. Please try again.');
      }
    }
  };

  const handleUpdateIngredient = (index, updatedIngredient) => {
    const newIngredients = [...value];
    let quantityDisplay = updatedIngredient.quantity_display;
    if (!quantityDisplay || typeof quantityDisplay === 'number' || /^\d+\.\d+$/.test(quantityDisplay)) {
      quantityDisplay = formatFraction(updatedIngredient.quantity);
    }
    newIngredients[index] = { ...updatedIngredient, quantity: quantityDisplay, quantity_display: quantityDisplay };
    onChange(newIngredients);
  };

  const handleRemoveIngredient = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newIngredients = [...value];
    const temp = newIngredients[index - 1];
    newIngredients[index - 1] = newIngredients[index];
    newIngredients[index] = temp;
    onChange(newIngredients);
  };

  const handleMoveDown = (index) => {
    if (index === value.length - 1) return;
    const newIngredients = [...value];
    const temp = newIngredients[index + 1];
    newIngredients[index + 1] = newIngredients[index];
    newIngredients[index] = temp;
    onChange(newIngredients);
  };

  const ingredientExists = (name, list) => list.some(item => item.name.toLowerCase() === name.toLowerCase());

  let options = searchQuery.length > 0 ? searchResults : (popularData?.data || []);
  options = options.filter(option => !option.isAddNew);

  const handleCancel = () => {
    setSelectedIngredient(null);
    setQuantity('');
    setUnitId('');
    setShowQuantityInput(false);
    setSearchQuery('');
  };

  return (
    <div className="mb-4">
      <div className="flex justify-center mb-4">
        <ToggleButtonGroup
          value={isFreeMode ? 'free' : 'structured'}
          exclusive
          onChange={(e, val) => { if (val !== null) setIsFreeMode(val === 'free'); }}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              '&.Mui-selected': {
                backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                color: isDarkMode ? '#60a5fa' : '#2563eb',
              }
            }
          }}
        >
          <ToggleButton value="structured" sx={{ textTransform: 'none', px: 3 }}>Structured</ToggleButton>
          <ToggleButton value="free" sx={{ textTransform: 'none', px: 3 }}>Free Text</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <div className="mb-4">
        {isFreeMode ? (
          <div className="flex gap-2">
            <TextField
              fullWidth
              label="Free Text Ingredient (e.g. 1 cup of Milk)"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddIngredient(); } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  color: isDarkMode ? '#e5e7eb' : '#374151',
                  '& fieldset': { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                },
                '& .MuiInputLabel-root': { color: isDarkMode ? '#d1d5db' : '#6b7280' },
              }}
            />
            <Button variant="contained" onClick={handleAddIngredient} disabled={disabled || !freeText.trim()} sx={{ borderRadius: 0 }}>
              Add
            </Button>
          </div>
        ) : (
          <Autocomplete
            freeSolo
            options={options}
            getOptionLabel={option => option.name || ''}
            inputValue={searchQuery}
            onInputChange={(event, newInputValue) => {
              setSearchQuery(newInputValue);
              setShowQuantityInput(false);
              if (newInputValue && newInputValue.length >= 2 && Array.isArray(searchResults)) {
                const exactMatch = searchResults.find(item => item.name.toLowerCase() === newInputValue.toLowerCase());
                if (!exactMatch) { setShowQuantityInput(true); }
              }
            }}
            onFocus={() => { setIsOpen(true); setSearchQuery(''); }}
            onBlur={() => { setTimeout(() => setIsOpen(false), 200); }}
            onChange={(event, newValue) => {
              if (newValue && newValue.isAddNew) { handleCreateNewIngredient(); return; }
              if (newValue && typeof newValue === 'object') { handleIngredientSelect(newValue); }
            }}
            ListboxProps={{ style: { maxHeight: 300, overflow: 'auto' } }}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={inputRef}
                label="Search or add ingredient"
                fullWidth
                disabled={disabled}
                error={error}
                helperText={error ? (errorText || '') : (searchQuery && searchQuery.length >= 2 ? "Type to search existing ingredients or create new ones" : "Enter quantity and select fraction if needed")}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    color: isDarkMode ? '#e5e7eb' : '#374151',
                    '& fieldset': { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                    '& input::placeholder': { color: isDarkMode ? '#9ca3af' : '#9ca3af', opacity: 1 },
                  },
                  '& .MuiInputLabel-root': { color: isDarkMode ? '#d1d5db' : '#6b7280' },
                  '& .MuiFormHelperText-root': { color: error ? (isDarkMode ? '#f87171' : '#dc2626') : (isDarkMode ? '#9ca3af' : '#6b7280') },
                }}
                onFocus={() => { setIsOpen(true); setSearchQuery(''); }}
                onClick={() => { setIsOpen(true); setSearchQuery(''); }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}><Typography>{option.name}</Typography></li>
            )}
            noOptionsText={
              (searchQuery.length === 0 && isPopularFetching) || isSearching
                ? <span style={{ display: 'flex', alignItems: 'center' }}><CircularProgress size={18} style={{ marginRight: 8 }} />Loading...</span>
                : (searchQuery && searchQuery.length >= 2
                    ? `No ingredients found for "${searchQuery}". You can create it as a new ingredient.`
                    : "No ingredients available. Start typing to search or create new ones.")
            }
            open={isOpen}
            sx={{ '& .MuiAutocomplete-endAdornment': { top: 'calc(50% - 14px)' } }}
            slotProps={autocompleteSlotProps(isDarkMode)}
            onOpen={() => { setIsOpen(true); setSearchQuery(''); }}
            onClose={() => setIsOpen(false)}
          />
        )}

                {showQuantityInput && (
          <>
            <div className="flex flex-wrap sm:flex-nowrap gap-3 mt-3">
              <div className="flex gap-2 flex-1 min-w-[180px]">
                <TextField
                  label="Quantity"
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  size="small"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    '& .MuiOutlinedInput-root': {
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                      '& fieldset': { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                      '& input::placeholder': { color: isDarkMode ? '#9ca3af' : '#9ca3af', opacity: 1 },
                    },
                    '& .MuiInputLabel-root': { color: isDarkMode ? '#d1d5db' : '#6b7280' },
                    '& .MuiFormHelperText-root': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                  }}
                  disabled={disabled}
                  placeholder="Qty"
                  helperText="Optional"
                />
                <TextField
                  select
                  label="Fraction"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setQuantity(prev => {
                        const numericPart = String(prev || '').replace(/[^\d.]/g, '');
                        return numericPart ? `${numericPart} ${e.target.value}` : e.target.value;
                      });
                    }
                  }}
                  size="small"
                  sx={{
                    flex: 1.2,
                    minWidth: 0,
                    '& .MuiOutlinedInput-root': {
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                      '& fieldset': { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                    },
                    '& .MuiInputLabel-root': { color: isDarkMode ? '#d1d5db' : '#6b7280' },
                    '& .MuiFormHelperText-root': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                    '& .MuiSelect-icon': { color: isDarkMode ? '#9ca3af' : 'rgba(0, 0, 0, 0.54)' },
                  }}
                  disabled={disabled}
                  helperText="Optional"
                  SelectProps={{ MenuProps: menuProps }}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="1⁄2">1⁄2</MenuItem>
                  <MenuItem value="1⁄3">1⁄3</MenuItem>
                  <MenuItem value="2⁄3">2⁄3</MenuItem>
                  <MenuItem value="1⁄4">1⁄4</MenuItem>
                  <MenuItem value="3⁄4">3⁄4</MenuItem>
                  <MenuItem value="1⁄8">1⁄8</MenuItem>
                  <MenuItem value="3⁄8">3⁄8</MenuItem>
                  <MenuItem value="5⁄8">5⁄8</MenuItem>
                  <MenuItem value="7⁄8">7⁄8</MenuItem>
                </TextField>
              </div>
              <Autocomplete
                size="small"
                options={allUnits}
                getOptionLabel={(option) => option.name || ''}
                value={allUnits.find(u => u.unit_id === unit_id) || null}
                onChange={(e, newValue) => setUnitId(newValue ? newValue.unit_id : '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Unit"
                    placeholder="Unit"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: isDarkMode ? '#e5e7eb' : '#374151',
                        '& fieldset': { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' },
                      },
                      '& .MuiInputLabel-root': { color: isDarkMode ? '#d1d5db' : '#6b7280', fontSize: '0.75rem' },
                      '& .MuiFormHelperText-root': { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                    }}
                    helperText="Optional"
                  />
                )}
                sx={{ flex: 1.5, minWidth: '140px' }}
                disabled={disabled}
                slotProps={autocompleteSlotProps(isDarkMode)}
              />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button
                onClick={handleCancel}
                disabled={disabled}
                variant="outlined"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  color: isDarkMode ? '#94a3b8' : '#64748b',
                  borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                  '&:hover': {
                    borderColor: isDarkMode ? '#475569' : '#94a3b8',
                    backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.2)' : 'rgba(100, 116, 139, 0.04)',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAddIngredient}
                disabled={disabled || !selectedIngredient}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  backgroundColor: '#7367f0',
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#5e50ee', boxShadow: 'none' },
                }}
              >
                Add
              </Button>
            </div>
          </>
        )}
      </div>

      {value.length > 0 && (
        <div>
          <Typography variant="subtitle1" className={`mb-2 ${isDarkMode ? 'text-gray-200' : ''}`}>
            Added Ingredients:
          </Typography>
          <div
            style={{
              ...(value.length > 7 && {
                maxHeight: 360,
                overflowY: 'auto',
                paddingRight: 4,
                borderRadius: 4,
                border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                padding: '4px 8px 4px 4px',
              }),
            }}
          >
            {value.map((ingredient, index) => (
              <IngredientItem
                key={index}
                ingredient={ingredient}
                index={index}
                total={value.length}
                allUnits={allUnits}
                onUpdate={(updatedIngredient) => handleUpdateIngredient(index, updatedIngredient)}
                onRemove={() => handleRemoveIngredient(index)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientInput;
