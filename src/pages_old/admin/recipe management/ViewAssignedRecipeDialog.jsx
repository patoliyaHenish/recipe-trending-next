"use client";
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Chip, Box, useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '../../../context/ThemeContext';

const STATUS_OPTIONS = [
  { value: "assigned", label: "Assigned" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "on-hold", label: "On hold" },
];
const statusLabel = (v) => STATUS_OPTIONS.find((s) => s.value === v)?.label || v;

const ViewAssignedRecipeDialog = ({
  open,
  onClose,
  assignedRecipe,
}) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  const statusColors = {
    assigned: isDarkMode ? "#3b82f6" : "#2563eb",
    "in-progress": isDarkMode ? "#f59e0b" : "#d97706",
    completed: isDarkMode ? "#10b981" : "#059669",
    "on-hold": isDarkMode ? "#9ca3af" : "#6b7280",
  };

  const DetailRow = ({ label, value, children }) => (
      <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {label}
              </Typography>
          </Box>
          {children ? children : (
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                  {value || 'N/A'}
              </Typography>
          )}
      </Box>
  );

  return (
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
        <Typography variant="h6" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}>
          Assigned Recipe Details
        </Typography>
        <IconButton onClick={onClose} sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent
        dividers
        sx={{
          py: 3,
          backgroundColor: isDarkMode ? '#283046' : '#ffffff',
          borderColor: isDarkMode ? '#404656' : '#ebe9f1',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {assignedRecipe ? (
          <>
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 3,
                bgcolor: isDarkMode ? 'rgba(115, 103, 240, 0.04)' : 'rgba(115, 103, 240, 0.04)',
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(115, 103, 240, 0.12)' : 'rgba(115, 103, 240, 0.12)'}`,
            }}>
              <Box sx={{ gridColumn: 'span 2' }}>
                <DetailRow label="Recipe Name" value={assignedRecipe.recipe_name} />
              </Box>
              
              <DetailRow label="Status">
                  <Chip
                    label={statusLabel(assignedRecipe.status || 'assigned')}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: '22px',
                      color: statusColors[assignedRecipe.status] || (isDarkMode ? "#e5e7eb" : "#374151"),
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                      border: `1px solid ${statusColors[assignedRecipe.status] ? statusColors[assignedRecipe.status] + '33' : (isDarkMode ? '#e5e7eb33' : '#37415133')}`,
                    }}
                  />
              </DetailRow>

              <DetailRow label="Assigned To">
                 {assignedRecipe.assigned_user_name ? (
                     <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                            {assignedRecipe.assigned_user_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', display: 'block' }}>
                            {assignedRecipe.assigned_user_email}
                        </Typography>
                     </Box>
                 ) : (
                     <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                         Unassigned
                     </Typography>
                 )}
              </DetailRow>

              <DetailRow label="Category" value={assignedRecipe.category_name} />
              <DetailRow label="Sub-category" value={assignedRecipe.sub_category_name} />

              {assignedRecipe.created_at && (
                  <DetailRow label="Created At">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {new Date(assignedRecipe.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Typography>
                  </DetailRow>
              )}

              {assignedRecipe.updated_at && (
                  <DetailRow label="Updated At">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                        {new Date(assignedRecipe.updated_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Typography>
                  </DetailRow>
              )}
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">No details found.</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${isDarkMode ? '#404656' : '#ebe9f1'}` }}>
        <Button
          onClick={onClose}
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
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewAssignedRecipeDialog;
