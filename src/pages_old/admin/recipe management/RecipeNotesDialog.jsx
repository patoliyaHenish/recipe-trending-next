"use client";
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Avatar,
  useMediaQuery,
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import { useTheme } from '../../../context/ThemeContext';
import { useGetRecipeNotesQuery, useAddRecipeNoteMutation, useDeleteRecipeNoteMutation, useUpdateRecipeNoteStatusMutation } from '../../../features/api/recipeNoteApi';
import { toast } from '../../../utils/toast';
import { useSelector, useDispatch } from 'react-redux';
import { recipeApi } from '../../../features/api/recipeApi';
import { ConfirmDialog } from '../../../components/common';

const statusConfig = {
  pending: {
    label: 'Pending',
    bg: (dark) => dark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
    color: (dark) => dark ? '#fbbf24' : '#d97706',
    border: (dark) => dark ? 'rgba(245, 158, 11, 0.3)' : '#fcd34d',
  },
  resolved: {
    label: 'Resolved',
    bg: (dark) => dark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5',
    color: (dark) => dark ? '#34d399' : '#059669',
    border: (dark) => dark ? 'rgba(16, 185, 129, 0.3)' : '#6ee7b7',
  },
};

const menuSx = (isDarkMode) => ({
  PaperProps: {
    sx: {
      backgroundColor: isDarkMode ? '#283046' : '#ffffff',
      color: isDarkMode ? '#e2e8f0' : '#1e293b',
      borderRadius: '8px',
      border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
      boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)',
      mt: 0.5,
      '& .MuiMenuItem-root': {
        fontSize: '0.8rem',
        py: 1,
        '&:hover': { backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.1)' : '#f1f5f9' },
        '&.Mui-selected': {
          backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.15)' : '#e0e7ff',
          color: '#7367f0',
          '&:hover': { backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.2)' : '#c7d2fe' },
        },
      },
    },
  },
});

const selectSx = (isDarkMode, width = 110) => ({
  width,
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 500,
  backgroundColor: isDarkMode ? '#283046' : '#ffffff',
  color: isDarkMode ? '#e2e8f0' : '#1e293b',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: isDarkMode ? '#404656' : '#ebe9f1' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: isDarkMode ? '#6b7280' : '#cbd5e1' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7367f0', borderWidth: '2px' },
  '& .MuiSvgIcon-root': { color: isDarkMode ? '#9ca3af' : '#64748b' },
});

const RecipeNotesDialog = ({ open, onClose, recipeId, recipeTitle, canAdd, canDeletePermission, canUpdateStatus }) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('pending');
  const [deleteNoteId, setDeleteNoteId] = useState(null);

  const { data, isLoading, isFetching } = useGetRecipeNotesQuery(recipeId, { skip: !recipeId || !open });
  const [addNote, { isLoading: isAdding }] = useAddRecipeNoteMutation();
  const [deleteNote, { isLoading: isDeleting }] = useDeleteRecipeNoteMutation();
  const [updateStatus] = useUpdateRecipeNoteStatusMutation();

  const notes = data?.data || [];

  const handleUpdateStatus = async (noteId, newStatus) => {
    try {
      await updateStatus({ noteId, status: newStatus }).unwrap();
      dispatch(recipeApi.util.invalidateTags(['Refetch_Recipe']));
      toast.success('Status updated');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      await addNote({ recipeId, message: message.trim(), status }).unwrap();
      dispatch(recipeApi.util.invalidateTags(['Refetch_Recipe']));
      setMessage('');
      setStatus('pending');
      toast.success('Note added successfully');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to add note');
    }
  };

  const confirmDelete = async () => {
    if (!deleteNoteId) return;
    try {
      await deleteNote(deleteNoteId).unwrap();
      dispatch(recipeApi.util.invalidateTags(['Refetch_Recipe']));
      toast.success('Note deleted');
      setDeleteNoteId(null);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete note');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const getInitials = (name = '') =>
    name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: '8px',
            backgroundColor: isDarkMode ? '#283046' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
            boxShadow: isDarkMode ? '0 15px 30px rgba(0,0,0,0.3)' : '0 15px 30px rgba(0,0,0,0.1)',
          },
        }}
      >
        <DialogTitle
          className="flex items-center justify-between"
          sx={{ borderBottom: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`, py: 2.5 }}
        >
          <Box>
            <Typography variant="h6" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}>
              Notes
            </Typography>
            {recipeTitle && (
              <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block' }}>
                {recipeTitle}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            py: 3,
            px: 3,
            backgroundColor: isDarkMode ? '#283046' : '#ffffff',
            borderColor: isDarkMode ? '#404656' : '#ebe9f1',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            minHeight: '300px',
          }}
        >
          <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isLoading || isFetching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress size={28} sx={{ color: '#7367f0' }} />
              </Box>
            ) : notes.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                  No notes yet. Add the first note below.
                </Typography>
              </Box>
            ) : (
              notes.map((note) => {
                const isOwnNote = Number(note.commenter_id) === Number(user?.user_id);
                const canDelete = canDeletePermission || isOwnNote;
                const sc = statusConfig[note.status] || statusConfig.pending;

                return (
                  <Box
                    key={note.note_id}
                    sx={{
                      p: 2.5,
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
                      backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

                        <Box>
                          <Typography variant="caption" sx={{
                            fontWeight: 600, fontSize: '0.8rem',
                            color: isDarkMode ? '#e5e7eb' : '#111827',
                          }}>
                            {note.commenter_name || 'Unknown'}{isOwnNote && ' (You)'}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '0.7rem' }}>
                            {formatDate(note.created_at)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {canUpdateStatus && note.status !== 'resolved' ? (
                          <Autocomplete
                            size="small"
                            options={[{ label: 'Pending', value: 'pending' }, { label: 'Resolved', value: 'resolved' }]}
                            getOptionLabel={(option) => option.label || ''}
                            value={[{ label: 'Pending', value: 'pending' }, { label: 'Resolved', value: 'resolved' }].find(opt => opt.value === (note.status || 'pending')) || null}
                            onChange={(_, newValue) => {
                              handleUpdateStatus(note.note_id, newValue ? newValue.value : 'pending');
                            }}
                            isOptionEqualToValue={(option, value) => option.value === value.value}
                            disableClearable
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    height: '32px',
                                    padding: '0 39px 0 0 !important',
                                    backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                                    borderRadius: '8px',
                                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    '& fieldset': {
                                        borderColor: isDarkMode ? '#404656' : '#ebe9f1',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: isDarkMode ? '#6b7280' : '#cbd5e1',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#7367f0 !important',
                                        borderWidth: '2px !important',
                                    },
                                  },
                                  '& .MuiInputBase-input': {
                                    padding: '0px 14px !important',
                                    height: '32px',
                                    lineHeight: '32px',
                                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                  }
                                }}
                              />
                            )}
                            disablePortal={true}
                            slotProps={{
                              paper: {
                                sx: {
                                  bgcolor: isDarkMode ? '#283046' : '#ffffff',
                                  color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                  borderRadius: '8px',
                                  border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
                                  boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)',
                                  mt: 0.5,
                                  '& .MuiAutocomplete-listbox': {
                                    padding: '0',
                                    '& .MuiAutocomplete-option': {
                                      fontSize: '0.8rem',
                                      py: 1,
                                      color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                      '&[aria-selected="true"]': {
                                        backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.15) !important' : '#e0e7ff !important',
                                        color: '#7367f0 !important',
                                        fontWeight: 500,
                                        '&.Mui-focused': {
                                          backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.2) !important' : '#c7d2fe !important'
                                        }
                                      },
                                      '&:hover': {
                                        backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.1) !important' : '#f1f5f9 !important',
                                      },
                                      '&.Mui-focused': {
                                        backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.1) !important' : '#f1f5f9 !important',
                                      }
                                    }
                                  }
                                }
                              }
                            }}
                            sx={{
                              width: 110,
                              '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#9ca3af' : '#64748b' },
                              '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#9ca3af' : '#64748b' }
                            }}
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {canUpdateStatus && note.status === 'resolved' && (
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateStatus(note.note_id, 'pending')}
                                title="Reopen"
                                sx={{
                                  color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                                  p: '3px',
                                  '&:hover': { color: '#7367f0', backgroundColor: 'rgba(115, 103, 240, 0.1)' },
                                }}
                              >
                                <EditIcon sx={{ fontSize: '0.8rem' }} />
                              </IconButton>
                            )}
                            <Chip
                              label={sc.label}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                backgroundColor: sc.bg(isDarkMode),
                                color: sc.color(isDarkMode),
                                border: `1px solid ${sc.border(isDarkMode)}`,
                              }}
                            />
                          </Box>
                        )}
                        {canDelete && (
                          <IconButton
                            onClick={() => setDeleteNoteId(note.note_id)}
                            disabled={isDeleting}
                            size="small"
                            sx={{
                              color: isDarkMode ? '#ef4444' : '#dc2626',
                              p: '4px',
                              borderRadius: '4px',
                              backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              '&:hover': {
                                backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              },
                              transition: 'all 0.2s',
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: isDarkMode ? '#d0d2d6' : '#4b4b4b',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-words',
                    }}>
                      {note.message}
                    </Typography>
                  </Box>
                );
              })
            )}
          </Box>

          {/* Input area */}
          {canAdd && (
            <Box sx={{
              mt: 'auto',
              p: 2.5,
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                size="small"
                placeholder="Write a note..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                    fontSize: '0.9rem',
                    '& fieldset': { borderColor: isDarkMode ? '#404656' : '#ebe9f1' },
                    '&:hover fieldset': { borderColor: isDarkMode ? '#6b7280' : '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: '#7367f0', borderWidth: '1px' },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    opacity: 1,
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5 }}>
                <Autocomplete
                  size="small"
                  options={[{ label: 'Pending', value: 'pending' }, { label: 'Resolved', value: 'resolved' }]}
                  getOptionLabel={(option) => option.label || ''}
                  value={[{ label: 'Pending', value: 'pending' }, { label: 'Resolved', value: 'resolved' }].find(opt => opt.value === status) || null}
                  onChange={(_, newValue) => {
                    setStatus(newValue ? newValue.value : 'pending');
                  }}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  disableClearable
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '36px', // match the height of the Send button (36px)
                          padding: '0 39px 0 0 !important',
                          backgroundColor: isDarkMode ? '#283046' : '#ffffff',
                          borderRadius: '8px',
                          color: isDarkMode ? '#e2e8f0' : '#1e293b',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          '& fieldset': {
                              borderColor: isDarkMode ? '#404656' : '#ebe9f1',
                          },
                          '&:hover fieldset': {
                              borderColor: isDarkMode ? '#6b7280' : '#cbd5e1',
                          },
                          '&.Mui-focused fieldset': {
                              borderColor: '#7367f0 !important',
                              borderWidth: '2px !important',
                          },
                        },
                        '& .MuiInputBase-input': {
                          padding: '0px 14px !important',
                          height: '36px',
                          lineHeight: '36px',
                          color: isDarkMode ? '#e2e8f0' : '#1e293b',
                        }
                      }}
                    />
                  )}
                  disablePortal={true}
                  slotProps={{
                    paper: {
                      sx: {
                        bgcolor: isDarkMode ? '#283046' : '#ffffff',
                        color: isDarkMode ? '#e2e8f0' : '#1e293b',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}`,
                        boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)',
                        mt: 0.5,
                        '& .MuiAutocomplete-listbox': {
                          padding: '0',
                          '& .MuiAutocomplete-option': {
                            fontSize: '0.8rem',
                            py: 1,
                            color: isDarkMode ? '#e2e8f0' : '#1e293b',
                            '&[aria-selected="true"]': {
                              backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.15) !important' : '#e0e7ff !important',
                              color: '#7367f0 !important',
                              fontWeight: 500,
                              '&.Mui-focused': {
                                backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.2) !important' : '#c7d2fe !important'
                              }
                            },
                            '&:hover': {
                              backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.1) !important' : '#f1f5f9 !important',
                            },
                            '&.Mui-focused': {
                              backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.1) !important' : '#f1f5f9 !important',
                            }
                          }
                        }
                      }
                    }
                  }}
                  sx={{
                    width: 120,
                    '& .MuiAutocomplete-popupIndicator': { color: isDarkMode ? '#9ca3af' : '#64748b' },
                    '& .MuiAutocomplete-clearIndicator': { color: isDarkMode ? '#9ca3af' : '#64748b' }
                  }}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={isAdding || !message.trim()}
                  variant="contained"
                  sx={{
                    borderRadius: '6px',
                    height: 36,
                    px: 3,
                    minWidth: 0,
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    backgroundColor: '#7367f0',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: '#5e50ee',
                      boxShadow: 'none',
                    },
                    '&.Mui-disabled': { opacity: 0.6, backgroundColor: '#7367f0', color: '#fff' },
                  }}
                >
                  {isAdding
                    ? <CircularProgress size={16} color="inherit" />
                    : <><SendIcon sx={{ fontSize: '1rem', mr: 1 }} />Send</>
                  }
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, backgroundColor: isDarkMode ? '#283046' : '#ffffff', borderTop: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: '6px',
              color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
              borderColor: isDarkMode ? '#404656' : '#d8d6de',
              textTransform: 'uppercase',
              fontWeight: 500,
              px: 3,
              '&:hover': {
                borderColor: isDarkMode ? '#d0d2d6' : '#4b4b4b',
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {deleteNoteId && (
        <ConfirmDialog
          open={!!deleteNoteId}
          onClose={() => setDeleteNoteId(null)}
          onConfirm={confirmDelete}
          title="Delete Note"
          message="Are you sure you want to delete this note? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={isDeleting}
          loadingText="Deleting..."
          severity="error"
        />
      )}
    </>
  );
};

export default RecipeNotesDialog;

