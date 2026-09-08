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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    IconButton,
    Chip,
    Paper,
    Divider,
    Stack,
    Tooltip,
    Tab,
    Tabs
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PinterestIcon from '@mui/icons-material/Pinterest';
import HistoryIcon from '@mui/icons-material/History';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';

import { useTheme } from '../../../context/ThemeContext';
import { getImage } from '../../../utils/helper';
import { toast } from '../../../utils/toast';
import {
    useGetPinterestBoardsQuery,
    useCreatePinterestPinMutation,
    useGetRecipePinterestPostsQuery
} from '../../../features/api/pinterestApi';

const PinterestShareDialog = ({ open, onClose, recipe }) => {
    const { isDarkMode } = useTheme();
    const [tabIndex, setTabIndex] = useState(0);

    // Form fields
    const [boardId, setBoardId] = useState('');
    const [customBoardId, setCustomBoardId] = useState('');
    const [boardName, setBoardName] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [publishedPostUrl, setPublishedPostUrl] = useState('');
    const [copied, setCopied] = useState(false);

    // API hooks
    const { data: boardsData, isLoading: isLoadingBoards, error: boardsError } = useGetPinterestBoardsQuery(undefined, {
        skip: !open
    });
    const [createPin, { isLoading: isPosting }] = useCreatePinterestPinMutation();
    const { data: postsHistoryData, isLoading: isLoadingHistory } = useGetRecipePinterestPostsQuery(recipe?.recipe_id, {
        skip: !open || !recipe?.recipe_id
    });

    const boards = boardsData?.boards || [];
    const previousPosts = postsHistoryData?.posts || [];

    useEffect(() => {
        if (recipe && open) {
            setTitle(recipe.title || '');
            setDescription(recipe.description || recipe.meta_description || '');

            // Build default frontend recipe page link (Pinterest rejects localhost URLs)
            let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://recipetrending.com';
            if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
                baseUrl = window.location.origin;
            }
            const recipeSlug = recipe.slug || recipe.recipe_id;
            setLink(`${baseUrl}/recipes/${recipeSlug}`);

            // Image URL
            const fullImg = recipe.image ? getImage(recipe.image) : '';
            setImageUrl(fullImg);

            // Reset states
            setPublishedPostUrl('');
            setCopied(false);
            setTabIndex(0);
        }
    }, [recipe, open]);

    useEffect(() => {
        if (boards && boards.length > 0 && !boardId) {
            setBoardId(boards[0].id);
            setBoardName(boards[0].name);
        }
    }, [boards, boardId]);

    const handleBoardChange = (e) => {
        const selectedVal = e.target.value;
        setBoardId(selectedVal);
        if (selectedVal === 'custom') {
            setBoardName('Custom Board');
        } else {
            const foundBoard = boards.find((b) => b.id === selectedVal);
            setBoardName(foundBoard ? foundBoard.name : '');
        }
    };

    const handleShare = async () => {
        const finalBoardId = boardId === 'custom' ? customBoardId.trim() : boardId;

        if (!finalBoardId) {
            toast.error('Please select or specify a Pinterest Board ID.');
            return;
        }

        if (!title.trim()) {
            toast.error('Title is required for Pinterest post.');
            return;
        }

        if (!imageUrl) {
            toast.error('Recipe Image URL is required for Pinterest post.');
            return;
        }

        try {
            const res = await createPin({
                recipe_id: recipe.recipe_id,
                board_id: finalBoardId,
                board_name: boardName || 'Pinterest Board',
                title: title.trim(),
                description: description.trim(),
                link: link.trim(),
                image_url: imageUrl
            }).unwrap();

            if (res.success) {
                toast.success('Pin successfully created and shared on Pinterest!');
                const url = res.post?.pin_url || (res.post?.pin_id ? `https://www.pinterest.com/pin/${res.post.pin_id}/` : '');
                setPublishedPostUrl(url);
            }
        } catch (err) {
            const msg = err?.data?.message || err?.message || 'Failed to post on Pinterest.';
            toast.error(msg);
        }
    };

    const handleCopyUrl = (urlToCopy) => {
        if (!urlToCopy) return;
        navigator.clipboard.writeText(urlToCopy);
        setCopied(true);
        toast.success('Pinterest URL copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (!recipe) return null;

    // Standard Admin Theme variables
    const bgPaper = isDarkMode ? '#283046' : '#ffffff';
    const bgCard = isDarkMode ? '#161d31' : '#f8f8f8';
    const borderColor = isDarkMode ? '#404656' : '#ebe9f1';
    const textPrimary = isDarkMode ? '#d0d2d6' : '#2c2c2c';
    const textSecondary = isDarkMode ? '#b4b7bd' : '#6e6b7b';
    const inputBg = isDarkMode ? '#161d31' : '#ffffff';

    const textFieldStyle = {
        '& .MuiOutlinedInput-root': {
            backgroundColor: inputBg,
            color: textPrimary,
            borderRadius: '6px',
            fontSize: '0.875rem',
            '& fieldset': {
                borderColor: borderColor,
            },
            '&:hover fieldset': {
                borderColor: isDarkMode ? '#7367f0' : '#7367f0',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#7367f0',
            },
        },
        '& .MuiInputLabel-root': {
            color: textSecondary,
            fontSize: '0.85rem',
            '&.Mui-focused': {
                color: '#7367f0',
            },
        },
        '& .MuiFormHelperText-root': {
            color: textSecondary,
            fontSize: '0.75rem',
            textAlign: 'right'
        },
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
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
            {/* Standard Admin Header */}
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PinterestIcon sx={{ color: '#E60023', fontSize: 26 }} />
                    <Typography variant="h6" sx={{ color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}>
                        Share Recipe to Pinterest
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: textSecondary }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Navigation Tabs */}
            <Box sx={{ px: 3, pt: 1.5, borderBottom: `1px solid ${borderColor}` }}>
                <Tabs
                    value={tabIndex}
                    onChange={(e, val) => setTabIndex(val)}
                    sx={{
                        minHeight: 40,
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#7367f0',
                            height: 3,
                            borderRadius: '3px 3px 0 0'
                        }
                    }}
                >
                    <Tab
                        icon={<ShareIcon sx={{ fontSize: 18 }} />}
                        iconPosition="start"
                        label="Create Pin"
                        sx={{
                            textTransform: 'none',
                            fontWeight: tabIndex === 0 ? 600 : 500,
                            fontSize: '0.875rem',
                            minHeight: 40,
                            color: tabIndex === 0 ? '#7367f0' : textSecondary,
                            '&.Mui-selected': { color: '#7367f0' }
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
                                            backgroundColor: tabIndex === 1 ? '#7367f0' : (isDarkMode ? '#3b4253' : '#e0e0e0'),
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
                            color: tabIndex === 1 ? '#7367f0' : textSecondary,
                            '&.Mui-selected': { color: '#7367f0' }
                        }}
                    />
                </Tabs>
            </Box>

            {/* Dialog Content */}
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
                                    Pin successfully published on Pinterest!
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-all', fontSize: '0.85rem' }}>
                                    Public Pin URL: <strong>{publishedPostUrl}</strong>
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
                                        View Pin on Pinterest
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="success"
                                        startIcon={<ContentCopyIcon fontSize="small" />}
                                        onClick={() => handleCopyUrl(publishedPostUrl)}
                                        sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 'bold' }}
                                    >
                                        {copied ? 'Copied Link!' : 'Copy Pin Link'}
                                    </Button>
                                </Stack>
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                            {/* Left Column: Post Format Preview */}
                            <Box sx={{ flex: '0 0 280px', width: { xs: '100%', md: 280 } }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: textSecondary, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                    Post Format Preview
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
                                    <Box sx={{ position: 'relative', width: '100%', pt: '120%', backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb' }}>
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
                                        <Chip
                                            icon={<PinterestIcon style={{ color: '#fff', fontSize: 14 }} />}
                                            label="Preview"
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                left: 8,
                                                backgroundColor: '#E60023',
                                                color: '#ffffff',
                                                fontWeight: 'bold',
                                                fontSize: '0.7rem',
                                                height: '22px'
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" fontWeight="600" sx={{ color: textPrimary }} noWrap>
                                            {title || 'Recipe Title'}
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
                                            {description || 'Recipe description preview will appear here.'}
                                        </Typography>

                                        <Box sx={{ mt: 1.5, pt: 1, borderTop: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <LinkIcon sx={{ color: '#7367f0', fontSize: 14 }} />
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: isDarkMode ? '#93c5fd' : '#2563eb',
                                                    fontWeight: '500',
                                                    wordBreak: 'break-all',
                                                    fontSize: '0.75rem'
                                                }}
                                                noWrap
                                            >
                                                {link || 'https://recipetrending.com'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Box>

                            {/* Right Column: Pin Configuration */}
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: textSecondary, textTransform: 'uppercase', display: 'block' }}>
                                    Pin Configuration & Details
                                </Typography>

                                {/* Board Selection */}
                                <FormControl fullWidth size="small" sx={textFieldStyle}>
                                    <InputLabel id="board-select-label">Pinterest Board *</InputLabel>
                                    <Select
                                        labelId="board-select-label"
                                        value={boardId}
                                        label="Pinterest Board *"
                                        onChange={handleBoardChange}
                                        disabled={isLoadingBoards}
                                        sx={{ borderRadius: '6px' }}
                                    >
                                        {boards.map((b) => (
                                            <MenuItem key={b.id} value={b.id} sx={{ fontSize: '0.875rem' }}>
                                                📌 {b.name} <span style={{ opacity: 0.6, marginLeft: 6, fontSize: '0.8rem' }}>({b.privacy || 'PUBLIC'})</span>
                                            </MenuItem>
                                        ))}
                                        <MenuItem value="custom" sx={{ fontWeight: 'bold', color: '#7367f0' }}>
                                            + Enter Custom Board ID
                                        </MenuItem>
                                    </Select>
                                </FormControl>

                                {isLoadingBoards && (
                                    <Typography variant="caption" sx={{ color: textSecondary }}>
                                        Loading available Pinterest boards...
                                    </Typography>
                                )}

                                {boardsError && (
                                    <Alert severity="info" sx={{ py: 0.5, borderRadius: '6px', fontSize: '0.8rem' }}>
                                        Could not auto-fetch boards from API. You can enter your Board ID manually below.
                                    </Alert>
                                )}

                                {(boardId === 'custom' || (!isLoadingBoards && boards.length === 0)) && (
                                    <TextField
                                        label="Custom Board ID *"
                                        size="small"
                                        fullWidth
                                        value={customBoardId}
                                        onChange={(e) => setCustomBoardId(e.target.value)}
                                        placeholder="e.g. 971933232022791738"
                                        helperText="Paste your Pinterest Board ID"
                                        sx={textFieldStyle}
                                    />
                                )}

                                {/* Title Field */}
                                <TextField
                                    label="Pin Title *"
                                    size="small"
                                    fullWidth
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    inputProps={{ maxLength: 100 }}
                                    helperText={`${title.length}/100 characters`}
                                    sx={textFieldStyle}
                                />

                                {/* Description Field */}
                                <TextField
                                    label="Pin Description"
                                    size="small"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    inputProps={{ maxLength: 800 }}
                                    helperText={`${description.length}/800 characters`}
                                    sx={textFieldStyle}
                                />

                                {/* Target Link */}
                                <TextField
                                    label="Target Link (Recipe URL) *"
                                    size="small"
                                    fullWidth
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    sx={textFieldStyle}
                                />

                                {/* Image URL */}
                                <TextField
                                    label="Image URL *"
                                    size="small"
                                    fullWidth
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    sx={textFieldStyle}
                                />
                            </Box>
                        </Box>
                    </Box>
                )}

                {tabIndex === 1 && (
                    <Box sx={{ minHeight: 250 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: textSecondary, textTransform: 'uppercase', display: 'block', mb: 2 }}>
                            Pinterest Pin History for this Recipe
                        </Typography>

                        {isLoadingHistory ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                                <CircularProgress sx={{ color: '#7367f0' }} />
                            </Box>
                        ) : previousPosts.length === 0 ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    borderRadius: '8px',
                                    border: `1px border ${borderColor}`,
                                    backgroundColor: bgCard,
                                    textAlign: 'center'
                                }}
                            >
                                <Typography variant="body2" sx={{ color: textSecondary }}>
                                    No Pinterest pins shared yet for this recipe.
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
                                            gap: 2,
                                            alignItems: 'center'
                                        }}
                                    >
                                        {post.image_url ? (
                                            <img
                                                src={post.image_url}
                                                alt={post.title}
                                                style={{ width: 56, height: 56, borderRadius: '6px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <Box sx={{ width: 56, height: 56, borderRadius: '6px', backgroundColor: isDarkMode ? '#3b4253' : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <PinterestIcon sx={{ color: textSecondary }} />
                                            </Box>
                                        )}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="subtitle2" fontWeight="600" sx={{ color: textPrimary }} noWrap>
                                                {post.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 0.3 }}>
                                                Board ID: <strong>{post.board_id}</strong> {post.board_name ? `(${post.board_name})` : ''}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: textSecondary }}>
                                                Posted: {new Date(post.created_at).toLocaleString()}
                                            </Typography>
                                        </Box>

                                        {(() => {
                                            const displayPinUrl = (post.pin_url && post.pin_url.includes('pinterest.com/pin/'))
                                                ? post.pin_url
                                                : (post.pin_id ? `https://www.pinterest.com/pin/${post.pin_id}/` : post.pin_url);

                                            return displayPinUrl ? (
                                                <Stack direction="row" spacing={1}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<OpenInNewIcon fontSize="small" />}
                                                        href={displayPinUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{
                                                            borderColor: '#7367f0',
                                                            color: '#7367f0',
                                                            borderRadius: '6px',
                                                            textTransform: 'none',
                                                            fontWeight: 'bold',
                                                            '&:hover': {
                                                                borderColor: '#5e50ee',
                                                                backgroundColor: 'rgba(115, 103, 240, 0.08)'
                                                            }
                                                        }}
                                                    >
                                                        View Pin
                                                    </Button>
                                                    <Tooltip title="Copy Pin Link">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleCopyUrl(displayPinUrl)}
                                                            sx={{
                                                                color: textSecondary,
                                                                '&:hover': { color: '#7367f0' }
                                                            }}
                                                        >
                                                            <ContentCopyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            ) : null;
                                        })()}
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Box>
                )}
            </DialogContent>

            {/* Standard Admin Actions Footer */}
            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: `1px solid ${borderColor}`,
                    backgroundColor: bgPaper,
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                }}
            >
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
                {tabIndex === 0 && (
                    <Button
                        onClick={handleShare}
                        variant="contained"
                        sx={{
                            backgroundColor: '#E60023',
                            '&:hover': { backgroundColor: '#b8001c', boxShadow: 'none' },
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            borderRadius: '6px',
                            px: 3,
                            py: 0.8,
                            boxShadow: 'none',
                            textTransform: 'none'
                        }}
                        disabled={isPosting}
                        startIcon={isPosting ? <CircularProgress size={18} color="inherit" /> : <PinterestIcon />}
                    >
                        {isPosting ? 'Sharing...' : 'Share'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default PinterestShareDialog;
