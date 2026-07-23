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
  Maximize2
} from 'lucide-react';

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
    <div className="min-h-screen bg-[#0B0D12] text-[#E8E9ED] flex flex-col justify-between selection:bg-[#6D5EF5] selection:text-white font-sans relative overflow-hidden">
      
      {/* ------------------- HEADER / NAV BAR ------------------- */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#6D5EF5]/10 border border-[#6D5EF5]/30 rounded-xl text-[#3ED9C7] flex items-center justify-center shadow-lg shadow-[#6D5EF5]/10">
            <Navigation className="w-5 h-5 fill-[#3ED9C7]/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg tracking-tight text-white">DevLens <span className="text-[#3ED9C7]">AI</span></span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#6D5EF5]/15 border border-[#6D5EF5]/30 text-[#8B7FFF]">
                v0.3.0
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#8A8F9C]">Google Maps for Codebases</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-xs font-mono text-[#8A8F9C]">
          <a href="#stats" className="hover:text-[#3ED9C7] transition-colors">Telemetry</a>
          <a href="#waypoints" className="hover:text-[#3ED9C7] transition-colors">Waypoints</a>
          <a href="#features" className="hover:text-[#3ED9C7] transition-colors">Legend</a>
          <a href="#underthehood" className="hover:text-[#3ED9C7] transition-colors">Under The Hood</a>
          <a 
            href="https://github.com/user-Rishabh/DevLens-AI" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#12151D] border border-[#1F2330] hover:border-[#6D5EF5]/40 text-[#E8E9ED] transition-all cursor-pointer"
          >
            <Github className="w-3.5 h-3.5 text-[#8A8F9C]" />
            GitHub
          </a>
        </div>
      </header>

      {/* ------------------- HERO SECTION ------------------- */}
      <section 
        ref={heroRef}
        className="relative w-full max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col items-center text-center z-10 my-auto min-h-[80vh] justify-center"
      >
        
        {/* ANIMATED NODE-LINK GRAPH BACKGROUND WITH MOUSE PARALLAX & ROUTE-TRACE */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-80 transition-transform duration-300 ease-out"
          style={{
            transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`
          }}
        >
          <svg className="w-full h-full" viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3ED9C7" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#8B7FFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3ED9C7" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Background Static Edges (Code Structure Map) */}
            <g stroke="#1F2330" strokeWidth="1.2" strokeOpacity="0.7">
              <line x1="150" y1="120" x2="350" y2="220" />
              <line x1="350" y1="220" x2="280" y2="420" />
              <line x1="350" y1="220" x2="600" y2="180" />
              <line x1="600" y1="180" x2="850" y2="260" />
              <line x1="850" y1="260" x2="1050" y2="150" />
              <line x1="850" y1="260" x2="920" y2="480" />
              <line x1="600" y1="180" x2="520" y2="450" />
              <line x1="520" y1="450" x2="280" y2="420" />
              <line x1="520" y1="450" x2="920" y2="480" />
            </g>

            {/* Ambient Background Nodes */}
            <g>
              <circle cx="150" cy="120" r="4" fill="#1F2330" />
              <circle cx="280" cy="420" r="5" fill="#1F2330" />
              <circle cx="1050" cy="150" r="4" fill="#1F2330" />
              <circle cx="920" cy="480" r="5" fill="#1F2330" />
            </g>

            {/* LITERAL ROUTE CALCULATION ANIMATION (Path Trace in Teal #3ED9C7) */}
            <path
              d="M 150 120 Q 250 170 350 220 T 600 180 T 850 260 T 920 480"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="3.5"
              className="animate-route-draw"
              strokeLinecap="round"
            />

            {/* Waypoint Nodes along the calculated route */}
            <g transform="translate(150, 120)">
              <circle r="8" fill="#0B0D12" stroke="#3ED9C7" strokeWidth="2" />
              <circle r="3" fill="#3ED9C7" />
              <text x="14" y="4" fill="#3ED9C7" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">app/main.py</text>
            </g>

            <g transform="translate(350, 220)" className="animate-node-pulse">
              <circle r="7" fill="#12151D" stroke="#6D5EF5" strokeWidth="2" />
              <circle r="2.5" fill="#8B7FFF" />
              <text x="14" y="4" fill="#8A8F9C" fontSize="9" fontFamily="JetBrains Mono">analysis/blast_radius.py</text>
            </g>

            <g transform="translate(600, 180)" className="animate-node-pulse">
              <circle r="9" fill="#12151D" stroke="#F5A623" strokeWidth="2" />
              <circle r="3" fill="#F5A623" />
              <text x="14" y="-10" fill="#F5A623" fontSize="9" fontFamily="JetBrains Mono">app/db.py [Hotspot]</text>
            </g>

            <g transform="translate(850, 260)" className="animate-node-pulse">
              <circle r="7" fill="#12151D" stroke="#6D5EF5" strokeWidth="2" />
              <circle r="2.5" fill="#8B7FFF" />
              <text x="14" y="4" fill="#8A8F9C" fontSize="9" fontFamily="JetBrains Mono">api/routes.py</text>
            </g>

            <g transform="translate(920, 480)">
              <circle r="14" fill="none" stroke="#3ED9C7" strokeWidth="1.5" className="animate-beacon" />
              <circle r="8" fill="#0B0D12" stroke="#3ED9C7" strokeWidth="2" />
              <circle r="3.5" fill="#3ED9C7" />
              <text x="-40" y="24" fill="#3ED9C7" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">frontend/src/App.tsx</text>
            </g>
          </svg>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12151D] border border-[#1F2330] text-[#3ED9C7] text-xs font-mono mb-6 shadow-xl">
            <span className="h-2 w-2 rounded-full bg-[#3ED9C7] animate-pulse" />
            <span>NAVIGATION ROUTE CALCULATED</span>
          </div>

          {/* Headline (Display Face: Space Grotesk) */}
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white leading-[1.08] mb-6">
            Google Maps for <br />
            <span className="bg-gradient-to-r from-[#3ED9C7] via-[#8B7FFF] to-[#6D5EF5] bg-clip-text text-transparent">
              your codebase.
            </span>
          </h1>

          {/* Subheadline (Body Face: Inter) */}
          <p className="text-base sm:text-lg text-[#8A8F9C] max-w-2xl leading-relaxed mb-10">
            Calculate impact paths, trace dependency blast radius, and navigate unfamiliar repositories before touching a single line of code.
          </p>

          {/* Error Alert Box */}
          {error && (
            <div className="mb-6 w-full max-w-2xl p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-left flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-300 font-semibold text-sm">Analysis Failed</h4>
                <p className="text-red-400/90 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* PRIMARY ROUTE INPUT CTA FORM */}
          <form onSubmit={handleAnalyze} className="w-full max-w-2xl mb-6">
            <div className="p-2 rounded-2xl bg-[#12151D] border border-[#1F2330] flex flex-col sm:flex-row gap-2 shadow-2xl shadow-[#6D5EF5]/10 focus-within:border-[#6D5EF5]/60 transition-all">
              <div className="flex-1 flex items-center gap-3 px-3 py-2 sm:py-0">
                <MapPin className="w-5 h-5 text-[#3ED9C7] shrink-0" />
                <input 
                  type="url" 
                  required
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full bg-transparent text-[#E8E9ED] placeholder-[#8A8F9C] text-xs sm:text-sm font-mono focus:outline-none py-1.5"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#6D5EF5] hover:bg-[#8B7FFF] text-white font-medium text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-[#6D5EF5]/25 active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
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
              <div className="mt-3 p-3 rounded-xl bg-[#12151D] border border-[#1F2330] flex items-center gap-3 text-xs font-mono text-[#3ED9C7]">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span className="truncate">{loadingPhase}</span>
              </div>
            )}
          </form>

          {/* Quick Example Repositories */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#8A8F9C] font-mono">
            <span>Try example route:</span>
            <button 
              type="button"
              onClick={() => setRepoUrl('https://github.com/octocat/Spoon-Knife')}
              className="text-[#E8E9ED] hover:text-[#3ED9C7] transition-colors underline underline-offset-4 decoration-[#1F2330] hover:decoration-[#3ED9C7] cursor-pointer"
            >
              octocat/Spoon-Knife
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => setRepoUrl('https://github.com/user-Rishabh/DevLens-AI')}
              className="text-[#E8E9ED] hover:text-[#3ED9C7] transition-colors underline underline-offset-4 decoration-[#1F2330] hover:decoration-[#3ED9C7] cursor-pointer"
            >
              user-Rishabh/DevLens-AI
            </button>
          </div>

        </div>
      </section>

      {/* ------------------- STATS / TELEMETRY STRIP ------------------- */}
      <section id="stats" ref={statsRef} className="w-full border-y border-[#1F2330] bg-[#12151D]/80 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          
          <div className="flex flex-col items-center justify-center reveal-on-scroll stagger-1">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#3ED9C7] flex items-center gap-1">
              <span>{countLanguages}</span>
              <span className="text-xs text-[#8A8F9C] font-sans font-normal">Languages</span>
            </div>
            <p className="text-[11px] font-mono text-[#8A8F9C] mt-1">Python • TypeScript • JavaScript</p>
          </div>

          <div className="flex flex-col items-center justify-center reveal-on-scroll stagger-2">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#8B7FFF] flex items-center gap-1">
              <span>{countAlgorithms}</span>
              <span className="text-xs text-[#8A8F9C] font-sans font-normal">Hybrid Search Engines</span>
            </div>
            <p className="text-[11px] font-mono text-[#8A8F9C] mt-1">BM25 Sparse + Cosine Dense RRF</p>
          </div>

          <div className="flex flex-col items-center justify-center reveal-on-scroll stagger-3">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#3ED9C7] flex items-center gap-1">
              <span>{countDeterministic}%</span>
            </div>
            <p className="text-[11px] font-mono text-[#8A8F9C] mt-1">AST Local Import Tree Resolution</p>
          </div>

          <div className="flex flex-col items-center justify-center reveal-on-scroll stagger-4">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#F5A623] flex items-center gap-1">
              <span>&lt;{countTraversal}ms</span>
            </div>
            <p className="text-[11px] font-mono text-[#8A8F9C] mt-1">Live BFS Graph Blast Radius Speed</p>
          </div>

        </div>
      </section>

      {/* ------------------- WAYPOINTS / HOW IT WORKS SECTION ------------------- */}
      <section id="waypoints" className="w-full py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-xl mx-auto mb-16 reveal-on-scroll">
            <span className="text-xs font-mono uppercase text-[#3ED9C7] tracking-wider">ROUTE WAYPOINTS</span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white mt-2">
              How You Navigate Code with DevLens
            </h2>
            <p className="text-xs sm:text-sm text-[#8A8F9C] mt-2">
              From raw repository link to confident code changes in 4 simple stops.
            </p>
          </div>

          {/* Connected Waypoints Path Visual */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Animated Connecting Line that draws as section is scrolled */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-[#1F2330] -translate-y-6 z-0">
              <div className="h-full bg-gradient-to-r from-[#6D5EF5] via-[#3ED9C7] to-[#8B7FFF] w-full transition-all duration-1000 ease-out origin-left" />
            </div>

            {/* Stop 1 */}
            <div className="bg-[#12151D] p-6 rounded-2xl border border-[#1F2330] flex flex-col justify-between relative z-10 hover:border-[#3ED9C7]/50 transition-all reveal-on-scroll stagger-1 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-[#6D5EF5]/15 border border-[#6D5EF5]/30 text-[#8B7FFF] text-[10px] font-mono font-bold">
                    STOP 01
                  </span>
                  <GitBranch className="w-4 h-4 text-[#3ED9C7] group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-display text-base font-bold text-white mb-2">Drop a GitHub URL</h3>
                <p className="text-xs text-[#8A8F9C] leading-relaxed">
                  Provide any public GitHub repository link. DevLens clones the codebase into an isolated temporary environment with shallow history depth up to 100 commits without needing local Docker setup or API keys.
                </p>
              </div>
            </div>

            {/* Stop 2 */}
            <div className="bg-[#12151D] p-6 rounded-2xl border border-[#1F2330] flex flex-col justify-between relative z-10 hover:border-[#3ED9C7]/50 transition-all reveal-on-scroll stagger-2 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-[#6D5EF5]/15 border border-[#6D5EF5]/30 text-[#8B7FFF] text-[10px] font-mono font-bold">
                    STOP 02
                  </span>
                  <Network className="w-4 h-4 text-[#3ED9C7] group-hover:rotate-12 transition-transform" />
                </div>
                <h3 className="font-display text-base font-bold text-white mb-2">We Map Structure</h3>
                <p className="text-xs text-[#8A8F9C] leading-relaxed">
                  DevLens parses internal imports across Python, JavaScript, and TypeScript source files while parsing git commit histories to construct a live 2D dependency graph and hotspot risk map.
                </p>
              </div>
            </div>

            {/* Stop 3 */}
            <div className="bg-[#12151D] p-6 rounded-2xl border border-[#1F2330] flex flex-col justify-between relative z-10 hover:border-[#3ED9C7]/50 transition-all reveal-on-scroll stagger-3 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-[#6D5EF5]/15 border border-[#6D5EF5]/30 text-[#8B7FFF] text-[10px] font-mono font-bold">
                    STOP 03
                  </span>
                  <Zap className="w-4 h-4 text-[#F5A623] group-hover:scale-125 transition-transform" />
                </div>
                <h3 className="font-display text-base font-bold text-white mb-2">Trace Blast Radius</h3>
                <p className="text-xs text-[#8A8F9C] leading-relaxed">
                  Select any file on the spatial map or file tree to calculate direct and transitive dependents with full impact flow chains before modifying function signatures or class interfaces.
                </p>
              </div>
            </div>

            {/* Stop 4 */}
            <div className="bg-[#12151D] p-6 rounded-2xl border border-[#1F2330] flex flex-col justify-between relative z-10 hover:border-[#3ED9C7]/50 transition-all reveal-on-scroll stagger-4 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-[#6D5EF5]/15 border border-[#6D5EF5]/30 text-[#8B7FFF] text-[10px] font-mono font-bold">
                    STOP 04
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#3ED9C7] group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-display text-base font-bold text-white mb-2">Ship with Confidence</h3>
                <p className="text-xs text-[#8A8F9C] leading-relaxed">
                  Query the repository in plain English using hybrid RAG search and review cited AI file explanations to verify downstream safety before shipping PRs to production.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------- FEATURES / MAP LEGEND SECTION ------------------- */}
      <section id="features" className="w-full max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-16 reveal-on-scroll">
          <span className="text-xs font-mono uppercase text-[#3ED9C7] tracking-wider">MAP LEGEND</span>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white mt-2">
            Built for Real Codebase Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-[#8A8F9C] mt-2">
            Every feature designed specifically to prevent downstream regressions and speed up code comprehension.
          </p>
        </div>

        {/* Feature Cards Grid (6 Real Features with Purposeful Hover Interactions & Substantial Copy) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1: Blast Radius */}
          <div className="p-6 rounded-2xl bg-[#12151D] border border-[#1F2330] hover:border-[#F5A623]/60 transition-all flex flex-col justify-between reveal-on-scroll stagger-1 feature-card-blast group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[#F5A623] uppercase tracking-wider block">
                  LEGEND — BLAST RADIUS
                </span>
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-[#F5A623] blast-ring opacity-0" />
                  <Zap className="w-4 h-4 text-[#F5A623] relative z-10" />
                </div>
              </div>
              <h3 className="font-display text-base font-bold text-white mb-2">Downstream Impact Analysis</h3>
              <p className="text-xs text-[#8A8F9C] leading-relaxed">
                Calculates a reverse adjacency graph up to 3 levels deep. Identifies every direct dependent and transitive module that imports a target file, showing exact impact flow paths (e.g. <code className="text-[#3ED9C7] font-mono text-[10px]">auth.py → routes.py → App.tsx</code>) before you touch code.
              </p>
            </div>
          </div>

          {/* Feature 2: Architecture Map */}
          <div className="p-6 rounded-2xl bg-[#12151D] border border-[#1F2330] hover:border-[#3ED9C7]/60 transition-all flex flex-col justify-between reveal-on-scroll stagger-2 feature-card-map group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[#3ED9C7] uppercase tracking-wider block">
                  LEGEND — ARCHITECTURE MAP
                </span>
                {/* Mini interactive nodes that shift on hover */}
                <div className="flex gap-1 items-center">
                  <span className="h-2 w-2 rounded-full bg-[#3ED9C7] map-node-1 transition-transform" />
                  <span className="h-2 w-2 rounded-full bg-[#8B7FFF] map-node-2 transition-transform" />
                  <span className="h-2 w-2 rounded-full bg-[#F5A623] map-node-3 transition-transform" />
                </div>
              </div>
              <h3 className="font-display text-base font-bold text-white mb-2">2D Visual Node Link Graph</h3>
              <p className="text-xs text-[#8A8F9C] leading-relaxed">
                Renders an interactive spatial map of repository files as nodes and import statements as directed edges. Includes a live Blast Radius Overlay toggle to visually highlight affected downstream modules in vibrant amber.
              </p>
            </div>
          </div>

          {/* Feature 3: Hybrid Search */}
          <div className="p-6 rounded-2xl bg-[#12151D] border border-[#1F2330] hover:border-[#8B7FFF]/60 transition-all flex flex-col justify-between reveal-on-scroll stagger-3 group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[#8B7FFF] uppercase tracking-wider block">
                  LEGEND — HYBRID RAG SEARCH
                </span>
                <Search className="w-4 h-4 text-[#8B7FFF] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-display text-base font-bold text-white mb-2">Vector & Keyword Hybrid Search</h3>
              <p className="text-xs text-[#8A8F9C] leading-relaxed">
                Combines sparse keyword matching with dense sentence-transformer vector embeddings using Reciprocal Rank Fusion (RRF). Finds code whether searching by exact function name or by describing conceptual intent in natural language.
              </p>
              {/* Animated typing cursor prompt on hover */}
              <div className="mt-3 p-2 rounded-lg bg-[#0B0D12] border border-[#1F2330] text-[10px] font-mono text-[#8A8F9C] flex items-center">
                <span>search: "auth token payload"</span>
                <span className="search-cursor" />
              </div>
            </div>
          </div>

          {/* Feature 4: Git Hotspots */}
          <div className="p-6 rounded-2xl bg-[#12151D] border border-[#1F2330] hover:border-[#F5A623]/60 transition-all flex flex-col justify-between reveal-on-scroll stagger-4 feature-card-hotspot group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[#F5A623] uppercase tracking-wider block">
                  LEGEND — GIT HOTSPOTS
                </span>
                <Flame className="w-4 h-4 text-[#F5A623] hotspot-icon transition-all" />
              </div>
              <h3 className="font-display text-base font-bold text-white mb-2">Commit Edit Velocity Logs</h3>
              <p className="text-xs text-[#8A8F9C] leading-relaxed">
                Mines historical git commit logs to calculate edit frequencies and co-change churn rates. Highlights high-velocity codebase risk zones that undergo frequent modification and require rigorous test coverage.
              </p>
            </div>
          </div>

          {/* Feature 5: Onboarding Guide */}
          <div className="p-6 rounded-2xl bg-[#12151D] border border-[#1F2330] hover:border-[#3ED9C7]/60 transition-all flex flex-col justify-between reveal-on-scroll stagger-5 feature-card-[#3ED9C7] group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[#3ED9C7] uppercase tracking-wider block">
                  LEGEND — ONBOARDING GUIDE
                </span>
                <Compass className="w-4 h-4 text-[#3ED9C7] compass-icon transition-transform duration-300" />
              </div>
              <h3 className="font-display text-base font-bold text-white mb-2">Suggested Reading Order</h3>
              <p className="text-xs text-[#8A8F9C] leading-relaxed">
                Analyzes repository entry points, central import nodes, and git edit rates to generate a structured reading order and plain-English architectural walkthrough tailored for developers newly assigned to the project.
              </p>
            </div>
          </div>

          {/* Feature 6: Quality Scores */}
          <div className="p-6 rounded-2xl bg-[#12151D] border border-[#1F2330] hover:border-[#8B7FFF]/60 transition-all flex flex-col justify-between reveal-on-scroll stagger-6 feature-card-quality group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[#8B7FFF] uppercase tracking-wider block">
                  LEGEND — QUALITY SCORE
                </span>
                <BarChart3 className="w-4 h-4 text-[#8B7FFF] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-display text-base font-bold text-white mb-2">Maintainability Metrics</h3>
              <p className="text-xs text-[#8A8F9C] leading-relaxed">
                Evaluates cyclomatic complexity, coupling density, and file size to calculate composite health ratings (0-100) across every file in the repository, surfacing technical debt before refactoring cycles begin.
              </p>
              {/* Shimmer health bar on hover */}
              <div className="mt-3 w-full bg-[#0B0D12] h-1.5 rounded-full overflow-hidden border border-[#1F2330]">
                <div className="bg-[#6D5EF5] h-full w-[70%] transition-all duration-500 bar-shimmer" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------- UNDER THE HOOD (TECHNICAL ARCHITECTURE) ------------------- */}
      <section id="underthehood" className="w-full bg-[#12151D]/60 border-y border-[#1F2330] py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 reveal-on-scroll">
            <span className="text-xs font-mono uppercase text-[#6D5EF5] tracking-wider">UNDER THE HOOD — TECHNICAL ARCHITECTURE</span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white mt-2">
              Designed for Engineering Rigor, Not Just LLM Wrappers
            </h2>
            <p className="text-xs sm:text-sm text-[#8A8F9C] mt-2 leading-relaxed">
              DevLens AI combines static AST analysis, vector similarity, and git history telemetry into a deterministic local graph engine.
            </p>
          </div>

          {/* 4 Technical Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="p-6 rounded-2xl bg-[#0B0D12] border border-[#1F2330] flex gap-4 items-start reveal-on-scroll stagger-1">
              <div className="p-3 bg-[#6D5EF5]/10 border border-[#6D5EF5]/20 rounded-xl text-[#3ED9C7] shrink-0">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white mb-1.5">Tree-Sitter AST & Import Resolution</h3>
                <p className="text-xs text-[#8A8F9C] leading-relaxed">
                  Parses syntax trees across Python, JavaScript, and TypeScript to resolve relative import statements and symbol exports into an exact file dependency graph with zero hallucination risk.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B0D12] border border-[#1F2330] flex gap-4 items-start reveal-on-scroll stagger-2">
              <div className="p-3 bg-[#6D5EF5]/10 border border-[#6D5EF5]/20 rounded-xl text-[#8B7FFF] shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white mb-1.5">Reciprocal Rank Fusion (RRF)</h3>
                <p className="text-xs text-[#8A8F9C] leading-relaxed">
                  Merges BM25 sparse keyword matching with dense sentence-transformer embeddings, guaranteeing that both exact symbol lookups and conceptual natural-language queries return accurately cited code chunks.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B0D12] border border-[#1F2330] flex gap-4 items-start reveal-on-scroll stagger-3">
              <div className="p-3 bg-[#6D5EF5]/10 border border-[#6D5EF5]/20 rounded-xl text-[#F5A623] shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white mb-1.5">Git Telemetry & Churn Mining</h3>
                <p className="text-xs text-[#8A8F9C] leading-relaxed">
                  Analyzes git history logs to extract commit frequency, author count, and co-change churn patterns, surfacing codebase risk zones backed by empirical repository telemetry.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B0D12] border border-[#1F2330] flex gap-4 items-start reveal-on-scroll stagger-4">
              <div className="p-3 bg-[#6D5EF5]/10 border border-[#6D5EF5]/20 rounded-xl text-[#3ED9C7] shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white mb-1.5">Live Graph BFS Traversal</h3>
                <p className="text-xs text-[#8A8F9C] leading-relaxed">
                  Executes live Breadth-First-Search (BFS) graph traversals over cached dependency structures, returning full transitive blast radius impact chains in under 50ms without database bottlenecks.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------- FOOTER / FINAL CTA ------------------- */}
      <footer className="w-full border-t border-[#1F2330] bg-[#0B0D12] py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center mb-12 reveal-on-scroll">
          <span className="text-xs font-mono uppercase text-[#3ED9C7] tracking-wider block mb-2">READY TO NAVIGATE?</span>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white mb-4">
            Calculate your codebase route now.
          </h2>
          <p className="text-xs sm:text-sm text-[#8A8F9C] mb-8 max-w-xl mx-auto">
            Paste any public GitHub repository to map dependencies, trace blast radius, and explore code risk areas immediately.
          </p>

          {/* Final CTA Form */}
          <form onSubmit={handleAnalyze} className="w-full max-w-2xl mx-auto">
            <div className="p-2 rounded-2xl bg-[#12151D] border border-[#1F2330] flex flex-col sm:flex-row gap-2 shadow-2xl shadow-[#6D5EF5]/10 focus-within:border-[#6D5EF5]/60 transition-all">
              <div className="flex-1 flex items-center gap-3 px-3 py-2 sm:py-0">
                <MapPin className="w-5 h-5 text-[#3ED9C7] shrink-0" />
                <input 
                  type="url" 
                  required
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full bg-transparent text-[#E8E9ED] placeholder-[#8A8F9C] text-xs sm:text-sm font-mono focus:outline-none py-1.5"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#6D5EF5] hover:bg-[#8B7FFF] text-white font-medium text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-[#6D5EF5]/25 active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Analyzing...' : 'Calculate Route'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-[#1F2330]/60 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Navigation className="w-4 h-4 text-[#3ED9C7]" />
            <span className="font-display font-bold text-sm text-[#E8E9ED]">DevLens AI Engine</span>
            <span className="text-xs font-mono text-[#8A8F9C]">© 2026</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono text-[#8A8F9C]">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#6D5EF5]" />
              FastAPI Python
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#3ED9C7]" />
              Groq & Supabase
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
