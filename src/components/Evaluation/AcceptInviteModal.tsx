import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, X, Sparkles, ArrowRight, Lock, Clock } from 'lucide-react';
import { UserProfile } from '../../types';
import './DeveloperEvaluationDashboard.css';

interface AcceptInviteModalProps {
  userProfile?: UserProfile | null;
  onInviteAccepted?: () => void;
  onClose?: () => void;
}

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export default function AcceptInviteModal({
  userProfile,
  onInviteAccepted,
  onClose
}: AcceptInviteModalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [accepting, setAccepting] = useState<boolean>(false);
  const [inviteDetails, setInviteDetails] = useState<{
    email: string;
    role: string;
    invited_by_email: string;
    expires_at: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      verifyToken(tokenParam);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (t: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/verify-invite?token=${encodeURIComponent(t)}`);
      const data = await res.json();
      if (res.ok) {
        setInviteDetails(data);
      } else {
        setError(data.detail || 'This invitation link is invalid, expired, or has already been accepted.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify invitation token.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;
    try {
      setAccepting(true);
      setError(null);
      const res = await fetch(`${BACKEND_BASE_URL}/api/v1/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        // Clear token from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          if (onInviteAccepted) onInviteAccepted();
          setToken(null);
        }, 1500);
      } else {
        setError(data.detail || 'Failed to accept invitation.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation.');
    } finally {
      setAccepting(false);
    }
  };

  const handleClose = () => {
    setToken(null);
    window.history.replaceState({}, document.title, window.location.pathname);
    if (onClose) onClose();
  };

  if (!token) return null;

  const isEmailMismatch = userProfile?.email && inviteDetails?.email &&
    userProfile.email.toLowerCase() !== inviteDetails.email.toLowerCase();

  return (
    <div className="accept-invite-backdrop anim-fade-in">
      <div className="accept-invite-card anim-slide-up">
        <button className="accept-close-btn" onClick={handleClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="accept-header">
          <div className="accept-badge-icon">
            <ShieldCheck size={28} />
          </div>
          <h2 className="accept-title">Developer Team Invitation</h2>
          <p className="accept-subtitle">
            Enterprise Agentic RAG Quality & Benchmark Suite
          </p>
        </div>

        <div className="accept-body">
          {loading ? (
            <div className="accept-loading">
              <div className="eval-spinner-ring" />
              <span>Verifying secure invitation token...</span>
            </div>
          ) : error ? (
            <div className="accept-error-box">
              <AlertCircle size={24} className="text-red" />
              <div className="error-text">
                <span className="error-title">Invitation Unavailable</span>
                <p className="error-desc">{error}</p>
              </div>
            </div>
          ) : success ? (
            <div className="accept-success-box anim-fade-in">
              <CheckCircle2 size={32} className="text-emerald" />
              <h3 className="success-title">Welcome to the Team!</h3>
              <p className="success-desc">
                Your privileges have been activated. Redirecting to your developer dashboard...
              </p>
            </div>
          ) : inviteDetails ? (
            <div className="accept-details-content">
              <div className="invite-meta-banner">
                <div className="role-chip">
                  Role: <strong>{inviteDetails.role === 'ADMIN' ? '🛡️ Admin' : '👤 Member'}</strong>
                </div>
                <div className="inviter-note">
                  Invited by: <strong>{inviteDetails.invited_by_email}</strong>
                </div>
              </div>

              <div className="invite-recipient-pill">
                <Lock size={13} className="lock-icon" />
                <span>Exclusively for: <strong>{inviteDetails.email}</strong></span>
              </div>

              <div className="invite-expiry-note">
                <Clock size={12} className="clock-icon" />
                <span>Expires in 48 hours from dispatch</span>
              </div>

              {isEmailMismatch && (
                <div className="email-mismatch-warning anim-shake">
                  <AlertCircle size={16} className="mismatch-icon" />
                  <div>
                    <strong>Recipient Mismatch:</strong> Signed in as <code>{userProfile?.email}</code>. 
                    Please sign in with <code>{inviteDetails.email}</code> to accept.
                  </div>
                </div>
              )}

              <div className="invite-perks-list">
                <div className="perk-item">
                  <Sparkles size={16} className="perk-icon" />
                  <span>Full access to RAGAs Benchmarks, Faithfulness & Relevance Audits</span>
                </div>
                <div className="perk-item">
                  <ShieldCheck size={16} className="perk-icon" />
                  <span>Inspect sentence-level groundedness checks & pipeline telemetry</span>
                </div>
              </div>

              <button
                className="accept-submit-btn"
                onClick={handleAccept}
                disabled={accepting || Boolean(isEmailMismatch)}
              >
                {accepting ? (
                  <span>Activating Privileges...</span>
                ) : isEmailMismatch ? (
                  <span>Sign in as {inviteDetails.email}</span>
                ) : (
                  <>
                    <span>Accept & Join Team</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
