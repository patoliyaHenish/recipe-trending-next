"use client";
import React, { useEffect, useRef } from "react";
import { Container, Typography, Box, Divider, Stack, Paper, Chip } from "@mui/material";
import { useTheme } from "../../context/ThemeContext";
import { 
  VerifiedUser as ShieldIcon, 
  Lock as LockIcon, 
  Info as InfoIcon,
  Copyright as CopyrightIcon,
  Gavel as GavelIcon,
  Balance as BalanceIcon,
  Link as LinkIcon,
  Update as UpdateIcon,
  MailOutlined as MailIcon,
  KeyboardArrowDown as ArrowDownIcon,
  PostAdd as PostIcon,
  WarningAmber as WarningIcon,
  Block as BlockIcon
} from "@mui/icons-material";

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
        const dotColor = "rgba(202,96,20,";
        const lineColor = isDarkMode ? "rgba(244,197,66," : "rgba(202,96,20,";

        const particles = Array.from({ length: COUNT }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 2 + 1,
        }));

        const resize = () => {
            W = canvas.width = canvas.offsetWidth;
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
            spotRef.current.style.top = `${e.clientY}px`;
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

const Section = ({ title, icon, children, isDarkMode }) => (
  <Box sx={{ mb: 1, position: 'relative' }}>
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{ 
            p: 1.2, 
            borderRadius: '12px', 
            bgcolor: isDarkMode ? "rgba(202,96,20,0.15)" : "rgba(202,96,20,0.1)",
            color: "#CA6014",
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            {icon}
        </Box>
        <Typography 
            variant="h5" 
            sx={{ 
                fontFamily: "'Basic', sans-serif", 
                fontWeight: 800, 
                color: isDarkMode ? "#FFF7EC" : "#1A0E05",
                fontSize: { xs: '1.2rem', md: '1.4rem' }
            }}
        >
            {title}
        </Typography>
    </Stack>
    <Box 
        sx={{ 
            fontFamily: "'Basic', sans-serif",
            color: isDarkMode ? "rgba(255,247,236,0.65)" : "rgba(26,14,5,0.65)",
            lineHeight: 1.8,
            pl: { xs: 0, md: 7.2 },
            fontSize: '1rem',
            '& p': { mb: 2 },
            '& ul': { mb: 2, pl: 2, listStyleType: 'disc' },
            '& li': { mb: 1 }
        }}
    >
      {children}
    </Box>
  </Box>
);

const TermsAndConditions = () => {
    const { isDarkMode } = useTheme();
    const brand = "#CA6014";

    useEffect(() => {
        const title = "Terms & Conditions | Recipe Trending";
        const metaDesc = "Terms and Conditions for using Recipe Trending. Our legal agreement regarding your use of our platform and recipes.";
        document.title = title;
        let metaDescriptionTag = document.querySelector('meta[name="description"]');
        if (!metaDescriptionTag) {
            metaDescriptionTag = document.createElement('meta');
            metaDescriptionTag.name = "description";
            document.head.appendChild(metaDescriptionTag);
        }
        metaDescriptionTag.setAttribute('content', metaDesc);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return () => { document.title = "Recipe Trending"; };
    }, []);

  return (
    <Box sx={{ bgcolor: isDarkMode ? "#1E1E1E" : "#ffffff", minHeight: '100vh' }}>
        <style>{`
            @keyframes floatPill {
                0%,100% { transform: translateY(0px); }
                50%      { transform: translateY(-10px); }
            }
            @keyframes fadeSlideUp {
                from { opacity:0; transform:translateY(32px); }
                to   { opacity:1; transform:translateY(0);    }
            }
            @keyframes auroraShift {
                0%   { background-position: 0%   50%; }
                50%  { background-position: 100% 50%; }
                100% { background-position: 0%   50%; }
            }
            @keyframes spinSlow {
                from { transform: translate(-50%,-50%) rotate(0deg); }
                to   { transform: translate(-50%,-50%) rotate(360deg); }
            }
            @keyframes spinSlowRev {
                from { transform: translate(-50%,-50%) rotate(0deg); }
                to   { transform: translate(-50%,-50%) rotate(-360deg); }
            }
            @keyframes blobPulse {
                0%,100% { transform:scale(1); opacity:0.55; }
                50%     { transform:scale(1.14); opacity:0.9; }
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
            .ah-chip { animation: fadeSlideUp 0.6s ease both; }
            .ah-h1   { animation: fadeSlideUp 0.7s 0.15s ease both; }
            .ah-sub  { animation: fadeSlideUp 0.7s 0.30s ease both; }
            .ah-paper { animation: fadeSlideUp 0.8s 0.45s ease both; }
            .ah-scroll { animation: floatPill 2.5s ease-in-out infinite; }
        `}</style>

        <Box sx={{
            minHeight: "110vh",
            pt: { xs: "72px", sm: "80px", md: "136px", lg: "144px" },
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            background: isDarkMode
                ? "linear-gradient(160deg,#1A0E05 0%,#1E1E1E 45%,#0F1627 100%)"
                : "linear-gradient(160deg,#FFF7EC 0%,#FFF0D8 45%,#FDF6FF 100%)",
        }}>
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

            <FloatingPill emoji="⚖️" label="Legal Rights" style={{ top:"18%", left:"7%",  animationDelay:"0s"   }} />
            <FloatingPill emoji="👤" label="User Terms" style={{ top:"30%", right:"8%", animationDelay:"1.2s" }} />
            <FloatingPill emoji="📄" label="Fair Usage"  style={{ bottom:"28%", left:"9%", animationDelay:"0.6s" }} />
            <FloatingPill emoji="🤝" label="Agreements"    style={{ bottom:"22%", right:"7%", animationDelay:"1.8s" }} />

            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 3, textAlign: 'center', py:{ xs:8, md:10 } }}>
                <div className="ah-chip">
                    <Chip
                        label="Usage & Compliance"
                        sx={{
                            mb: 4, px: 1, height: 36,
                            backgroundColor: isDarkMode ? "rgba(202,96,20,0.15)" : "#FFF0D8",
                            color: brand, fontWeight: 700, fontSize: "0.8rem",
                            letterSpacing: "0.8px", textTransform: "uppercase",
                            border: `1px solid ${isDarkMode ? "rgba(202,96,20,0.3)" : "#F4C54280"}`,
                            "& .MuiChip-label": { fontFamily: "'Basic', sans-serif" },
                        }}
                    />
                </div>
                <div className="ah-h1">
                    <Typography
                        variant="h1"
                        sx={{
                            fontFamily: "'Basic', sans-serif",
                            fontWeight: 800,
                            fontSize:{ xs:"2.8rem", sm:"4rem", md:"5.2rem" },
                            lineHeight: 1.08,
                            mb: 3,
                            color: isDarkMode ? "#FFF7EC" : "#1A0E05",
                            letterSpacing: "-1.5px",
                        }}
                    >
                        Terms & <Box component="span" sx={{ color: brand }}>Conditions</Box>
                    </Typography>
                </div>
                <div className="ah-sub">
                    <Typography
                        sx={{
                            fontFamily: "'Basic', sans-serif",
                            fontSize: { xs: "1rem", md: "1.2rem" },
                            lineHeight: 1.8,
                            color: isDarkMode ? "rgba(255,247,236,0.65)" : "rgba(26,14,5,0.6)",
                            maxWidth: 700, mx: 'auto', mb: 2
                        }}
                    >
                        By accessing Recipe Trending, you join a community of culinary enthusiasts. These terms ensure a safe and respectful environment for everyone.
                    </Typography>
                </div>

                <Box className="ah-scroll" sx={{
                    mt: { xs: 8, md: 10 },
                    display:"flex", flexDirection:"column",
                    alignItems:"center", gap:0.5,
                    opacity:0.4,
                }}>
                    <Typography sx={{
                      fontFamily:"'Basic', sans-serif",
                      fontSize:"0.72rem", letterSpacing:"2px",
                      textTransform:"uppercase",
                      color: isDarkMode ? "#FFF7EC" : "#1A0E05",
                    }}>
                      Scroll
                    </Typography>
                    <ArrowDownIcon sx={{ fontSize:22, color: isDarkMode ? "#FFF7EC" : "#1A0E05" }} />
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

        <Box sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 4, mt: -10 }}>
            <Container maxWidth="md">
                <div className="ah-paper">
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: { xs: 4, md: 8 },
                            borderRadius: '40px',
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#ffffff",
                            backdropFilter: 'blur(16px)',
                            border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(202,96,20,0.12)"}`,
                            boxShadow: isDarkMode 
                                ? "0 32px 64px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)" 
                                : "0 32px 64px rgba(202,96,20,0.08)",
                        }}
                    >
                        <Section title="1. Use of Website" icon={<ShieldIcon />} isDarkMode={isDarkMode}>
                            <p>You agree to use this website only for lawful purposes. You must not:</p>
                            <ul>
                                <li>Use the site in any way that may damage or disrupt the website</li>
                                <li>Attempt unauthorized access to any part of the website</li>
                                <li>Use the website for fraudulent or harmful activities</li>
                            </ul>
                        </Section>

                        <Divider sx={{ my: 4, opacity: 0.1 }} />

                        <Section title="2. Intellectual Property Rights" icon={<CopyrightIcon />} isDarkMode={isDarkMode}>
                            <p>All content on this website, including recipes, text, images, logos, and design, is the property of <strong>Recipe Trending</strong>, unless otherwise stated.</p>
                            <p><strong>You may:</strong></p>
                            <ul>
                                <li>View and print content for personal use only</li>
                            </ul>
                            <p><strong>You may NOT:</strong></p>
                            <ul>
                                <li>Copy, reproduce, or republish content without permission</li>
                                <li>Use content for commercial purposes</li>
                            </ul>
                        </Section>

                        <Divider sx={{ my: 4, opacity: 0.1 }} />

                        <Section title="3. User-Generated Content" icon={<PostIcon />} isDarkMode={isDarkMode}>
                            <p>If you submit content (comments, recipes, reviews):</p>
                            <ul>
                                <li>You grant us a non-exclusive, royalty-free license to use, modify, and display that content</li>
                                <li>You confirm that the content does not violate any laws or third-party rights</li>
                            </ul>
                            <p>We reserve the right to remove any content without notice.</p>
                        </Section>

                        <Divider sx={{ my: 4, opacity: 0.1 }} />

                        <Section title="4. Disclaimer" icon={<WarningIcon />} isDarkMode={isDarkMode}>
                            <p>All recipes and information provided on this website are for general informational purposes only.</p>
                            <p><strong>We do not guarantee:</strong></p>
                            <ul>
                                <li>Accuracy of recipes</li>
                                <li>Nutritional values</li>
                                <li>Results of any recipe</li>
                            </ul>
                            <p>Use the information at your own risk.</p>
                        </Section>

                        <Divider sx={{ my: 4, opacity: 0.1 }} />

                        <Section title="5. Limitation of Liability" icon={<GavelIcon />} isDarkMode={isDarkMode}>
                            <p>Recipe Trending will not be held liable for:</p>
                            <ul>
                                <li>Any loss or damage resulting from use of the website</li>
                                <li>Errors or omissions in content</li>
                                <li>Any issues arising from third-party links or services</li>
                            </ul>
                        </Section>

                        <Divider sx={{ my: 4, opacity: 0.1 }} />

                        <Section title="6. Third-Party Services" icon={<InfoIcon />} isDarkMode={isDarkMode}>
                            <p>This website may use third-party services such as:</p>
                            <ul>
                                <li>Google AdSense (for ads)</li>
                                <li>Google Analytics (for analytics)</li>
                            </ul>
                            <p>These services may collect data as per their own policies. We are not responsible for their practices.</p>
                        </Section>

                        <Divider sx={{ my: 4, opacity: 0.1 }} />

                        <Section title="7. External Links" icon={<LinkIcon />} isDarkMode={isDarkMode}>
                            <p>Our website may contain links to external websites. We do not control or endorse these websites and are not responsible for their content.</p>
                        </Section>

                        <Divider sx={{ my: 4, opacity: 0.1 }} />

                        <Section title="8. Termination" icon={<BlockIcon />} isDarkMode={isDarkMode}>
                            <p>We reserve the right to:</p>
                            <ul>
                                <li>Suspend or terminate access to the website at any time</li>
                                <li>Remove any content without prior notice</li>
                            </ul>
                        </Section>

                        <Divider sx={{ my: 4, opacity: 0.1 }} />

                        <Section title="9. Changes to Terms" icon={<UpdateIcon />} isDarkMode={isDarkMode}>
                            <p>We may update these Terms and Conditions at any time. Changes will be posted on this page with an updated date.</p>
                        </Section>

                        <Divider sx={{ my: 4, opacity: 0.1 }} />

                        <Section title="10. Governing Law" icon={<BalanceIcon />} isDarkMode={isDarkMode}>
                            <p>These Terms shall be governed by and interpreted in accordance with the laws of India.</p>
                        </Section>

                        <Divider sx={{ my: 4, opacity: 0.1 }} />

                        <Section title="11. Contact Information" icon={<MailIcon />} isDarkMode={isDarkMode}>
                            <p>If you have any questions about these Terms, you can contact us at:</p>
                            <Box 
                                component="a" 
                                href="mailto:support@recipetrending.com"
                                sx={{ 
                                    color: brand, 
                                    fontWeight: 700, 
                                    textDecoration: 'none',
                                    mt: 1, display: 'inline-block',
                                    fontSize: '1.2rem'
                                }}
                            >
                                support@recipetrending.com
                            </Box>
                        </Section>

                        <Divider sx={{ my: 6, opacity: 0.1 }} />
                        
                        <Typography sx={{ 
                            fontFamily: "'Basic', sans-serif", 
                            fontSize: "0.9rem", 
                            color: isDarkMode ? "rgba(255,247,236,0.4)" : "rgba(26,14,5,0.4)",
                            textAlign: 'center'
                        }}>
                            By using this website, you acknowledge that you have read and understood these Terms and Conditions.
                        </Typography>
                    </Paper>
                </div>
            </Container>
        </Box>
    </Box>
  );
};

export default TermsAndConditions;

