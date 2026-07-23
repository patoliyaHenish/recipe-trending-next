"use client";
import React, { useEffect, useRef } from "react";
import { Box, Typography, Container, Chip } from "@mui/material";
import { useRouter } from "next/navigation";
import { 
  Restaurant as RestaurantIcon, 
  KeyboardArrowDown as ArrowDownIcon,
  SearchRounded as SearchIcon,
  AccountTreeRounded as HierarchyIcon,
  BookmarkRounded as BookmarkIcon,
  AutoAwesomeRounded as SparklesIcon,
  WorkRounded as WorkIcon,
  SchoolRounded as SchoolIcon,
  SelfImprovementRounded as SimplicityIcon,
  ElectricBoltRounded as SpeedIcon,
  CategoryRounded as CategoryIcon,
  HomeRounded as HomeIcon
} from "@mui/icons-material";
import { useTheme } from "../../context/ThemeContext";
import MissionImage from "../../assets/about-us-page-image.jpg";

const ParticleCanvas = ({ isDarkMode }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);

    const COUNT = Math.floor((W * H) / 14000);
    const CONNECT_DIST = 130;
    const dotColor  = isDarkMode ? "rgba(202,96,20," : "rgba(202,96,20,";
    const lineColor = isDarkMode ? "rgba(244,197,66," : "rgba(202,96,20,";

    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
    }));

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor + "0.55)";
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = lineColor + (0.18 * (1 - dist / CONNECT_DIST)) + ")";
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 0,
      }}
    />
  );
};

const Spotlight = ({ isDarkMode }) => {
  const spotRef = useRef(null);

  useEffect(() => {
    const move = (e) => {
      if (!spotRef.current) return;
      spotRef.current.style.left = `${e.clientX}px`;
      spotRef.current.style.top  = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <Box
      ref={spotRef}
      sx={{
        position: "fixed",
        width: 520, height: 520,
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        background: isDarkMode
          ? "radial-gradient(circle, rgba(202,96,20,0.09) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(202,96,20,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 1,
        transition: "left 0.08s ease, top 0.08s ease",
      }}
    />
  );
};

const FloatingPill = ({ emoji, label, style }) => {
  const { isDarkMode } = useTheme();
  return (
    <Box
      sx={{
        position: "absolute",
        display: { xs: "none", md: "flex" },
        alignItems: "center",
        gap: "6px",
        px: 2, py: 1,
        borderRadius: "100px",
        backgroundColor: isDarkMode ? "rgba(45,26,14,0.85)" : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
        border: isDarkMode
          ? "1px solid rgba(202,96,20,0.25)"
          : "1px solid rgba(202,96,20,0.15)",
        boxShadow: isDarkMode
          ? "0 8px 24px rgba(0,0,0,0.4)"
          : "0 8px 24px rgba(202,96,20,0.12)",
        fontSize: "0.85rem",
        fontFamily: "'Basic', sans-serif",
        color: isDarkMode ? "#FFF7EC" : "#2B2828",
        fontWeight: 600,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 2,
        animation: "floatPill 4s ease-in-out infinite",
        ...style,
      }}
    >
      <span style={{ fontSize: "1.1rem" }}>{emoji}</span>
      {label}
    </Box>
  );
};

const AboutUs = () => {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const heroRef  = useRef(null);

  useEffect(() => {
    const title = "About Us | Recipe Trending";
    const metaDesc = "Discover the story behind Recipe Trending. We're on a mission to make cooking approachable, clutter-free, and delicious for everyone.";
    
    document.title = title;

    let metaDescriptionTag = document.querySelector('meta[name="description"]');
    if (!metaDescriptionTag) {
        metaDescriptionTag = document.createElement('meta');
        metaDescriptionTag.name = "description";
        document.head.appendChild(metaDescriptionTag);
    }
    metaDescriptionTag.setAttribute('content', metaDesc);

    return () => { document.title = "Recipe Trending"; };
  });

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        heroRef.current.style.backgroundPositionY = `${50 + window.scrollY * 0.03}%`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const brand = "#CA6014";

  return (
    <>
      <style>{`
        @keyframes floatPill {
          0%,100% { transform: translateY(0px);  }
          50%      { transform: translateY(-10px); }
        }
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(32px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes spinSlow {
          from { transform: translate(-50%,-50%) rotate(0deg);   }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes spinSlowRev {
          from { transform: translate(-50%,-50%) rotate(0deg);    }
          to   { transform: translate(-50%,-50%) rotate(-360deg); }
        }
        @keyframes blobPulse {
          0%,100% { transform:scale(1);    opacity:0.55; }
          50%      { transform:scale(1.14); opacity:0.9;  }
        }
        @keyframes auroraShift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        @keyframes gridPulse {
          0%,100% { opacity:0.04; }
          50%     { opacity:0.09; }
        }
        @keyframes orbitDot {
          from { transform: translate(-50%,-50%) rotate(0deg)   translateX(200px) rotate(0deg);   }
          to   { transform: translate(-50%,-50%) rotate(360deg) translateX(200px) rotate(-360deg); }
        }
        @keyframes orbitDot2 {
          from { transform: translate(-50%,-50%) rotate(0deg)   translateX(140px) rotate(0deg);   }
          to   { transform: translate(-50%,-50%) rotate(-360deg) translateX(140px) rotate(360deg); }
        }
        .ah-chip { animation: fadeSlideUp 0.6s         ease both; }
        .ah-h1   { animation: fadeSlideUp 0.7s 0.15s   ease both; }
        .ah-sub  { animation: fadeSlideUp 0.7s 0.30s   ease both; }
        .ah-cta  { animation: fadeSlideUp 0.7s 0.45s   ease both; }
      `}</style>

      <Box
        ref={heroRef}
        sx={{
          minHeight: "110vh",
          pt: { xs: "72px", sm: "80px", md: "136px", lg: "144px" },
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          background: isDarkMode
            ? "linear-gradient(160deg,#1A0E05 0%,#1E1E1E 45%,#0F1627 100%)"
            : "linear-gradient(160deg,#FFF7EC 0%,#FFF0D8 45%,#FDF6FF 100%)",
          backgroundSize: "100% 200%",
          backgroundPositionY: "50%",
        }}
      >
        <ParticleCanvas isDarkMode={isDarkMode} />
        <Spotlight isDarkMode={isDarkMode} />
        <Box sx={{
          position: "absolute",
          top: "10%", left: "-20%",
          width: "140%", height: "35%",
          background: isDarkMode
            ? "linear-gradient(90deg, transparent, rgba(202,96,20,0.07), rgba(244,197,66,0.06), rgba(124,58,237,0.05), transparent)"
            : "linear-gradient(90deg, transparent, rgba(202,96,20,0.06), rgba(244,197,66,0.08), rgba(202,96,20,0.04), transparent)",
          backgroundSize: "300% 300%",
          animation: "auroraShift 10s ease infinite",
          filter: "blur(40px)",
          pointerEvents: "none",
          zIndex: 0,
          borderRadius: "50%",
          transform: "rotate(-8deg)",
        }} />

        <Box sx={{
          position: "absolute", inset: 0,
          backgroundImage: isDarkMode
            ? "radial-gradient(circle, rgba(202,96,20,0.35) 1px, transparent 1px)"
            : "radial-gradient(circle, rgba(202,96,20,0.22) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          animation: "gridPulse 8s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {[
          { top:"8%",  right:"6%",  w:380, delay:"0s",  dur:"7s",  color: isDarkMode ? "rgba(202,96,20,0.22)" : "rgba(202,96,20,0.13)" },
          { bottom:"10%", left:"4%", w:280, delay:"2s",  dur:"9s",  color: isDarkMode ? "rgba(244,197,66,0.10)" : "rgba(244,197,66,0.16)" },
          { top:"45%", left:"52%",  w:200, delay:"4s",  dur:"11s", color: isDarkMode ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.06)" },
        ].map((b, i) => (
          <Box key={i} sx={{
            position: "absolute",
            top: b.top, bottom: b.bottom,
            left: b.left, right: b.right,
            width: { xs: Math.round(b.w * 0.6), md: b.w },
            height: { xs: Math.round(b.w * 0.6), md: b.w },
            borderRadius: "50%",
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            animation: `blobPulse ${b.dur} ${b.delay} ease-in-out infinite`,
            pointerEvents: "none", zIndex: 0,
          }} />
        ))}

        {[
          { size: { xs:340, md:560 }, dur:"45s",  dir:"normal",  color: isDarkMode ? "rgba(202,96,20,0.13)" : "rgba(202,96,20,0.1)"  },
          { size: { xs:240, md:400 }, dur:"30s",  dir:"reverse", color: isDarkMode ? "rgba(244,197,66,0.09)" : "rgba(244,197,66,0.18)" },
          { size: { xs:140, md:240 }, dur:"20s",  dir:"normal",  color: isDarkMode ? "rgba(255,255,255,0.05)": "rgba(202,96,20,0.08)" },
        ].map((r, i) => (
          <Box key={i} sx={{
            position: "absolute",
            top: "50%", left: "50%",
            width: r.size, height: r.size,
            borderRadius: "50%",
            border: `1px dashed ${r.color}`,
            animation: `${r.dir === "normal" ? "spinSlow" : "spinSlowRev"} ${r.dur} linear infinite`,
            pointerEvents: "none", zIndex: 1,
          }} />
        ))}

        <Box sx={{
          position:"absolute", top:"50%", left:"50%",
          width:8, height:8, borderRadius:"50%",
          backgroundColor: brand,
          boxShadow: `0 0 12px 4px ${brand}80`,
          animation: "orbitDot 18s linear infinite",
          pointerEvents:"none", zIndex:1,
        }} />
        <Box sx={{
          position:"absolute", top:"50%", left:"50%",
          width:5, height:5, borderRadius:"50%",
          backgroundColor: "#F4C542",
          boxShadow: "0 0 10px 3px rgba(244,197,66,0.6)",
          animation: "orbitDot2 12s linear infinite",
          pointerEvents:"none", zIndex:1,
        }} />

        <FloatingPill emoji="🍛" label="Indian Classics" style={{ top:"18%", left:"7%",  animationDelay:"0s"   }} />
        <FloatingPill emoji="🥗" label="Healthy Bowls"   style={{ top:"30%", right:"8%", animationDelay:"1.2s" }} />
        <FloatingPill emoji="🍰" label="Sweet Treats"    style={{ bottom:"28%", left:"9%", animationDelay:"0.6s" }} />
        <FloatingPill emoji="🌮" label="World Cuisine"   style={{ bottom:"22%", right:"7%", animationDelay:"1.8s" }} />

        <Container maxWidth="md" sx={{ position:"relative", zIndex:3, textAlign:"center", py:{ xs:8, md:10 } }}>
          <div className="ah-chip">
            <Chip
              label="Who We Are"
              sx={{
                mb:4, px:1, height:36,
                backgroundColor: isDarkMode ? "rgba(202,96,20,0.15)" : "#FFF0D8",
                color: brand, fontWeight:700, fontSize:"0.8rem",
                letterSpacing:"0.8px", textTransform:"uppercase",
                border:`1px solid ${isDarkMode ? "rgba(202,96,20,0.3)" : "#F4C54280"}`,
                "& .MuiChip-label":{ fontFamily:"'Basic', sans-serif" },
              }}
            />
          </div>

          <div className="ah-h1">
            <Typography component="h1" sx={{
              fontFamily:"'Basic', sans-serif",
              fontWeight:800,
              fontSize:{ xs:"2.6rem", sm:"3.5rem", md:"4.8rem" },
              lineHeight:1.08,
              color: isDarkMode ? "#FFF7EC" : "#1A0E05",
              mb:3, letterSpacing:"-0.5px",
            }}>
              Cooking Made{" "}
              <Box component="span" sx={{
                color: brand, position:"relative", display:"inline-block",
                "&::after":{
                  content:'""', position:"absolute",
                  bottom:{ xs:-2, md:-4 }, left:0,
                  width:"100%", height:{ xs:3, md:5 },
                  backgroundColor: brand,
                  borderRadius:"4px", opacity:0.35,
                },
              }}>
                Casual.
              </Box>
              <br />
              Memories Made{" "}
              <Box component="span" sx={{ color: brand }}>Forever.</Box>
            </Typography>
          </div>

          <div className="ah-sub">
            <Typography sx={{
              fontFamily:"'Basic', sans-serif",
              fontSize:{ xs:"1rem", md:"1.2rem" },
              lineHeight:1.8,
              color: isDarkMode ? "rgba(255,247,236,0.65)" : "rgba(26,14,5,0.6)",
              maxWidth:600, mx:"auto", mb:0,
            }}>
              Recipe Trending was born from a simple belief — great food doesn&apos;t
              need to be complicated. We inspire every home cook with recipes that
              are approachable, delicious, and made with heart.
            </Typography>
          </div>
          <Box sx={{
            mt:{ xs:10, md:12 },
            display:"flex", flexDirection:"column",
            alignItems:"center", gap:0.5,
            opacity:0.4,
            animation:"floatPill 2.5s ease-in-out infinite",
          }}>
            <Typography sx={{
              fontFamily:"'Basic', sans-serif",
              fontSize:"0.72rem", letterSpacing:"2px",
              textTransform:"uppercase",
              color: isDarkMode ? "#FFF7EC" : "#1A0E05",
            }}>
              Scroll
            </Typography>
            <ArrowDownIcon sx={{ fontSize:20, color: isDarkMode ? "#FFF7EC" : "#1A0E05" }} />
          </Box>
        </Container>

        <Box sx={{
          position:"absolute", bottom:0, left:0,
          width:"100%", lineHeight:0,
          pointerEvents:"none", zIndex:2,
        }}>
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none" style={{ display:"block", width:"100%" }}>
            <path
              d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
              fill={isDarkMode ? "#1E1E1E" : "#ffffff"}
            />
          </svg>
        </Box>
      </Box>

      <Box
        id="our-mission"
        sx={{
          py: { xs: 10, md: 16 },
          backgroundColor: isDarkMode ? "#1E1E1E" : "#ffffff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              gap: { xs: 6, md: 10 },
            }}
          >
            <Box
              sx={{
                flex: 1,
                position: "relative",
                width: "100%",
                maxWidth: { xs: 450, md: "none" },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  borderRadius: "24px",
                  overflow: "hidden",
                  boxShadow: isDarkMode
                    ? "0 20px 40px rgba(0,0,0,0.4)"
                    : "0 20px 40px rgba(202,96,20,0.12)",
                  aspectRatio: "1.1 / 1",
                }}
              >
                <img
                  src={MissionImage}
                  alt="Kitchen Frustration vs. Clarity"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
              
              <Box sx={{
                position: "absolute",
                top: -20, right: -20,
                width: 80, height: 80,
                borderRadius: "50%",
                backgroundColor: `${brand}15`,
                zIndex: -1
              }} />
            </Box>

            <Box sx={{ flex: 1.2 }}>
              <Typography
                sx={{
                  fontFamily: "'Basic', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: brand,
                  textTransform: "uppercase",
                  letterSpacing: "2.5px",
                  mb: 2,
                }}
              >
                Our Mission
              </Typography>
              
              <Typography
                variant="h2"
                sx={{
                  fontFamily: "'Basic', sans-serif",
                  fontWeight: 800,
                  fontSize: { xs: "2.2rem", md: "3rem" },
                  color: isDarkMode ? "#FFF7EC" : "#1A0E05",
                  mb: 4,
                  lineHeight: 1.1,
                }}
              >
                Focusing on the <Box component="span" sx={{ color: brand }}>Ingredients</Box>, Not the Clutter.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
                <Box sx={{ display: "flex", gap: 2.5 }}>
                  <Box sx={{ 
                    minWidth: 4, 
                    borderRadius: 2, 
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)" 
                  }} />
                  <Typography sx={{ 
                    fontFamily: "'Basic', sans-serif", 
                    fontSize: { xs: "1rem", md: "1.15rem" }, 
                    lineHeight: 1.6,
                    color: isDarkMode ? "rgba(255,247,236,0.5)" : "rgba(26,14,5,0.5)"
                  }}>
                    Most recipe websites are overwhelming—buried in endless stories and intrusive ads.
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2.5 }}>
                  <Box sx={{ 
                    minWidth: 4, 
                    borderRadius: 2, 
                    bgcolor: brand,
                    opacity: 0.6
                  }} />
                  <Typography sx={{ 
                    fontFamily: "'Basic', sans-serif", 
                    fontSize: { xs: "1.1rem", md: "1.2rem" }, 
                    lineHeight: 1.6,
                    fontWeight: 600,
                    color: isDarkMode ? "#FFF7EC" : "#1A0E05"
                  }}>
                    Cooking shouldn&apos;t require scrolling. It should be an effortless escape from the day&apos;s chaos.
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2.5 }}>
                  <Box sx={{ 
                    minWidth: 4, 
                    borderRadius: 2, 
                    bgcolor: brand
                  }} />
                  <Typography sx={{ 
                    fontFamily: "'Basic', sans-serif", 
                    fontSize: { xs: "1.1rem", md: "1.2rem" }, 
                    lineHeight: 1.6,
                    color: brand,
                    fontWeight: 700
                  }}>
                    We built a clean, structured platform where usability is the priority, so you can focus on flavor.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
      <Box
        id="usp-section"
        sx={{
          py: { xs: 10, md: 16 },
          backgroundColor: isDarkMode ? "#1A1A1A" : "#FDF8F3",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{
          position: "absolute",
          top: "50%", left: "50%",
          width: "120%", height: "120%",
          background: isDarkMode 
            ? "radial-gradient(circle, rgba(202,96,20,0.03) 0%, transparent 60%)"
            : "radial-gradient(circle, rgba(202,96,20,0.04) 0%, transparent 60%)",
          transform: "translate(-50%, -50%)",
          zIndex: 0,
          pointerEvents: "none"
        }} />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ textAlign: "center", mb: { xs: 6, md: 10 } }}>
            <Typography
              sx={{
                fontFamily: "'Basic', sans-serif",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: brand,
                textTransform: "uppercase",
                letterSpacing: "2.5px",
                mb: 2,
              }}
            >
              The Experience
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontFamily: "'Basic', sans-serif",
                fontWeight: 800,
                fontSize: { xs: "2.2rem", md: "3rem" },
                color: isDarkMode ? "#FFF7EC" : "#1A0E05",
                lineHeight: 1.1,
              }}
            >
              What Makes Us Different
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
              gap: 4,
            }}
          >
            {[
              {
                icon: <SearchIcon />,
                title: "Smart Search",
                desc: "Find exact recipes based on the ingredients you already have in your kitchen."
              },
              {
                icon: <HierarchyIcon />,
                title: "Clear Hierarchy",
                desc: "Navigate logically through structured categories to discover your next favorite meal."
              },
              {
                icon: <BookmarkIcon />,
                title: "Save Favorites",
                desc: "Organize your preferred dishes into a personal collection for quick future access."
              },
              {
                icon: <SparklesIcon />,
                title: "Clean Interface",
                desc: "Cook without distractions on a platform designed for focus and aesthetic clarity."
              }
            ].map((usp, i) => (
              <Box
                key={i}
                sx={{
                  p: 4,
                  height: "100%",
                  borderRadius: "24px",
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#ffffff",
                  border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(202,96,20,0.1)"}`,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 2.5,
                  "&:hover": {
                    transform: "translateY(-8px)",
                    borderColor: brand,
                    boxShadow: isDarkMode 
                      ? `0 12px 32px rgba(0,0,0,0.4), 0 0 20px ${brand}15`
                      : `0 12px 32px rgba(202,96,20,0.08)`,
                    "& .usp-icon-box": {
                      bgcolor: brand,
                      color: "#fff"
                    }
                  }
                }}
              >
                <Box
                  className="usp-icon-box"
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isDarkMode ? "rgba(202,96,20,0.12)" : `${brand}08`,
                    color: brand,
                    transition: "all 0.3s ease",
                    "& svg": { fontSize: 28 }
                  }}
                >
                  {usp.icon}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "'Basic', sans-serif",
                      fontWeight: 800,
                      fontSize: "1.25rem",
                      color: isDarkMode ? "#FFF7EC" : "#1A0E05",
                      mb: 1.5,
                    }}
                  >
                    {usp.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "'Basic', sans-serif",
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      color: isDarkMode ? "rgba(255,247,236,0.6)" : "rgba(26,14,5,0.6)",
                    }}
                  >
                    {usp.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Box
        id="who-we-serve"
        sx={{
          py: { xs: 10, md: 16 },
          backgroundColor: isDarkMode ? "#1E1E1E" : "#ffffff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: { xs: 6, md: 8 }, textAlign: { xs: "center", md: "left" } }}>
            <Typography
              sx={{
                fontFamily: "'Basic', sans-serif",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: brand,
                textTransform: "uppercase",
                letterSpacing: "2.5px",
                mb: 2,
              }}
            >
              Our Community
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontFamily: "'Basic', sans-serif",
                fontWeight: 800,
                fontSize: { xs: "2.2rem", md: "3rem" },
                color: isDarkMode ? "#FFF7EC" : "#1A0E05",
                lineHeight: 1.1,
                maxWidth: 600,
              }}
            >
              Built for Those Who Value <Box component="span" sx={{ color: brand }}>Intentional</Box> Cooking.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 4,
            }}
          >
            {[
              {
                icon: <WorkIcon />,
                title: "Busy Professionals",
                desc: "High standards, low bandwidth. We provide quality meals that fit into your tight schedule."
              },
              {
                icon: <SchoolIcon />,
                title: "Active Students",
                desc: "Bridge the gap between instant noodles and proper home cooking with budget-friendly, fast meals."
              },
              {
                icon: <SimplicityIcon />,
                title: "Simplicity Seekers",
                desc: "Home cooks who value ego-free cooking. Clear steps, zero jargon, and reliable results every time."
              },
              {
                icon: <SpeedIcon />,
                title: "Efficiency Lovers",
                desc: "For people who start with ingredients, not life stories. We focus on discovery, not blog essays."
              }
            ].map((audience, i) => (
              <Box
                key={i}
                  sx={{
                    display: "flex",
                    gap: 3,
                    alignItems: "flex-start",
                    p: 4,
                    borderRadius: "24px",
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.45)",
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(202,96,20,0.12)"}`,
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)",
                      borderColor: brand,
                      boxShadow: isDarkMode 
                        ? `0 20px 40px rgba(0,0,0,0.4), 0 0 20px ${brand}15`
                        : `0 20px 40px rgba(202,96,20,0.08)`,
                    }
                  }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    minWidth: 48,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isDarkMode ? "rgba(202,96,20,0.1)" : `${brand}08`,
                    color: brand,
                    "& svg": { fontSize: 24 }
                  }}
                >
                  {audience.icon}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "'Basic', sans-serif",
                      fontWeight: 800,
                      fontSize: "1.4rem",
                      color: isDarkMode ? "#FFF7EC" : "#1A0E05",
                      mb: 1,
                    }}
                  >
                    {audience.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "'Basic', sans-serif",
                      fontSize: "1.05rem",
                      lineHeight: 1.6,
                      color: isDarkMode ? "rgba(255,247,236,0.55)" : "rgba(26,14,5,0.55)",
                      maxWidth: 400,
                    }}
                  >
                    {audience.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Box
        id="final-cta"
        sx={{
          py: { xs: 12, md: 20 },
          backgroundColor: isDarkMode ? "#1A1A1A" : "#FDF8F3",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{
          position: "absolute",
          top: "50%", left: "50%",
          width: "120%", height: "120%",
          background: isDarkMode 
            ? "radial-gradient(circle, rgba(202,96,20,0.03) 0%, transparent 60%)"
            : "radial-gradient(circle, rgba(202,96,20,0.04) 0%, transparent 60%)",
          transform: "translate(-50%, -50%)",
          zIndex: 0,
          pointerEvents: "none"
        }} />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: "'Basic', sans-serif",
              fontWeight: 800,
              fontSize: { xs: "2.5rem", md: "4rem" },
              color: isDarkMode ? "#FFF7EC" : "#1A0E05",
              mb: 3,
              lineHeight: 1.1,
            }}
          >
            Ready to find your <br /> next <Box component="span" sx={{ color: brand }}>craving?</Box>
          </Typography>
          
          <Typography
            sx={{
              fontFamily: "'Basic', sans-serif",
              fontSize: { xs: "1.1rem", md: "1.25rem" },
              color: isDarkMode ? "rgba(255,247,236,0.6)" : "rgba(26,14,5,0.6)",
              mb: 6,
              maxWidth: 500,
              mx: "auto",
            }}
          >
            Skip the stories. Focus on the flavor. Start your refined cooking experience today.
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <Box
              onClick={() => router.push("/")}
              sx={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                px: 5,
                py: 2,
                borderRadius: "16px",
                background: `linear-gradient(135deg, ${brand} 0%, #E07520 100%)`,
                color: "#fff",
                fontFamily: "'Basic', sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                textDecoration: "none",
                boxShadow: `0 8px 32px rgba(202,96,20,0.3)`,
                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                "&:hover": {
                  transform: "scale(1.05) translateY(-5px)",
                  boxShadow: `0 12px 48px rgba(202,96,20,0.5)`,
                },
              }}
            >
              <RestaurantIcon sx={{ fontSize: 20 }} />
              Explore Recipes
            </Box>
          </Box>
        </Container>
      </Box>


    </>
  );
};

export default AboutUs;

