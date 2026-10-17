import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  HelpCircle,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileCode2,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Scale,
  MessageSquare
} from 'lucide-react';
import { API_BASE_URL } from '../lib/apiClient';

interface DefenseSuiteProps {
  repoId: string;
  repoName: string;
  sharedProblemStatement: string;
  onSelectFilePath?: (filePath: string) => void;
}

type DefenseTab = 'judge_questions' | 'requirements_audit' | 'mock_interview';

export default function DefenseSuite({
  repoId,
  repoName,
  sharedProblemStatement,
  onSelectFilePath,
}: DefenseSuiteProps) {
  const [activeTab, setActiveTab] = useState<DefenseTab>('judge_questions');

  // 1. Judge Questions State
  const [judgeQuestions, setJudgeQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(1);

  // 2. Requirements Audit State
  const [auditPS, setAuditPS] = useState(sharedProblemStatement || '');
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // 3. Mock Defense Simulator State
  const [selectedQuestion, setSelectedQuestion] = useState<string>(
    'How do you handle unexpected service failures, and what trade-offs did you make in your architecture?'
  );
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluatingDefense, setIsEvaluatingDefense] = useState(false);
  const [defenseFeedback, setDefenseFeedback] = useState<any | null>(null);
  const [defenseError, setDefenseError] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Sync shared problem statement if local auditPS is empty
  useEffect(() => {
    if (!auditPS && sharedProblemStatement) {
      setAuditPS(sharedProblemStatement);
    }
  }, [sharedProblemStatement]);

  // Fetch Judge Questions
  const fetchJudgeQuestions = async () => {
    setIsLoadingQuestions(true);
    setQuestionsError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/stage2/${repoId}/judge-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_name: repoName }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate judge questions.');
      }

      const data = await response.json();
      setJudgeQuestions(data.judge_questions || []);
      if (data.judge_questions && data.judge_questions.length > 0) {
        setExpandedQuestionId(data.judge_questions[0].id);
        setSelectedQuestion(data.judge_questions[0].question);
      }
    } catch (err: any) {
      console.error(err);
      setQuestionsError(err.message || 'Error communicating with backend.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (repoId && judgeQuestions.length === 0) {
      fetchJudgeQuestions();
    }
  }, [repoId]);

  // Run Requirements Audit
  const handleRunAudit = async () => {
    if (!auditPS.trim()) {
      setAuditError('Please provide a problem statement to compare against the repository.');
      return;
    }

    setIsLoadingAudit(true);
    setAuditError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/stage2/${repoId}/verify-requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem_statement: auditPS.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to audit requirements against repository.');
      }

      const data = await response.json();
      setAuditResult(data);
    } catch (err: any) {
      console.error(err);
      setAuditError(err.message || 'Requirements audit failed.');
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // Run Mock Interview Defense Evaluation
  const handleEvaluateDefense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || isEvaluatingDefense) return;

    setIsEvaluatingDefense(true);
    setDefenseError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/stage2/${repoId}/mock-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: selectedQuestion,
          user_answer: userAnswer.trim(),
          repo_name: repoName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate mock defense.');
      }

      const data = await response.json();
      setDefenseFeedback(data);
    } catch (err: any) {
      console.error(err);
      setDefenseError(err.message || 'Evaluation failed.');
    } finally {
      setIsEvaluatingDefense(false);
    }
  };

  const statusBadges: Record<string, { label: string; bg: string; text: string; border: string }> = {
    implemented: {
      label: 'Implemented',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    partially_implemented: {
      label: 'Partially Implemented',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
    },
    not_found: {
      label: 'Not Found',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    },
    requires_manual_verification: {
      label: 'Manual Verification Required',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
    },
  };

  return (
    <div className="pt-2 sm:pt-3 px-6 pb-12 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1DA] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#3B5FE0] bg-[#3B5FE0]/10 px-2.5 py-0.5 rounded">
              Stage 2 &bull; Project Defense Suite
            </span>
            <span className="text-xs font-mono text-[#6B7280]">
              Repository: <strong className="text-[#1A1D29]">{repoName}</strong>
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-[#1A1D29]">
            Prepare to Explain & Defend Technical Choices
          </h2>
          <p className="text-xs font-mono text-[#6B7280] mt-1 max-w-2xl">
            Simulate rigorous judge interactions, verify stated requirements against actual static code evidence, and receive feedback before stepping onto the stage.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-[#E5E1DA] shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('judge_questions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'judge_questions'
                ? 'bg-[#3B5FE0] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#1A1D29]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Judge Questions</span>
          </button>
          <button
            onClick={() => setActiveTab('requirements_audit')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'requirements_audit'
                ? 'bg-[#3B5FE0] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#1A1D29]'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Requirements Audit</span>
          </button>
          <button
            onClick={() => setActiveTab('mock_interview')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'mock_interview'
                ? 'bg-[#3B5FE0] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#1A1D29]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Mock Defense</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: TECHNICAL JUDGE QUESTIONS ================= */}
      {activeTab === 'judge_questions' && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-[#6B7280]">
              Tough, realistic technical judge questions synthesized from your internal dependencies, hotspots, and architecture.
            </div>
            <button
              onClick={fetchJudgeQuestions}
              disabled={isLoadingQuestions}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#E5E1DA] bg-white hover:bg-[#FAFAF7] text-xs font-mono text-[#6B7280] hover:text-[#1A1D29] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingQuestions ? 'animate-spin' : ''}`} />
              <span>Regenerate Questions</span>
            </button>
          </div>

          {isLoadingQuestions ? (
            <div className="p-16 rounded-2xl bg-white border border-[#E5E1DA] flex flex-col items-center justify-center gap-3 text-xs font-mono text-[#3B5FE0]">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Analyzing codebase graph and synthesizing judge questions...</span>
            </div>
          ) : questionsError ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-700">
              {questionsError}
            </div>
          ) : judgeQuestions.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-[#E5E1DA] text-center text-xs font-mono text-[#6B7280]">
              No judge questions generated yet. Click "Regenerate Questions" to analyze the repository.
            </div>
          ) : (
            <div className="space-y-4">
              {judgeQuestions.map((q) => {
                const isExpanded = expandedQuestionId === q.id;
                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl bg-white border border-[#E5E1DA] hover:border-[#3B5FE0]/40 shadow-xs transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-md bg-[#3B5FE0]/10 text-[#3B5FE0] flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                          {q.id}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-mono font-bold text-[#3B5FE0] bg-[#3B5FE0]/10 px-2 py-0.5 rounded">
                              {q.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold font-mono text-[#1A1D29] leading-snug">
                            "{q.question}"
                          </h4>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                        className="p-1.5 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:text-[#1A1D29] transition-colors cursor-pointer shrink-0"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Why Judges Ask Callout */}
                    <div className="text-[11px] font-mono text-[#6B7280] bg-[#FAFAF7] p-2.5 rounded-xl border border-[#E5E1DA] flex items-start gap-2">
                      <strong className="text-[#1A1D29] shrink-0">Why judges ask:</strong>
                      <span>{q.why_judges_ask}</span>
                    </div>

                    {/* Expandable Tactical Defense Box */}
                    {isExpanded && (
                      <div className="mt-2 pt-3 border-t border-[#E5E1DA] flex flex-col gap-3 text-xs font-mono animate-fade-in">
                        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                          <div className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-indigo-700" />
                            Tactical Defense Strategy
                          </div>
                          <div className="text-indigo-900 leading-relaxed text-[11px]">
                            {q.suggested_defense}
                          </div>
                        </div>

                        {q.key_talking_points && (
                          <div>
                            <div className="text-[11px] font-bold text-[#1A1D29] mb-1.5">Key Talking Points</div>
                            <ul className="space-y-1 text-[#6B7280] text-[11px]">
                              {q.key_talking_points.map((pt: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-[#3B5FE0]">•</span>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {q.relevant_files && q.relevant_files.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-[10px] text-[#6B7280] font-bold">Anchor Files:</span>
                            {q.relevant_files.map((file: string, fidx: number) => (
                              <button
                                key={fidx}
                                onClick={() => onSelectFilePath && onSelectFilePath(file)}
                                className="text-[10px] px-2 py-0.5 rounded bg-white border border-[#E5E1DA] hover:border-[#3B5FE0] text-[#3B5FE0] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <FileCode2 className="w-3 h-3" />
                                <span>{file}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedQuestion(q.question);
                              setActiveTab('mock_interview');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#1A1D29] hover:bg-[#3B5FE0] text-white text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <span>Practice Defending This</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: REQUIREMENTS AUDIT (PS VS CODE) ================= */}
      {activeTab === 'requirements_audit' && (
        <div className="flex flex-col gap-6">
          <div className="p-5 rounded-2xl bg-white border border-[#E5E1DA] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-mono text-[#1A1D29] flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#3B5FE0]" />
                  Problem Statement vs. Implementation Evidence
                </h3>
                <div className="text-[11px] font-mono text-[#6B7280] mt-0.5">
                  Verify stated requirements against static code findings. Distinguish written code from runtime execution.
                </div>
              </div>

              {sharedProblemStatement && auditPS !== sharedProblemStatement && (
                <button
                  onClick={() => setAuditPS(sharedProblemStatement)}
                  className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  Import Stage 1 Problem Statement
                </button>
              )}
            </div>

            <textarea
              rows={4}
              value={auditPS}
              onChange={(e) => setAuditPS(e.target.value)}
              placeholder="Paste or review the original problem statement requirements to cross-examine against the codebase..."
              className="w-full p-3 rounded-xl border border-[#E5E1DA] bg-white text-xs font-mono text-[#1A1D29] focus:outline-none focus:border-[#3B5FE0] leading-relaxed resize-y"
            />

            {auditError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-700">
                {auditError}
              </div>
            )}

            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] font-mono text-[#6B7280]">
                {auditPS ? `${auditPS.split(/\s+/).filter(Boolean).length} words ready for forensic audit` : 'No PS loaded'}
              </span>
              <button
                onClick={handleRunAudit}
                disabled={isLoadingAudit || !auditPS.trim()}
                className="py-2 px-5 rounded-xl bg-[#3B5FE0] hover:bg-[#2D4BC7] text-white text-xs font-mono font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoadingAudit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Auditing Codebase Evidence...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Verify Codebase Evidence</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Audit Results View */}
          {auditResult && (
            <div className="space-y-4 animate-fade-in">
              {/* Summary Card with Completion Bar */}
              <div className="p-5 rounded-2xl bg-white border border-[#E5E1DA] shadow-xs flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#3B5FE0] uppercase tracking-wider bg-[#3B5FE0]/10 px-2 py-0.5 rounded">
                      Forensic Audit Summary
                    </span>
                    <p className="text-xs font-mono text-[#1A1D29] mt-1.5 leading-relaxed">
                      {auditResult.summary}
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <div className="text-2xl font-bold font-mono text-[#1A1D29]">
                      {auditResult.completion_percentage || 70}%
                    </div>
                    <div className="text-[10px] font-mono text-[#6B7280]">Code Evidence Coverage</div>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-[#E5E1DA] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#3B5FE0] transition-all duration-700"
                    style={{ width: `${auditResult.completion_percentage || 70}%` }}
                  />
                </div>

                <div className="text-[10px] font-mono text-[#6B7280] flex items-center gap-1.5 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    Static Code Evidence Distinction: Presence of code files and routes verifies implementation intent, but runtime behavior and cloud credentials require live execution testing.
                  </span>
                </div>
              </div>

              {/* Requirement Checklist Items */}
              <div className="space-y-3">
                {auditResult.requirements?.map((req: any) => {
                  const badge = statusBadges[req.status] || statusBadges.partially_implemented;
                  return (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl bg-white border border-[#E5E1DA] shadow-xs flex flex-col gap-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-xs font-bold font-mono text-[#1A1D29]">
                          {req.id}. {req.requirement}
                        </h4>
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border} w-fit shrink-0`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Code Evidence Block */}
                      <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA] text-xs font-mono flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <strong className="text-[#1A1D29]">Static Code Finding:</strong>
                          {req.file_path && (
                            <button
                              onClick={() => onSelectFilePath && onSelectFilePath(req.file_path)}
                              className="text-[#3B5FE0] hover:underline flex items-center gap-1 text-[10px] cursor-pointer"
                            >
                              <FileCode2 className="w-3 h-3" />
                              <span>{req.file_path}</span>
                            </button>
                          )}
                        </div>
                        <div className="text-[#6B7280] text-[11px] leading-relaxed">
                          {req.code_evidence}
                        </div>
                      </div>

                      {/* Audit Notes */}
                      {req.audit_notes && (
                        <div className="text-[11px] font-mono text-[#6B7280]">
                          <strong className="text-[#1A1D29]">Audit Stance:</strong> {req.audit_notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: MOCK DEFENSE SIMULATOR ================= */}
      {activeTab === 'mock_interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Question & Input (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E5E1DA] shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-mono text-[#1A1D29] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#3B5FE0]" />
                  Mock Defense Interview
                </h3>
                <span className="text-[10px] font-mono text-[#6B7280]">Real-time Evaluation</span>
              </div>

              {/* Question Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-[#1A1D29]">
                  Judge Question to Defend:
                </label>
                <textarea
                  rows={3}
                  value={selectedQuestion}
                  onChange={(e) => setSelectedQuestion(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5E1DA] bg-[#FAFAF7] text-xs font-mono text-[#1A1D29] focus:outline-none focus:border-[#3B5FE0] resize-none"
                />
              </div>

              {/* Pre-fill Quick Questions */}
              {judgeQuestions.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-[#6B7280]">Or pick generated judge question:</span>
                  <div className="flex flex-wrap gap-1">
                    {judgeQuestions.slice(0, 3).map((jq) => (
                      <button
                        key={jq.id}
                        onClick={() => setSelectedQuestion(jq.question)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#E5E1DA] hover:border-[#3B5FE0] text-[#6B7280] hover:text-[#3B5FE0] truncate max-w-full text-left cursor-pointer"
                      >
                        Q{jq.id}: {jq.question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Developer Defense Answer Input */}
              <form onSubmit={handleEvaluateDefense} className="flex flex-col gap-2.5 mt-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <label className="font-bold text-[#1A1D29]">Your Defense Answer:</label>
                  <span className="text-[10px] text-[#6B7280]">
                    {userAnswer.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={7}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Draft your verbal defense response here. Mention your architectural boundaries, trade-offs, and fallback handling..."
                  className="w-full p-3 rounded-xl border border-[#E5E1DA] bg-white text-xs font-mono text-[#1A1D29] focus:outline-none focus:border-[#3B5FE0] leading-relaxed resize-y"
                />

                {defenseError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-700">
                    {defenseError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isEvaluatingDefense || !userAnswer.trim()}
                  className="py-2.5 px-4 rounded-xl bg-[#3B5FE0] hover:bg-[#2D4BC7] text-white text-xs font-mono font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isEvaluatingDefense ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Evaluating Technical Stance...</span>
                    </>
                  ) : (
                    <>
                      <Scale className="w-4 h-4" />
                      <span>Evaluate Defense Answer</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Feedback & Model Answer (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {defenseFeedback ? (
              <div className="p-5 rounded-2xl bg-white border border-[#E5E1DA] shadow-xs flex flex-col gap-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[#E5E1DA] pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#3B5FE0] uppercase tracking-wider bg-[#3B5FE0]/10 px-2 py-0.5 rounded">
                      Judge Scorecard
                    </span>
                    <h3 className="text-base font-bold font-display text-[#1A1D29] mt-1">
                      Technical Defense Evaluation
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-extrabold font-mono text-[#1A1D29]">
                      {defenseFeedback.score || 80}/100
                    </div>
                    <div className="text-[10px] font-mono text-[#6B7280]">Pitch Readiness</div>
                  </div>
                </div>

                {/* Rating Badges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA] text-xs font-mono">
                    <div className="text-[10px] text-[#6B7280] mb-0.5">Clarity Rating</div>
                    <div className="font-bold text-[#1A1D29]">
                      {defenseFeedback.clarity_rating || 'Strong'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA] text-xs font-mono">
                    <div className="text-[10px] text-[#6B7280] mb-0.5">Technical Depth</div>
                    <div className="font-bold text-[#1A1D29]">
                      {defenseFeedback.technical_depth_rating || 'Strong'}
                    </div>
                  </div>
                </div>

                {/* Strengths */}
                {defenseFeedback.strengths && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs font-mono">
                    <div className="font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      What You Defended Well
                    </div>
                    <ul className="space-y-1 text-emerald-800 text-[11px]">
                      {defenseFeedback.strengths.map((s: string, idx: number) => (
                        <li key={idx}>✓ {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Critical Gaps & Potential Pushback */}
                {defenseFeedback.critical_gaps && (
                  <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs font-mono">
                    <div className="font-bold text-rose-950 mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Critical Gaps & Judge Pushback Risks
                    </div>
                    <ul className="space-y-1 text-rose-800 text-[11px]">
                      {defenseFeedback.critical_gaps.map((g: string, idx: number) => (
                        <li key={idx}>⚠️ {g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Polished Model Answer */}
                {defenseFeedback.model_answer && (
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs font-mono flex flex-col gap-2">
                    <div className="flex items-center justify-between text-indigo-950 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
                        Polished Model Answer (Practice Delivering This)
                      </span>
                      <button
                        onClick={() => handleCopy(defenseFeedback.model_answer, 'model')}
                        className="text-[10px] text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'model' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="text-indigo-900 leading-relaxed text-[11px] whitespace-pre-wrap">
                      "{defenseFeedback.model_answer}"
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-white border border-[#E5E1DA] shadow-xs flex flex-col items-center justify-center text-center my-auto min-h-[350px]">
                <div className="w-12 h-12 rounded-2xl bg-[#3B5FE0]/10 border border-[#3B5FE0]/20 flex items-center justify-center text-[#3B5FE0] mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-display text-[#1A1D29] mb-1">
                  Mock Defense Awaiting
                </h3>
                <p className="text-xs font-mono text-[#6B7280] max-w-sm mb-4 leading-relaxed">
                  Type your proposed response to the judge's question on the left. The AI coach will evaluate your technical precision, clarity, and depth.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
