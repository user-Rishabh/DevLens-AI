import React from 'react';
import {
  Compass,
  ShieldCheck,
  FileText,
  Lightbulb,
  GitBranch,
  Search,
  CheckCircle2,
  HelpCircle,
  Award,
  Layers,
  ArrowRight,
  ExternalLink,
  Github,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface MainWorkspaceProps {
  onSelectStage: (stage: 'stage1' | 'stage2') => void;
  hasProblemStatement: boolean;
  isRepoAnalyzed: boolean;
  repoName?: string;
}

export default function MainWorkspace({
  onSelectStage,
  hasProblemStatement,
  isRepoAnalyzed,
  repoName,
}: MainWorkspaceProps) {
  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1A1D29] flex flex-col justify-between selection:bg-[#E85D2C]/20 selection:text-[#E85D2C]">
      {/* Top Bar Header */}
      <header className="w-full border-b border-[#E5E1DA] bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E85D2C] flex items-center justify-center text-white font-bold text-base shadow-sm">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg tracking-tight text-[#1A1D29]">
                  DevLens <span className="text-[#E85D2C]">AI</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#E5E1DA]/60 border border-[#E5E1DA] text-[#6B7280]">
                  Workspace
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#6B7280]">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E85D2C]/8 text-[#E85D2C] border border-[#E85D2C]/20 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Two-Stage Developer Platform
            </span>
            <a
              href="https://github.com/user-Rishabh/DevLens-AI"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E1DA] hover:border-[#1A1D29] bg-white text-[#1A1D29] transition-all duration-150 shadow-2xs cursor-pointer font-medium"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 sm:py-16 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E1DA] text-xs font-mono text-[#6B7280] shadow-2xs mb-5">
            <span className="w-2 h-2 rounded-full bg-[#E85D2C] animate-pulse" />
            <span>Structured Intelligence for Hackathons & Technical Reviews</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#1A1D29] tracking-tight leading-[1.15] mb-5">
            From your idea to a project{' '}
            <span className="text-[#E85D2C] underline decoration-[#E85D2C]/30 underline-offset-8">
              you can defend.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed max-w-2xl mx-auto font-normal">
            Understand problems, plan solutions, analyze implementations, and prepare to explain your technical decisions.
          </p>
        </div>

        {/* Two Prominent Stage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto w-full">
          {/* ================= STAGE 1 CARD ================= */}
          <div
            onClick={() => onSelectStage('stage1')}
            className="group relative bg-white rounded-3xl border border-[#E5E1DA] hover:border-[#E85D2C]/60 p-7 sm:p-9 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            {/* Top accent badge */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E85D2C] to-[#F4A688]" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#E85D2C]/10 border border-[#E85D2C]/25 flex items-center justify-center text-[#E85D2C] shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#E85D2C] bg-[#E85D2C]/10 px-2 py-0.5 rounded">
                      Stage 1
                    </span>
                  </div>
                </div>

                {hasProblemStatement && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    PS Active
                  </span>
                )}
              </div>

              <h2 className="font-display font-bold text-2xl text-[#1A1D29] tracking-tight mb-3 group-hover:text-[#E85D2C] transition-colors">
                Explore & Plan
              </h2>

              <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
                Turn a problem statement or an early-stage idea into a well-defined solution and implementation blueprint.
              </p>

              {/* Two Entry Points Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA]/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#E5E1DA] flex items-center justify-center text-[#E85D2C] shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1A1D29] font-mono">A. Problem Statement</div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                      Upload PDF/DOCX/TXT or paste text. Extract, structure into key bullet points, and explore feasibility.
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA]/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#E5E1DA] flex items-center justify-center text-[#E85D2C] shrink-0 mt-0.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1A1D29] font-mono">B. Open Innovation</div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                      Enter an idea or prompt. Research existing tools, uncover limitations, and identify defensible USPs.
                    </div>
                  </div>
                </div>
              </div>

              {/* Deliverable pills */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#E5E1DA]/60">
                {['Architecture', 'Workflows', 'Tech Stack', 'Implementation Plan', 'DB & APIs', 'Pitch Deck'].map((item) => (
                  <span
                    key={item}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-[#E5E1DA] text-[#6B7280]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E5E1DA] flex items-center justify-between text-sm font-semibold text-[#E85D2C] group-hover:translate-x-0.5 transition-transform">
              <span>Open Stage 1 Workspace</span>
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>

          {/* ================= STAGE 2 CARD ================= */}
          <div
            onClick={() => onSelectStage('stage2')}
            className="group relative bg-white rounded-3xl border border-[#E5E1DA] hover:border-[#3B5FE0]/60 p-7 sm:p-9 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            {/* Top accent badge */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3B5FE0] to-[#7C3AED]" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#3B5FE0]/10 border border-[#3B5FE0]/25 flex items-center justify-center text-[#3B5FE0] shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#3B5FE0] bg-[#3B5FE0]/10 px-2 py-0.5 rounded">
                      Stage 2
                    </span>
                  </div>
                </div>

                {isRepoAnalyzed && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold truncate max-w-[130px]">
                    <CheckCircle2 className="w-3 h-3 text-indigo-600 shrink-0" />
                    {repoName || 'Repo Ready'}
                  </span>
                )}
              </div>

              <h2 className="font-display font-bold text-2xl text-[#1A1D29] tracking-tight mb-3 group-hover:text-[#3B5FE0] transition-colors">
                Analyze & Defend
              </h2>

              <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
                Understand your existing codebase, verify what your project implements, and prepare to explain your technical decisions.
              </p>

              {/* Capabilities Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA]/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#E5E1DA] flex items-center justify-center text-[#3B5FE0] shrink-0 mt-0.5">
                    <GitBranch className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1A1D29] font-mono">Codebase Truth & Grounded Q&A</div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                      Connect GitHub repository. Analyze AST dependencies, hotspots, and ask questions cited to file lines.
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA]/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#E5E1DA] flex items-center justify-center text-[#3B5FE0] shrink-0 mt-0.5">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1A1D29] font-mono">Judge Questions & Mock Defense</div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                      Generate tough technical judge questions, audit PS requirements vs static code, and practice defense.
                    </div>
                  </div>
                </div>
              </div>

              {/* Defense capability pills */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#E5E1DA]/60">
                {['Static Evidence', 'Judge Questions', 'Requirements Audit', 'Mock Interview', 'AST Graph', 'Blast Radius'].map((item) => (
                  <span
                    key={item}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-[#E5E1DA] text-[#6B7280]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E5E1DA] flex items-center justify-between text-sm font-semibold text-[#3B5FE0] group-hover:translate-x-0.5 transition-transform">
              <span>Open Stage 2 Workspace</span>
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* Bottom Integrity Notice */}
        <div className="mt-12 text-center text-xs font-mono text-[#6B7280] max-w-2xl mx-auto flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
          <span>
            Verifiable code evidence and grounded citations. DevLens AI never hallucinates execution status or fabricates code findings.
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#E5E1DA] bg-white py-4 px-6 text-center text-xs font-mono text-[#6B7280]">
        DevLens AI &copy; {new Date().getFullYear()} &mdash; Intelligent Developer & Hackathon Workspace
      </footer>
    </div>
  );
}
