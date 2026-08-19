"use client";
import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    IconButton,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Tooltip,
    Chip,
    Avatar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useTheme } from "../../context/ThemeContext";
import {
    useGetPinterestBoardsQuery,
    useGetPinterestStatusQuery,
    usePostToPinterestMutation,
    useCreatePinterestBoardMutation,
} from "../../features/api/pinterestApi";
import { toast } from "../../utils/toast";
import { getImage, getYouTubeThumbnail } from "../../utils/helper";

// Pinterest "P" SVG icon
const PinterestIcon = ({ size = 20, color = "#E60023" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
);

const PinterestPinModal = ({
    open,
    onClose,
    recipeData, // { title, description, image, video_url, slug, recipe_id }
}) => {
    const { isDarkMode } = useTheme();

    const [selectedBoardId, setSelectedBoardId] = useState("");
    const [pinTitle, setPinTitle] = useState("");
    const [pinDescription, setPinDescription] = useState("");
    const [pinImageUrl, setPinImageUrl] = useState("");
    const [successPin, setSuccessPin] = useState(null); // { pin_url, pin_id }

    // API hooks
    const { data: statusData, isLoading: statusLoading } = useGetPinterestStatusQuery(undefined, {
        skip: !open,
    });
    const { data: boardsData, isLoading: boardsLoading } = useGetPinterestBoardsQuery(undefined, {
        skip: !open || !statusData?.connected,
    });
    const [postToPinterest, { isLoading: isPosting }] = usePostToPinterestMutation();
    const [createPinterestBoard, { isLoading: isCreatingBoard }] = useCreatePinterestBoardMutation();

    const [newBoardName, setNewBoardName] = useState("");
    const [newBoardDescription, setNewBoardDescription] = useState("");
    const [showBoardForm, setShowBoardForm] = useState(false);

    const isConnected = statusData?.connected;
    const boards = boardsData?.data || [];

    // Pre-fill fields when recipe data or modal changes
    useEffect(() => {
        if (!open || !recipeData) return;

        setPinTitle(recipeData.title || "");

        // Clean & truncate description to 500 chars — prefer main description over meta_description
        const rawDesc = (recipeData.description || recipeData.meta_description || "")
            .replace(/^"|"$/g, "")
            .trim();
        setPinDescription(rawDesc.slice(0, 500));

        // Resolve image URL — prefer main image, fall back to YouTube thumbnail
        const rawImage = recipeData.image;
        if (rawImage && String(rawImage).trim() && String(rawImage).toLowerCase() !== "null") {
            const img = rawImage.startsWith("http") ? rawImage : getImage(rawImage);
            setPinImageUrl(img);
        } else if (recipeData.video_url) {
            const ytThumb = getYouTubeThumbnail(recipeData.video_url);
            setPinImageUrl(ytThumb || "");
        } else {
            setPinImageUrl("");
        }

        // Reset board selection & success state
        setSelectedBoardId("");
        setSuccessPin(null);
    }, [open, recipeData]);

    const handlePost = async () => {
        if (!selectedBoardId) {
            toast.error("Please select a Pinterest board");
            return;
        }
        if (!pinImageUrl) {
            toast.error("This recipe has no image. Pinterest requires an image to create a pin.");
            return;
        }

        const frontendUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || window.location.origin;
        const recipeUrl = recipeData?.slug
            ? `${window.location.origin}/${recipeData.slug}`
            : window.location.origin;

        try {
            const result = await postToPinterest({
                board_id: selectedBoardId,
                title: pinTitle.slice(0, 100),
                description: pinDescription.slice(0, 500),
                image_url: pinImageUrl,
                recipe_url: recipeUrl,
                recipe_id: recipeData?.recipe_id,
                recipe_name: recipeData?.title,
            }).unwrap();

            setSuccessPin(result.data);
            toast.success("🎉 Recipe pinned to Pinterest successfully!");
        } catch (err) {
            const msg = err?.data?.message || err?.data?.error || "Failed to post to Pinterest";
            toast.error(msg);
        }
    };

    const handleClose = () => {
        setSuccessPin(null);
        setSelectedBoardId("");
        setShowBoardForm(false);
        setNewBoardName("");
        setNewBoardDescription("");
        onClose();
    };

    const handleCreateBoard = async () => {
        if (!newBoardName.trim()) {
            toast.error("Board name is required");
            return;
        }

        try {
            const result = await createPinterestBoard({
                name: newBoardName.trim(),
                description: newBoardDescription.trim() || undefined,
                privacy: "PUBLIC",
            }).unwrap();

            const newBoardId = result.data?.id;
            if (newBoardId) {
                setSelectedBoardId(newBoardId);
                toast.success("Board created and selected!");
            }
            setShowBoardForm(false);
            setNewBoardName("");
            setNewBoardDescription("");
        } catch (err) {
            const msg = err?.data?.message || err?.data?.error || "Failed to create Pinterest board";
            toast.error(msg);
        }
    };

    // ─── Styles ──────────────────────────────────────────────────────────────
    const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
    const cardBgElevated = isDarkMode ? "#26334d" : "#ffffff";
    const borderColor = isDarkMode ? "#334155" : "#e2e8f0";
    const borderSubtle = isDarkMode ? "rgba(148,163,184,0.12)" : "rgba(0,0,0,0.06)";
    const textPrimary = isDarkMode ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDarkMode ? "#94a3b8" : "#64748b";
    const inputBg = isDarkMode ? "#0f172a" : "#f8fafc";
    const pinterestRed = "#E60023";
    const successGreen = "#10b981";
    const successGreenBg = isDarkMode ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)";
    const successGreenBorder = isDarkMode ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.2)";

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: cardBg,
                    border: isDarkMode ? `1px solid ${borderColor}` : "none",
                    borderRadius: "16px",
                    boxShadow: isDarkMode
                        ? "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)"
                        : "0 20px 60px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                },
            }}
        >
            {/* ── Title Bar ── */}
            <DialogTitle
                sx={{
                    borderBottom: `1px solid ${borderColor}`,
                    py: 2.5,
                    px: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: isDarkMode
                        ? "linear-gradient(135deg, rgba(230,0,35,0.15) 0%, rgba(30,41,59,1) 60%)"
                        : "linear-gradient(135deg, rgba(230,0,35,0.05) 0%, #ffffff 60%)",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: pinterestRed,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: isDarkMode ? "0 0 20px rgba(230,0,35,0.4)" : "0 2px 8px rgba(230,0,35,0.3)",
                    }}
                >
                        <PinterestIcon size={20} color="#fff" />
                    </Box>
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{ color: textPrimary, fontWeight: 700, lineHeight: 1.2 }}
                        >
                            Post to Pinterest
                        </Typography>
                        <Typography variant="caption" sx={{ color: textSecondary }}>
                            Share this recipe as a Pinterest pin
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{
                        color: textSecondary,
                        backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        "&:hover": { 
                            backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                            color: textPrimary,
                        },
                        transition: "all 0.2s ease",
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, backgroundColor: cardBg, "& .MuiDialogContent-root": { backgroundColor: cardBg } }}>
                {/* ── Loading State ── */}
                {statusLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={5}>
                        <Box textAlign="center">
                            <CircularProgress size={36} sx={{ color: pinterestRed, mb: 2 }} />
                            <Typography variant="body2" sx={{ color: textSecondary }}>
                                Checking Pinterest connection...
                            </Typography>
                        </Box>
                    </Box>
                ) : !isConnected ? (
                    /* ── Not Connected ── */
                    <Box
                        sx={{
                            textAlign: "center",
                            py: 5,
                            px: 3,
                            background: isDarkMode
                                ? "linear-gradient(135deg, rgba(230,0,35,0.1) 0%, rgba(15,23,42,0.4) 100%)"
                                : "linear-gradient(135deg, rgba(230,0,35,0.04) 0%, rgba(248,250,252,0.6) 100%)",
                            borderRadius: 3,
                            border: `1px solid ${isDarkMode ? "rgba(230,0,35,0.2)" : "rgba(230,0,35,0.15)"}`,
                            backdropFilter: isDarkMode ? "blur(10px)" : "none",
                        }}
                    >
                        <Box
                            sx={{
                                mb: 3,
                                opacity: 0.9,
                                display: "inline-flex",
                                p: 2,
                                borderRadius: "50%",
                                backgroundColor: isDarkMode ? "rgba(230,0,35,0.15)" : "rgba(230,0,35,0.08)",
                            }}
                        >
                            <PinterestIcon size={52} />
                        </Box>
                        <Typography
                            variant="body1"
                            sx={{ color: textPrimary, fontWeight: 700, mb: 1.5, fontSize: "1.1rem" }}
                        >
                            Pinterest Not Connected
                        </Typography>
                        <Typography variant="body2" sx={{ color: textSecondary, mb: 2, maxWidth: 400, mx: "auto" }}>
                            {statusData?.message || "The Pinterest access token is missing or invalid."}
                        </Typography>
                        <Box
                            sx={{
                                display: "inline-block",
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: isDarkMode ? "rgba(15,23,42,0.6)" : "#f1f5f9",
                                border: `1px solid ${borderSubtle}`,
                            }}
                        >
                            <Typography variant="caption" sx={{ color: textSecondary }}>
                                Please add a valid{" "}
                                <code
                                    style={{
                                        backgroundColor: isDarkMode ? "rgba(230,0,35,0.15)" : "rgba(230,0,35,0.1)",
                                        padding: "2px 8px",
                                        borderRadius: 6,
                                        fontSize: "0.75rem",
                                        color: pinterestRed,
                                        fontWeight: 600,
                                        fontFamily: "monospace",
                                    }}
                                >
                                    PINTEREST_ACCESS_TOKEN
                                </code>{" "}
                                to your backend <code
                                    style={{
                                        backgroundColor: isDarkMode ? "rgba(148,163,184,0.1)" : "#e2e8f0",
                                        padding: "2px 8px",
                                        borderRadius: 6,
                                        fontSize: "0.75rem",
                                        color: textPrimary,
                                        fontWeight: 600,
                                        fontFamily: "monospace",
                                    }}
                                >.env</code> file.
                            </Typography>
                        </Box>
                    </Box>
                ) : successPin ? (
                    /* ── Success State ── */
                    <Box
                        sx={{
                            textAlign: "center",
                            py: 5,
                            px: 3,
                            background: isDarkMode
                                ? successGreenBg
                                : "rgba(16,185,129,0.05)",
                            borderRadius: 3,
                            border: `1px solid ${successGreenBorder}`,
                            position: "relative",
                            overflow: "hidden",
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                top: -50,
                                right: -50,
                                width: 150,
                                height: 150,
                                borderRadius: "50%",
                                background: isDarkMode ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.05)",
                            },
                        }}
                    >
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: "50%",
                                backgroundColor: isDarkMode ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px",
                                position: "relative",
                                zIndex: 1,
                            }}
                        >
                            <Typography variant="h3" sx={{ lineHeight: 1 }}>🎉</Typography>
                        </Box>
                        <Typography
                            variant="body1"
                            sx={{ 
                                color: isDarkMode ? "#34d399" : "#059669", 
                                fontWeight: 700, 
                                mb: 1,
                                fontSize: "1.1rem",
                                position: "relative",
                                zIndex: 1,
                            }}
                        >
                            Pin Created Successfully!
                        </Typography>
                        <Typography variant="body2" sx={{ color: textSecondary, mb: 3, position: "relative", zIndex: 1 }}>
                            Your recipe has been pinned to Pinterest.
                        </Typography>
                        {successPin.pin_url && (
                            <Button
                                variant="contained"
                                startIcon={<OpenInNewIcon />}
                                href={successPin.pin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    backgroundColor: pinterestRed,
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    px: 3,
                                    py: 1,
                                    boxShadow: isDarkMode ? "0 4px 14px rgba(230,0,35,0.4)" : "0 2px 8px rgba(230,0,35,0.2)",
                                    "&:hover": { 
                                        backgroundColor: "#c0001e",
                                        boxShadow: isDarkMode ? "0 6px 20px rgba(230,0,35,0.5)" : "0 4px 12px rgba(230,0,35,0.3)",
                                        transform: "translateY(-1px)",
                                    },
                                    transition: "all 0.2s ease",
                                    position: "relative",
                                    zIndex: 1,
                                }}
                            >
                                View Pin on Pinterest
                            </Button>
                        )}
                    </Box>
                ) : (
                    /* ── Main Form ── */
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                        {/* Connected badge */}
                        {statusData?.account && (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    p: 1.5,
                                    borderRadius: 2,
                                    backgroundColor: isDarkMode ? "rgba(230,0,35,0.1)" : "rgba(230,0,35,0.05)",
                                    border: `1px solid ${isDarkMode ? "rgba(230,0,35,0.2)" : "rgba(230,0,35,0.12)"}`,
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {statusData.account.profile_image && (
                                    <Avatar
                                        src={statusData.account.profile_image}
                                        sx={{ 
                                            width: 32, 
                                            height: 32,
                                            border: `2px solid ${isDarkMode ? "rgba(230,0,35,0.3)" : "rgba(230,0,35,0.15)"}`,
                                        }}
                                    />
                                )}
                                <Typography variant="caption" sx={{ color: textSecondary, flex: 1 }}>
                                    Posting as{" "}
                                    <strong style={{ color: pinterestRed, fontWeight: 700 }}>
                                        @{statusData.account.username}
                                    </strong>
                                </Typography>
                                <Chip
                                    label="Connected"
                                    size="small"
                                    sx={{
                                        height: 22,
                                        fontSize: "0.7rem",
                                        backgroundColor: isDarkMode ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.12)",
                                        color: isDarkMode ? "#34d399" : "#059669",
                                        fontWeight: 700,
                                        border: `1px solid ${isDarkMode ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.2)"}`,
                                        "& .MuiChip-label": { px: 1 },
                                    }}
                                />
                            </Box>
                        )}

                        {/* Image Preview */}
                        {pinImageUrl ? (
                            <Box
                                sx={{
                                    borderRadius: 3,
                                    overflow: "hidden",
                                    border: `1px solid ${borderColor}`,
                                    position: "relative",
                                    backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
                                    boxShadow: isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
                                }}
                            >
                                <img
                                    src={pinImageUrl}
                                    alt="Pin preview"
                                    style={{
                                        width: "100%",
                                        maxHeight: 220,
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 10,
                                        left: 10,
                                        backgroundColor: isDarkMode ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.6)",
                                        color: "#fff",
                                        fontSize: "0.65rem",
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1.5,
                                        fontWeight: 700,
                                        letterSpacing: 0.8,
                                        textTransform: "uppercase",
                                        backdropFilter: "blur(4px)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                >
                                    Pin Image
                                </Box>
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: `1px dashed ${isDarkMode ? "rgba(230,0,35,0.35)" : "rgba(230,0,35,0.25)"}`,
                                    backgroundColor: isDarkMode ? "rgba(230,0,35,0.08)" : "rgba(230,0,35,0.04)",
                                    textAlign: "center",
                                    backdropFilter: isDarkMode ? "blur(10px)" : "none",
                                }}
                            >
                                <Typography variant="caption" sx={{ color: pinterestRed, fontWeight: 700, fontSize: "0.8rem" }}>
                                    ⚠️ No image found for this recipe. Pinterest requires an image to create a pin.
                                </Typography>
                            </Box>
                        )}

                        {/* Board Selector */}
                        <FormControl fullWidth size="small">
                            <InputLabel
                                sx={{
                                    color: textSecondary,
                                    fontWeight: 600,
                                    fontSize: "0.8rem",
                                    "&.Mui-focused": { color: pinterestRed },
                                }}
                            >
                                {boardsLoading ? "Loading boards…" : "Select Pinterest Board *"}
                            </InputLabel>
                            <Select
                                value={selectedBoardId}
                                onChange={(e) => setSelectedBoardId(e.target.value)}
                                label={boardsLoading ? "Loading boards…" : "Select Pinterest Board *"}
                                disabled={boardsLoading}
                                sx={{
                                    color: textPrimary,
                                    backgroundColor: inputBg,
                                    borderRadius: "10px",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: borderColor,
                                        borderRadius: "10px",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                        borderColor: pinterestRed,
                                    },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: pinterestRed,
                                        borderWidth: "2px",
                                    },
                                    "& .MuiSvgIcon-root": { 
                                        color: textSecondary,
                                        fontSize: "1.2rem",
                                    },
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            backgroundColor: cardBgElevated,
                                            border: `1px solid ${borderColor}`,
                                            borderRadius: "12px",
                                            boxShadow: isDarkMode
                                                ? "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)"
                                                : "0 8px 32px rgba(0,0,0,0.12)",
                                            "& .MuiMenuItem-root": {
                                                py: 1.5,
                                                px: 2,
                                                "&:hover": {
                                                    backgroundColor: isDarkMode
                                                        ? "rgba(230,0,35,0.12)"
                                                        : "rgba(230,0,35,0.06)",
                                                },
                                                "&.Mui-selected": {
                                                    backgroundColor: isDarkMode
                                                        ? "rgba(230,0,35,0.18)"
                                                        : "rgba(230,0,35,0.1)",
                                                    "&:hover": {
                                                        backgroundColor: isDarkMode
                                                            ? "rgba(230,0,35,0.22)"
                                                            : "rgba(230,0,35,0.14)",
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    MenuListProps: {
                                        sx: { py: 1 },
                                    },
                                }}
                            >
                                {boardsLoading && (
                                    <MenuItem disabled value="">
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <CircularProgress size={16} sx={{ color: pinterestRed }} />
                                            <span style={{ color: textSecondary }}>Loading boards…</span>
                                        </Box>
                                    </MenuItem>
                                )}
                                {!boardsLoading && boards.length === 0 && (
                                    <MenuItem disabled value="">
                                        <Typography variant="body2" sx={{ color: textSecondary, fontStyle: "italic" }}>
                                            No boards found
                                        </Typography>
                                    </MenuItem>
                                )}
                                {boards.map((board) => (
                                    <MenuItem
                                        key={board.id}
                                        value={board.id}
                                        sx={{
                                            color: textPrimary,
                                            "&:hover": {
                                                backgroundColor: isDarkMode
                                                    ? "rgba(230,0,35,0.12)"
                                                    : "rgba(230,0,35,0.06)",
                                            },
                                            "&.Mui-selected": {
                                                backgroundColor: isDarkMode
                                                    ? "rgba(230,0,35,0.18)"
                                                    : "rgba(230,0,35,0.1)",
                                                "&:hover": {
                                                    backgroundColor: isDarkMode
                                                        ? "rgba(230,0,35,0.22)"
                                                        : "rgba(230,0,35,0.14)",
                                                },
                                            },
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                                                {board.name}
                                            </Typography>
                                            {board.privacy && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: textSecondary, textTransform: "capitalize", fontSize: "0.75rem" }}
                                                >
                                                    {board.privacy.toLowerCase()} • {board.pin_count ?? 0} pins
                                                </Typography>
                                            )}
                                        </Box>
                                    </MenuItem>
                                ))}
                                <MenuItem
                                    onClick={() => setShowBoardForm(true)}
                                    sx={{
                                        color: pinterestRed,
                                        fontWeight: 700,
                                        borderTop: `1px solid ${borderColor}`,
                                        mt: 1,
                                        pt: 1.5,
                                        "&:hover": {
                                            backgroundColor: isDarkMode
                                                ? "rgba(230,0,35,0.12)"
                                                : "rgba(230,0,35,0.06)",
                                        },
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        <span>Create New Board</span>
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        {/* Create Board Form */}
                        {showBoardForm && (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.5,
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: `1px dashed ${isDarkMode ? "rgba(230,0,35,0.35)" : "rgba(230,0,35,0.25)"}`,
                                    backgroundColor: isDarkMode ? "rgba(230,0,35,0.08)" : "rgba(230,0,35,0.04)",
                                    backdropFilter: isDarkMode ? "blur(10px)" : "none",
                                }}
                            >
                                <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.75rem" }}>
                                    New Pinterest Board
                                </Typography>
                                <TextField
                                    label="Board Name *"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value.slice(0, 50))}
                                    fullWidth
                                    size="small"
                                    placeholder="e.g. My Favorite Recipes"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            backgroundColor: inputBg,
                                            borderRadius: "10px",
                                            color: textPrimary,
                                            "& fieldset": { borderColor: borderColor },
                                            "&:hover fieldset": { borderColor: pinterestRed },
                                            "&.Mui-focused fieldset": { borderColor: pinterestRed, borderWidth: "2px" },
                                        },
                                        "& .MuiInputLabel-root": {
                                            color: textSecondary,
                                            fontWeight: 600,
                                            fontSize: "0.85rem",
                                            "&.Mui-focused": { color: pinterestRed },
                                        },
                                    }}
                                />
                                <TextField
                                    label="Description (optional)"
                                    value={newBoardDescription}
                                    onChange={(e) => setNewBoardDescription(e.target.value.slice(0, 500))}
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    placeholder="What's this board about?"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            backgroundColor: inputBg,
                                            borderRadius: "10px",
                                            color: textPrimary,
                                            "& fieldset": { borderColor: borderColor },
                                            "&:hover fieldset": { borderColor: pinterestRed },
                                            "&.Mui-focused fieldset": { borderColor: pinterestRed, borderWidth: "2px" },
                                        },
                                        "& .MuiInputLabel-root": {
                                            color: textSecondary,
                                            fontWeight: 600,
                                            fontSize: "0.85rem",
                                            "&.Mui-focused": { color: pinterestRed },
                                        },
                                    }}
                                />
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button
                                        onClick={() => {
                                            setShowBoardForm(false);
                                            setNewBoardName("");
                                            setNewBoardDescription("");
                                        }}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            borderRadius: "10px",
                                            color: textSecondary,
                                            borderColor: borderColor,
                                            textTransform: "none",
                                            fontWeight: 600,
                                            "&:hover": {
                                                borderColor: isDarkMode ? "#94a3b8" : "#64748b",
                                                backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                                color: textPrimary,
                                            },
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateBoard}
                                        disabled={isCreatingBoard || !newBoardName.trim()}
                                        size="small"
                                        variant="contained"
                                        startIcon={isCreatingBoard ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : null}
                                        sx={{
                                            borderRadius: "10px",
                                            backgroundColor: pinterestRed,
                                            color: "#fff",
                                            textTransform: "none",
                                            fontWeight: 600,
                                            boxShadow: "none",
                                            "&:hover": { 
                                                backgroundColor: "#c0001e", 
                                                boxShadow: isDarkMode ? "0 4px 12px rgba(230,0,35,0.4)" : "0 2px 8px rgba(230,0,35,0.2)",
                                            },
                                            "&.Mui-disabled": {
                                                backgroundColor: isDarkMode ? "rgba(230,0,35,0.25)" : "rgba(230,0,35,0.35)",
                                                color: "rgba(255,255,255,0.6)",
                                            },
                                        }}
                                    >
                                        {isCreatingBoard ? "Creating…" : "Create Board"}
                                    </Button>
                                </Box>
                            </Box>
                        )}

                        {/* Pin Title */}
                        <TextField
                            label="Pin Title"
                            value={pinTitle}
                            onChange={(e) => setPinTitle(e.target.value.slice(0, 100))}
                            fullWidth
                            size="small"
                            helperText={`${pinTitle.length}/100`}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor: inputBg,
                                    borderRadius: "10px",
                                    color: textPrimary,
                                    "& fieldset": { borderColor: borderColor },
                                    "&:hover fieldset": { borderColor: pinterestRed },
                                    "&.Mui-focused fieldset": { borderColor: pinterestRed, borderWidth: "2px" },
                                },
                                "& .MuiInputLabel-root": {
                                    color: textSecondary,
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    "&.Mui-focused": { color: pinterestRed },
                                },
                                "& .MuiFormHelperText-root": { 
                                    color: textSecondary,
                                    fontSize: "0.7rem",
                                },
                            }}
                        />

                        {/* Pin Description */}
                        <TextField
                            label="Pin Description"
                            value={pinDescription}
                            onChange={(e) => setPinDescription(e.target.value.slice(0, 500))}
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            helperText={`${pinDescription.length}/500`}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor: inputBg,
                                    borderRadius: "10px",
                                    color: textPrimary,
                                    "& fieldset": { borderColor: borderColor },
                                    "&:hover fieldset": { borderColor: pinterestRed },
                                    "&.Mui-focused fieldset": { borderColor: pinterestRed, borderWidth: "2px" },
                                },
                                "& .MuiInputLabel-root": {
                                    color: textSecondary,
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    "&.Mui-focused": { color: pinterestRed },
                                },
                                "& .MuiFormHelperText-root": { 
                                    color: textSecondary,
                                    fontSize: "0.7rem",
                                },
                            }}
                        />

                        {/* Link preview */}
                        {recipeData?.slug && (
                            <Box
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    backgroundColor: isDarkMode ? "rgba(15,23,42,0.5)" : "#f8fafc",
                                    border: `1px solid ${borderColor}`,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: textSecondary,
                                        display: "block",
                                        mb: 0.5,
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.8,
                                        fontSize: "0.7rem",
                                    }}
                                >
                                    Link (auto)
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: isDarkMode ? "#60a5fa" : "#2563eb",
                                        wordBreak: "break-all",
                                        fontSize: "0.8rem",
                                        fontWeight: 500,
                                    }}
                                >
                                    {typeof window !== "undefined"
                                        ? `${window.location.origin}/${recipeData.slug}`
                                        : `/${recipeData.slug}`}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            {/* ── Footer Actions ── */}
            {isConnected && !successPin && (
                <DialogActions
                    sx={{
                        p: 2.5,
                        pt: 2.5,
                        borderTop: `1px solid ${borderColor}`,
                        backgroundColor: cardBg,
                        gap: 1.5,
                    }}
                >
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        sx={{
                            borderRadius: "10px",
                            color: textSecondary,
                            borderColor: borderColor,
                            textTransform: "none",
                            fontWeight: 600,
                            py: 1,
                            "&:hover": {
                                borderColor: isDarkMode ? "#94a3b8" : "#64748b",
                                backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                color: textPrimary,
                            },
                            transition: "all 0.2s ease",
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePost}
                        variant="contained"
                        disabled={isPosting || !selectedBoardId || !pinImageUrl}
                        startIcon={
                            isPosting ? (
                                <CircularProgress size={18} sx={{ color: "#fff" }} />
                            ) : (
                                <PinterestIcon size={20} color="#fff" />
                            )
                        }
                        sx={{
                            borderRadius: "10px",
                            backgroundColor: pinterestRed,
                            color: "#fff",
                            textTransform: "none",
                            fontWeight: 600,
                            boxShadow: isDarkMode ? "0 4px 14px rgba(230,0,35,0.35)" : "0 2px 8px rgba(230,0,35,0.2)",
                            px: 3.5,
                            py: 1,
                            "&:hover": {
                                backgroundColor: "#c0001e",
                                boxShadow: isDarkMode ? "0 6px 20px rgba(230,0,35,0.5)" : "0 4px 12px rgba(230,0,35,0.3)",
                                transform: "translateY(-1px)",
                            },
                            "&.Mui-disabled": {
                                backgroundColor: isDarkMode ? "rgba(230,0,35,0.25)" : "rgba(230,0,35,0.35)",
                                color: "rgba(255,255,255,0.6)",
                                boxShadow: "none",
                            },
                            transition: "all 0.2s ease",
                        }}
                    >
                        {isPosting ? "Posting Pin…" : "Post to Pinterest"}
                    </Button>
                </DialogActions>
            )}

            {/* Close button after success */}
            {successPin && (
                <DialogActions
                    sx={{
                        p: 2.5,
                        pt: 2,
                        borderTop: `1px solid ${borderColor}`,
                        backgroundColor: cardBg,
                    }}
                >
                    <Button
                        onClick={handleClose}
                        variant="contained"
                        sx={{
                            borderRadius: "10px",
                            backgroundColor: pinterestRed,
                            color: "#fff",
                            textTransform: "none",
                            fontWeight: 600,
                            boxShadow: isDarkMode ? "0 4px 14px rgba(230,0,35,0.35)" : "0 2px 8px rgba(230,0,35,0.2)",
                            px: 3,
                            py: 1,
                            "&:hover": { 
                                backgroundColor: "#c0001e", 
                                boxShadow: isDarkMode ? "0 6px 20px rgba(230,0,35,0.5)" : "0 4px 12px rgba(230,0,35,0.3)",
                                transform: "translateY(-1px)",
                            },
                            transition: "all 0.2s ease",
                        }}
                    >
                        Done
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default PinterestPinModal;
