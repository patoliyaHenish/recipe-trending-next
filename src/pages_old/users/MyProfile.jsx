"use client";
import { Visibility, VisibilityOff, RestaurantMenuRounded, EditRounded, Egg as EggIcon, RadioButtonCheckedRounded } from '@mui/icons-material';
import { Avatar, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, TextField, Typography, Box, Chip, Stack, Divider } from '@mui/material';
import { Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '../../utils/toast';
import * as Yup from 'yup';
import CropImage from '../../components/CropImage';
import { useUser } from '../../context/useUser';
import { useChangePasswordMutation, useLogoutUserMutation, useMyProfileQuery, useUpdateProfileMutation, useUpdatePreferenceMutation } from '../../features/api/authApi';

import RecipeCard from '../../components/common/RecipeCard';
import { getImage } from '../../utils/helper';
import PreferenceDialog from '../../components/PreferenceDialog';
import RecipeGridSkeleton from '../../components/common/RecipeGridSkeleton';
import Cookies from 'js-cookie';
import { useTheme } from '../../context/ThemeContext';
import { Pagination, CircularProgress } from '@mui/material';


const MyProfile = () => {
  const { data, isLoading } = useMyProfileQuery(undefined);
  const { isDarkMode } = useTheme();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChanging }] = useChangePasswordMutation();
  const [updatePreference, { isLoading: isUpdatingPref }] = useUpdatePreferenceMutation();
  const [logoutUser] = useLogoutUserMutation();
  const { setUser } = useUser();
  const router = useRouter();

  const [name, setName] = useState('');

  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState('');
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [removeProfilePic, setRemoveProfilePic] = useState(false);

  const [nameError, setNameError] = useState('');

  const [isPreferenceDialogOpen, setIsPreferenceDialogOpen] = useState(false);


  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);



  const passwordSchema = Yup.object().shape({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string()
      .required('New password is required')
      .min(6, 'Password must be at least 6 characters')
      .matches(/[A-Z]/, 'Must contain an uppercase letter')
      .matches(/[a-z]/, 'Must contain a lowercase letter')
      .matches(/[0-9]/, 'Must contain a number')
      .matches(/[@$!%*?&#]/, 'Must contain a special character'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
      .required('Confirm your new password'),
  });

  useEffect(() => {
    const title = "My Profile | Recipe Trending";
    const metaDesc = "Manage your Recipe Trending profile, update your food preferences, and view recipes you've reacted to.";
    
    document.title = title;

    let metaDescriptionTag = document.querySelector('meta[name="description"]');
    if (!metaDescriptionTag) {
        metaDescriptionTag = document.createElement('meta');
        metaDescriptionTag.name = "description";
        document.head.appendChild(metaDescriptionTag);
    }
    metaDescriptionTag.setAttribute('content', metaDesc);

    return () => { document.title = "Recipe Trending"; };
  }, []);

  useEffect(() => {
    if (data?.user) {
      setName(data.user.name || '');
      setPreview(data.user?.image ? getImage(data.user.image) : '');
    }
  }, [data]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRawImage(URL.createObjectURL(file));
      setProfilePic(file);
      setShowCropDialog(true);
    }
  };

  const getCroppedImg = async (imageSrc, crop) => {
    return new Promise((resolve) => {
      const image = new window.Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        );
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg');
      };
    });
  };

  const handleCropComplete = async (croppedAreaPixels) => {
    if (rawImage && croppedAreaPixels) {
      const croppedBlob = await getCroppedImg(rawImage, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], 'profile-picture.jpg', { type: 'image/jpeg' });
      setProfilePic(croppedFile);
      setPreview(URL.createObjectURL(croppedBlob));
      setRemoveProfilePic(false);
    }
  };

  const handleRemovePicture = () => {
    setProfilePic(null);
    setPreview('');
    setRemoveProfilePic(true);
    setRawImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', name);

    if (removeProfilePic) {
      formData.append('removeProfilePic', 'true');
    } else if (profilePic) {
      formData.append('image', profilePic);
    }
    
    try {
      setNameError('');
      await updateProfile(formData).unwrap();
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      if (err?.data?.errors && Array.isArray(err.data.errors)) {
        err.data.errors.forEach((msg) => {
          const lower = String(msg).toLowerCase();
          if (lower.includes('name')) setNameError(msg);
          toast.error(msg);
        });
      } else if (err?.data?.message) {
        toast.error(err.data.message);
      } else {
        toast.error('Failed to update profile.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
      router.push('/');
      setUser(null);
      toast.success('Logged out successfully!');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const handleSavePreference = async (selectedPreferences) => {
    try {
      await updatePreference(selectedPreferences).unwrap();
      
      const prefValue = selectedPreferences.join(',');
      if (prefValue === 'all') {
        Cookies.remove('userPreference');
      } else {
        Cookies.set('userPreference', prefValue, { expires: 365 });
      }
      window.dispatchEvent(new Event('userPreferenceChanged'));

      toast.success('Food preferences updated!');
      setIsPreferenceDialogOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update preferences');
    }
  };

  const preferenceMap = {
    'veg': 'Vegetarian',
    'egg': 'Eggetarian',
    'all': 'Everything'
  };

  const getPreferenceIcon = (pref) => {
    const iconStyle = { fontSize: '0.9rem', mr: 0.5 };
    if (pref === 'veg') return (
      <Box sx={{ width: 12, height: 12, border: '1.5px solid #43a047', borderRadius: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 0.8 }}>
        <Box sx={{ width: 6, height: 6, bgcolor: '#43a047', borderRadius: '50%' }} />
      </Box>
    );
    if (pref === 'egg') return <EggIcon sx={{ ...iconStyle, color: '#ffb300' }} />;
    if (pref === 'all') return <RadioButtonCheckedRounded sx={{ ...iconStyle, color: '#795548' }} />;
    return null;
  };



  if (isLoading) return (
    <div 
      className="flex justify-center items-center min-h-screen"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        transition: 'all 0.3s ease'
      }}
    >
      <div className="text-xl font-semibold">Loading...</div>
    </div>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: { xs: '72px', sm: '80px', md: '136px', lg: '144px' },
        pb: 6,
        backgroundColor: 'var(--bg-primary)',
        transition: 'all 0.3s ease'
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card 
          sx={{
            backgroundColor: isDarkMode ? '#301400' : '#FFF5E8',
            border: isDarkMode ? '1px solid #555555' : '2px solid #CA6014',
            borderRadius: '8px',
            padding: { xs: '0.8rem', sm: '2rem' },
            marginBottom: { xs: '1.2rem', sm: '2rem' },
            transition: 'all 0.3s ease'
          }}
        >
          {!isEditing ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              gap: { xs: 3, sm: 6 }, 
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              width: '100%'
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'row', 
                gap: { xs: 2, sm: 6 }, 
                flex: 1, 
                width: '100%',
                alignItems: 'flex-start'
              }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, order: 1, width: { xs: '100px', sm: 'auto' }, flexShrink: 0 }}>
                <Avatar
                  src={preview}
                  alt={data?.user?.username || name}
                  sx={{ 
                    width: { xs: 80, sm: 120 }, 
                    height: { xs: 80, sm: 120 }, 
                    bgcolor: !preview ? (data?.user?.profile_color || '#2563eb') : 'transparent',
                    color: !preview ? '#ffffff' : 'transparent',
                    fontSize: { xs: '2.5rem', sm: '4rem' },
                    fontWeight: 400,
                    fontFamily: "'Basic', sans-serif !important",
                    letterSpacing: '1px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {!preview && (data?.user?.name || name) && (data?.user?.name || name).charAt(0).toUpperCase()}
                </Avatar>
                <Typography
                  component="button"
                  onClick={() => setIsEditing(true)}
                  sx={{
                    color: isDarkMode ? '#FFEFD9' : '#000000',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    fontFamily: "'Basic', sans-serif !important",
                    textDecoration: 'none',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#CA6014'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Edit Profile
                </Typography>
                <Box sx={{ mt: 1.5, display: { xs: 'block', sm: 'none' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, justifyContent: 'center' }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 500, 
                        color: '#ca6014', 
                        fontFamily: "'Basic', sans-serif", 
                        fontSize: '0.95rem',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        textDecorationThickness: '1.5px',
                      }}
                    >
                      Preferences
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => setIsPreferenceDialogOpen(true)}
                      sx={{ color: '#CA6014', padding: '2px' }}
                    >
                      <EditRounded sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ justifyContent: 'center' }}>
                    {(data?.user?.preference || ['all']).map(pref => (
                      <Chip 
                        key={pref}
                        icon={getPreferenceIcon(pref)}
                        label={preferenceMap[pref] || pref}
                        size="small"
                        sx={{ 
                          bgcolor: isDarkMode ? 'rgba(255, 239, 217, 0.1)' : 'rgba(202, 96, 20, 0.08)', 
                          color: isDarkMode ? '#FFEFD9' : '#000000', 
                          fontSize: '0.75rem',
                          height: '24px',
                          border: isDarkMode ? '1px solid rgba(255, 239, 217, 0.2)' : '1px solid rgba(202, 96, 20, 0.25)',
                          '& .MuiChip-label': { px: 0.8, fontFamily: "'Basic', sans-serif" }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Box>

              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: { xs: 1.5, sm: 1.5 }, 
                order: { xs: 2, sm: 2 },
                alignItems: 'flex-start',
                textAlign: 'left',
                width: { xs: 'calc(100% - 116px)', sm: '100%' }
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 0.5 }, alignItems: 'flex-start', width: '100%' }}>
                  <Box>
                    <Typography 
                      variant="h4"
                      sx={{ 
                        color: isDarkMode ? '#FFEFD9' : '#000000',
                        fontWeight: 700,
                        fontFamily: "'Basic', sans-serif !important",
                        fontSize: { xs: '1.4rem', md: '2.2rem' },
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {data?.user?.name || name || data?.user?.username}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography 
                      variant="body1"
                      sx={{ 
                        color: isDarkMode ? '#DEDEDE' : '#4B5563',
                        fontSize: { xs: '0.9rem', md: '1.05rem' },
                        fontFamily: "'Basic', sans-serif",
                        fontWeight: 500,
                        opacity: 0.9
                      }}
                    >
                      {data?.user?.email}
                    </Typography>
                  </Box>

                <Box sx={{ 
                  display: { xs: 'flex', sm: 'none' }, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 3, 
                  mt: 1.5,
                  width: '100%'
                }}>
                  {data?.user?.hasPassword && (
                    <Typography
                      component="button"
                      onClick={() => setShowPasswordDialog(true)}
                      sx={{
                        color: isDarkMode ? '#FFEFD9' : '#000000',
                        fontSize: '0.9rem',
                        fontWeight: 400,
                        fontFamily: "'Basic', sans-serif",
                        textDecoration: 'none',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        '&:hover': {
                          textDecoration: 'underline',
                          color: isDarkMode ? '#FFEFD9' : '#000000',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Change Password
                    </Typography>
                  )}
                  <Typography
                    component="button"
                    onClick={handleLogout}
                    sx={{
                      color: '#dc3545',
                      fontSize: '0.9rem',
                      fontWeight: 400,
                      fontFamily: "'Basic', sans-serif",
                      textDecoration: 'none',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      '&:hover': {
                        textDecoration: 'underline',
                        color: '#dc3545',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Logout
                  </Typography>
                </Box>
              </Box>

                <Box sx={{ mt: { xs: 0.5, sm: 1 }, display: { xs: 'none', sm: 'block' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.5, sm: 1.5 }, justifyContent: { xs: 'flex-start', sm: 'flex-start' } }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 500, 
                        color: '#ca6014', 
                        fontFamily: "'Basic', sans-serif", 
                        fontSize: '1.05rem',
                        textDecoration: 'underline',
                        textUnderlineOffset: '4px',
                        textDecorationThickness: '1.5px',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Food Preferences
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => setIsPreferenceDialogOpen(true)}
                      sx={{ color: '#CA6014', padding: '4px' }}
                    >
                      <EditRounded fontSize="small" />
                    </IconButton>
                  </Box>
                  <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                    {(data?.user?.preference || ['all']).map(pref => (
                      <Chip 
                        key={pref}
                        icon={getPreferenceIcon(pref)}
                        label={preferenceMap[pref] || pref}
                        size="small"
                        sx={{ 
                          bgcolor: isDarkMode ? 'rgba(255, 239, 217, 0.1)' : 'rgba(202, 96, 20, 0.08)', 
                          color: isDarkMode ? '#FFEFD9' : '#000000', 
                          fontWeight: 400,
                          fontSize: '0.875rem',
                          border: isDarkMode ? '1px solid rgba(255, 239, 217, 0.2)' : '1px solid rgba(202, 96, 20, 0.25)',
                          borderRadius: '6px',
                          px: 1,
                          py: 0.5,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: isDarkMode ? 'rgba(255, 239, 217, 0.15)' : 'rgba(202, 96, 20, 0.12)',
                            borderColor: isDarkMode ? 'rgba(255, 239, 217, 0.3)' : 'rgba(202, 96, 20, 0.4)',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                          },
                          '& .MuiChip-icon': { 
                            ml: 0.25, 
                            mr: 0.25,
                            ...(pref === 'egg' && { 
                              color: '#ffb300',
                              '& svg': {
                                color: '#ffb300',
                                fill: '#ffb300'
                              }
                            })
                          },
                          '& .MuiChip-label': { 
                            fontFamily: "'Basic', sans-serif",
                            fontWeight: 400,
                            px: 0.25
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Box>

              <Box sx={{ 
                display: { xs: 'none', sm: 'flex' }, 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: 3, 
                justifyContent: 'flex-end',
                order: { xs: 3, sm: 3 },
                ml: 'auto',
                alignSelf: 'flex-start'
              }}>
                {data?.user?.hasPassword && (
                  <Typography
                    component="button"
                    onClick={() => setShowPasswordDialog(true)}
                    sx={{
                      color: isDarkMode ? '#FFEFD9' : '#000000',
                      fontSize: '0.95rem',
                      fontWeight: 400,
                      fontFamily: "'Basic', sans-serif",
                      textDecoration: 'none',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      '&:hover': {
                        textDecoration: 'underline',
                        color: isDarkMode ? '#FFEFD9' : '#000000',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Change Password
                  </Typography>
                )}
                <Typography
                  component="button"
                  onClick={handleLogout}
                  sx={{
                    color: '#dc3545',
                    fontSize: '0.95rem',
                    fontWeight: 400,
                    fontFamily: "'Basic', sans-serif",
                    textDecoration: 'none',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#dc3545',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Logout
                </Typography>
              </Box>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row', md: 'row' }, gap: { xs: 1.5, sm: 3 }, alignItems: { xs: 'center', sm: 'flex-start', md: 'flex-start' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={preview}
                    alt={data?.user?.username || name}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      bgcolor: !preview ? (data?.user?.profile_color || '#2563eb') : 'transparent',
                      color: !preview ? '#ffffff' : 'transparent',
                      fontSize: '4rem',
                      fontWeight: 300,
                      fontFamily: "'Basic', sans-serif",
                      letterSpacing: '1px',
                      textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    {!preview && (data?.user?.name || name) && (data?.user?.name || name).charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: '200px' }}>
                    <Button 
                      variant="contained" 
                      component="label"
                      fullWidth
                      sx={{
                        backgroundColor: '#CA6014',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontFamily: "'Basic', sans-serif",
                        '&:hover': {
                          backgroundColor: '#A04F10',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Change Picture
                      <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                    </Button>
                    {preview && (
                      <Button 
                        variant="outlined"
                        fullWidth
                        onClick={handleRemovePicture}
                        sx={{
                          borderColor: '#dc3545',
                          color: '#dc3545',
                          fontWeight: 600,
                          fontFamily: "'Basic', sans-serif",
                          '&:hover': {
                            borderColor: '#c82333',
                            backgroundColor: '#dc3545',
                            color: '#ffffff',
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Remove Picture
                      </Button>
                    )}
                  </Box>
                  <CropImage
                    open={showCropDialog}
                    imageSrc={rawImage}
                    onClose={() => setShowCropDialog(false)}
                    onCropComplete={async (croppedAreaPixels) => {
                      await handleCropComplete(croppedAreaPixels);
                      setShowCropDialog(false);
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Name"
                    value={name}
                    onChange={e => { setName(e.target.value); if (nameError) setNameError(''); }}
                    fullWidth
                    error={Boolean(nameError)}
                    helperText={nameError}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                        color: isDarkMode ? '#ffffff' : '#000000',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#CA6014',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#CA6014',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#666666',
                        '&.Mui-focused': {
                          color: '#CA6014',
                        }
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#cccccc',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isUpdating}
                      sx={{
                        backgroundColor: '#CA6014',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontFamily: "'Basic', sans-serif",
                        '&:hover': {
                          backgroundColor: '#A04F10',
                        },
                        '&:disabled': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#cccccc',
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : '#666666',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isUpdating ? 'Updating...' : 'Update Profile'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setIsEditing(false);
                        setName(data?.user?.name || '');
                        setPreview(data?.user?.image ? getImage(data.user.image) : '');
                        setProfilePic(null);
                        setRemoveProfilePic(false);
                      }}
                      sx={{
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : '#666666',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666',
                        fontFamily: "'Basic', sans-serif",
                        '&:hover': {
                          borderColor: isDarkMode ? '#ffffff' : '#333333',
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
                          color: isDarkMode ? '#ffffff' : '#333333',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </Box>
            </form>
          )}
        </Card>

        <Box sx={{ mt: 2 }}>


          {data?.user?.username && (
            <Box sx={{ mt: 8, pt: 2, borderTop: '1px solid', borderColor: 'var(--border-color)' }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontFamily: "'Basic', sans-serif" }}>
                Username: {data.user.username}
              </Typography>
            </Box>
          )}
        </Box>

      </div>
        <Dialog
        open={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
        }}
        disableScrollLock
        PaperProps={{
          sx: {
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            transition: 'all 0.3s ease'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            color: 'var(--text-primary)',
            fontWeight: 600,
            transition: 'color 0.3s ease'
          }}
        >
          Change Password
        </DialogTitle>
        <Formik
          initialValues={{
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }}
          validationSchema={passwordSchema}
          onSubmit={async (values, { setSubmitting, setStatus, resetForm, setFieldError }) => {
            try {
              const res = await changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
              }).unwrap();
              toast.success(res.message || 'Password changed successfully!');
              setStatus({ success: true });
              resetForm();
              setTimeout(() => setShowPasswordDialog(false), 1200);
            } catch (err) {
              if (err?.data?.errors && Array.isArray(err.data.errors) && err.data.errors.length > 0) {
                err.data.errors.forEach((error) => {
                  toast.error(error);
                });
                
                err.data.errors.forEach((error) => {
                  if (error.toLowerCase().includes('current password')) {
                    setFieldError('currentPassword', error);
                  } else if (error.toLowerCase().includes('new password')) {
                    setFieldError('newPassword', error);
                  } else if (error.toLowerCase().includes('confirm')) {
                    setFieldError('confirmPassword', error);
                  }
                });
                setStatus({ success: false, errors: err.data.errors });
              } else if (err?.data?.message) {
                let cleanErrorMessage = err.data.message;
                if (typeof cleanErrorMessage === 'string') {
                  cleanErrorMessage = cleanErrorMessage.trim();
                } else {
                  cleanErrorMessage = 'An error occurred';
                }
                if (cleanErrorMessage.toLowerCase().includes('current password')) {
                  setFieldError('currentPassword', cleanErrorMessage);
                  setStatus({ success: false, errors: [] });
                } else {
                  toast.error(cleanErrorMessage);
                  setStatus({ success: false, errors: [cleanErrorMessage] });
                }
              } else {
                toast.error('Failed to change password.');
                setStatus({ success: false, errors: ['Failed to change password.'] });
              }
            }
            setSubmitting(false);
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting, status, setStatus }) => {
            const handleFieldChange = (e) => {
              handleChange(e);
              if (status?.success === false) {
                setStatus({ success: true });
              }
            };
            
            return (
            <Form>
              <DialogContent className="flex flex-col gap-3 min-w-[300px]">
                <TextField
                  label="Current Password"
                  name="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  value={values.currentPassword}
                  onChange={handleFieldChange}
                  onBlur={handleBlur}
                  error={touched.currentPassword && Boolean(errors.currentPassword)}
                  helperText={touched.currentPassword && errors.currentPassword ? String(errors.currentPassword) : ''}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F97C1B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F97C1B',
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                      '&.Mui-focused': {
                        color: '#F97C1B',
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--border-color)',
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'var(--text-secondary)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle current password visibility"
                          onClick={() => setShowCurrent((show) => !show)}
                          edge="end"
                          sx={{ color: isDarkMode ? 'var(--text-primary)' : '#000000' }}
                        >
                          {showCurrent ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="New Password"
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  value={values.newPassword}
                  onChange={handleFieldChange}
                  onBlur={handleBlur}
                  error={touched.newPassword && Boolean(errors.newPassword)}
                  helperText={touched.newPassword && errors.newPassword}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F97C1B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F97C1B',
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                      '&.Mui-focused': {
                        color: '#F97C1B',
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--border-color)',
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'var(--text-secondary)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle new password visibility"
                          onClick={() => setShowNew((show) => !show)}
                          edge="end"
                          sx={{ color: isDarkMode ? 'var(--text-primary)' : '#000000' }}
                        >
                          {showNew ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={values.confirmPassword}
                  onChange={handleFieldChange}
                  onBlur={handleBlur}
                  error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F97C1B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F97C1B',
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                      '&.Mui-focused': {
                        color: '#F97C1B',
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--border-color)',
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'var(--text-secondary)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => setShowConfirm((show) => !show)}
                          edge="end"
                          sx={{ color: isDarkMode ? 'var(--text-primary)' : '#000000' }}
                        >
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </DialogContent>
              <DialogActions>
                <Button 
                  onClick={() => setShowPasswordDialog(false)}
                  sx={{
                    borderColor: 'var(--btn-secondary)',
                    color: 'var(--btn-secondary)',
                    '&:hover': {
                      borderColor: 'var(--btn-secondary-hover)',
                      backgroundColor: 'var(--btn-secondary)',
                      color: '#ffffff',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={isSubmitting || isChanging}
                  sx={{
                    backgroundColor: '#F97C1B',
                    color: '#FFF8ED',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#FFB15E',
                      color: '#3B2200'
                    },
                    '&:disabled': {
                      backgroundColor: 'var(--text-muted)',
                      color: 'var(--text-secondary)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isSubmitting || isChanging ? 'Changing...' : 'Change Password'}
                </Button>
              </DialogActions>
            </Form>
            );
          }}
        </Formik>
      </Dialog>

      <PreferenceDialog 
        open={isPreferenceDialogOpen}
        onClose={() => setIsPreferenceDialogOpen(false)}
        onSave={handleSavePreference}
        isLoading={isUpdatingPref}
        initialValues={data?.user?.preference || ['all']}
      />
    </Box>
  );
};

export default MyProfile;
