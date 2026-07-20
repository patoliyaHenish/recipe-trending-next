"use client";
import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "../context/ThemeContext";

const ThreeDotsLoader = () => {
  const { isDarkMode } = useTheme();
  const dot = "#CA6014";

  return (
    <Box
      sx={{
        minHeight: "60vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading recipe"
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          "@keyframes recipe-dot-bounce": {
            "0%, 80%, 100%": {
              transform: "translateY(0) scale(0.85)",
              opacity: 0.45,
            },
            "40%": {
              transform: "translateY(-10px) scale(1)",
              opacity: 1,
            },
          },
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: { xs: 10, sm: 12 },
              height: { xs: 10, sm: 12 },
              borderRadius: "50%",
              bgcolor: dot,
              boxShadow: isDarkMode
                ? "0 0 12px rgba(202, 96, 20, 0.45)"
                : "0 2px 8px rgba(202, 96, 20, 0.35)",
              animation: "recipe-dot-bounce 1.05s ease-in-out infinite",
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ThreeDotsLoader;

