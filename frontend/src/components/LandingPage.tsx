import React, { useState, useEffect, useRef } from 'react';
import { 
  GitBranch, 
  ArrowRight, 
  MapPin, 
  Navigation, 
  Zap, 
  Network, 
  Search, 
  Flame, 
  Compass, 
  CheckCircle2, 
  Code2, 
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Github,
  Layers,
  Cpu,
  Database,
  BarChart3,
  GitCommit,
  Sparkles,
  Terminal,
  FileCode2,
  Activity,
  Maximize2,
  Rocket,
  Target
} from 'lucide-react';
import { techStack } from '../config/techStack';

interface LandingPageProps {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  handleAnalyze: (e: React.FormEvent) => void;
  isLoading: boolean;
  loadingPhase: string;
  error: string | null;
}

// Hook for Animated Count-up Stats
function useCountUp(endVal: number, duration: number = 1500, start: boolean = false) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * endVal));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [endVal, duration, start]);

  return count;
}

export default function LandingPage({
  repoUrl,
  setRepoUrl,
  handleAnalyze,
  isLoading,
  loadingPhase,
  error
}: LandingPageProps) {
  // 1. Mouse Parallax State for Hero Graph Background
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if touch device or reduced motion is preferred
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const offsetX = (e.clientX - centerX) * 0.015;
      const offsetY = (e.clientY - centerY) * 0.015;
      setMouseOffset({ x: offsetX, y: offsetY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 2. Intersection Observer for Scroll Reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // 3. Stats Section Intersection Observer for Count-up
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Animated Count-up values
  const countLanguages = useCountUp(3, 1200, statsVisible);
  const countAlgorithms = useCountUp(2, 1200, statsVisible);
  const countDeterministic = useCountUp(100, 1500, statsVisible);
  const countTraversal = useCountUp(50, 1500, statsVisible);

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1A1D29] flex flex-col justify-between selection:bg-[#F4A688]/40 selection:text-[#1A1D29] font-sans relative overflow-hidden">
      
      {/* ------------------- HEADER / NAV BAR ------------------- */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#E85D2C]/10 border border-[#E85D2C]/25 rounded-xl text-[#E85D2C] flex items-center justify-center shadow-xs">
            <Navigation className="w-5 h-5 fill-[#E85D2C]/15" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg tracking-tight text-[#1A1D29]">DevLens <span className="text-[#E85D2C]">AI</span></span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#E5E1DA]/70 border border-[#E5E1DA] text-[#6B7280]">
                v0.3.0
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#6B7280]">Google Maps for Codebases</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-xs font-mono text-[#6B7280]">
          <a href="#stats" className="hover:text-[#1A1D29] transition-colors">Telemetry</a>
          <a href="#waypoints" className="hover:text-[#1A1D29] transition-colors">Waypoints</a>
          <a href="#features" className="hover:text-[#1A1D29] transition-colors">Legend</a>
          <a href="#underthehood" className="hover:text-[#1A1D29] transition-colors">Under The Hood</a>
          <a 
            href="https://github.com/user-Rishabh/DevLens-AI" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E1DA] hover:border-[#E85D2C]/40 text-[#1A1D29] shadow-xs transition-all cursor-pointer"
          >
            <Github className="w-3.5 h-3.5 text-[#1A1D29]" />
            GitHub
          </a>
        </div>
      </header>

      {/* ------------------- HERO SECTION ------------------- */}
      <section 
        ref={heroRef}
        className="relative w-full max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col items-center text-center z-10 my-auto min-h-[80vh] justify-center"
      >
        
        {/* GOOGLE MAPS STREET-GRID & NAVIGATION ROUTE HERO BACKGROUND */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 transition-transform duration-300 ease-out animate-map-grid"
          style={{
            transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`
          }}
        >
          <svg className="w-full h-full" viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="gmapsRouteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E85D2C" />
                <stop offset="60%" stopColor="#F06F42" />
                <stop offset="100%" stopColor="#E85D2C" />
              </linearGradient>

              {/* Pin contact drop shadow */}
              <filter id="pinShadow" x="-50%" y="-30%" width="200%" height="180%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.1   0 0 0 0 0.1   0 0 0 0 0.15  0 0 0 0.25 0" />
                <feOffset dx="0" dy="4" />
                <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
              </filter>

              {/* Route line elevated drop shadow */}
              <filter id="routeShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#E85D2C" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* 1. CITY BLOCKS / LAND PARCELS (Low-contrast organic map blocks) */}
            <g fill="#F7F5EE" stroke="#EAE5DC" strokeWidth="1" opacity="0.6">
              {/* Northwest quadrant blocks */}
              <polygon points="20,20 90,20 90,130 20,130" />
              <polygon points="125,20 230,20 215,130 125,130" />
              <polygon points="250,20 380,20 365,130 240,130" />
              <polygon points="400,20 540,20 530,120 390,120" />
              <polygon points="560,20 710,20 700,120 550,120" />
              <polygon points="730,20 860,20 850,130 720,130" />
              <polygon points="880,20 1020,20 1010,130 870,130" />
              <polygon points="1045,20 1180,20 1180,130 1045,130" />

              {/* West margin blocks */}
              <polygon points="20,150 90,150 90,280 20,280" />
              <polygon points="20,300 90,300 90,430 20,430" />
              <polygon points="20,450 90,450 90,580 20,580" />

              {/* Central-East & East margin blocks */}
              <polygon points="1045,150 1180,150 1180,270 1045,270" />
              <polygon points="1045,290 1180,290 1180,410 1045,410" />
              <polygon points="1045,430 1180,430 1180,560 1045,560" />

              {/* South margin blocks */}
              <polygon points="20,600 130,600 120,640 20,640" />
              <polygon points="150,600 320,600 310,640 140,640" />
              <polygon points="340,600 520,600 510,640 330,640" />
              <polygon points="540,600 720,600 710,640 530,640" />
              <polygon points="740,600 920,600 910,640 730,640" />
              <polygon points="940,600 1180,600 1180,640 930,640" />

              {/* Diagonal cross-block accents (irregular city layout) */}
              <polygon points="125,150 210,150 190,270 125,270" />
              <polygon points="125,440 220,440 200,570 125,570" />
              <polygon points="940,150 1025,150 1025,270 955,270" />
              <polygon points="940,440 1025,440 1025,570 945,570" />
            </g>

            {/* 2. SPECIAL DISTRICTS / GREEN PARK & WATER CANAL */}
            {/* Dev Park (Google Maps subtle green tint) */}
            <polygon 
              points="125,290 220,290 205,420 125,420" 
              fill="#EBF4EA" 
              stroke="#DCE9D9" 
              strokeWidth="1.2" 
              opacity="0.8" 
            />
            <text x="165" y="360" textAnchor="middle" fill="#7C9975" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600" opacity="0.75" letterSpacing="0.06em">
              DEV_PARK
            </text>

            {/* East Harbor Canal (Google Maps soft water blue) */}
            <path
              d="M 1120 0 C 1135 180, 1145 380, 1200 520 L 1200 0 Z"
              fill="#E7F0F8"
              stroke="#D6E4F0"
              strokeWidth="1"
              opacity="0.7"
            />

            {/* 3. STREET NETWORK (Casing + Surface for Google Maps road look) */}
            {/* Outer Street Casing */}
            <g stroke="#E7E2D8" strokeLinecap="round" strokeLinejoin="round" opacity="0.75">
              {/* North Expressway (Arterial Avenue) */}
              <line x1="-10" y1="52" x2="1210" y2="52" strokeWidth="8.5" />
              {/* West Boulevard (Arterial Avenue) */}
              <line x1="110" y1="-10" x2="110" y2="660" strokeWidth="8.5" />
              {/* East Boulevard (Arterial Avenue) */}
              <line x1="1060" y1="-10" x2="1060" y2="660" strokeWidth="8.5" />

              {/* Secondary Streets */}
              <line x1="-10" y1="140" x2="1210" y2="140" strokeWidth="5.5" />
              <line x1="-10" y1="280" x2="1210" y2="280" strokeWidth="5.5" />
              <line x1="-10" y1="425" x2="1210" y2="425" strokeWidth="5.5" />
              <line x1="-10" y1="585" x2="1210" y2="585" strokeWidth="6" />

              {/* Secondary Vertical Avenues */}
              <line x1="230" y1="-10" x2="210" y2="660" strokeWidth="5" />
              <line x1="380" y1="-10" x2="350" y2="140" strokeWidth="4.5" />
              <line x1="545" y1="-10" x2="525" y2="140" strokeWidth="4.5" />
              <line x1="715" y1="-10" x2="695" y2="140" strokeWidth="4.5" />
              <line x1="865" y1="-10" x2="845" y2="140" strokeWidth="4.5" />
              <line x1="945" y1="140" x2="930" y2="660" strokeWidth="5" />
              <line x1="350" y1="585" x2="330" y2="660" strokeWidth="4.5" />
              <line x1="695" y1="585" x2="675" y2="660" strokeWidth="4.5" />

              {/* Diagonal Broadway-style Avenue */}
              <line x1="30" y1="640" x2="320" y2="10" strokeWidth="4.5" />
            </g>

            {/* Inner Street Surface (Pure White Roadbed) */}
            <g stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
              <line x1="-10" y1="52" x2="1210" y2="52" strokeWidth="6" />
              <line x1="110" y1="-10" x2="110" y2="660" strokeWidth="6" />
              <line x1="1060" y1="-10" x2="1060" y2="660" strokeWidth="6" />

              <line x1="-10" y1="140" x2="1210" y2="140" strokeWidth="3.5" />
              <line x1="-10" y1="280" x2="1210" y2="280" strokeWidth="3.5" />
              <line x1="-10" y1="425" x2="1210" y2="425" strokeWidth="3.5" />
              <line x1="-10" y1="585" x2="1210" y2="585" strokeWidth="4" />

              <line x1="230" y1="-10" x2="210" y2="660" strokeWidth="3" />
              <line x1="380" y1="-10" x2="350" y2="140" strokeWidth="2.5" />
              <line x1="545" y1="-10" x2="525" y2="140" strokeWidth="2.5" />
              <line x1="715" y1="-10" x2="695" y2="140" strokeWidth="2.5" />
              <line x1="865" y1="-10" x2="845" y2="140" strokeWidth="2.5" />
              <line x1="945" y1="140" x2="930" y2="660" strokeWidth="3" />

              <line x1="30" y1="640" x2="320" y2="10" strokeWidth="2.5" />
            </g>

            {/* Subtle Map Street Names */}
            <g fill="#B8B2A6" fontSize="8" fontFamily="JetBrains Mono" opacity="0.65" letterSpacing="0.05em">
              <text x="45" y="47">WEST_BLVD</text>
              <text x="580" y="47" textAnchor="middle">AST_EXPRESSWAY</text>
              <text x="1005" y="47">EAST_AVE</text>
              <text x="50" y="275">IMPORT_WAY</text>
              <text x="990" y="275">CALL_STACK_ST</text>
            </g>

            {/* 4. GOOGLE MAPS ROUTE LINE (Thick curved route with casing) */}
            {/* White Underlay Casing */}
            <path
              d="M 110 220 L 110 75 Q 110 52 132 52 L 1048 52 Q 1070 52 1070 75 L 1070 270 L 1070 410 Q 1070 480 1115 480"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-maps-route"
            />
            {/* Main Primary Orange Route */}
            <path
              d="M 110 220 L 110 75 Q 110 52 132 52 L 1048 52 Q 1070 52 1070 75 L 1070 270 L 1070 410 Q 1070 480 1115 480"
              fill="none"
              stroke="url(#gmapsRouteGradient)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#routeShadow)"
              className="animate-maps-route"
            />

            {/* 5. PIN MARKERS (Classic Teardrop Map Pins with bounce drop) */}

            {/* ORIGIN PIN: app/main.py at (110, 220) */}
            <g transform="translate(110, 220)">
              {/* Contact Shadow */}
              <ellipse cx="0" cy="2" rx="7.5" ry="2.8" fill="#1A1D29" className="animate-pin-origin-shadow" />
              {/* Pin with drop & idle animation */}
              <g className="animate-pin-origin animate-pin-idle">
                {/* Teardrop Silhouette */}
                <path
                  d="M 0 0 C -2.5 -3, -11 -13.5, -11 -21 C -11 -27.5, -6.1 -32.5, 0 -32.5 C 6.1 -32.5, 11 -27.5, 11 -21 C 11 -13.5, 2.5 -3, 0 0 Z"
                  fill="#E85D2C"
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                  filter="url(#pinShadow)"
                />
                {/* Inner Disc */}
                <circle cx="0" cy="-21" r="4.5" fill="#FFFFFF" />
                <circle cx="0" cy="-21" r="2.2" fill="#E85D2C" />

                {/* Floating Map Label Badge */}
                <g transform="translate(0, -42)">
                  <rect x="-44" y="-11" width="88" height="22" rx="6" fill="#FFFFFF" stroke="#E5E1DA" strokeWidth="1" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.08))" />
                  <polygon points="-4,11 4,11 0,14" fill="#FFFFFF" />
                  <text x="0" y="4" textAnchor="middle" fill="#E85D2C" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="700" letterSpacing="0.02em">
                    app/main.py
                  </text>
                </g>
              </g>
            </g>

            {/* INTERMEDIATE WAYPOINT PIN: src/routes/api.py at (1070, 270) */}
            <g transform="translate(1070, 270)">
              {/* Contact Shadow */}
              <ellipse cx="0" cy="2" rx="6.5" ry="2.5" fill="#1A1D29" className="animate-pin-waypoint-shadow" />
              {/* Pin with drop & idle animation */}
              <g className="animate-pin-waypoint animate-pin-idle" style={{ animationDelay: '2.2s, 3.6s' }}>
                <path
                  d="M 0 0 C -2.2 -2.8, -9.5 -12, -9.5 -18.5 C -9.5 -24, -5.2 -28.5, 0 -28.5 C 5.2 -28.5, 9.5 -24, 9.5 -18.5 C 9.5 -12, 2.2 -2.8, 0 0 Z"
                  fill="#3B5FE0"
                  stroke="#FFFFFF"
                  strokeWidth="1.6"
                  filter="url(#pinShadow)"
                />
                <circle cx="0" cy="-18.5" r="4" fill="#FFFFFF" />
                <circle cx="0" cy="-18.5" r="2" fill="#3B5FE0" />

                {/* Floating Map Label Badge */}
                <g transform="translate(0, -38)">
                  <rect x="-56" y="-11" width="112" height="22" rx="6" fill="#FFFFFF" stroke="#E5E1DA" strokeWidth="1" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.08))" />
                  <polygon points="-4,11 4,11 0,14" fill="#FFFFFF" />
                  <text x="0" y="4" textAnchor="middle" fill="#3B5FE0" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                    src/routes/api.py
                  </text>
                </g>
              </g>
            </g>

            {/* DESTINATION PIN: frontend/src/App.tsx at (1115, 480) */}
            <g transform="translate(1115, 480)">
              {/* Contact Shadow */}
              <ellipse cx="0" cy="2" rx="8" ry="3" fill="#1A1D29" className="animate-pin-dest-shadow" />
              {/* Pin with drop & idle animation */}
              <g className="animate-pin-dest animate-pin-idle" style={{ animationDelay: '2.6s, 3.8s' }}>
                <path
                  d="M 0 0 C -2.5 -3, -11 -13.5, -11 -21 C -11 -27.5, -6.1 -32.5, 0 -32.5 C 6.1 -32.5, 11 -27.5, 11 -21 C 11 -13.5, 2.5 -3, 0 0 Z"
                  fill="#E85D2C"
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                  filter="url(#pinShadow)"
                />
                <circle cx="0" cy="-21" r="4.5" fill="#FFFFFF" />
                <circle cx="0" cy="-21" r="2.2" fill="#E85D2C" />

                {/* Floating Map Label Badge */}
                <g transform="translate(0, -42)">
                  <rect x="-68" y="-11" width="136" height="22" rx="6" fill="#FFFFFF" stroke="#E5E1DA" strokeWidth="1" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.08))" />
                  <polygon points="-4,11 4,11 0,14" fill="#FFFFFF" />
                  <text x="0" y="4" textAnchor="middle" fill="#1A1D29" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="700" letterSpacing="0.02em">
                    frontend/src/App.tsx
                  </text>
                </g>
              </g>
            </g>
          </svg>
        </div>

        {/* GOOGLE MAPS ROUTE SUMMARY CARD (Floating in upper-right margin near route) */}
        <div className="absolute top-8 right-6 lg:right-10 z-10 pointer-events-none animate-route-card hidden sm:flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#E5E1DA] shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="w-8 h-8 rounded-xl bg-[#FFF4EE] border border-[#E85D2C]/30 flex items-center justify-center text-[#E85D2C] shrink-0">
            <Navigation className="w-4 h-4 fill-[#E85D2C]/20" />
          </div>
          <div className="text-left font-mono">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1A1D29]">12 files</span>
              <span className="text-[10px] text-[#6B7280]">·</span>
              <span className="text-xs font-semibold text-[#E85D2C]">3 hops</span>
            </div>
            <div className="text-[10px] text-[#6B7280] flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3 text-[#3B5FE0]" />
              <span>Analyzed in 2.1s · AST route</span>
            </div>
          </div>
        </div>

        {/* GOOGLE MAPS CONTROL BUTTONS (Visual texture in bottom-right corner) */}
        <div className="absolute bottom-6 right-6 lg:right-10 z-10 pointer-events-none hidden md:flex flex-col items-center gap-2 select-none opacity-80">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E1DA] shadow-xs flex items-center justify-center text-[#6B7280]">
            <Target className="w-4 h-4 text-[#6B7280]" />
          </div>
          <div className="flex flex-col rounded-xl bg-white border border-[#E5E1DA] shadow-xs overflow-hidden">
            <div className="w-8 h-8 flex items-center justify-center text-[#4B5563] text-sm font-semibold border-b border-[#E5E1DA]/80 leading-none">
              +
            </div>
            <div className="w-8 h-8 flex items-center justify-center text-[#4B5563] text-base font-semibold leading-none">
              −
            </div>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          
          {/* Top Status & Deployment Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {/* Primary Animated Status Pill: Live & Deployed */}
            <div className="relative inline-flex items-center">
              {/* Subtle animated accent sparkles/particles */}
              <span className="sparkle-particle sparkle-particle-1 -top-1 -right-1 w-1.5 h-1.5 bg-[#E85D2C] shadow-[0_0_6px_rgba(232,93,44,0.6)]" />
              <span className="sparkle-particle sparkle-particle-2 -bottom-1 -left-1 w-1.5 h-1.5 bg-[#F4A688] shadow-[0_0_6px_rgba(244,166,136,0.6)]" />
              <span className="sparkle-particle sparkle-particle-3 -top-1.5 left-1/3 w-1 h-1 bg-[#E85D2C]" />
              <span className="sparkle-particle sparkle-particle-4 -bottom-1 right-1/3 w-1 h-1 bg-[#F4A688]" />

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1D29] text-white text-xs font-mono font-semibold tracking-wide shadow-xs border border-[#1A1D29]/20">
                <Rocket className="w-3.5 h-3.5 text-[#E85D2C]" />
                <span>Live & Deployed</span>
              </div>
            </div>

            {/* Route Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E1DA] text-[#E85D2C] text-xs font-mono shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E85D2C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E85D2C]"></span>
              </span>
              <span className="font-semibold tracking-wider">NAVIGATION ROUTE CALCULATED</span>
            </div>
          </div>

          {/* Headline (Display Face: Space Grotesk) */}
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-[#1A1D29] leading-[1.08] mb-6">
            Google Maps for <br />
            <span className="text-[#E85D2C]">
              your codebase.
            </span>
          </h1>

          {/* Subheadline (Body Face: Inter) */}
          <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl leading-relaxed mb-10 font-normal">
            Calculate impact paths, trace dependency blast radius, and navigate unfamiliar repositories before touching a single line of code.
          </p>

          {/* Error Alert Box */}
          {error && (
            <div className="mb-6 w-full max-w-2xl p-4 rounded-xl bg-red-50 border border-red-200 text-left flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-800 font-semibold text-sm">Analysis Failed</h4>
                <p className="text-red-600 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* PRIMARY ROUTE INPUT CTA FORM */}
          <form onSubmit={handleAnalyze} className="w-full max-w-2xl mb-6">
            <div className="p-2 rounded-2xl sm:rounded-full bg-white border border-[#E5E1DA] flex flex-col sm:flex-row gap-2 shadow-[0_10px_35px_-5px_rgba(232,93,44,0.08),0_4px_16px_rgba(0,0,0,0.04)] focus-within:border-[#E85D2C]/60 focus-within:ring-2 focus-within:ring-[#E85D2C]/15 transition-all">
              <div className="flex-1 flex items-center gap-3 px-3 py-2 sm:py-0">
                <MapPin className="w-5 h-5 text-[#E85D2C] shrink-0" />
                <input 
                  type="url" 
                  required
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full bg-transparent text-[#1A1D29] placeholder-[#6B7280] text-xs sm:text-sm font-mono focus:outline-none py-1.5"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#E85D2C] hover:bg-[#D45022] text-white font-medium text-xs sm:text-sm transition-all duration-200 shadow-md shadow-[#E85D2C]/25 active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Analyzing Route...
                  </>
                ) : (
                  <>
                    Calculate Route
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Progress Phase bar if analyzing */}
            {isLoading && (
              <div className="mt-3 p-3 rounded-xl bg-white border border-[#E5E1DA] flex items-center gap-3 text-xs font-mono text-[#E85D2C] shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span className="truncate">{loadingPhase}</span>
              </div>
            )}
          </form>

          {/* Quick Example Repositories */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#6B7280] font-mono">
            <span>Try example route:</span>
            <button 
              type="button"
              onClick={() => setRepoUrl('https://github.com/octocat/Spoon-Knife')}
              className="text-[#1A1D29] hover:text-[#E85D2C] transition-colors underline underline-offset-4 decoration-[#E5E1DA] hover:decoration-[#E85D2C] cursor-pointer"
            >
              octocat/Spoon-Knife
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => setRepoUrl('https://github.com/user-Rishabh/DevLens-AI')}
              className="text-[#1A1D29] hover:text-[#E85D2C] transition-colors underline underline-offset-4 decoration-[#E5E1DA] hover:decoration-[#E85D2C] cursor-pointer"
            >
              user-Rishabh/DevLens-AI
            </button>
          </div>

        </div>
      </section>

      {/* ------------------- STATS / TELEMETRY STRIP ------------------- */}
      <section id="stats" ref={statsRef} className="w-full border-y border-[#E5E1DA] bg-white/70 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          
          <div className="flex flex-col items-center justify-center reveal-on-scroll stagger-1">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#E85D2C] flex items-center gap-1">
              <span>{countLanguages}</span>
              <span className="text-xs text-[#6B7280] font-sans font-normal">Languages</span>
            </div>
            <p className="text-[11px] font-mono text-[#6B7280] mt-1">Python • TypeScript • JavaScript</p>
          </div>

          <div className="flex flex-col items-center justify-center reveal-on-scroll stagger-2">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#3B5FE0] flex items-center gap-1">
              <span>{countAlgorithms}</span>
              <span className="text-xs text-[#6B7280] font-sans font-normal">Hybrid Search Engines</span>
            </div>
            <p className="text-[11px] font-mono text-[#6B7280] mt-1">BM25 Sparse + Cosine Dense RRF</p>
          </div>

          <div className="flex flex-col items-center justify-center reveal-on-scroll stagger-3">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#E85D2C] flex items-center gap-1">
              <span>{countDeterministic}%</span>
            </div>
            <p className="text-[11px] font-mono text-[#6B7280] mt-1">AST Local Import Tree Resolution</p>
          </div>

          <div className="flex flex-col items-center justify-center reveal-on-scroll stagger-4">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#E85D2C] flex items-center gap-1">
              <span>&lt;{countTraversal}ms</span>
            </div>
            <p className="text-[11px] font-mono text-[#6B7280] mt-1">Live BFS Graph Blast Radius Speed</p>
          </div>

        </div>
      </section>

      {/* ------------------- WAYPOINTS / HOW IT WORKS SECTION ------------------- */}
      <section id="waypoints" className="w-full py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-xl mx-auto mb-16 reveal-on-scroll">
            <span className="text-xs font-mono uppercase text-[#E85D2C] tracking-wider font-semibold">ROUTE WAYPOINTS</span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#1A1D29] mt-2">
              How You Navigate Code with DevLens
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-2">
              From raw repository link to confident code changes in 4 simple stops.
            </p>
          </div>

          {/* Connected Waypoints Path Visual */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Animated Connecting Line that draws as section is scrolled */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-[#E5E1DA] -translate-y-6 z-0">
              <div className="h-full bg-gradient-to-r from-[#E85D2C] via-[#F4A688] to-[#E85D2C] w-full transition-all duration-1000 ease-out origin-left" />
            </div>

            {/* Stop 1 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E1DA] shadow-xs flex flex-col justify-between relative z-10 hover:border-[#E85D2C]/40 hover:shadow-md transition-all reveal-on-scroll stagger-1 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-[#E85D2C]/10 border border-[#E85D2C]/20 text-[#E85D2C] text-[10px] font-mono font-bold">
                    STOP 01
                  </span>
                  <GitBranch className="w-4 h-4 text-[#E85D2C] group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-display text-base font-bold text-[#1A1D29] mb-2">Drop a GitHub URL</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Provide any public GitHub repository link. DevLens clones the codebase into an isolated temporary environment with shallow history depth up to 100 commits without needing local Docker setup or API keys.
                </p>
              </div>
            </div>

            {/* Stop 2 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E1DA] shadow-xs flex flex-col justify-between relative z-10 hover:border-[#E85D2C]/40 hover:shadow-md transition-all reveal-on-scroll stagger-2 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-[#E85D2C]/10 border border-[#E85D2C]/20 text-[#E85D2C] text-[10px] font-mono font-bold">
                    STOP 02
                  </span>
                  <Network className="w-4 h-4 text-[#E85D2C] group-hover:rotate-12 transition-transform" />
                </div>
                <h3 className="font-display text-base font-bold text-[#1A1D29] mb-2">We Map Structure</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  DevLens parses internal imports across Python, JavaScript, and TypeScript source files while parsing git commit histories to construct a live 2D dependency graph and hotspot risk map.
                </p>
              </div>
            </div>

            {/* Stop 3 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E1DA] shadow-xs flex flex-col justify-between relative z-10 hover:border-[#E85D2C]/40 hover:shadow-md transition-all reveal-on-scroll stagger-3 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-[#E85D2C]/10 border border-[#E85D2C]/20 text-[#E85D2C] text-[10px] font-mono font-bold">
                    STOP 03
                  </span>
                  <Zap className="w-4 h-4 text-[#E85D2C] group-hover:scale-125 transition-transform" />
                </div>
                <h3 className="font-display text-base font-bold text-[#1A1D29] mb-2">See What's Affected</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Select any file on the spatial map or file tree to calculate direct and transitive dependents with full impact flow chains before modifying function signatures or class interfaces.
                </p>
              </div>
            </div>

            {/* Stop 4 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E1DA] shadow-xs flex flex-col justify-between relative z-10 hover:border-[#E85D2C]/40 hover:shadow-md transition-all reveal-on-scroll stagger-4 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-[#E85D2C]/10 border border-[#E85D2C]/20 text-[#E85D2C] text-[10px] font-mono font-bold">
                    STOP 04
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#E85D2C] group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-display text-base font-bold text-[#1A1D29] mb-2">Ship with Confidence</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Query the repository in plain English using Smart Search and review cited AI file explanations to verify downstream safety before shipping PRs to production.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------- FEATURES / MAP LEGEND SECTION ------------------- */}
      <section id="features" className="w-full max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-16 reveal-on-scroll">
          <span className="text-xs font-mono uppercase text-[#E85D2C] tracking-wider font-semibold">MAP LEGEND</span>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#1A1D29] mt-2">
            Built for Real Codebase Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-2">
            Every feature designed specifically to prevent downstream regressions and speed up code comprehension.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1: Blast Radius */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E1DA] hover:border-[#E85D2C]/50 hover:shadow-md transition-all flex flex-col justify-between reveal-on-scroll stagger-1 feature-card-blast group shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[#E85D2C] uppercase tracking-wider block">
                  LEGEND — IMPACT ANALYSIS
                </span>
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-[#E85D2C] blast-ring opacity-0" />
                  <Zap className="w-4 h-4 text-[#E85D2C] relative z-10" />
                </div>
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1D29] mb-2">Downstream Impact Analysis</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Calculates a reverse adjacency graph up to 3 levels deep. Identifies every direct dependent and transitive module that imports a target file, showing exact impact flow paths (e.g. <code className="text-[#E85D2C] font-mono text-[10px] bg-[#FAFAF7] px-1.5 py-0.5 rounded border border-[#E5E1DA]">auth.py → routes.py → App.tsx</code>) before you touch code.
              </p>
            </div>
          </div>

          {/* Feature 2: Architecture Map */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E1DA] hover:border-[#E85D2C]/50 hover:shadow-md transition-all flex flex-col justify-between reveal-on-scroll stagger-2 feature-card-map group shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[#E85D2C] uppercase tracking-wider block">
                  LEGEND — ARCHITECTURE MAP
                </span>
                {/* Mini interactive nodes that shift on hover */}
                <div className="flex gap-1 items-center">
                  <span className="h-2 w-2 rounded-full bg-[#E85D2C] map-node-1 transition-transform" />
                  <span className="h-2 w-2 rounded-full bg-[#F4A688] map-node-2 transition-transform" />
                  <span className="h-2 w-2 rounded-full bg-[#3B5FE0] map-node-3 transition-transform" />
                </div>
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1D29] mb-2">2D Visual Node Link Graph</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Renders an interactive spatial map of repository files as nodes and import statements as directed edges. Includes a live Impact View toggle to visually highlight affected downstream modules in vibrant terracotta.
              </p>
            </div>
          </div>

          {/* Feature 3: Hybrid Search */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E1DA] hover:border-[#3B5FE0]/50 hover:shadow-md transition-all flex flex-col justify-between reveal-on-scroll stagger-3 group shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[#3B5FE0] uppercase tracking-wider block">
                  LEGEND — SMART SEARCH
                </span>
                <Search className="w-4 h-4 text-[#3B5FE0] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1D29] mb-2">Vector & Keyword Hybrid Search</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Combines sparse keyword matching with dense sentence-transformer vector embeddings using Reciprocal Rank Fusion (RRF). Finds code whether searching by exact function name or by describing conceptual intent in natural language.
              </p>
              {/* Animated typing cursor prompt on hover */}
              <div className="mt-3 p-2 rounded-lg bg-[#FAFAF7] border border-[#E5E1DA] text-[10px] font-mono text-[#6B7280] flex items-center">
                <span>search: "auth token payload"</span>
                <span className="search-cursor" />
              </div>
            </div>
          </div>

          {/* Feature 4: Git Hotspots */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E1DA] hover:border-[#E85D2C]/50 hover:shadow-md transition-all flex flex-col justify-between reveal-on-scroll stagger-4 feature-card-hotspot group shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[#E85D2C] uppercase tracking-wider block">
                  LEGEND — FILES TO WATCH
                </span>
                <Flame className="w-4 h-4 text-[#E85D2C] hotspot-icon transition-all" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1D29] mb-2">Commit Edit Velocity Logs</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Mines historical git commit logs to calculate edit frequencies and co-change churn rates. Highlights high-velocity codebase risk zones that undergo frequent modification and require rigorous test coverage.
              </p>
            </div>
          </div>

          {/* Feature 5: Onboarding Guide */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E1DA] hover:border-[#E85D2C]/50 hover:shadow-md transition-all flex flex-col justify-between reveal-on-scroll stagger-5 feature-card-onboarding group shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[#E85D2C] uppercase tracking-wider block">
                  LEGEND — ONBOARDING GUIDE
                </span>
                <Compass className="w-4 h-4 text-[#E85D2C] compass-icon transition-transform duration-300" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1D29] mb-2">Suggested Reading Order</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Analyzes repository entry points, central import nodes, and git edit rates to generate a structured reading order and plain-English architectural walkthrough tailored for developers newly assigned to the project.
              </p>
            </div>
          </div>

          {/* Feature 6: Quality Scores */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E1DA] hover:border-[#3B5FE0]/50 hover:shadow-md transition-all flex flex-col justify-between reveal-on-scroll stagger-6 feature-card-quality group shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[#3B5FE0] uppercase tracking-wider block">
                  LEGEND — QUALITY SCORE
                </span>
                <BarChart3 className="w-4 h-4 text-[#3B5FE0] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1D29] mb-2">Maintainability Metrics</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Evaluates cyclomatic complexity, coupling density, and file size to calculate composite health ratings (0-100) across every file in the repository, surfacing technical debt before refactoring cycles begin.
              </p>
              {/* Shimmer health bar on hover */}
              <div className="mt-3 w-full bg-[#E5E1DA] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#E85D2C] h-full w-[70%] transition-all duration-500 bar-shimmer" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------- UNDER THE HOOD (TECHNICAL ARCHITECTURE) ------------------- */}
      <section id="underthehood" className="w-full bg-white/70 border-y border-[#E5E1DA] py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 reveal-on-scroll flex flex-col items-center">
            {/* Verified Benchmark Status Badge from real project evaluation harness */}
            <div className="relative inline-flex items-center mb-5">
              {/* Subtle animated accent sparkles/particles */}
              <span className="sparkle-particle sparkle-particle-1 -top-1 -right-1.5 w-1.5 h-1.5 bg-[#E85D2C] shadow-[0_0_6px_rgba(232,93,44,0.6)]" />
              <span className="sparkle-particle sparkle-particle-2 -bottom-1 -left-1.5 w-1.5 h-1.5 bg-[#3B5FE0] shadow-[0_0_6px_rgba(59,95,224,0.6)]" />
              <span className="sparkle-particle sparkle-particle-3 -top-1 left-1/4 w-1 h-1 bg-[#E85D2C]" />
              <span className="sparkle-particle sparkle-particle-4 -bottom-1 right-1/4 w-1 h-1 bg-[#3B5FE0]" />

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1D29] text-white text-xs font-mono font-semibold tracking-wide shadow-xs border border-[#1A1D29]/20">
                <Target className="w-3.5 h-3.5 text-[#E85D2C]" />
                <span>Hybrid Search — 69.23% Recall@5</span>
              </div>
            </div>

            <span className="text-xs font-mono uppercase text-[#E85D2C] tracking-wider font-semibold">UNDER THE HOOD — TECHNICAL ARCHITECTURE</span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#1A1D29] mt-2">
              Designed for Engineering Rigor, Not Just LLM Wrappers
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-2 leading-relaxed">
              DevLens AI combines static AST analysis, vector similarity, and git history telemetry into a deterministic local graph engine.
            </p>
          </div>

          {/* 4 Technical Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="p-6 rounded-2xl bg-[#FAFAF7] border border-[#E5E1DA] flex gap-4 items-start reveal-on-scroll stagger-1 hover:bg-white hover:border-[#E85D2C]/30 hover:shadow-xs transition-all">
              <div className="p-3 bg-[#E85D2C]/10 border border-[#E85D2C]/20 rounded-xl text-[#E85D2C] shrink-0">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#1A1D29] mb-1.5">Tree-Sitter AST & Import Resolution</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Parses syntax trees across Python, JavaScript, and TypeScript to resolve relative import statements and symbol exports into an exact file dependency graph with zero hallucination risk.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAF7] border border-[#E5E1DA] flex gap-4 items-start reveal-on-scroll stagger-2 hover:bg-white hover:border-[#3B5FE0]/30 hover:shadow-xs transition-all">
              <div className="p-3 bg-[#3B5FE0]/10 border border-[#3B5FE0]/20 rounded-xl text-[#3B5FE0] shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#1A1D29] mb-1.5">Reciprocal Rank Fusion (RRF)</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Merges BM25 sparse keyword matching with dense sentence-transformer embeddings, guaranteeing that both exact symbol lookups and conceptual natural-language queries return accurately cited code chunks.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAF7] border border-[#E5E1DA] flex gap-4 items-start reveal-on-scroll stagger-3 hover:bg-white hover:border-[#E85D2C]/30 hover:shadow-xs transition-all">
              <div className="p-3 bg-[#E85D2C]/10 border border-[#E85D2C]/20 rounded-xl text-[#E85D2C] shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#1A1D29] mb-1.5">Git Telemetry & Churn Mining</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Analyzes git history logs to extract commit frequency, author count, and co-change churn patterns, surfacing codebase risk zones backed by empirical repository telemetry.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAF7] border border-[#E5E1DA] flex gap-4 items-start reveal-on-scroll stagger-4 hover:bg-white hover:border-[#E85D2C]/30 hover:shadow-xs transition-all">
              <div className="p-3 bg-[#E85D2C]/10 border border-[#E85D2C]/20 rounded-xl text-[#E85D2C] shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#1A1D29] mb-1.5">Live Graph BFS Traversal</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Executes live Breadth-First-Search (BFS) graph traversals over cached dependency structures, returning full transitive blast radius impact chains in under 50ms without database bottlenecks.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------- TECH STACK SHOWCASE ------------------- */}
      <section className="w-full py-16 border-t border-[#E5E1DA] bg-[#FAFAF7] relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 reveal-on-scroll">
            <span className="text-xs font-mono uppercase text-[#E85D2C] tracking-wider font-semibold">TECHNOLOGY STACK</span>
            <h2 className="font-display text-xl sm:text-3xl font-extrabold text-[#1A1D29] mt-2">
              Built With DevLens AI Tech Stack
            </h2>
            <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
              Explore the engineering choices powering our codebase ingestion, AST analysis, and hybrid search pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 reveal-on-scroll">
            {Object.entries(techStack).map(([category, items]) => (
              <div key={category} className="p-5 rounded-xl bg-white border border-[#E5E1DA] shadow-xs">
                <span className="text-[11px] font-mono text-[#E85D2C] uppercase tracking-wider block mb-3 font-semibold">
                  {category}
                </span>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <span 
                      key={item} 
                      className="px-2.5 py-1 bg-[#FAFAF7] border border-[#E5E1DA] text-[#1A1D29] rounded-lg text-xs font-mono"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------- FOOTER / FINAL CTA ------------------- */}
      <footer className="w-full border-t border-[#E5E1DA] bg-[#FAFAF7] py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center mb-12 reveal-on-scroll">
          <span className="text-xs font-mono uppercase text-[#E85D2C] tracking-wider block mb-2 font-semibold">READY TO NAVIGATE?</span>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#1A1D29] mb-4">
            Calculate your codebase route now.
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mb-8 max-w-xl mx-auto">
            Paste any public GitHub repository to map dependencies, trace blast radius, and explore code risk areas immediately.
          </p>

          {/* Final CTA Form */}
          <form onSubmit={handleAnalyze} className="w-full max-w-2xl mx-auto">
            <div className="p-2 rounded-2xl sm:rounded-full bg-white border border-[#E5E1DA] flex flex-col sm:flex-row gap-2 shadow-[0_10px_35px_-5px_rgba(232,93,44,0.08),0_4px_16px_rgba(0,0,0,0.04)] focus-within:border-[#E85D2C]/60 focus-within:ring-2 focus-within:ring-[#E85D2C]/15 transition-all">
              <div className="flex-1 flex items-center gap-3 px-3 py-2 sm:py-0">
                <MapPin className="w-5 h-5 text-[#E85D2C] shrink-0" />
                <input 
                  type="url" 
                  required
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full bg-transparent text-[#1A1D29] placeholder-[#6B7280] text-xs sm:text-sm font-mono focus:outline-none py-1.5"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#E85D2C] hover:bg-[#D45022] text-white font-medium text-xs sm:text-sm transition-all duration-200 shadow-md shadow-[#E85D2C]/25 active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Analyzing...' : 'Calculate Route'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-[#E5E1DA] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Navigation className="w-4 h-4 text-[#E85D2C]" />
            <span className="font-display font-bold text-sm text-[#1A1D29]">DevLens AI Engine</span>
            <span className="text-xs font-mono text-[#6B7280]">© 2026</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#E85D2C]" />
              {techStack["Backend"]?.[1]} {techStack["Backend"]?.[0]}
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#3B5FE0]" />
              {techStack["AI / ML"]?.[0]} & {techStack["Database"]?.[0]?.split(' ')?.[0]}
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
