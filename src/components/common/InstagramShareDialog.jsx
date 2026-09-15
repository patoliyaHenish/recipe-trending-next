"use client";
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    CircularProgress,
    Alert,
    IconButton,
    Chip,
    Paper,
    Stack,
    Tooltip,
    Tabs,
    Tab
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InstagramIcon from '@mui/icons-material/Instagram';
import HistoryIcon from '@mui/icons-material/History';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { useTheme } from '../../context/ThemeContext';
import { getImage } from '../../utils/helper';
import { toast } from '../../utils/toast';
import ConfirmDialog from './ConfirmDialog';
import {
    useCreateInstagramPostMutation,
    useGetRecipeInstagramPostsQuery,
    useDeleteInstagramPostMutation,
    useGenerateInstagramCaptionMutation
} from '../../features/api/instagramApi';

const InstagramShareDialog = ({ open, onClose, recipe, canDelete }) => {
    const { isDarkMode } = useTheme();
    const [tabIndex, setTabIndex] = useState(0);

    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [publishedPostUrl, setPublishedPostUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [recipeUrl, setRecipeUrl] = useState('');

    const [createPost, { isLoading: isPosting }] = useCreateInstagramPostMutation();
    const [deletePost, { isLoading: isDeleting }] = useDeleteInstagramPostMutation();
    const [generateCaption, { isLoading: isGeneratingCaption }] = useGenerateInstagramCaptionMutation();
    const { data: postsHistoryData, isLoading: isLoadingHistory } = useGetRecipeInstagramPostsQuery(recipe?.recipe_id, {
        skip: !open || !recipe?.recipe_id
    });

    const [deleteId, setDeleteId] = useState(null);

    const previousPosts = postsHistoryData?.posts || [];

    useEffect(() => {
        if (recipe && open) {
            setTitle(recipe.title || '');
            setCaption(recipe.meta_description || recipe.title || '');
            const fullImg = recipe.image ? getImage(recipe.image) : (recipe.image_url ? getImage(recipe.image_url) : '');
            setImageUrl(fullImg);
            setPublishedPostUrl('');
            setCopied(false);
            setTabIndex(0);
            let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://recipetrending.com';
            if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
                baseUrl = window.location.origin;
            }
            const recipeSlug = recipe.slug || recipe.recipe_id;
            setRecipeUrl(`${baseUrl}/recipes/${recipeSlug}`);
        }
    }, [recipe, open]);

    const handleShare = async () => {
        if (!title.trim()) {
            toast.error('Title is required for Instagram post.');
            return;
        }
        if (!imageUrl) {
            toast.error('Recipe Image URL is required for Instagram post.');
            return;
        }

        try {
            const res = await createPost({
                recipe_id: recipe.recipe_id,
                title: title.trim(),
                image_url: imageUrl,
                caption: caption.trim()
            }).unwrap();

            if (res.success) {
                toast.success('Post successfully published on Instagram!');
                const url = res.post?.post_url || '';
                setPublishedPostUrl(url);
            }
        } catch (err) {
            const msg = err?.data?.userMessage || err?.data?.message || err?.message || 'Failed to post on Instagram.';
            toast.error(msg);
        }
    };

    const handleCopyUrl = (urlToCopy) => {
        if (!urlToCopy) return;
        navigator.clipboard.writeText(urlToCopy);
        setCopied(true);
        toast.success('Instagram URL copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDeletePost = async () => {
        if (!deleteId) return;

        try {
            const res = await deletePost(deleteId).unwrap();

            if (res.success && res.databaseDeleted) {
                if (res.instagramDeleted) {
                    toast.success('Instagram post deleted successfully from Instagram and local history.');
                } else {
                    toast.success('Instagram post removed from local history. It was already not found on Instagram.');
                }
                setDeleteId(null);
            } else {
                toast.error(res?.userMessage || res?.message || 'Instagram post could not be deleted through the API. The local history record has been kept so you can retry or delete manually.');
                setDeleteId(null);
            }
        } catch (err) {
            const msg = err?.data?.userMessage || err?.data?.message || err?.message || 'Failed to delete Instagram post.';
            toast.error(msg);
        }
    };

    const handleGenerateCaption = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title first to generate a caption.');
            return;
        }

        try {
            const res = await generateCaption({
                title: title.trim(),
                description: recipe?.description || recipe?.meta_description || '',
                meta_description: recipe?.meta_description || ''
            }).unwrap();

            if (res.success && res.caption) {
                setCaption(res.caption);
                toast.success('Caption generated successfully!');
            } else {
                toast.error(res?.message || 'Failed to generate caption. Please try again.');
            }
        } catch (err) {
            const msg = err?.data?.message || err?.message || 'Failed to generate caption.';
            toast.error(msg);
        }
    };

    const isRecipePublicApproved = recipe?.public_approved === true || recipe?.public_approved === 'true';

    if (!recipe) return null;

    const bgPaper = isDarkMode ? '#283046' : '#ffffff';
    const bgCard = isDarkMode ? '#161d31' : '#f8f8f8';
    const borderColor = isDarkMode ? '#404656' : '#ebe9f1';
    const textPrimary = isDarkMode ? '#d0d2d6' : '#2c2c2c';
    const textSecondary = isDarkMode ? '#b4b7bd' : '#6e6b7b';
    const inputBg = isDarkMode ? '#161d31' : '#ffffff';

    const textFieldStyle = {
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
                borderColor: '#E1306C',
                borderWidth: '2px',
            },
            '&.Mui-focused': {
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
            },
        },
        '& .MuiInputLabel-root': {
            color: isDarkMode ? '#94a3b8' : '#64748b',
            '&.Mui-focused': {
                color: '#E1306C',
            },
        },
        '& .MuiFormHelperText-root': {
            color: isDarkMode ? '#94a3b8' : '#64748b',
            marginLeft: '4px',
            marginTop: '4px',
        },
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            sx={{
                '@media (max-width:600px)': {
                    '& .MuiDialog-paper': {
                        maxWidth: '100%',
                        width: '100%',
                        height: '100%',
                        margin: 0,
                        borderRadius: 0
                    },
                    '& .MuiDialog-container': {
                        height: '100%'
                    }
                }
            }}
            PaperProps={{
                sx: {
                    borderRadius: '8px',
                    backgroundColor: bgPaper,
                    color: textPrimary,
                    backgroundImage: 'none',
                    border: `1px solid ${borderColor}`,
                    boxShadow: isDarkMode ? '0 15px 30px rgba(0,0,0,0.3)' : '0 15px 30px rgba(0,0,0,0.1)',
                }
            }}
        >
            <DialogTitle
                className="flex items-center justify-between"
                sx={{
                    borderBottom: `1px solid ${borderColor}`,
                    py: 2.5,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Typography variant="h6" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}>
                    Share Recipe to Instagram
                </Typography>
                <IconButton onClick={onClose} sx={{ color: textSecondary }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Box sx={{ px: 3, pt: 1.5, borderBottom: `1px solid ${borderColor}` }}>
                <Tabs
                    value={tabIndex}
                    onChange={(e, val) => setTabIndex(val)}
                    sx={{
                        minHeight: 40,
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#E1306C',
                            height: 3,
                            borderRadius: '3px 3px 0 0'
                        }
                    }}
                >
                    <Tab
                        icon={<InstagramIcon sx={{ fontSize: 18 }} />}
                        iconPosition="start"
                        label="Create Post"
                        sx={{
                            textTransform: 'none',
                            fontWeight: tabIndex === 0 ? 600 : 500,
                            fontSize: '0.875rem',
                            minHeight: 40,
                            color: tabIndex === 0 ? '#E1306C' : textSecondary,
                            '&.Mui-selected': { color: '#E1306C' }
                        }}
                    />
                    <Tab
                        icon={<HistoryIcon sx={{ fontSize: 18 }} />}
                        iconPosition="start"
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>History</span>
                                {previousPosts.length > 0 && (
                                    <Chip
                                        label={previousPosts.length}
                                        size="small"
                                        sx={{
                                            height: 18,
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            backgroundColor: tabIndex === 1 ? '#E1306C' : (isDarkMode ? '#3b4253' : '#e0e0e0'),
                                            color: tabIndex === 1 ? '#ffffff' : textSecondary,
                                        }}
                                    />
                                )}
                            </Box>
                        }
                        sx={{
                            textTransform: 'none',
                            fontWeight: tabIndex === 1 ? 600 : 500,
                            fontSize: '0.875rem',
                            minHeight: 40,
                            color: tabIndex === 1 ? '#E1306C' : textSecondary,
                            '&.Mui-selected': { color: '#E1306C' }
                        }}
                    />
                </Tabs>
            </Box>

            <DialogContent
                dividers
                sx={{
                    py: 3,
                    px: 3,
                    backgroundColor: bgPaper,
                    borderColor: borderColor
                }}
            >
                {tabIndex === 0 && (
                    <Box>
                        {publishedPostUrl && (
                            <Alert
                                icon={<CheckCircleIcon sx={{ color: '#10b981' }} />}
                                severity="success"
                                sx={{
                                    mb: 3,
                                    borderRadius: '6px',
                                    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                                    color: isDarkMode ? '#6ee7b7' : '#065f46',
                                    border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0'}`
                                }}
                            >
                                <Typography variant="subtitle2" fontWeight="600">
                                    Post successfully published on Instagram!
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-all', fontSize: '0.85rem' }}>
                                    Post URL: <strong>{publishedPostUrl}</strong>
                                </Typography>
                                <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        startIcon={<OpenInNewIcon fontSize="small" />}
                                        href={publishedPostUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 'bold' }}
                                    >
                                        View on Instagram
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="success"
                                        startIcon={<ContentCopyIcon fontSize="small" />}
                                        onClick={() => handleCopyUrl(publishedPostUrl)}
                                        sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 'bold' }}
                                    >
                                        {copied ? 'Copied!' : 'Copy Link'}
                                    </Button>
                                </Stack>
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                            <Box sx={{ flex: '0 0 280px', width: { xs: '100%', md: 280 } }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: textSecondary, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                    Post Preview
                                </Typography>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: `1px solid ${borderColor}`,
                                        backgroundColor: bgCard,
                                        boxShadow: 'none'
                                    }}
                                >
                                    <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb' }}>
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={title || 'Recipe Preview'}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: textSecondary,
                                                    gap: 1
                                                }}
                                            >
                                                <ImageIcon sx={{ fontSize: 36, opacity: 0.5 }} />
                                                <Typography variant="caption">No Image</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                    <Box sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" fontWeight="600" sx={{ color: textPrimary }} noWrap>
                                            {title ? `Checkout ${title} - ${recipeUrl}` : 'Checkout Recipe Title - Recipe Link'}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                mt: 0.5,
                                                color: textSecondary,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                fontSize: '0.8rem',
                                                lineHeight: 1.4
                                            }}
                                        >
                                            {caption || 'Recipe caption preview will appear here.'}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Box>

                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: textSecondary, textTransform: 'uppercase', display: 'block' }}>
                                    Post Details
                                </Typography>

                                {!isRecipePublicApproved && (
                                    <Alert
                                        icon={<WarningAmberIcon sx={{ color: '#f59e0b' }} />}
                                        severity="warning"
                                        sx={{
                                            borderRadius: '6px',
                                            backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                                            color: isDarkMode ? '#fcd34d' : '#92400e',
                                            border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#fde68a'}`
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight="600">
                                            This recipe is not publicly approved. Please approve it before sharing on Instagram.
                                        </Typography>
                                    </Alert>
                                )}

                                <TextField
                                    label="Title *"
                                    size="small"
                                    fullWidth
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    sx={textFieldStyle}
                                />

                                <TextField
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <span>Caption *</span>
                                            <Tooltip title="Generate Caption with AI">
                                                <IconButton
                                                    size="small"
                                                    onClick={handleGenerateCaption}
                                                    disabled={isGeneratingCaption || !title.trim()}
                                                    sx={{
                                                        color: '#E1306C',
                                                        padding: 0,
                                                        '&:hover': { color: '#c0355e' },
                                                        '&.Mui-disabled': { color: isDarkMode ? '#4a5568' : '#a0aec0' }
                                                    }}
                                                >
                                                    {isGeneratingCaption ? (
                                                        <CircularProgress size={16} sx={{ color: '#E1306C' }} />
                                                    ) : (
                                                        <AutoAwesomeIcon fontSize="small" />
                                                    )}
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    }
                                    size="small"
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    inputProps={{ maxLength: 2200 }}
                                    helperText={`${caption.length}/2200 characters`}
                                    sx={textFieldStyle}
                                />
                            </Box>
                        </Box>
                    </Box>
                )}

                {tabIndex === 1 && (
                    <Box sx={{ minHeight: 250 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: textSecondary, textTransform: 'uppercase', display: 'block', mb: 2 }}>
                            Instagram Post History for this Recipe
                        </Typography>

                        {isLoadingHistory ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                                <CircularProgress sx={{ color: '#E1306C' }} />
                            </Box>
                        ) : previousPosts.length === 0 ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    borderRadius: '8px',
                                    border: `1px solid ${borderColor}`,
                                    backgroundColor: bgCard,
                                    textAlign: 'center'
                                }}
                            >
                                <Typography variant="body2" sx={{ color: textSecondary }}>
                                    No Instagram posts shared yet for this recipe.
                                </Typography>
                            </Paper>
                        ) : (
                            <Stack spacing={2}>
                                {previousPosts.map((post) => (
                                    <Paper
                                        key={post.id}
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: '8px',
                                            border: `1px solid ${borderColor}`,
                                            backgroundColor: bgCard,
                                            display: 'flex',
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            gap: 2,
                                            alignItems: { xs: 'stretch', sm: 'center' }
                                        }}
                                    >
                                        {post.image_url ? (
                                            <Box
                                                sx={{
                                                    width: { xs: '100%', sm: 56 },
                                                    height: { xs: 180, sm: 56 },
                                                    borderRadius: '6px',
                                                    overflow: 'hidden',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <img
                                                    src={post.image_url}
                                                    alt={post.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </Box>
                                        ) : (
                                            <Box sx={{ width: { xs: '100%', sm: 56 }, height: { xs: 180, sm: 56 }, borderRadius: '6px', backgroundColor: isDarkMode ? '#3b4253' : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <InstagramIcon sx={{ color: textSecondary }} />
                                            </Box>
                                        )}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="subtitle2" fontWeight="600" sx={{ color: textPrimary }} noWrap>
                                                {post.title}
                                            </Typography>
                                            <Box sx={{ mt: 0.3 }}>
                                                <Chip
                                                    label={post._instagramFetched === false ? 'Not Found on Instagram' : (post.status || 'published')}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        backgroundColor: post._instagramFetched === false
                                                            ? (isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')
                                                            : (post.status === 'published' || !post.status)
                                                                ? (isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
                                                                : (isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)'),
                                                        color: post._instagramFetched === false
                                                            ? '#ef4444'
                                                            : (post.status === 'published' || !post.status) ? '#10b981' : '#f59e0b',
                                                        fontWeight: 500,
                                                        fontSize: '0.65rem'
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 0.3 }}>
                                                Post ID: <strong>{post.instagram_post_id}</strong>
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: textSecondary }}>
                                                Posted: {new Date(post.created_at).toLocaleString()}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ 
                                            display: 'flex', 
                                            flexDirection: 'row',
                                            gap: 1,
                                            alignItems: 'center',
                                            flexWrap: 'wrap'
                                        }}>
                                            {post.post_url && post._instagramFetched !== false ? (
                                                <>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<OpenInNewIcon fontSize="small" />}
                                                        href={post.post_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{
                                                            borderColor: '#E1306C',
                                                            color: '#E1306C',
                                                            borderRadius: '6px',
                                                            textTransform: 'none',
                                                            fontWeight: 'bold',
                                                            justifyContent: 'flex-start',
                                                            '&:hover': {
                                                                borderColor: '#c0355e',
                                                                backgroundColor: 'rgba(225, 48, 108, 0.08)'
                                                            }
                                                        }}
                                                    >
                                                        View Post
                                                    </Button>
                                                    <Tooltip title="Copy Post Link">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleCopyUrl(post.post_url)}
                                                            sx={{
                                                                color: textSecondary,
                                                                '&:hover': { color: '#E1306C' },
                                                                alignSelf: { xs: 'flex-end', sm: 'center' }
                                                            }}
                                                        >
                                                            <ContentCopyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            ) : null}
                                            {canDelete && (
                                                <Tooltip title="Delete Post Record">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setDeleteId(post.id)}
                                                        sx={{
                                                            color: textSecondary,
                                                            '&:hover': { color: '#ea5455' },
                                                            alignSelf: { xs: 'flex-end', sm: 'center' }
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Box>
                )}
            </DialogContent>

            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeletePost}
                title="Delete Instagram Post Record"
                message="If the current Instagram API supports deletion, the post will be removed from Instagram and from local history. If deletion is not supported, the local history record will remain so you can retry or delete manually from Instagram."
                confirmText="Delete"
                cancelText="Cancel"
                severity="error"
                isLoading={isDeleting}
                loadingText="Deleting..."
            />

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: `1px solid ${borderColor}`,
                    backgroundColor: bgPaper,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                {tabIndex === 0 && (
                    <Button
                        onClick={handleShare}
                        variant="contained"
                        sx={{
                            backgroundColor: '#E1306C',
                            '&:hover': { backgroundColor: '#c0355e', boxShadow: 'none' },
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            borderRadius: '6px',
                            px: 3,
                            py: 0.8,
                            boxShadow: 'none',
                            textTransform: 'none'
                        }}
                        disabled={isPosting || !isRecipePublicApproved}
                        startIcon={isPosting ? <CircularProgress size={18} color="inherit" /> : <InstagramIcon />}
                    >
                        {isPosting ? 'Sharing...' : 'Share'}
                    </Button>
                )}
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        borderRadius: '6px',
                        textTransform: 'none',
                        color: textSecondary,
                        borderColor: isDarkMode ? '#404656' : '#d8d6de',
                        px: 2.5,
                        '&:hover': {
                            borderColor: textPrimary,
                            color: textPrimary
                        }
                    }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InstagramShareDialog;
