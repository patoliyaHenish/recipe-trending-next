"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton,
  LinearProgress,
  Avatar,
  Collapse,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Button,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
} from "@mui/material";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import {
  Search as SearchIcon,
  Assignment,
  CheckCircle,
  HourglassEmpty,
  PauseCircle,
  RestaurantMenu,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  CalendarToday,
  ArrowForward,
  FolderOpen,
  FilterAltOutlined,
  FilterAltOffOutlined,
  Cancel,
  Group as GroupIcon,
  ReceiptLong as ReceiptLongIcon,
  ExpandMore,
  ExpandLess,
  Close as CloseIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import { useGetMyWorkQuery } from "../../features/api/myWorkApi";
import { useGetAllUsersQuery } from "../../features/api/authApi";
import { getImage } from "../../utils/helper";
import { AccessDenied } from "../../components/common";
import { toast } from "../../utils/toast";
import moment from "moment";

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  assigned: {
    label: "Assigned",
    color: "#7367f0",
    bg: "rgba(115, 103, 240, 0.12)",
    icon: <Assignment sx={{ fontSize: 14 }} />,
  },
  "in-progress": {
    label: "In Progress",
    color: "#ff9f43",
    bg: "rgba(255, 159, 67, 0.12)",
    icon: <HourglassEmpty sx={{ fontSize: 14 }} />,
  },
  completed: {
    label: "Completed",
    color: "#28c76f",
    bg: "rgba(40, 199, 111, 0.12)",
    icon: <CheckCircle sx={{ fontSize: 14 }} />,
  },
  "on-hold": {
    label: "On Hold",
    color: "#ea5455",
    bg: "rgba(234, 84, 85, 0.12)",
    icon: <PauseCircle sx={{ fontSize: 14 }} />,
  },
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "assigned", label: "Assigned" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on-hold", label: "On Hold" },
];

// ── Stat card (Dashboard KPI style) ───────────────────────────────────────────
const StatCard = ({ label, count, gradient, lightBg, icon, isDarkMode }) => (
  <Box
    sx={{
      position: "relative",
      borderRadius: "6px",
      overflow: "hidden",
      background: isDarkMode ? "#1a1d27" : (lightBg || "#f8f9fa"),
      border: isDarkMode
        ? "1px solid rgba(255,255,255,0.06)"
        : "1px solid rgba(0,0,0,0.08)",
      cursor: "default",
    }}
  >
    {/* ── Colored accent bar at top ── */}
    <Box
      sx={{
        height: 4,
        width: "100%",
        background: gradient,
      }}
    />

    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: { xs: 2.5, sm: 3 },
      }}
    >
      {/* ── Icon ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 52,
          height: 52,
          borderRadius: "8px",
          background: isDarkMode ? "rgba(115,103,240,0.12)" : gradient,
          color: isDarkMode ? "#a5b4fc" : "#ffffff",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      {/* ── Value & Label ── */}
      <Box sx={{ textAlign: "right" }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.5rem", sm: "1.8rem" },
            color: isDarkMode ? "#e2e8f0" : "#1e293b",
            lineHeight: 1.2,
          }}
        >
          {(count ?? 0).toLocaleString()}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: isDarkMode ? "#64748b" : "#64748b",
            fontWeight: 500,
            mt: 0.5,
            fontSize: "0.85rem",
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  </Box>
);

// ── Recipe Work Card ───────────────────────────────────────────────────────────
const RecipeWorkCard = ({ item, isDarkMode, index }) => {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.assigned;
  const dueDate = item.due_date ? moment(item.due_date) : null;
  const isOverdue =
    dueDate && !dueDate.isAfter(moment()) && item.status !== "completed";
  const progressMap = {
    assigned: 10,
    "in-progress": 55,
    "on-hold": 30,
    completed: 100,
  };
  const progress = progressMap[item.status] ?? 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Box
        sx={{
          borderRadius: "14px",
          background: isDarkMode ? "#1e2233" : "#fff",
          border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"}`,
          boxShadow: isDarkMode
            ? "0 2px 12px rgba(0,0,0,0.2)"
            : "0 2px 12px rgba(0,0,0,0.05)",
          overflow: "hidden",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: isDarkMode
              ? "0 8px 28px rgba(0,0,0,0.3)"
              : "0 8px 28px rgba(0,0,0,0.1)",
          },
        }}
      >
        {/* Top accent line */}
        <Box
          sx={{
            height: 3,
            background: `linear-gradient(90deg, ${status.color}, ${status.color}88)`,
          }}
        />

        <Box sx={{ p: "18px 20px" }}>
          {/* Header row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
              mb: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <RestaurantMenu sx={{ fontSize: 18, color: "#fff" }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.97rem",
                    color: isDarkMode ? "#e2e8f0" : "#1e293b",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={item.recipe_name || item.recipe_title || "Untitled Recipe"}
                >
                  {item.recipe_name || item.recipe_title || "Untitled Recipe"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    color: isDarkMode ? "#64748b" : "#94a3b8",
                    mt: 0.2,
                  }}
                >
                  {item.category_name || "Uncategorized"}
                  {item.sub_category_name ? ` · ${item.sub_category_name}` : ""}
                </Typography>
              </Box>
            </Box>

            {/* Status badge */}
            <Chip
              label={status.label}
              size="small"
              icon={React.cloneElement(status.icon, { style: { color: status.color } })}
              sx={{
                background: status.bg,
                color: status.color,
                fontWeight: 600,
                fontSize: "0.72rem",
                height: 24,
                flexShrink: 0,
                "& .MuiChip-icon": { ml: "6px" },
              }}
            />
          </Box>

          {/* Notes */}
          {item.notes && (
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: isDarkMode ? "#94a3b8" : "#64748b",
                mb: 1.5,
                lineHeight: 1.55,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.notes}
            </Typography>
          )}

          {/* Progress bar */}
          <Box sx={{ mb: 1.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Typography
                sx={{ fontSize: "0.72rem", color: isDarkMode ? "#64748b" : "#94a3b8" }}
              >
                Progress
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: status.color,
                }}
              >
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 5,
                borderRadius: 4,
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(0,0,0,0.06)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${status.color}, ${status.color}88)`,
                },
              }}
            />
          </Box>

          {/* Footer row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CalendarToday
                sx={{
                  fontSize: 13,
                  color: isOverdue
                    ? "#ea5455"
                    : isDarkMode
                      ? "#64748b"
                      : "#94a3b8",
                }}
              />
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: isOverdue
                    ? "#ea5455"
                    : isDarkMode
                      ? "#64748b"
                      : "#94a3b8",
                  fontWeight: isOverdue ? 600 : 400,
                }}
              >
                {dueDate
                  ? isOverdue
                    ? `Overdue · ${dueDate.format("MMM D")}`
                    : `Due ${dueDate.fromNow()}`
                  : "No due date"}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: "0.72rem",
                color: isDarkMode ? "#475569" : "#cbd5e1",
              }}
            >
              Assigned {moment(item.created_at).fromNow()}
            </Typography>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

// ── Team Panel (admin-only) – Users-page style ─────────────────────────────────
const TeamPanel = ({ isDarkMode, usersWorkList = [], isLoading = false }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [nameSearch, setNameSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const filtered = useMemo(() => {
    return (usersWorkList || []).filter((item) => {
      const u = item.user || {};
      const nameMatch = !nameSearch || (u.name || "").toLowerCase().includes(nameSearch.toLowerCase());
      const roleMatch = roleFilter === "all" || (u.role_name || u.role || "").toLowerCase() === roleFilter;
      return nameMatch && roleMatch;
    });
  }, [usersWorkList, nameSearch, roleFilter]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set((usersWorkList || []).map((item) => (item.user?.role_name || item.user?.role || "").toLowerCase()));
    return Array.from(roles).filter(Boolean);
  }, [usersWorkList]);

  const getRoleStyle = (roleName) => {
    const lRole = (roleName || "").toLowerCase();
    if (lRole === "admin") return { bg: isDarkMode ? "rgba(99,102,241,0.18)" : "#ede9fe", text: isDarkMode ? "#a5b4fc" : "#4f46e5" };
    if (lRole === "data entry") return { bg: isDarkMode ? "rgba(6,182,212,0.15)" : "#cffafe", text: isDarkMode ? "#67e8f9" : "#0891b2" };
    return { bg: isDarkMode ? "rgba(115,103,240,0.15)" : "#ede9fe", text: isDarkMode ? "#c4b5fd" : "#7c3aed" };
  };

  const cardBg = isDarkMode ? "#283046" : "#ffffff";
  const headBg = isDarkMode ? "#283046" : "#f3f2f7";
  const headText = isDarkMode ? "#b4b7bd" : "#6e6b7b";
  const rowEven = isDarkMode ? "#283046" : "#ffffff";
  const rowOdd = isDarkMode ? "#283046" : "#fafbfc";
  const rowHover = isDarkMode ? "#2f3851" : "#f8f8f8";
  const cellText = isDarkMode ? "#d0d2d6" : "#6e6b7b";
  const border = isDarkMode ? "#3b4253" : "#ebe9f1";
  const nameTxt = isDarkMode ? "#d0d2d6" : "#4b4b4b";
  const subTxt = isDarkMode ? "#b4b7bd" : "#a1a1aa";

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      {/* ── Filters ──────────────────────────────────────────────────── */}
      <Collapse in={showFilters} timeout="auto" unmountOnExit>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 3,
            p: "16px 20px",
            borderBottom: `1px solid ${border}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ color: cellText }}>Name:</Typography>
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Search name…"
              style={{
                height: "38px",
                width: "200px",
                padding: "0 12px",
                borderRadius: "4px",
                border: `1px solid ${isDarkMode ? "#404656" : "#d8d6de"}`,
                backgroundColor: isDarkMode ? "#283046" : "#fff",
                color: isDarkMode ? "#d0d2d6" : "#6e6b7b",
                outline: "none",
                fontSize: "0.9rem",
              }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ color: cellText }}>Role:</Typography>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                height: "38px",
                minWidth: "150px",
                padding: "0 12px",
                borderRadius: "4px",
                border: `1px solid ${isDarkMode ? "#404656" : "#d8d6de"}`,
                backgroundColor: isDarkMode ? "#283046" : "#fff",
                color: isDarkMode ? "#d0d2d6" : "#6e6b7b",
                outline: "none",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </Box>
          {(nameSearch || roleFilter !== "all") && (
            <Button
              size="small"
              onClick={() => { setNameSearch(""); setRoleFilter("all"); }}
              sx={{ textTransform: "none", color: "#7367f0", fontSize: "0.82rem" }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Collapse>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table stickyHeader sx={{ minWidth: 800, borderCollapse: "separate", borderSpacing: 0 }}>
          <TableHead>
            <TableRow
              sx={{
                height: "48px",
                "& th": {
                  backgroundColor: headBg,
                  color: headText,
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  borderBottom: "none",
                  borderTop: "none",
                  py: 0,
                  px: 2,
                },
              }}
            >
              <TableCell align="center" width="50">#</TableCell>
              <TableCell sx={{ minWidth: 240 }}>USER</TableCell>
              <TableCell align="center" sx={{ minWidth: 140 }}>ROLE</TableCell>
              <TableCell align="center" sx={{ minWidth: 160 }}>ACTION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow sx={{ height: "60px" }}>
                <TableCell colSpan={4} align="center" sx={{ borderBottom: "none", backgroundColor: cardBg }}>
                  <CircularProgress size={24} sx={{ color: "#7367f0" }} />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow sx={{ height: "60px" }}>
                <TableCell colSpan={4} align="center" sx={{ color: headText, borderBottom: "none", backgroundColor: cardBg }}>
                  No recipe creators found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item, index) => {
                const member = item.user || {};
                const rs = getRoleStyle(member.role_name || member.role);
                return (
                  <TableRow
                    key={member.user_id || member.id || index}
                    onClick={() => setSelectedItem(item)}
                    sx={{
                      height: "60px",
                      backgroundColor: index % 2 === 0 ? rowEven : rowOdd,
                      cursor: "pointer",
                      "&:hover": { backgroundColor: rowHover },
                      transition: "background-color 0.2s ease",
                      "& td": {
                        borderBottom: "none",
                        color: cellText,
                        py: 0,
                        px: 2,
                      },
                    }}
                  >
                    {/* # */}
                    <TableCell align="center">{index + 1}</TableCell>

                    {/* USER */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          src={member.image ? getImage(member.image) : ""}
                          alt={member.name}
                          sx={{
                            width: 35,
                            height: 35,
                            bgcolor: !member.image ? (member.profile_color || "#2563eb") : "transparent",
                            color: "#fff",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                          }}
                        >
                          {!member.image && member.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: nameTxt, lineHeight: 1.2 }}>
                            {member.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: subTxt, mt: 0.4 }}>
                            {member.role_name || member.role}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* ROLE */}
                    <TableCell align="center">
                      <Typography
                        variant="caption"
                        sx={{
                          bgcolor: rs.bg,
                          color: rs.text,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "4px",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          textTransform: "capitalize",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {member.role_name || member.role || "N/A"}
                      </Typography>
                    </TableCell>

                    {/* ACTION */}
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                        sx={{
                          textTransform: "none",
                          borderColor: isDarkMode ? "rgba(115,103,240,0.4)" : "#7367f0",
                          color: "#7367f0",
                          borderRadius: "6px",
                          fontWeight: 600,
                          fontSize: "0.78rem",
                          py: 0.3,
                          px: 1.5,
                          "&:hover": {
                            backgroundColor: isDarkMode ? "rgba(115,103,240,0.15)" : "#ede9fe",
                          },
                        }}
                      >
                        View Work Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Component for Selected Creator's Work Details */}
      {selectedItem && (
        <Dialog
          open={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: "8px",
              backgroundColor: isDarkMode ? "#283046" : "#ffffff",
              border: `1px solid ${isDarkMode ? "#404656" : "#ebe9f1"}`,
              boxShadow: isDarkMode ? "0 15px 30px rgba(0,0,0,0.3)" : "0 15px 30px rgba(0,0,0,0.1)",
            },
          }}
        >
          {/* Dialog Header */}
          <DialogTitle
            className="flex items-center justify-between"
            sx={{
              borderBottom: `1px solid ${isDarkMode ? "#404656" : "#ebe9f1"}`,
              py: 2.5,
            }}
          >
            <Typography variant="h6" sx={{ color: isDarkMode ? "#e2e8f0" : "#1e293b", fontWeight: 600 }}>
              Work Details - {selectedItem.user?.name}
            </Typography>
            <IconButton onClick={() => setSelectedItem(null)} sx={{ color: isDarkMode ? "#b4b7bd" : "#6e6b7b" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          {/* Dialog Body */}
          <DialogContent
            dividers
            sx={{
              py: 3,
              backgroundColor: isDarkMode ? "#283046" : "#ffffff",
              borderColor: isDarkMode ? "#404656" : "#ebe9f1",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {/* User Profile Header Card */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                background: isDarkMode
                  ? "linear-gradient(145deg, #1f2937, #111827)"
                  : "linear-gradient(145deg, #ffffff, #f8fafc)",
                border: `1px solid ${isDarkMode ? "#404656" : "#ebe9f1"}`,
                borderRadius: 2,
                p: 2.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={selectedItem.user?.image ? getImage(selectedItem.user.image) : ""}
                  alt={selectedItem.user?.name}
                  sx={{
                    width: 52,
                    height: 52,
                    bgcolor: !selectedItem.user?.image ? (selectedItem.user?.profile_color || "#7367f0") : "transparent",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                  }}
                >
                  {!selectedItem.user?.image && selectedItem.user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDarkMode ? "#e5e7eb" : "#111827", lineHeight: 1.2 }}>
                    {selectedItem.user?.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDarkMode ? "#9ca3af" : "#6b7280", mt: 0.3, textTransform: "capitalize" }}>
                    {selectedItem.user?.role_name || selectedItem.user?.role || "Member"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Detailed Work Summary Table Box */}
            <Box
              sx={{
                bgcolor: "rgba(115, 103, 240, 0.04)",
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? "rgba(115, 103, 240, 0.12)" : "rgba(115, 103, 240, 0.12)"}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "6px", background: "linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Assignment sx={{ color: "#fff", fontSize: 16 }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDarkMode ? "#e2e8f0" : "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.75rem" }}>
                  Work Summary Metrics
                </Typography>
              </Box>

              <TableContainer
                sx={{
                  borderRadius: "6px",
                  backgroundColor: isDarkMode ? "#1e2233" : "#ffffff",
                  border: isDarkMode
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid #ebe9f1",
                  overflowX: "auto",
                  width: "100%",
                }}
              >
                <Table sx={{ minWidth: 480 }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        height: "44px",
                        backgroundColor: isDarkMode ? "#283046" : "#f8fafc",
                        "& th": {
                          color: isDarkMode ? "#b4b7bd" : "#6e6b7b",
                          fontWeight: 600,
                          fontSize: "0.78rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: isDarkMode
                            ? "1px solid rgba(255, 255, 255, 0.1)"
                            : "1px solid #ebe9f1",
                          borderRight: isDarkMode
                            ? "1px solid rgba(255, 255, 255, 0.08)"
                            : "1px solid #ebe9f1",
                          py: 1,
                          px: 2.5,
                          "&:last-child": { borderRight: "none" },
                        },
                      }}
                    >
                      <TableCell width="50" align="center">#</TableCell>
                      <TableCell>METRIC NAME</TableCell>
                      <TableCell align="center">TOTAL COUNT</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { id: 1, label: "New Assigned Recipes", count: selectedItem.stats?.assigned, icon: <Assignment sx={{ fontSize: 18, color: "#7367f0" }} />, chipBg: isDarkMode ? "rgba(115,103,240,0.15)" : "#ede9fe", chipText: "#7367f0" },
                      { id: 2, label: "Approved Recipes", count: selectedItem.stats?.approved, icon: <CheckCircle sx={{ fontSize: 18, color: "#28c76f" }} />, chipBg: isDarkMode ? "rgba(40,199,111,0.15)" : "#d1fae5", chipText: "#28c76f" },
                      { id: 3, label: "Not Approved Recipes", count: selectedItem.stats?.notApproved, icon: <PauseCircle sx={{ fontSize: 18, color: "#ea5455" }} />, chipBg: isDarkMode ? "rgba(234,84,85,0.15)" : "#fee2e2", chipText: "#ea5455" },
                      { id: 4, label: "Today's Recipes", count: selectedItem.stats?.todayRecipes, icon: <CalendarToday sx={{ fontSize: 18, color: "#00cfdd" }} />, chipBg: isDarkMode ? "rgba(0,207,221,0.15)" : "#e0f2fe", chipText: "#00cfdd" },
                      { id: 5, label: "Paid Recipes", count: selectedItem.stats?.paidRecipes, icon: <CheckCircle sx={{ fontSize: 18, color: "#28c76f" }} />, chipBg: isDarkMode ? "rgba(40,199,111,0.15)" : "#d1fae5", chipText: "#28c76f" },
                      { id: 6, label: "Payment Pending / Left Recipes", count: selectedItem.stats?.leftRecipes, icon: <PauseCircle sx={{ fontSize: 18, color: "#ea5455" }} />, chipBg: isDarkMode ? "rgba(234,84,85,0.15)" : "#fee2e2", chipText: "#ea5455" },
                    ].map((row, idx) => (
                      <TableRow
                        key={row.id}
                        sx={{
                          height: "46px",
                          backgroundColor: "transparent",
                          "&:hover": { backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" },
                          "& td": {
                            borderBottom: idx === 5 ? "none" : isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #ebe9f1",
                            borderRight: isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #ebe9f1",
                            color: isDarkMode ? "#d0d2d6" : "#4b4b4b",
                            py: 1,
                            px: 2.5,
                            "&:last-child": { borderRight: "none" },
                          },
                        }}
                      >
                        <TableCell align="center" sx={{ fontWeight: 600, color: isDarkMode ? "#b4b7bd" : "#94a3b8" }}>{row.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box sx={{ width: 28, height: 28, borderRadius: "6px", backgroundColor: row.chipBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {row.icon}
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>{row.label}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body1" sx={{ fontWeight: 700, color: row.chipText, fontSize: "0.95rem" }}>
                            {(row.count ?? 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Payment Slips Table Box */}
            <Box
              sx={{
                bgcolor: "rgba(115, 103, 240, 0.04)",
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? "rgba(115, 103, 240, 0.12)" : "rgba(115, 103, 240, 0.12)"}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "6px", background: "linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ReceiptLongIcon sx={{ color: "#fff", fontSize: 16 }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDarkMode ? "#e2e8f0" : "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.75rem" }}>
                  Payment Slips
                </Typography>
              </Box>

              <TableContainer
                sx={{
                  borderRadius: "6px",
                  backgroundColor: isDarkMode ? "#1e2233" : "#ffffff",
                  border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #ebe9f1",
                  overflowX: "auto",
                  width: "100%",
                }}
              >
                <Table sx={{ minWidth: 520 }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        height: "44px",
                        backgroundColor: isDarkMode ? "#283046" : "#f8fafc",
                        "& th": {
                          color: isDarkMode ? "#b4b7bd" : "#6e6b7b",
                          fontWeight: 600,
                          fontSize: "0.78rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #ebe9f1",
                          borderRight: isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #ebe9f1",
                          py: 1,
                          px: 2,
                          "&:last-child": { borderRight: "none" },
                        },
                      }}
                    >
                      <TableCell width="50" align="center">#</TableCell>
                      <TableCell align="center">PAYMENT DATE</TableCell>
                      <TableCell align="center">APPROVED RECIPES</TableCell>
                      <TableCell align="center">TOTAL AMOUNT (₹)</TableCell>
                      <TableCell align="center">PAYMENT MODE</TableCell>
                      <TableCell align="center">STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!selectedItem.paymentSlips || selectedItem.paymentSlips.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: isDarkMode ? "#b4b7bd" : "#6e6b7b" }}>
                          No payment slips found for {selectedItem.user?.name}
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedItem.paymentSlips.map((slip, sIdx) => {
                        const statusConfig = {
                          paid: { bg: isDarkMode ? "rgba(40,199,111,0.15)" : "#d1fae5", text: "#28c76f" },
                          approved: { bg: isDarkMode ? "rgba(115,103,240,0.15)" : "#ede9fe", text: "#7367f0" },
                          pending: { bg: isDarkMode ? "rgba(255,159,67,0.15)" : "#fef3c7", text: "#ff9f43" },
                          rejected: { bg: isDarkMode ? "rgba(234,84,85,0.15)" : "#fee2e2", text: "#ea5455" },
                        };
                        const st = statusConfig[(slip.status || "").toLowerCase()] || statusConfig.pending;

                        return (
                          <TableRow
                            key={slip.id || sIdx}
                            sx={{
                              height: "46px",
                              backgroundColor: "transparent",
                              "&:hover": { backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" },
                              "& td": {
                                borderBottom: sIdx === selectedItem.paymentSlips.length - 1 ? "none" : isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #ebe9f1",
                                borderRight: isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #ebe9f1",
                                color: isDarkMode ? "#d0d2d6" : "#4b4b4b",
                                py: 1,
                                px: 2,
                                "&:last-child": { borderRight: "none" },
                              },
                            }}
                          >
                            <TableCell align="center" sx={{ fontWeight: 600, color: isDarkMode ? "#b4b7bd" : "#94a3b8" }}>{sIdx + 1}</TableCell>
                            <TableCell align="center">{slip.payment_date ? moment(slip.payment_date).format("MMM D, YYYY") : "-"}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>{slip.admin_approved_count ?? "-"}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: isDarkMode ? "#28c76f" : "#16a34a" }}>
                              {slip.total_amount ? `₹${Number(slip.total_amount).toLocaleString()}` : "-"}
                            </TableCell>
                            <TableCell align="center" sx={{ textTransform: "capitalize" }}>{slip.payment_mode || "-"}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={slip.status ? slip.status.toUpperCase() : "PENDING"}
                                size="small"
                                sx={{ backgroundColor: st.bg, color: st.text, fontWeight: 700, fontSize: "0.7rem", borderRadius: "4px", px: 0.5 }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                  {selectedItem.paymentSlips && selectedItem.paymentSlips.length > 0 && (
                    <TableHead>
                      <TableRow
                        sx={{
                          height: "44px",
                          backgroundColor: "transparent",
                          "& th, & td": {
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            color: isDarkMode ? "#e2e8f0" : "#1e293b",
                            borderTop: isDarkMode ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #ebe9f1",
                            borderBottom: "none",
                            borderRight: isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #ebe9f1",
                            py: 1,
                            px: 2,
                            "&:last-child": { borderRight: "none" },
                          },
                        }}
                      >
                        <TableCell colSpan={2} align="center" />
                        <TableCell align="center" sx={{ fontWeight: 700, color: isDarkMode ? "#d0d2d6" : "#4b4b4b" }}>
                          {selectedItem.paymentSlips
                            .filter(s => (s.status || "").toLowerCase() === "paid")
                            .reduce((sum, s) => sum + (Number(s.admin_approved_count) || 0), 0)} Recipes
                        </TableCell>
                        <TableCell colSpan={3} align="center" />
                      </TableRow>
                    </TableHead>
                  )}
                </Table>
              </TableContainer>
            </Box>
          </DialogContent>

          {/* Dialog Actions - Matched to ViewCategoryDialog */}
          <DialogActions sx={{ p: 2, backgroundColor: isDarkMode ? "#283046" : "#ffffff", borderTop: `1px solid ${isDarkMode ? "#404656" : "#ebe9f1"}` }}>
            <Button
              onClick={() => setSelectedItem(null)}
              variant="outlined"
              sx={{
                borderRadius: "6px",
                color: isDarkMode ? "#b4b7bd" : "#6e6b7b",
                borderColor: isDarkMode ? "#404656" : "#d8d6de",
                "&:hover": {
                  borderColor: isDarkMode ? "#d0d2d6" : "#4b4b4b",
                  backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

// ── User Work Drawer Card (Admin Multi-User View) ───────────────────────
const UserWorkCard = ({ item, index, isDarkMode }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user: person, stats, paymentSlips } = item;

  return (
    <>
      <Box
        onClick={() => setDrawerOpen(true)}
        sx={{
          borderRadius: "8px",
          backgroundColor: isDarkMode ? "#283046" : "#ffffff",
          border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          boxShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(34,41,47,0.05)",
          overflow: "hidden",
          mb: 1.5,
          px: { xs: 2.5, sm: 3 },
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: isDarkMode ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(115,103,240,0.12)",
            borderColor: "#7367f0",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: isDarkMode ? "#e2e8f0" : "#1e293b", fontSize: "1rem" }}
          >
            {index + 1}. {person.name}
          </Typography>
          <Avatar
            src={person.image ? getImage(person.image) : ""}
            alt={person.name}
            sx={{
              width: 34,
              height: 34,
              bgcolor: !person.image ? (person.profile_color || "#7367f0") : "transparent",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            {!person.image && person.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Chip
            label={person.role_name || "Member"}
            size="small"
            sx={{
              bgcolor: isDarkMode ? "rgba(115,103,240,0.15)" : "#ede9fe",
              color: "#7367f0",
              fontWeight: 600,
              fontSize: "0.72rem",
              height: 22,
            }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 2 }}>
            <Typography variant="caption" sx={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
              Approved: <strong style={{ color: "#28c76f" }}>{stats.approved}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
              Paid: <strong style={{ color: "#7367f0" }}>{stats.paidRecipes}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
              Pending: <strong style={{ color: "#ea5455" }}>{stats.leftRecipes}</strong>
            </Typography>
          </Box>

          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              setDrawerOpen(true);
            }}
            sx={{
              textTransform: "none",
              borderColor: isDarkMode ? "rgba(115,103,240,0.4)" : "#7367f0",
              color: "#7367f0",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.8rem",
              py: 0.4,
              px: 1.5,
              "&:hover": {
                backgroundColor: isDarkMode ? "rgba(115,103,240,0.15)" : "#ede9fe",
              },
            }}
          >
            View Work Details
          </Button>
        </Box>
      </Box>

      {/* Drawer Component for User Work Details */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 600, md: 720 },
            backgroundColor: isDarkMode ? "#1e2233" : "#ffffff",
            color: isDarkMode ? "#e2e8f0" : "#1e293b",
            p: 0,
          },
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 3,
            borderBottom: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            backgroundColor: isDarkMode ? "#283046" : "#f8fafc",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={person.image ? getImage(person.image) : ""}
              alt={person.name}
              sx={{
                width: 42,
                height: 42,
                bgcolor: !person.image ? (person.profile_color || "#7367f0") : "transparent",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {!person.image && person.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {person.name}'s Work & Slips
              </Typography>
              <Typography variant="caption" sx={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                {person.email || person.role_name}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: isDarkMode ? "#cbd5e1" : "#64748b" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Drawer Body */}
        <Box sx={{ p: { xs: 2.5, sm: 3 }, overflowY: "auto" }}>
          {/* Work Summary Table */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>
            Work Summary Metrics
          </Typography>

          <TableContainer
            sx={{
              borderRadius: "6px",
              backgroundColor: "transparent",
              border: isDarkMode
                ? "1px solid rgba(255, 255, 255, 0.25)"
                : "1px solid rgba(0, 0, 0, 0.2)",
              overflowX: "auto",
              width: "100%",
              mb: 4,
            }}
          >
            <Table sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow
                  sx={{
                    height: "44px",
                    backgroundColor: "transparent",
                    "& th": {
                      color: isDarkMode ? "#b4b7bd" : "#6e6b7b",
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.2)"
                        : "1px solid rgba(0, 0, 0, 0.15)",
                      borderRight: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.12)"
                        : "1px solid rgba(0, 0, 0, 0.1)",
                      py: 1,
                      px: 2.5,
                      "&:last-child": { borderRight: "none" },
                    },
                  }}
                >
                  <TableCell width="50" align="center">#</TableCell>
                  <TableCell>METRIC NAME</TableCell>
                  <TableCell align="center">TOTAL COUNT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { id: 1, label: "New Assigned Recipes", count: stats.assigned, icon: <Assignment sx={{ fontSize: 18, color: "#7367f0" }} />, chipBg: isDarkMode ? "rgba(115,103,240,0.15)" : "#ede9fe", chipText: "#7367f0" },
                  { id: 2, label: "Approved Recipes", count: stats.approved, icon: <CheckCircle sx={{ fontSize: 18, color: "#28c76f" }} />, chipBg: isDarkMode ? "rgba(40,199,111,0.15)" : "#d1fae5", chipText: "#28c76f" },
                  { id: 3, label: "Not Approved Recipes", count: stats.notApproved, icon: <PauseCircle sx={{ fontSize: 18, color: "#ea5455" }} />, chipBg: isDarkMode ? "rgba(234,84,85,0.15)" : "#fee2e2", chipText: "#ea5455" },
                  { id: 4, label: "Today's Recipes", count: stats.todayRecipes, icon: <CalendarToday sx={{ fontSize: 18, color: "#00cfdd" }} />, chipBg: isDarkMode ? "rgba(0,207,221,0.15)" : "#e0f2fe", chipText: "#00cfdd" },
                  { id: 5, label: "Avg. Recipes Completed / Day", count: stats.avgPerDay, icon: <HourglassEmpty sx={{ fontSize: 18, color: "#ff9f43" }} />, chipBg: isDarkMode ? "rgba(255,159,67,0.15)" : "#fff7ed", chipText: "#ff9f43" },
                  { id: 6, label: "Paid Recipes", count: stats.paidRecipes, icon: <CheckCircle sx={{ fontSize: 18, color: "#28c76f" }} />, chipBg: isDarkMode ? "rgba(40,199,111,0.15)" : "#d1fae5", chipText: "#28c76f" },
                  { id: 7, label: "Payment Pending / Left Recipes", count: stats.leftRecipes, icon: <PauseCircle sx={{ fontSize: 18, color: "#ea5455" }} />, chipBg: isDarkMode ? "rgba(234,84,85,0.15)" : "#fee2e2", chipText: "#ea5455" },
                ].map((row, idx) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      height: "48px",
                      backgroundColor: "transparent",
                      "&:hover": { backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" },
                      "& td": {
                        borderBottom: idx === 6 ? "none" : isDarkMode ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(0, 0, 0, 0.12)",
                        borderRight: isDarkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
                        color: isDarkMode ? "#d0d2d6" : "#4b4b4b",
                        py: 1,
                        px: 2.5,
                        "&:last-child": { borderRight: "none" },
                      },
                    }}
                  >
                    <TableCell align="center" sx={{ fontWeight: 600, color: isDarkMode ? "#b4b7bd" : "#94a3b8" }}>{row.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: "6px", backgroundColor: row.chipBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {row.icon}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>{row.label}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" sx={{ fontWeight: 700, color: row.chipText, fontSize: "0.95rem" }}>
                        {(row.count ?? 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Payment Slips Table for User */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: "6px", background: "linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ReceiptLongIcon sx={{ color: "#fff", fontSize: 16 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>
              Payment Slips
            </Typography>
          </Box>

          <TableContainer
            sx={{
              borderRadius: "6px",
              backgroundColor: "transparent",
              border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid rgba(0, 0, 0, 0.2)",
              overflowX: "auto",
              width: "100%",
            }}
          >
            <Table sx={{ minWidth: 520 }}>
              <TableHead>
                <TableRow
                  sx={{
                    height: "44px",
                    backgroundColor: "transparent",
                    "& th": {
                      color: isDarkMode ? "#b4b7bd" : "#6e6b7b",
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: isDarkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.15)",
                      borderRight: isDarkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
                      py: 1,
                      px: 2,
                      "&:last-child": { borderRight: "none" },
                    },
                  }}
                >
                  <TableCell width="50" align="center">#</TableCell>
                  <TableCell align="center">PAYMENT DATE</TableCell>
                  <TableCell align="center">APPROVED RECIPES</TableCell>
                  <TableCell align="center">TOTAL AMOUNT (₹)</TableCell>
                  <TableCell align="center">PAYMENT MODE</TableCell>
                  <TableCell align="center">STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!paymentSlips || paymentSlips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: isDarkMode ? "#b4b7bd" : "#6e6b7b" }}>
                      No payment slips found for {person.name}
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentSlips.map((slip, sIdx) => {
                    const statusConfig = {
                      paid: { bg: isDarkMode ? "rgba(40,199,111,0.15)" : "#d1fae5", text: "#28c76f" },
                      approved: { bg: isDarkMode ? "rgba(115,103,240,0.15)" : "#ede9fe", text: "#7367f0" },
                      pending: { bg: isDarkMode ? "rgba(255,159,67,0.15)" : "#fef3c7", text: "#ff9f43" },
                      rejected: { bg: isDarkMode ? "rgba(234,84,85,0.15)" : "#fee2e2", text: "#ea5455" },
                    };
                    const st = statusConfig[(slip.status || "").toLowerCase()] || statusConfig.pending;

                    return (
                      <TableRow
                        key={slip.id}
                        sx={{
                          height: "48px",
                          backgroundColor: "transparent",
                          "&:hover": { backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" },
                          "& td": {
                            borderBottom: sIdx === paymentSlips.length - 1 ? "none" : isDarkMode ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(0, 0, 0, 0.12)",
                            borderRight: isDarkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
                            color: isDarkMode ? "#d0d2d6" : "#4b4b4b",
                            py: 1,
                            px: 2,
                            "&:last-child": { borderRight: "none" },
                          },
                        }}
                      >
                        <TableCell align="center" sx={{ fontWeight: 600, color: isDarkMode ? "#b4b7bd" : "#94a3b8" }}>{sIdx + 1}</TableCell>
                        <TableCell align="center">{slip.payment_date ? moment(slip.payment_date).format("MMM D, YYYY") : "-"}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{slip.admin_approved_count ?? "-"}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: isDarkMode ? "#28c76f" : "#16a34a" }}>
                          {slip.total_amount ? `₹${Number(slip.total_amount).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell align="center" sx={{ textTransform: "capitalize" }}>{slip.payment_mode || "-"}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={slip.status ? slip.status.toUpperCase() : "PENDING"}
                            size="small"
                            sx={{ backgroundColor: st.bg, color: st.text, fontWeight: 700, fontSize: "0.7rem", borderRadius: "4px", px: 0.5 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              {paymentSlips && paymentSlips.length > 0 && (
                <TableHead>
                  <TableRow
                    sx={{
                      height: "44px",
                      backgroundColor: "transparent",
                      "& th, & td": {
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        color: isDarkMode ? "#e2e8f0" : "#1e293b",
                        borderTop: isDarkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.15)",
                        borderBottom: "none",
                        borderRight: isDarkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
                        py: 1,
                        px: 2,
                        "&:last-child": { borderRight: "none" },
                      },
                    }}
                  >
                    <TableCell colSpan={2} align="center" />
                    <TableCell align="center" sx={{ fontWeight: 700, color: isDarkMode ? "#d0d2d6" : "#4b4b4b" }}>
                      {paymentSlips
                        .filter(s => (s.status || "").toLowerCase() === "paid")
                        .reduce((sum, s) => sum + (Number(s.admin_approved_count) || 0), 0)} Recipes
                    </TableCell>
                    <TableCell colSpan={3} align="center" />
                  </TableRow>
                </TableHead>
              )}
            </Table>
          </TableContainer>
        </Box>
      </Drawer>
    </>
  );
};


// ── Main component ─────────────────────────────────────────────────────────────
const MyWork = () => {
  const { isDarkMode } = useTheme();
  const user = useSelector((state) => state.auth.user);
  const userPermissions = user?.permissions || [];
  const canView = userPermissions.includes("my_work.view");

  // Fetch My Work stats from dedicated /api/my-work endpoint
  const { data, isLoading, isFetching, refetch } = useGetMyWorkQuery(
    {
      assignedTo: user?.user_id || user?.id || "",
    },
    { skip: !canView, refetchOnMountOrArgChange: true }
  );

  useEffect(() => {
    document.title = "My Work";
  }, []);

  const stats = useMemo(() => {
    return data?.stats || { assigned: 0, "in-progress": 0, completed: 0, "on-hold": 0 };
  }, [data]);

  const usersWorkList = useMemo(() => {
    return data?.usersWork || [];
  }, [data]);

  if (!canView) {
    return <AccessDenied message="You don't have permission to view the My Work page." />;
  }

  const BG = isDarkMode ? "#161b2e" : "#f4f6fb";
  const TEXT_PRI = isDarkMode ? "#e2e8f0" : "#1e293b";
  const TEXT_SEC = isDarkMode ? "#64748b" : "#94a3b8";
  const CARD_BG = isDarkMode ? "#283046" : "#ffffff";
  const BORDER_COLOR = isDarkMode ? "#3b4253" : "#ebe9f1";

  const handleManualRefresh = async () => {
    try {
      const result = await refetch();
      if (result?.error) {
        toast.error("Failed to refresh My Work data.");
      } else {
        toast.success("My Work data refreshed successfully!");
      }
    } catch (err) {
      toast.error("Failed to refresh My Work data.");
    }
  };

  return (
    <Box className="transition-all duration-200 flex flex-col pt-0 md:pt-4 pb-4 px-3 mt-[64px] md:mt-[74px] min-h-[calc(100vh-74px)] h-auto w-full">
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRadius: "6px",
          backgroundColor: isDarkMode ? "#283046" : "#ffffff",
          overflow: "hidden",
          boxShadow: isDarkMode
            ? "0 4px 24px 0 rgba(0,0,0,0.24)"
            : "0 4px 24px 0 rgba(34,41,47,0.1)",
        }}
      >
        {/* ── Card Header ── */}
        <Box
          className="flex flex-row justify-between items-center p-4 sm:p-5 border-b gap-4"
          sx={{ borderColor: isDarkMode ? "#3b4253" : "#ebe9f1" }}
        >
          <Box className="flex items-center flex-wrap gap-2">
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: isDarkMode ? "#e2e8f0" : "#1e293b",
                letterSpacing: "0.5px",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              My Work
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton
              onClick={handleManualRefresh}
              disabled={isFetching}
              sx={{
                color: isDarkMode ? "#a5b4fc" : "#7367f0",
                bgcolor: isDarkMode ? "rgba(115,103,240,0.12)" : "#ede9fe",
                "&:hover": { bgcolor: isDarkMode ? "rgba(115,103,240,0.2)" : "#e0d8ff" },
              }}
            >
              <RefreshIcon
                sx={{
                  animation: isFetching ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>

        {/* ── Content Area ── */}
        <Box sx={{ p: 0, flex: 1, display: "flex", flexDirection: "column" }}>
          {/* ── Admin View vs Single User View ── */}
          {user?.role === 'admin' ? (
            <TeamPanel isDarkMode={isDarkMode} usersWorkList={usersWorkList} isLoading={isLoading} />
          ) : (
            <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", gap: { xs: 3, sm: 4 } }}>
              {/* ── Work Summary Metrics Section ────────────────────────────── */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Assignment sx={{ color: "#fff", fontSize: 18 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: isDarkMode ? "#e2e8f0" : "#1e293b",
                      letterSpacing: "0.5px",
                      fontSize: { xs: "1.1rem", sm: "1.25rem" },
                    }}
                  >
                    Work Summary Metrics
                  </Typography>
                </Box>

                <TableContainer
                  sx={{
                    borderRadius: "6px",
                    backgroundColor: "transparent",
                    border: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.25)"
                      : "1px solid rgba(0, 0, 0, 0.2)",
                    overflowX: "auto",
                    width: "100%",
                  }}
                >
                <Table sx={{ minWidth: 500 }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        height: "48px",
                        backgroundColor: "transparent",
                        "& th": {
                          color: isDarkMode ? "#b4b7bd" : "#6e6b7b",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: isDarkMode
                            ? "1px solid rgba(255, 255, 255, 0.2)"
                            : "1px solid rgba(0, 0, 0, 0.15)",
                          borderRight: isDarkMode
                            ? "1px solid rgba(255, 255, 255, 0.12)"
                            : "1px solid rgba(0, 0, 0, 0.1)",
                          py: 1,
                          px: 3,
                          "&:last-child": {
                            borderRight: "none",
                          },
                        },
                      }}
                    >
                      <TableCell width="60" align="center">#</TableCell>
                      <TableCell>METRIC NAME</TableCell>
                      <TableCell align="center">TOTAL COUNT</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      {
                        id: 1,
                        label: "New Assigned Recipes",
                        count: stats.assigned,
                        icon: <Assignment sx={{ fontSize: 20, color: "#7367f0" }} />,
                        chipBg: isDarkMode ? "rgba(115,103,240,0.15)" : "#ede9fe",
                        chipText: "#7367f0",
                      },
                      {
                        id: 2,
                        label: "Approved Recipes",
                        count: stats.approved,
                        icon: <CheckCircle sx={{ fontSize: 20, color: "#28c76f" }} />,
                        chipBg: isDarkMode ? "rgba(40,199,111,0.15)" : "#d1fae5",
                        chipText: "#28c76f",
                      },
                      {
                        id: 3,
                        label: "Not Approved Recipes",
                        count: stats.notApproved,
                        icon: <PauseCircle sx={{ fontSize: 20, color: "#ea5455" }} />,
                        chipBg: isDarkMode ? "rgba(234,84,85,0.15)" : "#fee2e2",
                        chipText: "#ea5455",
                      },
                      {
                        id: 4,
                        label: "Today's Recipes",
                        count: stats.todayRecipes,
                        icon: <CalendarToday sx={{ fontSize: 20, color: "#00cfdd" }} />,
                        chipBg: isDarkMode ? "rgba(0,207,221,0.15)" : "#e0f2fe",
                        chipText: "#00cfdd",
                      },
                      {
                        id: 5,
                        label: "Paid Recipes",
                        count: stats.paidRecipes,
                        icon: <CheckCircle sx={{ fontSize: 20, color: "#28c76f" }} />,
                        chipBg: isDarkMode ? "rgba(40,199,111,0.15)" : "#d1fae5",
                        chipText: "#28c76f",
                      },
                      {
                        id: 6,
                        label: "Payment Pending / Left Recipes",
                        count: stats.leftRecipes,
                        icon: <PauseCircle sx={{ fontSize: 20, color: "#ea5455" }} />,
                        chipBg: isDarkMode ? "rgba(234,84,85,0.15)" : "#fee2e2",
                        chipText: "#ea5455",
                      },
                    ].map((row, index) => (
                      <TableRow
                        key={row.id}
                        sx={{
                          height: "56px",
                          backgroundColor: "transparent",
                          "&:hover": {
                            backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                          },
                          "& td": {
                            borderBottom: index === 5
                              ? "none"
                              : isDarkMode
                                ? "1px solid rgba(255, 255, 255, 0.15)"
                                : "1px solid rgba(0, 0, 0, 0.12)",
                            borderRight: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.12)"
                              : "1px solid rgba(0, 0, 0, 0.1)",
                            color: isDarkMode ? "#d0d2d6" : "#4b4b4b",
                            py: 1.5,
                            px: 3,
                            "&:last-child": {
                              borderRight: "none",
                            },
                          },
                        }}
                      >
                        <TableCell align="center" sx={{ fontWeight: 600, color: isDarkMode ? "#b4b7bd" : "#94a3b8" }}>
                          {row.id}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: "6px",
                                backgroundColor: row.chipBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {row.icon}
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? "#e2e8f0" : "#1e293b" }}>
                              {row.label}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="h6" sx={{ fontWeight: 700, color: row.chipText, fontSize: "1.1rem" }}>
                            {(row.count ?? 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

              {/* ── Payment Slips Table ───────────────────────────────────────── */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ReceiptLongIcon sx={{ color: "#fff", fontSize: 18 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: isDarkMode ? "#e2e8f0" : "#1e293b",
                      letterSpacing: "0.5px",
                      fontSize: { xs: "1.1rem", sm: "1.25rem" },
                    }}
                  >
                    Payment Slips
                  </Typography>
                </Box>

                <TableContainer
                  sx={{
                    borderRadius: "6px",
                    backgroundColor: "transparent",
                    border: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.25)"
                      : "1px solid rgba(0, 0, 0, 0.2)",
                    overflowX: "auto",
                    width: "100%",
                  }}
                >
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow
                        sx={{
                          height: "48px",
                          backgroundColor: "transparent",
                          "& th": {
                            color: isDarkMode ? "#b4b7bd" : "#6e6b7b",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            borderBottom: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.2)"
                              : "1px solid rgba(0, 0, 0, 0.15)",
                            borderRight: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.12)"
                              : "1px solid rgba(0, 0, 0, 0.1)",
                            py: 1,
                            px: 3,
                            "&:last-child": {
                              borderRight: "none",
                            },
                          },
                        }}
                      >
                        <TableCell width="60" align="center">#</TableCell>
                        <TableCell align="center">PAYMENT DATE</TableCell>
                        <TableCell align="center">APPROVED RECIPES</TableCell>
                        <TableCell align="center">TOTAL AMOUNT (₹)</TableCell>
                        <TableCell align="center">PAYMENT MODE</TableCell>
                        <TableCell align="center">STATUS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!data?.paymentSlips || data.paymentSlips.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            align="center"
                            sx={{
                              py: 4,
                              color: isDarkMode ? "#b4b7bd" : "#6e6b7b",
                            }}
                          >
                            No payment slips found for your account
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.paymentSlips.map((slip, index) => {
                          const statusConfig = {
                            paid: { bg: isDarkMode ? "rgba(40,199,111,0.15)" : "#d1fae5", text: "#28c76f" },
                            approved: { bg: isDarkMode ? "rgba(115,103,240,0.15)" : "#ede9fe", text: "#7367f0" },
                            pending: { bg: isDarkMode ? "rgba(255,159,67,0.15)" : "#fef3c7", text: "#ff9f43" },
                            rejected: { bg: isDarkMode ? "rgba(234,84,85,0.15)" : "#fee2e2", text: "#ea5455" },
                          };
                          const st = statusConfig[(slip.status || "").toLowerCase()] || statusConfig.pending;

                          return (
                            <TableRow
                              key={slip.id}
                              sx={{
                                height: "56px",
                                backgroundColor: "transparent",
                                "&:hover": {
                                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                                },
                                "& td": {
                                  borderBottom: index === data.paymentSlips.length - 1
                                    ? "none"
                                    : isDarkMode
                                      ? "1px solid rgba(255, 255, 255, 0.15)"
                                      : "1px solid rgba(0, 0, 0, 0.12)",
                                  borderRight: isDarkMode
                                    ? "1px solid rgba(255, 255, 255, 0.12)"
                                    : "1px solid rgba(0, 0, 0, 0.1)",
                                  color: isDarkMode ? "#d0d2d6" : "#4b4b4b",
                                  py: 1.5,
                                  px: 3,
                                  "&:last-child": {
                                    borderRight: "none",
                                  },
                                },
                              }}
                            >
                              <TableCell align="center" sx={{ fontWeight: 600, color: isDarkMode ? "#b4b7bd" : "#94a3b8" }}>
                                {index + 1}
                              </TableCell>
                              <TableCell align="center">
                                {slip.payment_date ? moment(slip.payment_date).format("MMM D, YYYY") : "-"}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600 }}>
                                {slip.admin_approved_count ?? "-"}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, color: isDarkMode ? "#28c76f" : "#16a34a" }}>
                                {slip.total_amount ? `₹${Number(slip.total_amount).toLocaleString()}` : "-"}
                              </TableCell>
                              <TableCell align="center" sx={{ textTransform: "capitalize" }}>
                                {slip.payment_mode || "-"}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={slip.status ? slip.status.toUpperCase() : "PENDING"}
                                  size="small"
                                  sx={{
                                    backgroundColor: st.bg,
                                    color: st.text,
                                    fontWeight: 700,
                                    fontSize: "0.72rem",
                                    borderRadius: "4px",
                                    px: 0.5,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                    {data?.paymentSlips && data.paymentSlips.length > 0 && (
                      <TableHead>
                        <TableRow
                          sx={{
                            height: "50px",
                            backgroundColor: "transparent",
                            "& th, & td": {
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              color: isDarkMode ? "#e2e8f0" : "#1e293b",
                              borderTop: isDarkMode
                                ? "1px solid rgba(255, 255, 255, 0.2)"
                                : "1px solid rgba(0, 0, 0, 0.15)",
                              borderBottom: "none",
                              borderRight: isDarkMode
                                ? "1px solid rgba(255, 255, 255, 0.12)"
                                : "1px solid rgba(0, 0, 0, 0.1)",
                              py: 1.5,
                              px: 3,
                              "&:last-child": {
                                borderRight: "none",
                              },
                            },
                          }}
                        >
                          <TableCell colSpan={2} align="center" />
                          <TableCell
                            align="center"
                            sx={{
                              fontWeight: 700,
                              color: isDarkMode ? "#d0d2d6" : "#4b4b4b",
                            }}
                          >
                            {data.paymentSlips
                              .filter(s => (s.status || "").toLowerCase() === "paid")
                              .reduce((sum, s) => sum + (Number(s.admin_approved_count) || 0), 0)} Recipes
                          </TableCell>
                          <TableCell colSpan={3} align="center" />
                        </TableRow>
                      </TableHead>
                    )}
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MyWork;
