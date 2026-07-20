"use client";
import React, { useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, IconButton, Switch, InputAdornment, Typography, useMediaQuery } from '@mui/material'
import { useTheme as useMuiTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useCreateFooterItemMutation, useUpdateFooterItemMutation } from '../../../features/api/footerApi'
import { toast } from '../../../utils/toast';
import { useTheme } from '../../../context/ThemeContext'
import { useSelector } from 'react-redux'

const validationSchema = Yup.object({
    label: Yup.string().required('Label is required').min(2, 'Too short'),
    path: Yup.string().required('Path is required'),
    order_index: Yup.number().required('Sort order is required').integer('Must be an integer'),
    open_in_new_tab: Yup.boolean().required(),
    is_active: Yup.boolean().required()
})

const AddFooterItemDialog = ({ open, onClose, editItem }) => {
    const { isDarkMode } = useTheme()
    const muiTheme = useMuiTheme()
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'))
    const user = useSelector((state) => state.auth.user);
    const userPermissions = user?.permissions || [];
    const isAdmin = user?.role === 'admin' || user?.role_name === 'admin';
    const canPublish = isAdmin || userPermissions.includes('footer.publish');

    const [createFooterItem, { isLoading: isCreating }] = useCreateFooterItemMutation()
    const [updateFooterItem, { isLoading: isUpdating }] = useUpdateFooterItemMutation()


    const formik = useFormik({
        initialValues: {
            label: '',
            path: '',
            order_index: 0,
            open_in_new_tab: false,
            is_active: true
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                if (editItem) {
                    await updateFooterItem({ id: editItem.id, ...values }).unwrap()
                    toast.success('Footer item updated successfully')
                } else {
                    await createFooterItem(values).unwrap()
                    toast.success('Footer item created successfully')
                }
                formik.resetForm()
                onClose()
            } catch (error) {
                toast.error(error.data?.message || 'Something went wrong')
            }
        }
    })

    useEffect(() => {
        if (editItem) {
            formik.setValues({
                label: editItem.label || '',
                path: editItem.path || '',
                order_index: editItem.order_index || 0,
                open_in_new_tab: editItem.open_in_new_tab || false,
                is_active: editItem.is_active !== undefined ? editItem.is_active : true
            })
        } else {
            formik.resetForm()
        }
    }, [editItem, open])

    const customInputSx = {
        '& .MuiOutlinedInput-root': {
          color: isDarkMode ? '#e2e8f0' : '#1e293b',
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
          borderRadius: '8px',
          transition: 'all 0.2s ease-in-out',
          '& fieldset': {
            borderColor: isDarkMode ? '#334155' : '#e2e8f0',
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: isDarkMode ? '#475569' : '#cbd5e1',
          },
          '&.Mui-focused fieldset': {
              borderColor: '#6366f1',
              borderWidth: '2px',
          },
          '&.Mui-focused': {
              backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
          }
        },
        '& .MuiInputLabel-root': {
          color: isDarkMode ? '#94a3b8' : '#64748b',
          '&.Mui-focused': {
              color: '#6366f1',
          }
        },
        '& .MuiFormHelperText-root': {
          color: '#ef4444',
          marginLeft: '4px',
          marginTop: '4px',
        },
        '& .MuiTypography-root': {
            color: isDarkMode ? '#e2e8f0' : '#1e293b',
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                  backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                  borderRadius: isMobile ? 0 : '16px',
                  boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                  backgroundImage: 'none',
                  border: isDarkMode ? '1px solid #1e293b' : 'none',
                },
            }}
        >
            <DialogTitle 
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  p: 3,
                  pb: 2,
                }}
            >
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: isDarkMode ? '#f8fafc' : '#0f172a', letterSpacing: '-0.025em' }}>
                        {editItem ? 'Edit Footer Item' : 'Add Footer Item'}
                    </Typography>
                </Box>
                <IconButton 
                    onClick={onClose}
                    size="small"
                    sx={{ 
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
                        '&:hover': {
                            backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                            color: isDarkMode ? '#f8fafc' : '#0f172a',
                        }
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <form onSubmit={formik.handleSubmit} noValidate>
                <DialogContent
                    sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5
                    }}
                >
                    <TextField
                        fullWidth
                        id="label"
                        name="label"
                        label="Label"
                        value={formik.values.label}
                        onChange={formik.handleChange}
                        error={formik.touched.label && Boolean(formik.errors.label)}
                        helperText={formik.touched.label && formik.errors.label}
                        size="medium"
                        sx={customInputSx}
                        required
                    />
                    <TextField
                        fullWidth
                        id="path"
                        name="path"
                        label="Path"
                        value={formik.values.path}
                        onChange={formik.handleChange}
                        error={formik.touched.path && Boolean(formik.errors.path)}
                        helperText={formik.touched.path && formik.errors.path}
                        size="medium"
                        sx={customInputSx}
                        required
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Typography sx={{ color: isDarkMode ? '#64748b' : '#94a3b8', fontWeight: 600, mr: -0.5 }}>
                                        /
                                    </Typography>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        id="order_index"
                        name="order_index"
                        label="Sort Order"
                        type="number"
                        value={formik.values.order_index}
                        onChange={formik.handleChange}
                        error={formik.touched.order_index && Boolean(formik.errors.order_index)}
                        helperText={formik.touched.order_index && formik.errors.order_index}
                        size="medium"
                        sx={customInputSx}
                        required
                    />
                    
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 2,
                        p: 2.5,
                        mt: 1,
                        borderRadius: '12px',
                        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                        border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                    }}>
                         <Box display="flex" justifyContent="space-between" alignItems="center">
                             <Box>
                                 <Typography sx={{ fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>Open in New Tab</Typography>
                                 <Typography variant="body2" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>Open link in a new browser window</Typography>
                             </Box>
                             <Switch
                                checked={formik.values.open_in_new_tab}
                                onChange={formik.handleChange}
                                name="open_in_new_tab"
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366f1' },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#6366f1' },
                                }}
                            />
                         </Box>
                         <Box display="flex" justifyContent="space-between" alignItems="center">
                             <Box>
                                 <Typography sx={{ fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                                    Live Status
                                    {(() => {
                                        if (!canPublish) return " (No Permission)";
                                        return "";
                                    })()}
                                 </Typography>
                                 <Typography variant="body2" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>Make this item visible in the footer</Typography>
                             </Box>
                             <Switch
                                checked={formik.values.is_active}
                                onChange={formik.handleChange}
                                name="is_active"
                                color="success"
                                disabled={!canPublish}
                            />
                         </Box>
                    </Box>

                </DialogContent>
                <DialogActions
                    sx={{
                        p: 3,
                        pt: 2,
                        gap: 2,
                    }}
                >
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
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={isCreating || isUpdating}
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
                        {isCreating || isUpdating ? (editItem ? 'Updating...' : 'Adding...') : (editItem ? 'Update' : 'Add')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default AddFooterItemDialog

