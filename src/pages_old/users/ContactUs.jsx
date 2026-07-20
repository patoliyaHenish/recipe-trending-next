"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Box, 
    Typography, 
    Container, 
    TextField, 
    MenuItem, 
    Button, 
    Paper,
    Stack,
    InputAdornment,
    Fade,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip
} from '@mui/material';
import { 
    PersonOutlined as PersonIcon, 
    EmailOutlined as EmailIcon, 
    ChatBubbleOutlined as MessageIcon,
    Subject as SubjectIcon,
    Send as SendIcon,
    ExpandMore as ExpandMoreIcon,
    HelpOutlined as HelpIcon,
    Home as HomeIcon,
    KeyboardArrowDown as ArrowDownIcon,
    Restaurant as RestaurantIcon,
    CategoryRounded as CategoryIcon
} from '@mui/icons-material';
import { useSubmitContactMutation } from '../../features/api/contactApi';
import { useTheme } from '../../context/ThemeContext';
import { toast } from '../../utils/toast';
import FaqImage from "../../assets/contact_faq_support.png";
import FormHeaderImage from "../../assets/contact_form_feedback.png";

const subjects = [
    'General Question',
    'New Recipe Suggestion',
    'Report an Issue',
    'Business / Collaboration',
    'Other'
];

const faqs = [
    {
        q: "How do I search for recipes?",
        a: "You can search by recipe name or by ingredients using the search bar on our discovery pages."
    },
    {
        q: "How do I save recipes?",
        a: "Click the save (heart) icon on any recipe card to add it to your personal favorites for quick access later."
    },
    {
        q: "Can I suggest a recipe?",
        a: "Yes! Use the 'New Recipe Suggestion' option in the subject line of the contact form above."
    },
    {
        q: "I found an error in a recipe. What should I do?",
        a: "Please select 'Report an Issue' in the contact form and describe the problem so our culinary team can fix it."
    },
    {
        q: "Do you accept brand collaborations?",
        a: "Yes! Select 'Business / Collaboration' in the contact form to connect with our outreach team."
    }
];

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

const ContactUs = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const [submitContact, { isLoading }] = useSubmitContactMutation();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [subjectOpen, setSubjectOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await submitContact(formData).unwrap();
            setSubmitted(true);
            setFormData({
                full_name: '',
                email: '',
                subject: '',
                message: ''
            });
        } catch (err) {
            toast.error(err.data?.message || 'Failed to send message.');
        }
    };

    const brand = "#CA6014";

    useEffect(() => {
        const title = "Contact Us | Recipe Trending";
        const metaDesc = "Have questions or feedback? Contact the Recipe Trending team. We're here to help you on your culinary journey.";
        
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
        const handleScroll = () => { setSubjectOpen(false); };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => { window.removeEventListener('scroll', handleScroll); };
    }, []);

    return (
        <Box sx={{ bgcolor: isDarkMode ? "#1E1E1E" : "#ffffff", minHeight: '100vh' }}>
            <style>{`
                @keyframes floatPill {
                    0%,100% { transform: translateY(0px);  }
                    50%      { transform: translateY(-10px); }
                }
                @keyframes fadeSlideUp {
                    from { opacity:0; transform:translateY(32px); }
                    to   { opacity:1; transform:translateY(0);    }
                }
                @keyframes fadeSlideDown {
                    from { opacity:0; transform:translateY(-20px) scale(0.97); }
                    to   { opacity:1; transform:translateY(0)     scale(1);    }
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
                @keyframes shimmerEffect {
                    0% { background-position: -400px 0; }
                    100% { background-position: 400px 0; }
                }
                @keyframes checkPop {
                    0%   { transform: scale(0); opacity: 0; }
                    60%  { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .ah-chip { animation: fadeSlideUp 0.6s         ease both; }
                .ah-h1   { animation: fadeSlideUp 0.7s 0.15s   ease both; }
                .ah-sub  { animation: fadeSlideUp 0.7s 0.30s   ease both; }
                .ah-form  { animation: fadeSlideUp 0.8s 0.45s   ease both; }
                .success-panel { animation: fadeSlideDown 0.5s ease both; }
                .check-icon    { animation: checkPop 0.5s 0.3s  ease both; opacity: 0; }
            `}</style>
            
            <Box sx={{
                minHeight: '110vh',
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

                <FloatingPill emoji="📧" label="Active Support" style={{ top: "18%", left: "7%", animationDelay: "0s" }} />
                <FloatingPill emoji="💡" label="Recipe Feedback" style={{ top: "30%", right: "8%", animationDelay: "1.2s" }} />
                <FloatingPill emoji="🤝" label="Collaborations" style={{ bottom: "28%", left: "9%", animationDelay: "0.6s" }} />
                <FloatingPill emoji="✨" label="Feature Requests" style={{ bottom: "22%", right: "7%", animationDelay: "1.8s" }} />

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3, textAlign: 'center', py: { xs: 8, md: 10 } }}>
                    <div className="ah-chip">
                        <Chip
                            label="Get In Touch"
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
                                fontSize:{ xs:"2.6rem", sm:"3.5rem", md:"4.8rem" },
                                lineHeight: 1.08,
                                mb: 4,
                                color: isDarkMode ? "#FFF7EC" : "#1A0E05",
                                letterSpacing: "-0.5px",
                            }}
                        >
                            We&apos;d love to hear from <br /> 
                            <Box component="span" sx={{ color: brand }}>you.</Box>
                        </Typography>
                    </div>
                    <div className="ah-sub">
                        <Typography
                            sx={{
                                fontFamily: "'Basic', sans-serif",
                                fontSize: { xs: "1rem", md: "1.2rem" },
                                lineHeight: 1.8,
                                color: isDarkMode ? "rgba(255,247,236,0.65)" : "rgba(26,14,5,0.6)",
                                maxWidth: 600, mx: 'auto'
                            }}
                        >
                            Have a question, a recipe suggestion, an issue to report, a business inquiry, or just want to say hi?
                            Fill out the form and our team will get back to you personally within 24 hours.
                        </Typography>
                    </div>

                    <Box sx={{
                        mt:{ xs:6, md:8 },
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
                    position: "absolute", bottom: 0, left: 0,
                    width: "100%", lineHeight: 0,
                    pointerEvents: "none", zIndex: 2,
                }}>
                    <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none" style={{ display: "block", width: "100%" }}>
                        <path
                            d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
                            fill={isDarkMode ? "#1E1E1E" : "#ffffff"}
                        />
                    </svg>
                </Box>
            </Box>

            <Box sx={{ py: { xs: 8, md: 12 }, position: 'relative' }}>
                <Container maxWidth="lg">
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column-reverse', md: 'row' },
                        alignItems: 'center',
                        gap: { xs: 6, md: 10 },
                        mb: { xs: 12, md: 16 }
                    }}>
                        <Box sx={{ flex: { xs: '1 1 auto', md: '1.5' }, width: '100%', maxWidth: { md: '650px' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                                <HelpIcon sx={{ color: brand, fontSize: 28 }} />
                                <Typography variant="h5" sx={{ fontFamily: "'Basic', sans-serif", fontWeight: 800, color: isDarkMode ? "#FFF7EC" : "#1A0E05" }}>
                                    Quick Answers
                                </Typography>
                            </Box>
                            
                            {faqs.map((faq, index) => (
                                <Accordion 
                                    key={index}
                                    elevation={0}
                                    sx={{ 
                                        mb: 2,
                                        bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                                        backdropFilter: 'blur(8px)',
                                        '&:before': { display: 'none' },
                                        border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                                        borderRadius: '20px !important',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            borderColor: brand,
                                            bgcolor: isDarkMode ? "rgba(202,96,20,0.08)" : "rgba(202,96,20,0.03)",
                                            transform: 'translateY(-2px)',
                                            boxShadow: isDarkMode ? `0 10px 20px rgba(0,0,0,0.2)` : `0 10px 20px ${brand}10`
                                        }
                                    }}
                                >
                                    <AccordionSummary 
                                        expandIcon={<ExpandMoreIcon sx={{ color: brand }} />}
                                        sx={{ 
                                            px: 3,
                                            py: 0.5,
                                            '& .MuiAccordionSummary-content': { my: 1.5 }
                                        }}
                                    >
                                        <Typography sx={{ 
                                            fontFamily: "'Basic', sans-serif", 
                                            fontWeight: 700, 
                                            fontSize: '1rem',
                                            color: isDarkMode ? "#FFF7EC" : "#2B2828"
                                        }}>
                                            {faq.q}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                                        <Typography sx={{ 
                                            fontFamily: "'Basic', sans-serif", 
                                            fontSize: '0.95rem',
                                            lineHeight: 1.7,
                                            color: isDarkMode ? "rgba(255,247,236,0.6)" : "rgba(26,14,5,0.6)"
                                        }}>
                                            {faq.a}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box>

                        <Box sx={{ flex: { xs: '1 1 auto', md: '1' }, display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Box sx={{ 
                                borderRadius: '32px', 
                                overflow: 'hidden', 
                                maxWidth: '380px',
                                width: '100%',
                                border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                                transform: { md: 'rotate(2deg)' },
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: { md: 'rotate(0deg)' } }
                            }}>
                                <img 
                                    src={FaqImage} 
                                    alt="FAQ Support" 
                                    style={{ width: '100%', height: 'auto', display: 'block' }} 
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: 'center',
                        gap: { xs: 6, md: 10 }
                    }}>
                        <Box sx={{ flex: { xs: '1 1 auto', md: '1' }, display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Box sx={{ 
                                borderRadius: '32px', 
                                overflow: 'hidden', 
                                border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                                width: '100%',
                                maxWidth: '380px'
                            }}>
                                <img 
                                    src={FormHeaderImage} 
                                    alt="Kitchen Inspiration" 
                                    style={{ width: '100%', height: 'auto', display: 'block' }} 
                                />
                            </Box>
                        </Box>

                        <Box sx={{ flex: { xs: '1 1 auto', md: '1.5' }, width: '100%' }}>
                            <div className="ah-form">
                                <Paper 
                                    elevation={0}
                                    sx={{ 
                                        p: { xs: 4, md: 6 },
                                        borderRadius: '32px',
                                        bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#ffffff",
                                        backdropFilter: 'blur(16px)',
                                        border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(202,96,20,0.12)"}`,
                                        boxShadow: isDarkMode 
                                            ? "0 24px 64px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)" 
                                            : "0 24px 48px rgba(202,96,20,0.08)",
                                        overflow: 'hidden',
                                        position: 'relative',
                                        '&::before': isDarkMode ? {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, height: '1px',
                                            background: `linear-gradient(90deg, transparent, ${brand}40, transparent)`,
                                            zIndex: 1
                                        } : {}
                                    }}
                                >
                                    {!submitted && (
                                        <Box sx={{ mb: 4 }}>
                                            <Typography variant="h4" sx={{ fontFamily: "'Basic', sans-serif", fontWeight: 800, color: isDarkMode ? "#FFF7EC" : "#1A0E05", mb: 2 }}>
                                                Send a Message
                                            </Typography>
                                            <Typography sx={{ fontFamily: "'Basic', sans-serif", color: isDarkMode ? "rgba(255,247,236,0.6)" : "rgba(26,14,5,0.6)" }}>
                                                We typically respond to all inquiries within 24 hours.
                                            </Typography>
                                        </Box>
                                    )}

                                    {submitted && (
                                        <Box
                                            className="success-panel"
                                            sx={{
                                                mb: 4,
                                                p: 3,
                                                borderRadius: '20px',
                                                background: isDarkMode
                                                    ? 'linear-gradient(135deg, rgba(202,96,20,0.15) 0%, rgba(244,197,66,0.08) 100%)'
                                                    : 'linear-gradient(135deg, rgba(202,96,20,0.08) 0%, rgba(244,197,66,0.06) 100%)',
                                                border: `1.5px solid ${isDarkMode ? 'rgba(202,96,20,0.4)' : 'rgba(202,96,20,0.25)'}`,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                textAlign: 'center',
                                                gap: 1.5,
                                            }}
                                        >
                                            <Box
                                                className="check-icon"
                                                sx={{
                                                    width: 56, height: 56,
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, #CA6014, #E07520)`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 8px 24px rgba(202,96,20,0.35)',
                                                }}
                                            >
                                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </Box>
                                            <Typography sx={{ fontFamily: "'Basic', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: isDarkMode ? '#FFF7EC' : '#1A0E05' }}>
                                                Message Sent!
                                            </Typography>
                                            <Typography sx={{ fontFamily: "'Basic', sans-serif", fontSize: '0.9rem', color: isDarkMode ? 'rgba(255,247,236,0.65)' : 'rgba(26,14,5,0.6)', lineHeight: 1.6 }}>
                                                Thanks for reaching out. We'll get back to you within 24 hours.
                                            </Typography>
                                            <Button
                                                size="small"
                                                onClick={() => setSubmitted(false)}
                                                sx={{
                                                    mt: 0.5,
                                                    fontFamily: "'Basic', sans-serif",
                                                    fontWeight: 600,
                                                    fontSize: '0.82rem',
                                                    color: '#CA6014',
                                                    textTransform: 'none',
                                                    border: '1px solid rgba(202,96,20,0.35)',
                                                    borderRadius: '10px',
                                                    px: 2, py: 0.5,
                                                    '&:hover': { bgcolor: 'rgba(202,96,20,0.08)', borderColor: '#CA6014' }
                                                }}
                                            >
                                                Send another message
                                            </Button>
                                        </Box>
                                    )}

                                    {!submitted && (
                                    <form onSubmit={handleSubmit}>
                                        <Stack spacing={3}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                flexDirection: { xs: 'column', sm: 'row' }, 
                                                gap: 3 
                                            }}>
                                                <TextField
                                                    fullWidth
                                                    label="Full Name"
                                                    name="full_name"
                                                    placeholder="Enter your full name"
                                                    value={formData.full_name}
                                                    onChange={handleChange}
                                                    required
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '16px',
                                                            bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                            '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)' },
                                                            '&:hover fieldset': { borderColor: brand },
                                                            '&.Mui-focused fieldset': { 
                                                                borderColor: brand,
                                                                boxShadow: isDarkMode ? `0 0 15px ${brand}40` : `0 0 15px ${brand}20`
                                                            }
                                                        },
                                                        '& .MuiInputBase-input': {
                                                            color: isDarkMode ? '#FFF7EC' : '#1A0E05'
                                                        },
                                                        '& .MuiInputLabel-root': {
                                                            color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)',
                                                            '&.Mui-focused': { color: brand }
                                                        }
                                                    }}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <PersonIcon sx={{ color: brand }} />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    select
                                                    label="Subject"
                                                    name="subject"
                                                    placeholder="Select a subject"
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    required
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '16px',
                                                            bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                            '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)' },
                                                            '&:hover fieldset': { borderColor: brand },
                                                            '&.Mui-focused fieldset': { 
                                                                borderColor: brand,
                                                                boxShadow: isDarkMode ? `0 0 15px ${brand}40` : `0 0 15px ${brand}20`
                                                            }
                                                        },
                                                        '& .MuiInputBase-input': {
                                                            color: isDarkMode ? '#FFF7EC' : '#1A0E05'
                                                        },
                                                        '& .MuiInputLabel-root': {
                                                            color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)',
                                                            '&.Mui-focused': { color: brand }
                                                        }
                                                    }}
                                                    SelectProps={{
                                                        open: subjectOpen,
                                                        onOpen: () => setSubjectOpen(true),
                                                        onClose: () => setSubjectOpen(false),
                                                        displayEmpty: true,
                                                        renderValue: (selected) =>
                                                            selected ? (
                                                                selected
                                                            ) : (
                                                                <Typography
                                                                    component="span"
                                                                    sx={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}
                                                                >
                                                                    Select a subject
                                                                </Typography>
                                                            ),
                                                        MenuProps: {
                                                            disableScrollLock: true,
                                                            PaperProps: {
                                                                sx: {
                                                                    mt: 1,
                                                                    borderRadius: '16px',
                                                                    bgcolor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : '#ffffff',
                                                                    backdropFilter: 'blur(20px)',
                                                                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                                                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                                                    '& .MuiMenuItem-root': {
                                                                        py: 1.5,
                                                                        mx: 0.5,
                                                                        borderRadius: '8px',
                                                                        fontFamily: "'Basic', sans-serif",
                                                                        color: isDarkMode ? '#FFF7EC' : '#1A0E05',
                                                                        '&:hover': { bgcolor: isDarkMode ? 'rgba(202,96,20,0.15)' : 'rgba(202,96,20,0.05)' },
                                                                        '&.Mui-selected': { bgcolor: `${brand}20`, '&:hover': { bgcolor: `${brand}30` } }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                    }}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <SubjectIcon sx={{ color: brand }} />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                >
                                                    <MenuItem value="" disabled>
                                                        Select a subject
                                                    </MenuItem>
                                                    {subjects.map((option) => (
                                                        <MenuItem key={option} value={option}>
                                                            {option}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </Box>

                                            <TextField
                                                fullWidth
                                                label="Email Address"
                                                name="email"
                                                type="email"
                                                placeholder="Enter your email address"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '16px',
                                                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                        '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)' },
                                                        '&:hover fieldset': { borderColor: brand },
                                                        '&.Mui-focused fieldset': { 
                                                            borderColor: brand,
                                                            boxShadow: isDarkMode ? `0 0 15px ${brand}40` : `0 0 15px ${brand}20`
                                                        }
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        color: isDarkMode ? '#FFF7EC' : '#1A0E05'
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)',
                                                        '&.Mui-focused': { color: brand }
                                                    }
                                                }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <EmailIcon sx={{ color: brand }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />

                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={4}
                                                label="Your Message"
                                                name="message"
                                                placeholder="Type your message here..."
                                                value={formData.message}
                                                onChange={handleChange}
                                                required
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '16px',
                                                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                        '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)' },
                                                        '&:hover fieldset': { borderColor: brand },
                                                        '&.Mui-focused fieldset': { 
                                                            borderColor: brand,
                                                            boxShadow: isDarkMode ? `0 0 15px ${brand}40` : `0 0 15px ${brand}20`
                                                        }
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        color: isDarkMode ? '#FFF7EC' : '#1A0E05'
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)',
                                                        '&.Mui-focused': { color: brand }
                                                    }
                                                }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                                            <MessageIcon sx={{ color: brand }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />

                                            <Button
                                                fullWidth
                                                type="submit"
                                                variant="contained"
                                                disabled={isLoading}
                                                sx={{
                                                    py: 2,
                                                    borderRadius: '16px',
                                                    background: `linear-gradient(135deg, ${brand} 0%, #E07520 100%)`,
                                                    backgroundSize: '800px 100%',
                                                    color: '#fff',
                                                    fontFamily: "'Basic', sans-serif",
                                                    fontWeight: 700,
                                                    fontSize: '1.1rem',
                                                    textTransform: 'none',
                                                    boxShadow: `0 8px 32px ${brand}40`,
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: `0 12px 48px ${brand}60`,
                                                        '&::before': { left: '100%' }
                                                    },
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0, left: '-100%', width: '100%', height: '100%',
                                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                                        transition: 'all 0.6s ease',
                                                    },
                                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                                }}
                                                endIcon={<SendIcon sx={{ 
                                                    transition: 'transform 0.3s ease',
                                                    '.MuiButton-root:hover &': { transform: 'translateX(4px) translateY(-4px)' }
                                                }} />}
                                            >
                                                {isLoading ? 'Sending...' : 'Send Message'}
                                            </Button>
                                        </Stack>
                                    </form>
                                    )}
                                </Paper>
                            </div>
                        </Box>
                    </Box>

                    <Box
                        id="final-cta"
                        sx={{
                            py: { xs: 12, md: 10 },
                            textAlign: "center",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        <Box sx={{
                            position: "absolute",
                            top: "50%", left: "50%",
                            width: "200%", height: "40%",
                            background: `linear-gradient(90deg, transparent, ${brand}05, ${brand}10, ${brand}05, transparent)`,
                            transform: "translate(-50%, -50%) rotate(-5deg)",
                            zIndex: 0,
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
                                        px: 6,
                                        py: 2.5,
                                        borderRadius: "20px",
                                        background: `linear-gradient(135deg, ${brand} 0%, #E07520 100%)`,
                                        color: "#fff",
                                        fontFamily: "'Basic', sans-serif",
                                        fontWeight: 800,
                                        fontSize: "1.2rem",
                                        textDecoration: "none",
                                        boxShadow: isDarkMode 
                                            ? `0 12px 32px ${brand}40, 0 4px 12px rgba(0,0,0,0.4)` 
                                            : `0 12px 32px ${brand}30`,
                                        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                        position: 'relative',
                                        overflow: 'hidden',
                                        "&:hover": {
                                            transform: "scale(1.05) translateY(-6px)",
                                            boxShadow: isDarkMode 
                                                ? `0 20px 48px ${brand}60, 0 8px 24px rgba(0,0,0,0.5)`
                                                : `0 20px 48px ${brand}50`,
                                        },
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0, left: '-100%', width: '100%', height: '100%',
                                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                                            transition: 'all 0.6s ease',
                                        },
                                        '&:hover::before': { left: '100%' }
                                    }}
                                >
                                    <RestaurantIcon sx={{ fontSize: 20 }} />
                                    Explore Recipes
                                </Box>
                            </Box>
                        </Container>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default ContactUs;

