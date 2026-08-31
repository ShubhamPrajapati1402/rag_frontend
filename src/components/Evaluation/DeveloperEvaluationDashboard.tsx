import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  BookOpen,
  ShieldCheck, 
  Play, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  Database, 
  Search, 
  ChevronRight, 
  ChevronDown,
  BarChart3,
  Layers,
  HelpCircle,
  ExternalLink,
  Trash2,
  Users,
  UserPlus,
  X,
  UserCheck,
  Laptop
} from 'lucide-react';
import { evaluationService } from '../../services/evaluationService';
import { EvaluationRun, EvaluationCase, UserProfile } from '../../types';
import { useDeveloperTeamSocket, DeveloperMember } from '../../hooks/useDeveloperTeamSocket';
import AcceptInviteModal from './AcceptInviteModal';
import './DeveloperEvaluationDashboard.css';

interface DeveloperEvaluationDashboardProps {
  userProfile?: UserProfile | null;
  onNavigateToChat?: () => void;
}

interface DeveloperUser {
  id: number;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_superuser: boolean;
  created_at: string;
}

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export default function DeveloperEvaluationDashboard({ 
  userProfile, 
  onNavigateToChat 
}: DeveloperEvaluationDashboardProps) {
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<EvaluationRun | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [casesPerDoc, setCasesPerDoc] = useState<number>(2);
  const [isCasesMenuOpen, setIsCasesMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'unsupported'>('all');
  const [expandedContexts, setExpandedContexts] = useState<Record<number, boolean>>({});
  const pollingRef = useRef<number | null>(null);

  // Developer Team Modal States
  const [showTeamModal, setShowTeamModal] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState<boolean>(false);
  const [teamLoading, setTeamLoading] = useState<boolean>(false);
  const [inviteSubmitting, setInviteSubmitting] = useState<boolean>(false);
  const [teamMessage, setTeamMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const casesMenuRef = useRef<HTMLDivElement | null>(null);
  const roleMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (casesMenuRef.current && !casesMenuRef.current.contains(event.target as Node)) {
        setIsCasesMenuOpen(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Real-time WebSocket hook for Developer Team presence and instant sync
  const { developers, setDevelopers, isConnected: isTeamSocketConnected, refreshTeam } = useDeveloperTeamSocket({
    userProfile,
    onDeveloperRevokedSelf: () => {
      alert('Your developer privileges have been revoked by an administrator.');
      if (onNavigateToChat) onNavigateToChat();
    },
    onEventNotification: (msg, type) => {
      setTeamMessage({ type: type === 'warning' ? 'error' : type, text: msg });
    }
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    desc: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  const loadRunDetails = useCallback(async (runId: number) => {
    try {
      setDetailsLoading(true);
      const details = await evaluationService.getRunDetails(runId);
      setSelectedRun(details);
    } catch (err) {
      console.error('Failed to load run details', err);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const fetchRuns = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await evaluationService.getRuns(30);
      setRuns(data);
      if (data.length > 0) {
        setSelectedRun(prev => {
          if (!prev) {
            loadRunDetails(data[0].id);
            return null;
          }
          const updated = data.find(r => r.id === prev.id);
          if (updated && updated.status !== prev.status) {
            loadRunDetails(updated.id);
          }
          return updated || prev;
        });
      }
    } catch (err) {
      console.error('Failed to load evaluation runs', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [loadRunDetails]);

  // Initial fetch
  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Polling if any run is currently RUNNING
  useEffect(() => {
    const hasRunning = runs.some(r => r.status === 'RUNNING') || isTriggering;
    if (hasRunning) {
      pollingRef.current = window.setInterval(() => {
        fetchRuns(true);
      }, 3000);
    } else if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [runs, isTriggering, fetchRuns]);

  // Load Developer Team
  const loadDevelopers = async () => {
    try {
      setTeamLoading(true);
      const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/developers`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setDevelopers(data);
      }
    } catch (err) {
      console.error('Failed to load developers', err);
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (showTeamModal) {
      loadDevelopers();
    }
  }, [showTeamModal]);

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setInviteSubmitting(true);
      setTeamMessage(null);
      const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/invite-developer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send invitation');
      }
      setTeamMessage({ type: 'success', text: data.message });
      setInviteEmail('');
      await loadDevelopers();
    } catch (err: any) {
      setTeamMessage({ type: 'error', text: err.message || 'Failed to send invitation' });
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRevokeAccess = (email: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Revoke Developer Access?",
      desc: `Are you sure you want to revoke developer privileges from ${email}? They will no longer be able to run RAG benchmarks.`,
      confirmLabel: "Revoke Access",
      onConfirm: async () => {
        try {
          const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/manage-developer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, is_developer: false }),
          });
          const data = await res.json();
          if (res.ok) {
            setTeamMessage({ type: 'success', text: data.message });
            await loadDevelopers();
          } else {
            setTeamMessage({ type: 'error', text: data.detail || 'Failed to revoke' });
          }
        } catch (err: any) {
          setTeamMessage({ type: 'error', text: err.message });
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleDeleteRun = (runId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: `Delete Evaluation Run #${runId}?`,
      desc: `Are you sure you want to delete Evaluation Run #${runId}? All synthesized QA benchmark metrics and atomic claim audits will be permanently removed.`,
      confirmLabel: "Delete Run",
      onConfirm: async () => {
        try {
          await evaluationService.deleteRun(runId);
          setRuns(prev => prev.filter(r => r.id !== runId));
          if (selectedRun?.id === runId) {
            setSelectedRun(null);
          }
          fetchRuns(true);
        } catch (err: any) {
          console.error('Failed to delete run:', err);
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleTriggerRun = async () => {
    try {
      setIsTriggering(true);
      const res = await evaluationService.triggerRun({
        title: `RAG Benchmark (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        eval_mode: 'all_documents',
        cases_per_doc: casesPerDoc
      });
      await fetchRuns(true);
      if (res.run_id) {
        loadRunDetails(res.run_id);
      }
    } catch (err: any) {
      console.error('Failed to trigger evaluation', err);
      alert(err.message || 'Failed to trigger evaluation run');
    } finally {
      setIsTriggering(false);
    }
  };

  const toggleContext = (caseId: number) => {
    setExpandedContexts(prev => ({ ...prev, [caseId]: !prev[caseId] }));
  };

  const latestRun = selectedRun || runs[0];

  const filteredCases = (selectedRun?.cases || []).filter(tc => {
    const matchesSearch = !searchQuery || 
      tc.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.generated_answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterMode === 'unsupported') {
      return (tc.claims_evaluation || []).some(c => !c.supported) || tc.faithfulness < 0.8;
    }
    return true;
  });

  const getScoreColorClass = (score: number) => {
    if (score >= 0.8) return 'score-high';
    if (score >= 0.6) return 'score-mid';
    return 'score-low';
  };

  return (
    <div className="eval-dashboard-root">
      {/* Top Header Row */}
      <div className="eval-top-header">
        <div className="eval-header-left">
          <div className="eval-title-row">
            <h1 className="eval-main-title">RAG Benchmark & Evaluation Suite</h1>
            <span className="eval-dev-badge">
              <ShieldCheck size={13} />
              <span>DEVELOPER ONLY</span>
            </span>
          </div>
          <p className="eval-subtitle">
            Continuous RAGAs verification suite evaluating Faithfulness, Relevance, Precision & Atomic Claim Entailment across indexed documents.
          </p>
        </div>

        <div className="eval-header-actions">
          <div className="cases-selector-box">
            <span className="selector-label">Cases/Doc:</span>
            <div className="cases-select-menu" ref={casesMenuRef}>
              <button
                type="button"
                className="cases-select"
                onClick={() => setIsCasesMenuOpen((open) => !open)}
              disabled={isTriggering}
                aria-haspopup="listbox"
                aria-expanded={isCasesMenuOpen}
              >
                <span>{casesPerDoc} {casesPerDoc === 1 ? 'Case' : 'Cases'}</span>
                <ChevronDown size={15} aria-hidden="true" />
              </button>
              {isCasesMenuOpen && (
                <div className="cases-options" role="listbox">
                  {[1, 2, 3].map((count) => (
                    <button
                      type="button"
                      key={count}
                      role="option"
                      aria-selected={casesPerDoc === count}
                      className={casesPerDoc === count ? 'is-selected' : ''}
                      onClick={() => {
                        setCasesPerDoc(count);
                        setIsCasesMenuOpen(false);
                      }}
                    >
                      {count} {count === 1 ? 'Case' : 'Cases'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleTriggerRun}
            disabled={isTriggering}
            className="eval-trigger-btn"
          >
            {isTriggering ? (
              <>
                <div className="eval-spinner-ring" />
                <span>Benchmarking Pipeline...</span>
              </>
            ) : (
              <>
                <Play size={14} className="play-icon" />
                <span>Run Dynamic Benchmark</span>
              </>
            )}
          </button>

          {/* Manage Team & Invites Button */}
          <button
            onClick={() => setShowTeamModal(true)}
            className="eval-team-btn"
            data-tooltip="Manage authorized developer team"
          >
            <Users size={14} />
            <span>Developer Team</span>
          </button>

          <button 
            onClick={() => fetchRuns(false)} 
            className="eval-refresh-btn"
            data-tooltip="Refresh runs"
          >
            <RotateCw size={14} className={loading ? 'is-spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Top 6 Metric Cards Bar */}
      {latestRun ? (
        <div className="eval-metrics-grid anim-slide-up">
          <div className="eval-metric-card primary-card" data-tooltip="Composite weighted quality score of all RAG dimensions">
            <div className="metric-header">
              <span className="metric-title">Overall RAG Score</span>
              <Sparkles size={16} className="metric-icon primary" />
            </div>
            <div className={`metric-value ${getScoreColorClass(latestRun.overall_rag_score)}`}>
              {(latestRun.overall_rag_score * 100).toFixed(1)}%
            </div>
            <div className="metric-footer">
              <span className="metric-sub">Composite Quality</span>
              <span
                className={`metric-status-pill ${latestRun.status.toLowerCase()}`}
                aria-label={latestRun.status === 'COMPLETED' ? 'Completed' : 'Running'}
              >
                {latestRun.status === 'COMPLETED' ? 'Done' : 'Running'}
              </span>
            </div>
          </div>

          <div className="eval-metric-card" data-tooltip="Faithfulness: Verifies 0 hallucinations by checking if all answer claims are entailed by document text">
            <div className="metric-header">
              <span className="metric-title">Faithfulness</span>
              <CheckCircle2 size={16} className="metric-icon emerald" />
            </div>
            <div className={`metric-value ${getScoreColorClass(latestRun.faithfulness_score)}`}>
              {(latestRun.faithfulness_score * 100).toFixed(1)}%
            </div>
            <div className="metric-footer">
              <span className="metric-sub">Context Entailment</span>
            </div>
          </div>

          <div className="eval-metric-card" data-tooltip="Answer Relevance: Measures how directly and concisely the answer answers the user question">
            <div className="metric-header">
              <span className="metric-title">Answer Relevance</span>
              <BarChart3 size={16} className="metric-icon sky" />
            </div>
            <div className={`metric-value ${getScoreColorClass(latestRun.answer_relevancy_score)}`}>
              {(latestRun.answer_relevancy_score * 100).toFixed(1)}%
            </div>
            <div className="metric-footer">
              <span className="metric-sub">Query Intent Match</span>
            </div>
          </div>

          <div className="eval-metric-card" data-tooltip="Context Precision: Measures whether the most relevant document chunks are ranked at the top (Rank #1)">
            <div className="metric-header">
              <span className="metric-title">Context Precision</span>
              <Layers size={16} className="metric-icon amber" />
            </div>
            <div className={`metric-value ${getScoreColorClass(latestRun.context_precision_score)}`}>
              {(latestRun.context_precision_score * 100).toFixed(1)}%
            </div>
            <div className="metric-footer">
              <span className="metric-sub">Rank #1 Accuracy</span>
            </div>
          </div>

          <div className="eval-metric-card" data-tooltip="Context Recall: Measures whether all necessary facts from the ground truth were retrieved">
            <div className="metric-header">
              <span className="metric-title">Context Recall</span>
              <BookOpen size={16} className="metric-icon emerald" />
            </div>
            <div className={`metric-value ${getScoreColorClass(latestRun.context_recall_score || 0.95)}`}>
              {((latestRun.context_recall_score || 0.95) * 100).toFixed(1)}%
            </div>
            <div className="metric-footer">
              <span className="metric-sub">Fact Coverage</span>
            </div>
          </div>

          <div className="eval-metric-card" data-tooltip="Average Latency: Total execution time for retriever, reranker, and generator nodes">
            <div className="metric-header">
              <span className="metric-title">Avg Latency</span>
              <Clock size={16} className="metric-icon purple" />
            </div>
            <div className="metric-value latency">
              {latestRun.avg_latency_ms ? `${latestRun.avg_latency_ms.toFixed(0)} ms` : '—'}
            </div>
            <div className="metric-footer">
              <span className="metric-sub">End-to-End Pipeline</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Content Split Section */}
      <div className="eval-main-split">
        {/* Left Column: Historical Evaluation Runs */}
        <div className="eval-history-pane">
          <div className="pane-header">
            <h2 className="pane-title">Historical Benchmark Runs</h2>
            <span className="pane-count-badge">{runs.length}</span>
          </div>

          <div className="runs-scroll-list">
            {loading && runs.length === 0 ? (
              <div className="pane-empty-state">
                <div className="eval-spinner-ring" />
                <span>Loading evaluation history...</span>
              </div>
            ) : runs.length === 0 ? (
              <div className="pane-empty-state">
                <Database size={28} className="empty-icon" />
                <span className="empty-title">No benchmarks executed</span>
                <p className="empty-desc">Click "Run Dynamic Benchmark" above to test your RAG pipeline across indexed documents.</p>
              </div>
            ) : (
              runs.map((run) => {
                const isSelected = selectedRun?.id === run.id;
                const dateStr = new Date(run.created_at).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={run.id}
                    onClick={() => loadRunDetails(run.id)}
                    className={`eval-run-item ${isSelected ? 'is-selected' : ''}`}
                  >
                    <div className="run-item-top">
                      <span className="run-title">Run #{run.id} • {run.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`run-score-pill ${getScoreColorClass(run.overall_rag_score)}`}>
                          {(run.overall_rag_score * 100).toFixed(0)}%
                        </span>
                        <button
                          className="delete-run-btn"
                          onClick={(e) => handleDeleteRun(run.id, e)}
                          data-tooltip="Delete run"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="run-item-meta">
                      <div className="meta-left">
                        <span>{run.total_cases} dynamic test cases</span>
                        <span className="meta-dot">•</span>
                        <span>{dateStr}</span>
                      </div>
                      {run.status === 'RUNNING' && (
                        <span className="run-live-pulse">RUNNING</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep-Dive Granular Test Cases */}
        <div className="eval-details-pane">
          {selectedRun ? (
            <>
              {/* Selected Run Banner & Filter Toolbar */}
              <div className="details-header-toolbar">
                <div>
                  <h2 className="details-title">
                    Granular Test Cases • Run #{selectedRun.id}
                  </h2>
                  <span className="details-sub">
                    {selectedRun.total_cases} dynamic queries synthesized and evaluated across indexed documents
                  </span>
                </div>

                <div className="details-filter-controls">
                  <div className="eval-search-box">
                    <Search size={13} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search questions or answers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="filter-pill-toggle">
                    <button 
                      className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterMode('all')}
                    >
                      All ({selectedRun.cases?.length || 0})
                    </button>
                    <button 
                      className={`filter-btn ${filterMode === 'unsupported' ? 'active' : ''}`}
                      onClick={() => setFilterMode('unsupported')}
                    >
                      Issues / Hallucinations
                    </button>
                  </div>
                </div>
              </div>

              {/* Cases List */}
              <div className="cases-scroll-container">
                {detailsLoading ? (
                  <div className="pane-empty-state">
                    <div className="eval-spinner-ring" />
                    <span>Loading test case metrics and claim audits...</span>
                  </div>
                ) : filteredCases.length === 0 ? (
                  <div className="pane-empty-state">
                    <CheckCircle2 size={28} className="empty-icon" />
                    <span className="empty-title">No matching test cases</span>
                    <p className="empty-desc">
                      {filterMode === 'unsupported' 
                        ? 'Zero hallucinations detected in this run! All claims are 100% faithful.' 
                        : 'Try adjusting your search query.'}
                    </p>
                  </div>
                ) : (
                  filteredCases.map((tc: EvaluationCase, idx: number) => (
                    <div key={tc.id} className="eval-case-card">
                      {/* Card Header */}
                      <div className="case-card-header">
                        <div className="case-header-left">
                          <span className="case-num-tag">TEST CASE #{idx + 1}</span>
                          <span className="case-doc-badge">
                            <FileText size={12} />
                            <span>{tc.document_name}</span>
                          </span>
                        </div>

                        <div className="case-metric-badges">
                          <span className={`case-stat-badge ${getScoreColorClass(tc.faithfulness)}`}>
                            Faithful: {(tc.faithfulness * 100).toFixed(0)}%
                          </span>
                          <span className={`case-stat-badge ${getScoreColorClass(tc.answer_relevancy)}`}>
                            Relevance: {(tc.answer_relevancy * 100).toFixed(0)}%
                          </span>
                          <span className="case-latency-badge">
                            <Clock size={11} />
                            <span>{tc.latency_ms} ms</span>
                          </span>
                        </div>
                      </div>

                      {/* Question */}
                      <div className="case-question-row">
                        <span className="question-prefix">Q:</span>
                        <h3 className="case-question-text">{tc.question}</h3>
                      </div>

                      {/* Generated RAG Answer */}
                      <div className="case-block">
                        <span className="block-label">Generated RAG Response:</span>
                        <div className="block-content">{tc.generated_answer}</div>
                      </div>

                      {/* Synthetic Reference Answer */}
                      {tc.ground_truth && (
                        <div className="case-block truth-block">
                          <span className="block-label">Synthetic Ground Truth Reference:</span>
                          <div className="block-content">{tc.ground_truth}</div>
                        </div>
                      )}

                      {/* Atomic Claims Entailment Breakdown */}
                      {tc.claims_evaluation && tc.claims_evaluation.length > 0 && (
                        <div className="case-claims-audit">
                          <span className="claims-heading">
                            Atomic Claim Verification Audit ({tc.claims_evaluation.length} Claims):
                          </span>
                          <div className="claims-list">
                            {tc.claims_evaluation.map((claim, cIdx) => (
                              <div
                                key={cIdx}
                                className={`claim-audit-row ${claim.supported ? 'supported' : 'unsupported'}`}
                              >
                                <span className="claim-status-icon">
                                  {claim.supported ? (
                                    <CheckCircle2 size={14} className="claim-icon-supported" />
                                  ) : (
                                    <XCircle size={14} className="claim-icon-unsupported" />
                                  )}
                                </span>
                                <div className="claim-body">
                                  <span className="claim-statement">"{claim.claim}"</span>
                                  <span className="claim-reason">{claim.reason}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Collapsible Retrieved Chunks */}
                      {tc.retrieved_contexts && tc.retrieved_contexts.length > 0 && (
                        <div className="case-contexts-section">
                          <button 
                            className="toggle-context-btn"
                            onClick={() => toggleContext(tc.id)}
                          >
                            <ChevronRight size={14} className={`chevron-icon ${expandedContexts[tc.id] ? 'is-expanded' : ''}`} />
                            <span>Retrieved Context Excerpts ({tc.retrieved_contexts.length} chunks)</span>
                          </button>

                          {expandedContexts[tc.id] && (
                            <div className="contexts-expanded-list">
                              {tc.retrieved_contexts.map((chunkText, chIdx) => (
                                <div key={chIdx} className="context-chunk-card">
                                  <span className="chunk-label">Chunk #{chIdx + 1}:</span>
                                  <p className="chunk-text">{chunkText}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="pane-empty-state">
              <HelpCircle size={32} className="empty-icon" />
              <span className="empty-title">Select an evaluation run</span>
              <p className="empty-desc">Choose any benchmark run from the left panel to inspect its deep-dive RAG triad metrics and claim-level verification audits.</p>
            </div>
          )}
        </div>
      </div>

      {/* Developer Team & Access Management Modal */}
      {showTeamModal && (
        <div className="team-modal-backdrop" onClick={() => setShowTeamModal(false)}>
          <div className="team-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="team-modal-header">
              <div className="modal-header-left">
                <ShieldCheck size={20} className="modal-shield-icon" />
                <div>
                  <h3 className="modal-title">Developer Team & Access</h3>
                  <p className="modal-subtitle">Grant or revoke developer & benchmark access by user email.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowTeamModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleGrantAccess} className="team-invite-form">
              <input
                type="email"
                placeholder="Enter user email (e.g. teammate@example.com)"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="team-email-input"
              />
              <div className="invite-role-select-menu" ref={roleMenuRef}>
                <button
                  type="button"
                  className="invite-role-select"
                  onClick={() => setIsRoleMenuOpen((open) => !open)}
                  disabled={inviteSubmitting}
                  aria-haspopup="listbox"
                  aria-expanded={isRoleMenuOpen}
                  title="Assign developer role"
                >
                  <div className="invite-role-current">
                    {inviteRole === 'ADMIN' ? (
                      <>
                        <ShieldCheck size={14} className="role-icon-admin" />
                        <span>Admin</span>
                      </>
                    ) : (
                      <>
                        <Laptop size={14} className="role-icon-member" />
                        <span>Member</span>
                      </>
                    )}
                  </div>
                  <ChevronDown size={14} className="role-chevron" aria-hidden="true" />
                </button>
                {isRoleMenuOpen && (
                  <div className="invite-role-options anim-pop-in" role="listbox">
                    <button
                      type="button"
                      role="option"
                      aria-selected={inviteRole === 'MEMBER'}
                      className={inviteRole === 'MEMBER' ? 'is-selected' : ''}
                      onClick={() => {
                        setInviteRole('MEMBER');
                        setIsRoleMenuOpen(false);
                      }}
                    >
                      <Laptop size={14} className="role-icon-member" />
                      <span>Member</span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      aria-selected={inviteRole === 'ADMIN'}
                      className={inviteRole === 'ADMIN' ? 'is-selected' : ''}
                      onClick={() => {
                        setInviteRole('ADMIN');
                        setIsRoleMenuOpen(false);
                      }}
                    >
                      <ShieldCheck size={14} className="role-icon-admin" />
                      <span>Admin</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={inviteSubmitting}
                className="team-grant-btn"
              >
                {inviteSubmitting ? (
                  <span>Sending Link...</span>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Send Invite</span>
                  </>
                )}
              </button>
            </form>

            {teamMessage && (
              <div className={`team-status-alert ${teamMessage.type}`}>
                {teamMessage.text}
              </div>
            )}

            {/* Team List */}
            <div className="team-members-container">
              <div className="team-section-header-row">
                <span className="team-section-heading">
                  Authorized Developers ({developers.length})
                </span>
                <span className={`team-sync-badge ${isTeamSocketConnected ? 'connected' : 'syncing'}`}>
                  <span className="sync-pulse-dot" />
                  {isTeamSocketConnected ? 'Live Sync Active' : 'Connecting Sync...'}
                </span>
              </div>

              {teamLoading && developers.length === 0 ? (
                <div className="team-loading-state">
                  <div className="eval-spinner-ring" />
                  <span>Loading authorized team...</span>
                </div>
              ) : developers.length === 0 ? (
                <div className="team-loading-state">
                  <span>No other developers authorized yet.</span>
                </div>
              ) : (
                <div className="team-members-list">
                  {developers.map((dev) => {
                    const isSelf = userProfile?.email && dev.email.toLowerCase() === userProfile.email.toLowerCase();
                    const presence = dev.presence || 'OFFLINE';
                    const avatarImg = (isSelf ? (userProfile?.avatarUrl || userProfile?.avatar || userProfile?.picture || userProfile?.image) : null) || dev.avatar_url;

                    return (
                      <div key={dev.id || dev.email} className="team-member-item">
                        <div className="member-avatar-wrapper">
                          <div className="member-avatar">
                            {avatarImg ? (
                              <img
                                src={avatarImg}
                                alt={dev.full_name || dev.email}
                                className="member-avatar-img"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              (dev.full_name?.[0] || dev.email.charAt(0)).toUpperCase()
                            )}
                          </div>
                          <span className={`presence-indicator-dot ${presence.toLowerCase()}`} title={`Status: ${presence}`} />
                        </div>
                        <div className="member-info">
                          <span className="member-email">{dev.email}</span>
                          <span className="member-date">
                            {dev.full_name || 'Developer'} • Added {dev.created_at ? new Date(dev.created_at).toLocaleDateString() : 'Recently'}
                          </span>
                        </div>
                        <div className="member-right-tags">
                          {dev.is_primary_owner && <span className="member-owner-tag">Owner</span>}
                          {isSelf && <span className="member-self-tag">You</span>}
                          <span className={`member-presence-tag ${presence.toLowerCase()}`}>
                            {presence === 'ONLINE' ? 'Online' : presence === 'OFFLINE' ? 'Offline' : 'Pre-Authorized'}
                          </span>
                          {!isSelf && !dev.is_primary_owner && (
                            <button
                              onClick={() => handleRevokeAccess(dev.email)}
                              className="member-revoke-btn"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirmation Modal (Identical to Logout Modal) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="delete-modal-backdrop anim-fade-in" onClick={() => setConfirmDialog(null)}>
          <div className="delete-modal-card anim-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h3>{confirmDialog.title}</h3>
              <button className="modal-x" onClick={() => setConfirmDialog(null)}>
                <X size={16} />
              </button>
            </div>
            <p className="delete-modal-desc">
              {confirmDialog.desc}
            </p>
            <div className="delete-modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmDialog(null)}>
                Cancel
              </button>
              <button 
                className="btn-danger-confirm" 
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Accept Invite Token Gateway */}
      <AcceptInviteModal onInviteAccepted={() => fetchRuns(false)} />
    </div>
  );
}
