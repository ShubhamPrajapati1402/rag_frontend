import React, { useState } from 'react';
import { Brain, ArrowRight, ArrowLeft, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { ThemeType, UserProfile } from '../../types';
import './AuthModal.css';

interface AuthModalProps {
  onLogin: (user: UserProfile) => void;
  theme: ThemeType;
}

export default function AuthModal({ onLogin, theme }: AuthModalProps) {
  const [email, setEmail] = useState('shubham@example.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);

    if (authMode === 'forgot') {
      setTimeout(() => {
        setIsLoading(false);
        setResetSent(true);
      }, 600);
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        name: 'Shubham Prajapati',
        email: email || 'shubham@example.com',
        role: 'Pro Workspace'
      });
    }, 600);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        name: 'Shubham Prajapati',
        email: 'shubham.prajapati@google.com',
        role: 'Pro Workspace'
      });
    }, 600);
  };

  return (
    <div className="auth-canvas-overlay anim-fade-in">
      <div className="auth-card-box anim-slide-up">
        {/* Branding & Logo */}
        <div className="auth-brand-badge">
          <div className="auth-brain-orb">
            <Brain size={22} className="auth-brain-icon" />
          </div>
          <h2>DocuMind</h2>
          <span className="auth-tagline">Autonomous Multi-Modal RAG Platform</span>
        </div>

        <div className="auth-form-card">
          {authMode === 'forgot' ? (
            /* Forgot Password Workflow */
            resetSent ? (
              <div className="auth-reset-success-pane anim-fade-in">
                <div className="reset-success-icon-box">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h3>Check your email</h3>
                <p>
                  We have sent password reset instructions to <strong>{email}</strong>.
                </p>
                <button 
                  type="button" 
                  className="auth-primary-submit-btn"
                  onClick={() => {
                    setAuthMode('signin');
                    setResetSent(false);
                  }}
                >
                  <ArrowLeft size={15} />
                  <span>Return to Sign In</span>
                </button>
              </div>
            ) : (
              <div className="auth-forgot-pane anim-fade-in">
                <div className="auth-header-text">
                  <h3>Reset password</h3>
                  <p>Enter your email and we will send you a link to reset your account password.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-input-form">
                  <div className="auth-field-group">
                    <label htmlFor="auth-email">Email address</label>
                    <div className="auth-input-wrapper">
                      <Mail size={15} className="auth-field-icon" />
                      <input 
                        id="auth-email"
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-primary-submit-btn" disabled={isLoading}>
                    {isLoading ? (
                      <span className="auth-spinner"></span>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-toggle-footer">
                  <button 
                    type="button" 
                    className="auth-back-btn"
                    onClick={() => {
                      setAuthMode('signin');
                      setResetSent(false);
                    }}
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Sign In / Sign Up Form */
            <>
              <div className="auth-header-text">
                <h3>{authMode === 'signin' ? 'Welcome back' : 'Create an account'}</h3>
                <p>
                  {authMode === 'signin' 
                    ? 'Sign in to access your neural semantic index and document collections.' 
                    : 'Get started with autonomous document processing and neural RAG.'}
                </p>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleSubmit} className="auth-input-form">
                <div className="auth-field-group">
                  <label htmlFor="auth-email">Email address</label>
                  <div className="auth-input-wrapper">
                    <Mail size={15} className="auth-field-icon" />
                    <input 
                      id="auth-email"
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <div className="field-label-split">
                    <label htmlFor="auth-password">Password</label>
                    {authMode === 'signin' && (
                      <button 
                        type="button" 
                        className="forgot-pass-link" 
                        onClick={() => {
                          setAuthMode('forgot');
                          setResetSent(false);
                        }}
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="auth-input-wrapper">
                    <Lock size={15} className="auth-field-icon" />
                    <input 
                      id="auth-password"
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="auth-primary-submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <span className="auth-spinner"></span>
                  ) : (
                    <>
                      <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>OR CONTINUE WITH</span>
              </div>

              {/* Social Sign In Options Below Form */}
              <div className="auth-social-row">
                <button 
                  type="button" 
                  className="auth-google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  title="Sign in with Google"
                >
                  <svg className="google-svg-icon" viewBox="0 0 24 24" width="17" height="17">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>

              {/* Toggle mode */}
              <div className="auth-toggle-footer">
                <span>
                  {authMode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                </span>
                <button 
                  type="button" 
                  className="auth-toggle-btn"
                  onClick={() => setAuthMode(prev => prev === 'signin' ? 'signup' : 'signin')}
                >
                  {authMode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
