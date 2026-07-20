"use client";
import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Dialog, DialogContent, DialogTitle, IconButton, Button, LinearProgress, Box, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const isStepHeader = (text) => /^step\s+\d+/i.test((text || '').trim());

const parseStepHeader = (text) => {
  const match = (text || '').match(/^(step\s+\d+)\s*[:\-–—]?\s*(.*)/i);
  return {
    label: match ? match[1] : text,
    title: match ? match[2] : '',
  };
};

const StepByStepModal = ({
  open,
  onClose,
  instructions,
  recipeTitle,
  isWakeLockActive,
  onToggleWakeLock,
}) => {
  const [step, setStep] = useState(0);
  const { isDarkMode } = useTheme();

  const handleNext = () => {
    if (step < instructions.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };
  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };
  const handleClose = () => {
    setStep(0);
    onClose();
  };

  const currentSectionHeader = (() => {
    for (let i = step; i >= 0; i--) {
      if (isStepHeader(instructions[i])) return instructions[i];
    }
    return null;
  })();

  const currentIsHeader = isStepHeader(instructions[step]);

  const nonHeaderTotal = instructions.filter(s => !isStepHeader(s)).length;

  let subStepIndex = 0;
  if (!currentIsHeader) {
    for (let i = 0; i <= step; i++) {
      if (!isStepHeader(instructions[i])) subStepIndex++;
    }
  }

  const progressValue = nonHeaderTotal > 0
    ? (subStepIndex / nonHeaderTotal) * 100
    : ((step + 1) / instructions.length) * 100;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      disableScrollLock
      PaperProps={{
        sx: {
          "& *": {
            fontFamily: "'Basic', sans-serif !important"
          }
        }
      }}
    >
      <Box
        className="min-h-screen flex flex-col"
        sx={{ backgroundColor: isDarkMode ? "#1f1f1e" : "#FFF7EC" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{
            borderBottom: `1px solid ${isDarkMode ? "#3f2a16" : "#FFE0C2"}`,
            backgroundColor: isDarkMode ? "#1f1f1e" : "#FFFFFF",
          }}
        >
          <DialogTitle
            className="!p-0"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.4rem", md: "1.6rem" },
              color: isDarkMode ? "#FFB870" : "#CA6014",
            }}
          >
            <div className="flex flex-col">
              <span>Step-by-Step Instructions</span>
              {recipeTitle && (
                <span style={{ marginTop: 0, fontSize: "0.9rem", fontWeight: 500, color: isDarkMode ? "#E5E7EB" : "#4B5563" }}>
                  {recipeTitle}
                </span>
              )}
            </div>
          </DialogTitle>
          <IconButton
            onClick={handleClose}
            sx={{
              color: isDarkMode ? "#FFB870" : "#CA6014",
              "&:hover": { color: isDarkMode ? "#FFD19A" : "#A94C10", backgroundColor: "transparent" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </div>

        <DialogContent className="flex-1 flex flex-col items-center justify-center">
          {typeof isWakeLockActive === "boolean" && typeof onToggleWakeLock === "function" && (
            <Box sx={{ width: "100%", maxWidth: "36rem", mb: 2, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.75 }}>
              <Box
                sx={{
                  display: "flex", alignItems: "center",
                  background: isDarkMode ? "#23272f" : "#f1f5f9",
                  border: `1.5px solid ${isWakeLockActive ? "#22c55e" : isDarkMode ? "#334155" : "#cbd5e1"}`,
                  borderRadius: 3, px: 2, py: 1,
                  boxShadow: isWakeLockActive ? "0 2px 8px 0 #22c55e33" : "none",
                  transition: "all 0.2s", width: "100%", justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: 500, fontSize: "1.05rem", color: isDarkMode ? "#fff" : "#0f172a" }}>
                  Keep Screen Awake
                </span>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={isWakeLockActive} onChange={onToggleWakeLock} style={{ display: "none" }} />
                  <span style={{
                    width: 58, height: 26,
                    background: isWakeLockActive ? "#22c55e" : isDarkMode ? "#334155" : "#cbd5e1",
                    borderRadius: 24, position: "relative", transition: "background 0.2s",
                    display: "inline-block", flexShrink: 0,
                  }}>
                    <span style={{
                      position: "absolute", top: "50%", transform: "translateY(-50%)",
                      left: isWakeLockActive ? 8 : "auto", right: isWakeLockActive ? "auto" : 7,
                      fontSize: "0.62rem", fontWeight: 800,
                      color: isWakeLockActive ? "#fff" : isDarkMode ? "#cbd5e1" : "#64748b",
                      pointerEvents: "none", transition: "all 0.2s",
                    }}>
                      {isWakeLockActive ? "ON" : "OFF"}
                    </span>
                    <span style={{
                      position: "absolute", left: isWakeLockActive ? 34 : 2, top: 2,
                      width: 22, height: 22, background: "#fff", borderRadius: "50%",
                      boxShadow: "0 1px 4px #0002", transition: "left 0.2s",
                    }} />
                  </span>
                </label>
              </Box>
              <span style={{ fontSize: "0.8rem", marginLeft: "2px", color: isDarkMode ? "#B3B3B3" : "rgba(0,0,0,0.6)" }}>
                <em>Note: This will be reset if you refresh or leave the page.</em>
              </span>
            </Box>
          )}

          <div
            className="w-full max-w-xl mx-auto p-6 rounded-lg shadow-lg"
            style={{
              backgroundColor: isDarkMode ? "#020617" : "#FFFFFF",
              boxShadow: isDarkMode ? "0 18px 45px rgba(0,0,0,0.65)" : "0 18px 45px rgba(202,96,20,0.25)",
              border: isDarkMode ? "1px solid #3f2a16" : "1px solid #FFE0C2",
            }}
          >
            <div className="text-center mb-4">
              <span className="font-semibold" style={{ color: isDarkMode ? "#FFB870" : "#CA6014", fontSize: "1.2rem" }}>
                {currentIsHeader
                  ? `Section ${step + 1} of ${instructions.length}`
                  : `Step ${subStepIndex} of ${nonHeaderTotal}`}
              </span>
              <Box sx={{ mt: 1.5, mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  sx={{
                    height: 6, borderRadius: 4,
                    backgroundColor: isDarkMode ? "#1f2933" : "#FFE0C2",
                    "& .MuiLinearProgress-bar": { backgroundColor: isDarkMode ? "#F97316" : "#CA6014" },
                  }}
                />
              </Box>
            </div>

            {currentIsHeader ? (
              <Box sx={{ py: 2 }}>
                {(() => {
                  const { label, title } = parseStepHeader(instructions[step]);
                  return (
                    <div style={{
                      backgroundColor: isDarkMode ? 'rgba(255,140,0,0.12)' : 'rgba(255,140,0,0.08)',
                      borderLeft: '4px solid #FF8C00',
                      borderRight: '4px solid #FF8C00',
                      borderRadius: 8,
                      padding: '14px 20px',
                    }}>
                      <Typography sx={{
                        fontWeight: 700, fontSize: '1.15rem',
                        color: isDarkMode ? '#fbbf24' : '#b45309',
                        mb: title ? 0.5 : 0,
                        fontFamily: "'Basic', sans-serif !important",
                        textTransform: 'capitalize',
                      }}>
                        {label}
                      </Typography>
                      {title && (
                        <Typography sx={{
                          fontWeight: 600, fontSize: '1.2rem',
                          color: isDarkMode ? '#e5e7eb' : '#1e293b',
                          fontFamily: "'Basic', sans-serif !important",
                        }}>
                          {title}
                        </Typography>
                      )}
                    </div>
                  );
                })()}
              </Box>
            ) : (
              <Box>
                {currentSectionHeader && (
                  <div style={{
                    backgroundColor: isDarkMode ? 'rgba(255,140,0,0.1)' : 'rgba(255,140,0,0.07)',
                    borderLeft: '3px solid #FF8C00',
                    borderRadius: '0 4px 4px 0',
                    padding: '5px 12px',
                    marginBottom: 16,
                  }}>
                    {(() => {
                      const { label, title } = parseStepHeader(currentSectionHeader);
                      return (
                        <Typography sx={{
                          fontWeight: 700, fontSize: '0.85rem',
                          color: isDarkMode ? '#fbbf24' : '#b45309',
                          fontFamily: "'Basic', sans-serif !important",
                          textTransform: 'capitalize',
                        }}>
                          {label}{title ? ` — ${title}` : ''}
                        </Typography>
                      );
                    })()}
                  </div>
                )}
                <Typography
                  variant="body1"
                  sx={{
                    mt: 1,
                    color: isDarkMode ? '#EAEAEA' : '#1e293b',
                    lineHeight: 1.6,
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    fontFamily: "'Basic', sans-serif !important",
                    transition: 'all 0.3s ease',
                  }}
                >
                  {instructions[step]}
                </Typography>
              </Box>
            )}

            <div className="flex justify-between mt-8">
              <Button
                variant="contained"
                onClick={handlePrev}
                disabled={step === 0}
                sx={{
                  textTransform: "none", borderRadius: "999px", px: 4, py: 1.2,
                  fontWeight: 600, boxShadow: "none",
                  backgroundColor: isDarkMode ? "#78320F" : "#CA6014",
                  "&:hover": { backgroundColor: isDarkMode ? "#92400E" : "#A94C10" },
                  "&.Mui-disabled": { backgroundColor: isDarkMode ? "#374151" : "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
                }}
              >
                Previous
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={instructions.length === 0}
                sx={{
                  textTransform: "none", borderRadius: "999px", px: 4, py: 1.2,
                  fontWeight: 600, boxShadow: "none",
                  backgroundColor: isDarkMode ? "#16A34A" : "#10B981",
                  "&:hover": { backgroundColor: isDarkMode ? "#15803D" : "#059669" },
                  "&.Mui-disabled": { backgroundColor: isDarkMode ? "#374151" : "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
                }}
              >
                {step === instructions.length - 1 ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default StepByStepModal;

