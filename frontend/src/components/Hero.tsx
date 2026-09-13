import React, { useState } from 'react';
import {
  Navigation,
  MapPin,
  ArrowRight,
  Github,
  Target,
  Crosshair,
  GitFork,
  Radio
} from 'lucide-react';

export default function Hero() {
  const [repoInput, setRepoInput] = useState('');

  const handleExampleClick = (repo: string) => {
    setRepoInput(`https://github.com/${repo}`);
    console.log('Selected example route:', repo);
  };

  const handleCalculateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Calculate route clicked for:', repoInput || 'https://github.com/octocat/Spoon-Knife');
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1a1a1a] p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center font-sans antialiased selection:bg-orange-200 selection:text-orange-900">
      {/* Outer App Window Frame (thin 1px black/dark border with subtle shadow) */}
      <div className="relative w-full max-w-7xl min-h-[92vh] bg-[#faf8f5] rounded-2xl md:rounded-3xl border border-black/15 shadow-[0_20px_50px_rgba(0,0,0,0.07)] overflow-hidden flex flex-col justify-between">
        
        {/* ========================================================================= */}
        {/* BACKGROUND LAYER (topographic route lines, node markers, circuit paths) */}
        {/* ========================================================================= */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          {/* Subtle warm radial highlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-orange-200/20 via-amber-100/25 to-blue-200/15 blur-3xl rounded-full" />

          {/* SVG Map Polylines & Curves */}
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            viewBox="0 0 1200 800"
          >
            <defs>
              <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0.08" />
              </linearGradient>
              <linearGradient id="blueGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Primary Orange Trajectory */}
            <path
              d="M -50,150 Q 250,90 480,240 T 920,380 T 1250,520"
              fill="none"
              stroke="url(#orangeGrad)"
              strokeWidth="2.5"
              strokeDasharray="8 6"
              className="opacity-75"
            />
            {/* Secondary Orange Curved Spur */}
            <path
              d="M 120,60 C 280,200 350,420 620,490 S 1050,620 1250,680"
              fill="none"
              stroke="#f97316"
              strokeWidth="1.75"
              strokeOpacity="0.14"
            />

            {/* Cyan/Blue Impact Ray Paths */}
            <path
              d="M 50,750 C 280,680 400,520 620,490 S 980,260 1250,140"
              fill="none"
              stroke="url(#blueGrad)"
              strokeWidth="2"
              strokeDasharray="6 6"
              className="opacity-80"
            />
            <path
              d="M -20,480 Q 320,390 560,510 T 1150,460"
              fill="none"
              stroke="#0284c7"
              strokeWidth="1.5"
              strokeOpacity="0.12"
            />

            {/* Subtle secondary connector veins */}
            <path
              d="M 320,180 L 480,240 L 620,490 L 780,430 L 920,380"
              fill="none"
              stroke="#f97316"
              strokeWidth="1.2"
              strokeOpacity="0.10"
            />
            <path
              d="M 480,240 L 390,360 L 560,510 L 820,590"
              fill="none"
              stroke="#0284c7"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              strokeOpacity="0.12"
            />

            {/* Intersection dots & coordinate rings */}
            <circle cx="480" cy="240" r="4" fill="#f97316" fillOpacity="0.25" />
            <circle cx="620" cy="490" r="5" fill="#f97316" fillOpacity="0.30" />
            <circle cx="620" cy="490" r="10" stroke="#f97316" strokeWidth="1" strokeOpacity="0.15" fill="none" />
            <circle cx="920" cy="380" r="4" fill="#0284c7" fillOpacity="0.25" />
            <circle cx="560" cy="510" r="3.5" fill="#0284c7" fillOpacity="0.30" />
            <circle cx="390" cy="360" r="3" fill="#f97316" fillOpacity="0.25" />
          </svg>

          {/* Top-Left Map Marker: app/main.py */}
          <div className="absolute top-[18%] left-[6%] sm:left-[10%] flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-orange-200/60 shadow-xs px-2.5 py-1 rounded-full pointer-events-auto transition-transform hover:scale-105">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <Target className="w-3.5 h-3.5 text-orange-600" />
            <span className="font-mono text-[11px] font-medium text-orange-950/80">app/main.py</span>
          </div>

          {/* Bottom-Right Map Marker: frontend/src/App.tsx */}
          <div className="absolute bottom-[20%] right-[6%] sm:right-[10%] flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-sky-200/60 shadow-xs px-2.5 py-1 rounded-full pointer-events-auto transition-transform hover:scale-105">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
            <Crosshair className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-mono text-[11px] font-medium text-sky-950/80">frontend/src/App.tsx</span>
          </div>

          {/* Additional subtle node: db/schema.sql */}
          <div className="hidden lg:flex absolute top-[44%] right-[14%] items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
            <span className="font-mono text-[10px] text-gray-500">db/schema.sql</span>
          </div>

          {/* Additional subtle node: core/graph.ts */}
          <div className="hidden lg:flex absolute bottom-[35%] left-[12%] items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 rounded-full bg-sky-400"></div>
            <span className="font-mono text-[10px] text-gray-500">core/graph.ts</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. NAVBAR */}
        {/* ========================================================================= */}
        <header className="relative z-10 w-full px-5 sm:px-8 py-4 border-b border-black/[0.06] flex justify-between items-center bg-[#faf8f5]/80 backdrop-blur-md">
          {/* Left: Brand + Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md shadow-orange-500/20 text-white transform -rotate-3 hover:rotate-0 transition-transform">
              <Navigation className="w-5 h-5 fill-white/20 stroke-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-black tracking-tight text-base sm:text-lg">
                  DevLens AI
                </span>
                <span className="bg-gray-200/80 text-gray-600 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gray-300/50">
                  v0.3.0
                </span>
              </div>
              <span className="font-mono text-xs text-gray-500 tracking-tight leading-none">
                Google Maps for Codebases
              </span>
            </div>
          </div>

          {/* Right: Nav Links + GitHub Pill */}
          <div className="flex items-center gap-4 sm:gap-7">
            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700 font-mono font-medium">
              <a
                href="#telemetry"
                onClick={(e) => { e.preventDefault(); console.log('Telemetry clicked'); }}
                className="hover:text-black transition-colors"
              >
                Telemetry
              </a>
              <a
                href="#waypoints"
                onClick={(e) => { e.preventDefault(); console.log('Waypoints clicked'); }}
                className="hover:text-black transition-colors"
              >
                Waypoints
              </a>
              <a
                href="#legend"
                onClick={(e) => { e.preventDefault(); console.log('Legend clicked'); }}
                className="hover:text-black transition-colors"
              >
                Legend
              </a>
              <a
                href="#under-the-hood"
                onClick={(e) => { e.preventDefault(); console.log('Under The Hood clicked'); }}
                className="hover:text-black transition-colors"
              >
                Under The Hood
              </a>
            </nav>

            <a
              href="https://github.com/user-Rishabh/DevLens-AI"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => console.log('GitHub link clicked')}
              className="bg-black hover:bg-neutral-800 text-white rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2 shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* MAIN HERO CONTENT (Centered, max-w-4xl mx-auto, generous vertical padding) */}
        {/* ========================================================================= */}
        <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 flex flex-col items-center text-center">
          
          {/* 2. Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/70 border border-orange-200 text-orange-700 font-mono text-xs font-semibold tracking-wider mb-8 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
            </span>
            <span>NAVIGATION ROUTE CALCULATED</span>
          </div>

          {/* 3. Hero Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            <span className="text-[#1a1a1a] block">Google Maps for</span>
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 bg-clip-text text-transparent block mt-1">
              your codebase.
            </span>
          </h1>

          {/* 4. Subheading */}
          <p className="max-w-2xl mx-auto text-gray-600 text-base sm:text-lg md:text-xl leading-relaxed mb-10 sm:mb-12 font-normal">
            Calculate impact paths, trace dependency blast radius, and navigate unfamiliar repositories before touching a single line of code.
          </p>

          {/* 5. Input + CTA Row */}
          <form
            onSubmit={handleCalculateRoute}
            className="w-full max-w-2xl mx-auto bg-white rounded-2xl sm:rounded-full p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 shadow-[0_10px_35px_-5px_rgba(249,115,22,0.14),0_4px_16px_rgba(0,0,0,0.06)] border border-orange-100/90 transition-all focus-within:ring-2 focus-within:ring-orange-500/25 focus-within:border-orange-300"
          >
            {/* Left: Map Pin + Monospace Input */}
            <div className="flex items-center w-full sm:w-auto flex-1 pl-2 sm:pl-3">
              <MapPin className="w-5 h-5 text-orange-500 shrink-0 mr-2.5" />
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="https://github.com/username/repository"
                className="w-full bg-transparent border-none outline-none font-mono text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0 py-2 sm:py-0"
              />
            </div>

            {/* Right: Solid Pill Button with gradient */}
            <button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium px-6 py-3.5 rounded-full text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer shrink-0"
            >
              <span>Calculate Route</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 6. Below Input: Example Routes */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-500 font-sans">
            <span>Try example route:</span>
            <button
              type="button"
              onClick={() => handleExampleClick('octocat/Spoon-Knife')}
              className="font-mono text-gray-700 underline decoration-gray-300 underline-offset-2 hover:decoration-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
            >
              octocat/Spoon-Knife
            </button>
            <span className="text-gray-400 font-mono">•</span>
            <button
              type="button"
              onClick={() => handleExampleClick('user-Rishabh/DevLens-AI')}
              className="font-mono text-gray-700 underline decoration-gray-300 underline-offset-2 hover:decoration-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
            >
              user-Rishabh/DevLens-AI
            </button>
          </div>

          {/* Mini telemetry quick stat badges for extra dev tool vibe */}
          <div className="mt-12 pt-8 border-t border-black/[0.06] w-full max-w-xl flex items-center justify-around text-center text-xs font-mono text-gray-500">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
              <span>Real-time AST Parsing</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5 text-sky-500" />
              <span>Multi-repo Blast Radius</span>
            </div>
          </div>
        </main>

        {/* Window bottom status line (browser/app window aesthetic) */}
        <footer className="relative z-10 w-full px-6 py-3 border-t border-black/[0.05] bg-[#faf8f5]/80 flex justify-between items-center text-[11px] font-mono text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>SYSTEM READY // GPS FOR CODE ACTIVE</span>
          </div>
          <div className="hidden sm:block">
            <span>LAT 37.7749° N, LONG 122.4194° W</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
