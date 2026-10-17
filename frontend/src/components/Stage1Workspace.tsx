import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  Lightbulb,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  Layers,
  Cpu,
  GitPullRequest,
  Database,
  Presentation,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Sliders,
  ChevronRight,
  Code2
} from 'lucide-react';
import { API_BASE_URL } from '../lib/apiClient';

interface Stage1WorkspaceProps {
  onBackToMain: () => void;
  onGoToStage2: () => void;
  sharedProblemStatement: string;
  setSharedProblemStatement: (ps: string) => void;
}

type Stage1Tab = 'problem_statement' | 'open_innovation';
type DeliverableType = 'architecture' | 'workflows' | 'tech_stack' | 'implementation_plan' | 'db_api_design' | 'pitch_deck';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function Stage1Workspace({
  onBackToMain,
  onGoToStage2,
  sharedProblemStatement,
  setSharedProblemStatement,
}: Stage1WorkspaceProps) {
  const [activeTab, setActiveTab] = useState<Stage1Tab>('problem_statement');

  // Problem statement state
  const [rawPSText, setRawPSText] = useState(sharedProblemStatement || '');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [isAnalyzingPS, setIsAnalyzingPS] = useState(false);
  const [psAnalysis, setPsAnalysis] = useState<any | null>(null);
  const [psError, setPsError] = useState<string | null>(null);

  // Open innovation state
  const [innovationPrompt, setInnovationPrompt] = useState('');
  const [isExploringInnovation, setIsExploringInnovation] = useState(false);
  const [innovationAnalysis, setInnovationAnalysis] = useState<any | null>(null);
  const [innovationError, setInnovationError] = useState<string | null>(null);

  // Conversational Workspace state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Contextual Tools Panel state
  const [activeDeliverableType, setActiveDeliverableType] = useState<DeliverableType | null>(null);
  const [deliverableData, setDeliverableData] = useState<Record<string, any>>({});
  const [isGeneratingDeliverable, setIsGeneratingDeliverable] = useState(false);
  const [deliverableError, setDeliverableError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. Document Extraction & Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsExtractingDoc(true);
    setPsError(null);

    try {
      if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.csv')) {
        const text = await file.text();
        setRawPSText(text);
        setSharedProblemStatement(text);
      } else {
        // For other files, read text or provide friendly fallback
        try {
          const text = await file.text();
          // Filter readable characters
          const readable = text.replace(/[^\x20-\x7E\t\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
          if (readable.length > 50) {
            setRawPSText(readable);
            setSharedProblemStatement(readable);
          } else {
            throw new Error('Binary text stream unreadable.');
          }
        } catch {
          setPsError(`Uploaded "${file.name}". For PDF or binary documents with complex formatting, please copy and paste the problem statement text directly below.`);
        }
      }
    } catch (err: any) {
      setPsError(`Failed to extract text from file: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExtractingDoc(false);
    }
  };

  // 2. Explain Problem Statement API
  const handleAnalyzeProblemStatement = async () => {
    if (!rawPSText.trim()) {
      setPsError('Please paste or upload a problem statement first.');
      return;
    }

    setIsAnalyzingPS(true);
    setPsError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/stage1/explain-ps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem_statement: rawPSText.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to analyze problem statement.');
      }

      const data = await response.json();
      setPsAnalysis(data);
      setSharedProblemStatement(rawPSText.trim());

      // Seed conversational workspace if empty
      if (messages.length === 0) {
        setMessages([
          {
            role: 'assistant',
            content: `I have analyzed your problem statement: **${data.title || 'Project Overview'}**. I've extracted the core root problem, constraints, and target users. What would you like to explore first? We can discuss solution architectures, unique value propositions, or feasibility considerations.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setPsError(err.message || 'Error communicating with DevLens AI backend.');
    } finally {
      setIsAnalyzingPS(false);
    }
  };

  // 3. Open Innovation Exploration API
  const handleExploreInnovation = async () => {
    if (!innovationPrompt.trim()) {
      setInnovationError('Please enter an idea, topic, or research prompt.');
      return;
    }

    setIsExploringInnovation(true);
    setInnovationError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/stage1/explore-open-innovation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: innovationPrompt.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to explore innovation topic.');
      }

      const data = await response.json();
      setInnovationAnalysis(data);

      // Seed conversational workspace if empty
      if (messages.length === 0) {
        setMessages([
          {
            role: 'assistant',
            content: `I've explored the landscape for: **${data.refined_concept || innovationPrompt}**. I mapped incumbent solutions, their critical limitations, and strong differentiation angles. Ask me anything to refine this concept further or generate a full technical blueprint!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setInnovationError(err.message || 'Error communicating with DevLens AI backend.');
    } finally {
      setIsExploringInnovation(false);
    }
  };

  // 4. Conversational Chat API
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsChatLoading(true);

    const activeContext = activeTab === 'problem_statement' ? rawPSText : innovationPrompt;

    try {
      const response = await fetch(`${API_BASE_URL}/api/stage1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: activeContext || 'No raw context provided yet. Guide the user in scoping their project.',
          mode: activeTab,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI.');
      }

      const data = await response.json();
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Unable to connect to the reasoning server.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  // 5. On-Demand Deliverable Generator
  const handleGenerateDeliverable = async (type: DeliverableType) => {
    setActiveDeliverableType(type);
    if (deliverableData[type]) return; // Already cached

    setIsGeneratingDeliverable(true);
    setDeliverableError(null);

    const activeContext = activeTab === 'problem_statement' ? rawPSText : innovationPrompt;
    const conversationNotes = messages.map((m) => `${m.role}: ${m.content}`).slice(-4).join('\n');

    try {
      const response = await fetch(`${API_BASE_URL}/api/stage1/generate-deliverable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverable_type: type,
          context: activeContext || 'General hackathon project plan',
          conversation_notes: conversationNotes,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to generate ${type}`);
      }

      const data = await response.json();
      setDeliverableData((prev) => ({ ...prev, [type]: data }));
    } catch (err: any) {
      console.error(err);
      setDeliverableError(err.message || 'Failed to generate deliverable.');
    } finally {
      setIsGeneratingDeliverable(false);
    }
  };

  const deliverableTools: { type: DeliverableType; label: string; icon: React.ReactNode; desc: string }[] = [
    { type: 'architecture', label: 'Architecture Diagram', icon: <Layers className="w-4 h-4 text-[#E85D2C]" />, desc: 'System nodes, layers & data flow' },
    { type: 'workflows', label: 'User Workflows', icon: <GitPullRequest className="w-4 h-4 text-[#3B5FE0]" />, desc: 'Step-by-step user journeys & failures' },
    { type: 'tech_stack', label: 'Tech-Stack Strategy', icon: <Cpu className="w-4 h-4 text-[#7C3AED]" />, desc: 'Framework choices & defensible trade-offs' },
    { type: 'implementation_plan', label: 'Implementation Plan', icon: <Sliders className="w-4 h-4 text-[#059669]" />, desc: 'Sprint phases, hours & checkpoints' },
    { type: 'db_api_design', label: 'Database & API Design', icon: <Database className="w-4 h-4 text-[#D97706]" />, desc: 'Entity schemas & REST endpoints' },
    { type: 'pitch_deck', label: 'PPT & Pitch Content', icon: <Presentation className="w-4 h-4 text-[#DC2626]" />, desc: 'Slide structure, elevator pitch & demo' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1A1D29] flex flex-col">
      {/* Top Bar Header with Breadcrumbs */}
      <header className="border-b border-[#E5E1DA] bg-white sticky top-0 z-30 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToMain}
              className="flex items-center gap-1.5 text-xs font-mono text-[#6B7280] hover:text-[#1A1D29] transition-colors p-1 rounded-md hover:bg-[#FAFAF7] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Workspace</span>
            </button>
            <span className="text-[#E5E1DA]">/</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#E85D2C] bg-[#E85D2C]/10 px-2 py-0.5 rounded">
                Stage 1
              </span>
              <span className="text-sm font-display font-bold text-[#1A1D29]">Explore & Plan</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onGoToStage2}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#3B5FE0]/40 bg-[#3B5FE0]/10 hover:bg-[#3B5FE0] text-[#3B5FE0] hover:text-white text-xs font-mono font-semibold transition-all shadow-2xs cursor-pointer"
            >
              <span>Stage 2 — Analyze & Defend</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Entry Point Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E1DA]">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white border border-[#E5E1DA] shadow-2xs w-fit">
            <button
              onClick={() => setActiveTab('problem_statement')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeTab === 'problem_statement'
                  ? 'bg-[#E85D2C] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#1A1D29]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A. Problem Statement</span>
            </button>
            <button
              onClick={() => setActiveTab('open_innovation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeTab === 'open_innovation'
                  ? 'bg-[#E85D2C] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#1A1D29]'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>B. Open Innovation</span>
            </button>
          </div>

          <div className="text-xs font-mono text-[#6B7280]">
            {activeTab === 'problem_statement'
              ? 'Extract and dissect requirements from your challenge statement.'
              : 'Research existing solutions and architect defensible market moats.'}
          </div>
        </div>

        {/* ================= TAB A: PROBLEM STATEMENT ================= */}
        {activeTab === 'problem_statement' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Input & Document Extraction (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#E5E1DA] shadow-2xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-mono text-[#1A1D29] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#E85D2C]" />
                    Problem Statement Document
                  </h3>
                  {rawPSText && (
                    <span className="text-[11px] font-mono text-[#6B7280]">
                      {rawPSText.split(/\s+/).filter(Boolean).length} words
                    </span>
                  )}
                </div>

                {/* Upload Area */}
                <label className="border-2 border-dashed border-[#E5E1DA] hover:border-[#E85D2C]/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#FAFAF7] hover:bg-[#FFF4EE]/40 flex flex-col items-center justify-center gap-2">
                  <Upload className="w-5 h-5 text-[#E85D2C]" />
                  <div className="text-xs font-mono text-[#1A1D29]">
                    <span className="font-bold text-[#E85D2C]">Click to upload</span> or drag and drop
                  </div>
                  <div className="text-[10px] font-mono text-[#6B7280]">
                    PDF, DOCX, TXT, MD, JSON (document text extracted before analysis)
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md,.json,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {uploadedFileName && (
                  <div className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                    <span className="truncate">Loaded: {uploadedFileName}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </div>
                )}

                {/* Direct Paste / Textarea preview */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-mono text-[#6B7280]">
                    <span>Extracted Document Text / Paste Direct</span>
                    <button
                      onClick={() => setRawPSText('')}
                      className="hover:text-red-500 transition-colors cursor-pointer text-[11px]"
                    >
                      Clear
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={rawPSText}
                    onChange={(e) => {
                      setRawPSText(e.target.value);
                      setSharedProblemStatement(e.target.value);
                    }}
                    placeholder="Paste the problem statement here, or review the extracted document text..."
                    className="w-full p-3 rounded-xl border border-[#E5E1DA] bg-white text-xs font-mono text-[#1A1D29] focus:outline-none focus:border-[#E85D2C] leading-relaxed resize-y"
                  />
                </div>

                {psError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{psError}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAnalyzeProblemStatement}
                    disabled={isAnalyzingPS || !rawPSText.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#E85D2C] hover:bg-[#D45022] text-white text-xs font-mono font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAnalyzingPS ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Structuring Problem...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Explain & Structure Problem</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Transfer to Stage 2 Pill Card */}
              {rawPSText.trim() && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-200/80 flex items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="text-xs font-mono font-bold text-indigo-900">Ready to audit code?</div>
                    <div className="text-[11px] font-mono text-indigo-700">
                      Transfer this PS to Stage 2 for Requirements Verification.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSharedProblemStatement(rawPSText.trim());
                      onGoToStage2();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-semibold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Send to Stage 2</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Structured Explanation & Cards (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {psAnalysis ? (
                <div className="p-6 rounded-2xl bg-white border border-[#E5E1DA] shadow-xs flex flex-col gap-5 animate-fade-in">
                  <div className="flex items-start justify-between border-b border-[#E5E1DA] pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#E85D2C] font-bold bg-[#E85D2C]/10 px-2 py-0.5 rounded">
                        Structured Breakdown
                      </span>
                      <h2 className="text-xl font-bold font-display text-[#1A1D29] mt-2">
                        {psAnalysis.title || 'Problem Statement Analysis'}
                      </h2>
                      <p className="text-xs text-[#6B7280] leading-relaxed mt-1 font-mono">
                        {psAnalysis.summary}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(JSON.stringify(psAnalysis, null, 2), 'ps')}
                      className="p-1.5 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:text-[#1A1D29] text-xs font-mono flex items-center gap-1 cursor-pointer"
                      title="Copy JSON"
                    >
                      {copiedKey === 'ps' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Core Problem Callout */}
                  <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200">
                    <div className="text-xs font-mono font-bold text-orange-900 mb-1">Root Cause & Core Pain Point</div>
                    <div className="text-xs text-orange-800 leading-relaxed font-mono">
                      {psAnalysis.core_problem}
                    </div>
                  </div>

                  {/* Two column grid for personas & constraints */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA]">
                      <div className="text-xs font-mono font-bold text-[#1A1D29] mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3B5FE0]" />
                        Target Beneficiaries
                      </div>
                      <ul className="text-xs font-mono text-[#6B7280] space-y-1.5">
                        {psAnalysis.target_beneficiaries?.map((p: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#3B5FE0]">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA]">
                      <div className="text-xs font-mono font-bold text-[#1A1D29] mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E85D2C]" />
                        Technical Constraints
                      </div>
                      <ul className="text-xs font-mono text-[#6B7280] space-y-1.5">
                        {psAnalysis.technical_constraints?.map((c: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#E85D2C]">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Key Requirements Checklist */}
                  <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA]">
                    <div className="text-xs font-mono font-bold text-[#1A1D29] mb-2.5 flex items-center justify-between">
                      <span>Must-Have Functional Deliverables</span>
                      <span className="text-[10px] text-[#6B7280]">
                        {psAnalysis.key_functional_requirements?.length || 0} items
                      </span>
                    </div>
                    <div className="space-y-2">
                      {psAnalysis.key_functional_requirements?.map((req: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-white border border-[#E5E1DA] text-xs font-mono text-[#1A1D29] flex items-start gap-2 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expected Outcomes */}
                  {psAnalysis.expected_outcomes && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                      <div className="text-xs font-mono font-bold text-emerald-900 mb-1.5">Expected Tangible Outcomes</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {psAnalysis.expected_outcomes.map((out: string, idx: number) => (
                          <div key={idx} className="text-xs font-mono text-emerald-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{out}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 rounded-2xl bg-white border border-[#E5E1DA] shadow-2xs flex flex-col items-center justify-center text-center my-auto min-h-[350px]">
                  <div className="w-12 h-12 rounded-2xl bg-[#E85D2C]/10 border border-[#E85D2C]/20 flex items-center justify-center text-[#E85D2C] mb-4">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold font-display text-[#1A1D29] mb-1">
                    Structured Explanation Awaiting
                  </h3>
                  <p className="text-xs font-mono text-[#6B7280] max-w-sm mb-4 leading-relaxed">
                    Paste your problem statement or upload a challenge brief to generate a forensic breakdown of pain points, personas, constraints, and requirements.
                  </p>
                  <button
                    onClick={() => {
                      const samplePS = `Design an autonomous AI governance and codebase verification agent that evaluates whether developers met all stated hackathon criteria, verifies static code evidence, maps internal dependencies, and tests developers on their technical choices prior to final judging. Must support sub-second query response, secret sanitization, and grounded citations to exact files and lines.`;
                      setRawPSText(samplePS);
                      setSharedProblemStatement(samplePS);
                    }}
                    className="text-xs font-mono text-[#E85D2C] hover:underline cursor-pointer"
                  >
                    + Load sample problem statement
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB B: OPEN INNOVATION ================= */}
        {activeTab === 'open_innovation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Input & Prompt (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#E5E1DA] shadow-2xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-mono text-[#1A1D29] flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-[#E85D2C]" />
                    Open Innovation & Idea Scoping
                  </h3>
                </div>

                <p className="text-xs font-mono text-[#6B7280] leading-relaxed">
                  Enter an early-stage concept, market hypothesis, or research theme. DevLens AI will research existing incumbent solutions, surface their critical limitations, and recommend defensible differentiation angles.
                </p>

                <textarea
                  rows={6}
                  value={innovationPrompt}
                  onChange={(e) => setInnovationPrompt(e.target.value)}
                  placeholder="e.g. A privacy-preserving biometric authenticator for off-grid clinical workers, using local on-device zero-knowledge proofs..."
                  className="w-full p-3 rounded-xl border border-[#E5E1DA] bg-white text-xs font-mono text-[#1A1D29] focus:outline-none focus:border-[#E85D2C] leading-relaxed resize-y"
                />

                {/* Sample Prompt Chips */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-mono text-[#6B7280]">Sample Exploration Topics:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Autonomous supply-chain SBOM vulnerability triage agent',
                      'Zero-knowledge code provenance attestations for open-source PRs',
                      'Local edge IoT telemetry anomaly detection for solar grids',
                    ].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setInnovationPrompt(topic)}
                        className="text-[10px] font-mono px-2 py-1 rounded-md bg-[#FAFAF7] hover:bg-[#FFF4EE] border border-[#E5E1DA] hover:border-[#E85D2C]/40 text-[#6B7280] hover:text-[#E85D2C] transition-colors text-left cursor-pointer"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {innovationError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{innovationError}</span>
                  </div>
                )}

                <button
                  onClick={handleExploreInnovation}
                  disabled={isExploringInnovation || !innovationPrompt.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E85D2C] hover:bg-[#D45022] text-white text-xs font-mono font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isExploringInnovation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Researching Landscape...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Explore Innovation Landscape</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Research & Differentiation Output (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {innovationAnalysis ? (
                <div className="p-6 rounded-2xl bg-white border border-[#E5E1DA] shadow-xs flex flex-col gap-5 animate-fade-in">
                  <div className="flex items-start justify-between border-b border-[#E5E1DA] pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#3B5FE0] font-bold bg-[#3B5FE0]/10 px-2 py-0.5 rounded">
                        Market & Technical Moat
                      </span>
                      <h2 className="text-xl font-bold font-display text-[#1A1D29] mt-2">
                        {innovationAnalysis.refined_concept || 'Innovation Scoping'}
                      </h2>
                      <p className="text-xs text-[#6B7280] leading-relaxed mt-1 font-mono">
                        {innovationAnalysis.market_context}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(JSON.stringify(innovationAnalysis, null, 2), 'innov')}
                      className="p-1.5 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:text-[#1A1D29] text-xs font-mono flex items-center gap-1 cursor-pointer"
                      title="Copy JSON"
                    >
                      {copiedKey === 'innov' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Incumbent Solutions & Flaws */}
                  <div>
                    <div className="text-xs font-mono font-bold text-[#1A1D29] mb-2.5">
                      Existing Market Solutions & Their Flaws
                    </div>
                    <div className="space-y-2.5">
                      {innovationAnalysis.existing_solutions?.map((sol: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold font-mono text-[#1A1D29]">{sol.name}</span>
                            <span className="text-[10px] font-mono text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                              Limitation
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-[#6B7280] mb-1">
                            <strong className="text-[#1A1D29]">Approach:</strong> {sol.approach}
                          </div>
                          <div className="text-[11px] font-mono text-red-700">
                            <strong className="text-red-800">Gap:</strong> {sol.limitation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Differentiation & USPs */}
                  <div>
                    <div className="text-xs font-mono font-bold text-emerald-900 mb-2.5">
                      Defensible Opportunities & USPs
                    </div>
                    <div className="space-y-2.5">
                      {innovationAnalysis.differentiation_opportunities?.map((diff: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                          <div className="text-xs font-bold font-mono text-emerald-950 mb-1">
                            ✨ {diff.usp}
                          </div>
                          <div className="text-[11px] font-mono text-emerald-800">
                            <strong>Technical Implementation:</strong> {diff.technical_edge}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Winning MVP Scope */}
                  {innovationAnalysis.suggested_mvp_scope && (
                    <div className="p-4 rounded-xl bg-white border border-[#E5E1DA]">
                      <div className="text-xs font-mono font-bold text-[#1A1D29] mb-2">Winning Demo MVP Scope</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {innovationAnalysis.suggested_mvp_scope.map((item: string, idx: number) => (
                          <div key={idx} className="p-2 rounded-lg bg-[#FAFAF7] border border-[#E5E1DA] text-xs font-mono text-[#1A1D29] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E85D2C]" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 rounded-2xl bg-white border border-[#E5E1DA] shadow-2xs flex flex-col items-center justify-center text-center my-auto min-h-[350px]">
                  <div className="w-12 h-12 rounded-2xl bg-[#3B5FE0]/10 border border-[#3B5FE0]/20 flex items-center justify-center text-[#3B5FE0] mb-4">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold font-display text-[#1A1D29] mb-1">
                    Open Innovation Research Awaiting
                  </h3>
                  <p className="text-xs font-mono text-[#6B7280] max-w-sm mb-4 leading-relaxed">
                    Enter an idea or select a sample topic to analyze market gaps, existing tools, and defensible technical edges.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= CONVERSATIONAL WORKSPACE ================= */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E1DA] shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#E5E1DA] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#E85D2C]/10 border border-[#E85D2C]/20 flex items-center justify-center text-[#E85D2C]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-[#1A1D29]">
                  Conversational Planning Workspace
                </h3>
                <div className="text-[11px] font-mono text-[#6B7280]">
                  Grounded in:{' '}
                  <span className="font-semibold text-[#E85D2C]">
                    {activeTab === 'problem_statement' ? 'Problem Statement Context' : 'Open Innovation Context'}
                  </span>
                </div>
              </div>
            </div>

            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-[11px] font-mono text-[#6B7280] hover:text-[#1A1D29] cursor-pointer"
              >
                Reset Chat
              </button>
            )}
          </div>

          {/* Chat Messages Log */}
          <div className="flex flex-col gap-3 min-h-[160px] max-h-[340px] overflow-y-auto pr-2">
            {messages.length === 0 ? (
              <div className="my-auto py-8 text-center text-xs font-mono text-[#6B7280]">
                Ask questions about technical trade-offs, architecture patterns, API models, or competitive angles.
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-mono leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#1A1D29] text-white rounded-br-xs'
                        : 'bg-[#FAFAF7] border border-[#E5E1DA] text-[#1A1D29] rounded-bl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div
                      className={`text-[9px] mt-1 text-right ${
                        m.role === 'user' ? 'text-white/60' : 'text-[#6B7280]'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#E85D2C] py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Formulating technical insights...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Question Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              'What database schema best fits this data model?',
              'How can we minimize latency during live judging?',
              'What are 3 hard questions judges will ask us?',
              'What should be our 2-minute demo golden path?',
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInputMessage(q);
                }}
                className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#FAFAF7] hover:bg-[#FFF4EE] border border-[#E5E1DA] hover:border-[#E85D2C]/40 text-[#6B7280] hover:text-[#E85D2C] transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything about technical choices, feasibility, or implementation..."
              className="flex-1 p-2.5 rounded-xl border border-[#E5E1DA] bg-white text-xs font-mono text-[#1A1D29] focus:outline-none focus:border-[#E85D2C]"
            />
            <button
              type="submit"
              disabled={isChatLoading || !inputMessage.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#1A1D29] hover:bg-[#E85D2C] text-white text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* ================= CONTEXTUAL TOOLS PANEL (ON-DEMAND) ================= */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E1DA] shadow-xs flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E1DA] pb-3">
            <div>
              <h3 className="text-sm font-bold font-mono text-[#1A1D29] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#E85D2C]" />
                On-Demand Technical Deliverables
              </h3>
              <p className="text-xs font-mono text-[#6B7280] mt-0.5">
                Generate specific blueprints and presentation assets on request without clutter.
              </p>
            </div>
            {activeDeliverableType && (
              <span className="text-[11px] font-mono text-[#E85D2C] bg-[#E85D2C]/10 px-2 py-0.5 rounded w-fit">
                Viewing: {activeDeliverableType.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* 6 On-Demand Tool Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {deliverableTools.map((tool) => {
              const isSelected = activeDeliverableType === tool.type;
              const isCached = !!deliverableData[tool.type];
              return (
                <button
                  key={tool.type}
                  onClick={() => handleGenerateDeliverable(tool.type)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#E85D2C] bg-[#FFF4EE]/60 shadow-xs'
                      : 'border-[#E5E1DA] hover:border-[#E85D2C]/40 bg-white hover:bg-[#FAFAF7]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-lg bg-[#FAFAF7] border border-[#E5E1DA]">{tool.icon}</div>
                    {isCached && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Ready" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold font-mono text-[#1A1D29] leading-tight mb-1">
                      {tool.label}
                    </div>
                    <div className="text-[10px] font-mono text-[#6B7280] line-clamp-2 leading-tight">
                      {tool.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Deliverable Output Preview Area */}
          {activeDeliverableType && (
            <div className="p-5 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA] mt-2">
              <div className="flex items-center justify-between border-b border-[#E5E1DA] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-[#1A1D29] uppercase tracking-wider">
                    {deliverableData[activeDeliverableType]?.title || activeDeliverableType.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {deliverableData[activeDeliverableType] && (
                    <button
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(deliverableData[activeDeliverableType], null, 2),
                          'deliv'
                        )
                      }
                      className="px-2.5 py-1 rounded border border-[#E5E1DA] bg-white text-[#6B7280] hover:text-[#1A1D29] text-xs font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'deliv' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleGenerateDeliverable(activeDeliverableType)}
                    disabled={isGeneratingDeliverable}
                    className="p-1 rounded border border-[#E5E1DA] bg-white text-[#6B7280] hover:text-[#1A1D29] text-xs font-mono cursor-pointer"
                    title="Regenerate"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingDeliverable ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {isGeneratingDeliverable ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs font-mono text-[#E85D2C]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Synthesizing {activeDeliverableType.replace('_', ' ')} deliverable...</span>
                </div>
              ) : deliverableError ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-700">
                  {deliverableError}
                </div>
              ) : deliverableData[activeDeliverableType] ? (
                <div className="space-y-4 text-xs font-mono">
                  {/* Architecture Deliverable Render */}
                  {activeDeliverableType === 'architecture' && (
                    <div className="space-y-4">
                      {deliverableData.architecture.mermaid && (
                        <div className="p-4 rounded-xl bg-white border border-[#E5E1DA]">
                          <div className="text-[11px] font-bold text-[#6B7280] mb-2 uppercase">
                            Mermaid Architecture Definition
                          </div>
                          <pre className="p-3 rounded-lg bg-[#1A1D29] text-emerald-400 text-xs overflow-x-auto leading-relaxed">
                            {deliverableData.architecture.mermaid}
                          </pre>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {deliverableData.architecture.components?.map((c: any, idx: number) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#E5E1DA]">
                            <div className="font-bold text-[#1A1D29] mb-1">{c.name}</div>
                            <div className="text-[#6B7280] text-[11px] mb-2">{c.role}</div>
                            <div className="text-[#E85D2C] text-[10px] font-semibold bg-[#E85D2C]/10 px-2 py-0.5 rounded w-fit">
                              {c.tech}
                            </div>
                          </div>
                        ))}
                      </div>

                      {deliverableData.architecture.data_flow_steps && (
                        <div className="p-4 rounded-xl bg-white border border-[#E5E1DA]">
                          <div className="font-bold text-[#1A1D29] mb-2">Data Flow Sequence</div>
                          <ul className="space-y-1.5 text-[#6B7280]">
                            {deliverableData.architecture.data_flow_steps.map((s: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-[#E85D2C] font-bold">{idx + 1}.</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Workflows Deliverable Render */}
                  {activeDeliverableType === 'workflows' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-white border border-[#E5E1DA]">
                        <div className="font-bold text-[#1A1D29] mb-3">Primary User & System Flow</div>
                        <div className="space-y-2">
                          {deliverableData.workflows.primary_flow?.map((item: any, idx: number) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-[#FAFAF7] border border-[#E5E1DA] flex items-start gap-3">
                              <span className="w-5 h-5 rounded-full bg-[#3B5FE0]/15 text-[#3B5FE0] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                {item.step || idx + 1}
                              </span>
                              <div>
                                <div className="text-[#1A1D29] font-bold">
                                  [{item.actor}]: {item.action}
                                </div>
                                <div className="text-[#6B7280] text-[11px] mt-0.5">{item.state_change}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {deliverableData.workflows.edge_case_recovery && (
                        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                          <div className="font-bold text-amber-950 mb-2">Edge-Case Resilience & Recovery</div>
                          <div className="space-y-2">
                            {deliverableData.workflows.edge_case_recovery.map((e: any, idx: number) => (
                              <div key={idx} className="text-amber-900 text-[11px]">
                                <strong>⚠️ {e.failure_scenario}:</strong> {e.handling}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tech Stack Deliverable Render */}
                  {activeDeliverableType === 'tech_stack' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {deliverableData.tech_stack.layers?.map((l: any, idx: number) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#E5E1DA]">
                            <div className="text-[10px] uppercase font-bold text-[#7C3AED] mb-1">{l.category}</div>
                            <div className="text-sm font-bold text-[#1A1D29] mb-1">{l.choice}</div>
                            <div className="text-[#6B7280] text-[11px] mb-2">
                              <strong>Why:</strong> {l.rationale}
                            </div>
                            <div className="text-amber-800 text-[10px] bg-amber-50 border border-amber-200 p-1.5 rounded">
                              <strong>Trade-off:</strong> {l.trade_offs}
                            </div>
                          </div>
                        ))}
                      </div>

                      {deliverableData.tech_stack.why_defensible && (
                        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                          <div className="font-bold mb-1">How to Defend to Judges</div>
                          <div className="text-xs text-emerald-900 leading-relaxed">
                            {deliverableData.tech_stack.why_defensible}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Implementation Plan Render */}
                  {activeDeliverableType === 'implementation_plan' && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {deliverableData.implementation_plan.phases?.map((p: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl bg-white border border-[#E5E1DA]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-[#1A1D29]">{p.phase}</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                {p.duration}
                              </span>
                            </div>
                            <ul className="space-y-1 mb-2 text-[#6B7280] text-[11px]">
                              {p.tasks?.map((t: string, tidx: number) => (
                                <li key={tidx} className="flex items-center gap-2">
                                  <span className="text-emerald-600 font-bold">✓</span>
                                  <span>{t}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="text-[10px] text-[#1A1D29] bg-[#FAFAF7] p-2 rounded border border-[#E5E1DA]">
                              <strong>Checkpoint:</strong> {p.checkpoint}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Database & API Design Render */}
                  {activeDeliverableType === 'db_api_design' && (
                    <div className="space-y-4">
                      {deliverableData.db_api_design.entities && (
                        <div className="p-4 rounded-xl bg-white border border-[#E5E1DA]">
                          <div className="font-bold text-[#1A1D29] mb-3">Database Entities & Schemas</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {deliverableData.db_api_design.entities.map((e: any, idx: number) => (
                              <div key={idx} className="p-3 rounded-lg bg-[#FAFAF7] border border-[#E5E1DA]">
                                <div className="font-bold text-[#D97706] mb-1.5">{e.table_name}</div>
                                <div className="space-y-1">
                                  {e.fields?.map((f: any, fidx: number) => (
                                    <div key={fidx} className="flex justify-between text-[11px] text-[#6B7280]">
                                      <span>{f.name}</span>
                                      <span className="font-mono text-[#1A1D29]">{f.type}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {deliverableData.db_api_design.api_endpoints && (
                        <div className="p-4 rounded-xl bg-white border border-[#E5E1DA]">
                          <div className="font-bold text-[#1A1D29] mb-3">Core API Route Contracts</div>
                          <div className="space-y-2">
                            {deliverableData.db_api_design.api_endpoints.map((ep: any, idx: number) => (
                              <div key={idx} className="p-2.5 rounded-lg bg-[#FAFAF7] border border-[#E5E1DA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D97706]/15 text-[#D97706]">
                                    {ep.method}
                                  </span>
                                  <span className="font-bold text-[#1A1D29]">{ep.path}</span>
                                </div>
                                <div className="text-[11px] text-[#6B7280]">{ep.summary}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pitch Deck Render */}
                  {activeDeliverableType === 'pitch_deck' && (
                    <div className="space-y-4">
                      {deliverableData.pitch_deck.elevator_pitch && (
                        <div className="p-4 rounded-xl bg-red-50/70 border border-red-200">
                          <div className="font-bold text-red-950 mb-1">30-Second Elevator Pitch</div>
                          <div className="text-xs text-red-900 leading-relaxed font-mono">
                            "{deliverableData.pitch_deck.elevator_pitch}"
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {deliverableData.pitch_deck.slides?.map((s: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl bg-white border border-[#E5E1DA]">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-[#1A1D29]">
                                Slide {s.slide_number}: {s.slide_title}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-[#E85D2C] mb-2">{s.headline}</div>
                            <ul className="space-y-1 mb-2 text-[#6B7280] text-[11px]">
                              {s.bullet_points?.map((bp: string, bidx: number) => (
                                <li key={bidx}>• {bp}</li>
                              ))}
                            </ul>
                            <div className="p-2 rounded bg-[#FAFAF7] border border-[#E5E1DA] text-[11px] text-[#1A1D29]">
                              <strong>Presenter Script:</strong> {s.talking_points}
                            </div>
                          </div>
                        ))}
                      </div>

                      {deliverableData.pitch_deck.demo_golden_path && (
                        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                          <div className="font-bold mb-1">2-Minute Live Demo Golden Path</div>
                          <div className="text-xs text-emerald-900 leading-relaxed">
                            {deliverableData.pitch_deck.demo_golden_path}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
