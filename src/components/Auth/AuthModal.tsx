import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Mail, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  User,
  AlertCircle,
  KeyRound,
  RotateCw
} from 'lucide-react';
import { UserProfile } from '../../types';
import { authApi } from '../../services/authApi';
import '../Chat/ChatStudio.css';
import './AuthModal.css';

interface AuthModalProps {
  onLogin: (user: UserProfile) => void;
}

export default function AuthModal({ onLogin }: AuthModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'otp' | 'forgot'>('signin');
  const [resetSent, setResetSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // 6-digit OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState<number>(60);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const hasRenderedGoogleBtn = useRef(false);

  // Initialize Google Identity Services & Render Official Button (Once on mount)
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    const initGsi = () => {
      if ((window as any).google?.accounts?.id && googleClientId && googleBtnContainerRef.current) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              if (!response?.credential) return;
              setIsLoading(true);
              setErrorMessage(null);
              try {
                await authApi.googleLogin(response.credential);
                const me = await authApi.getMe();
                onLogin(me || {
                  name: 'User',
                  email: '',
                });
              } catch (err: any) {
                setErrorMessage(err.message || 'Google authentication failed.');
              } finally {
                setIsLoading(false);
              }
            },
          });

          if (!hasRenderedGoogleBtn.current || !googleBtnContainerRef.current.hasChildNodes()) {
            googleBtnContainerRef.current.innerHTML = '';
            (window as any).google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'filled_black',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: 'continue_with',
              width: 320,
              logo_alignment: 'left',
            });
            hasRenderedGoogleBtn.current = true;
          }
        } catch (err) {
          console.warn('GSI render notice:', err);
        }
      }
    };

    initGsi();
    const timer = setTimeout(initGsi, 350);
    return () => clearTimeout(timer);
  }, [onLogin]);

  // 60-Second OTP Countdown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (authMode === 'otp' && cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authMode, cooldown]);

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const preventClipboard = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Password Reset Mode
    if (authMode === 'forgot') {
      if (!email.trim()) {
        setErrorMessage('Please enter your email address.');
        return;
      }
      setIsLoading(true);
      try {
        await new Promise(res => setTimeout(res, 600));
        setResetSent(true);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to request password reset.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2. OTP Verification Mode
    if (authMode === 'otp') {
      const fullOtp = otpDigits.join('');
      if (fullOtp.length !== 6) {
        setErrorMessage('Please enter the complete 6-digit verification code.');
        return;
      }

      setIsLoading(true);
      try {
        await authApi.verifyOtp(email, fullOtp);
        const me = await authApi.getMe();
        onLogin(me || {
          name: name || email.split('@')[0],
          email: email,
        });
      } catch (err: any) {
        setErrorMessage(err.message || 'Invalid or expired OTP. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 3. Sign Up Mode (Triggers 6-digit OTP email)
    if (authMode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!email.trim()) {
        setErrorMessage('Please enter your email address.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.');
        return;
      }

      setIsLoading(true);
      try {
        await authApi.signup(name, email, password);
        setSuccessMessage(`A 6-digit verification code has been sent to ${email}`);
        setAuthMode('otp');
        setCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
      } catch (err: any) {
        setErrorMessage(err.message || 'Signup failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 4. Sign In Mode (Direct login with cookie)
    if (authMode === 'signin') {
      if (!email.trim() || !password.trim()) {
        setErrorMessage('Please enter both email and password.');
        return;
      }

      setIsLoading(true);
      try {
        await authApi.login(email, password);
        const me = await authApi.getMe();
        onLogin(me || {
          name: email.split('@')[0],
          email: email,
        });
      } catch (err: any) {
        setErrorMessage(err.message || 'Invalid email or password.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;

    setErrorMessage(null);
    setIsLoading(true);
    try {
      await authApi.resendOtp(email);
      setSuccessMessage('A fresh 6-digit verification code has been sent to your email.');
      setCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomGoogleClick = () => {
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    }
  };

  const switchMode = (mode: 'signin' | 'signup' | 'forgot' | 'otp') => {
    setAuthMode(mode);
    setResetSent(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div 
      className="auth-canvas-overlay anim-fade-in" 
      onMouseMove={handleMouseMove}
      style={{
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`
      } as React.CSSProperties}
    >
      {/* Ambient Spotlight & Grid */}
      <div className="auth-ambient-spotlight"></div>
      <div className="auth-grid-pattern"></div>

      <div className="auth-card-box anim-slide-up">
        {/* Branding & 3D Gyroscopic Solar Core */}
        <div className="auth-brand-badge">
          <div className="neural-3d-scene auth-3d-emblem">
            {/* Central Volumetric 3D Sphere */}
            <div className="volumetric-3d-sphere">
              <Brain size={22} className="sphere-brain-hologram" />
            </div>

            {/* Symmetrical 4-Plane Gyroscopic Solar System */}
            <div className="interactive-3d-rotator">
              <div className="neural-3d-floating-system">
                {/* 1. Horizontal Equatorial Ring (0°) */}
                <div className="gyro-3d-ring gyro-equatorial">
                  <div className="planet-revolver rev-eq">
                    <div className="orbit-planet">
                      <div className="sub-moon-orbit moon-orbit-eq">
                        <div className="sub-moon"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. +45° Tilted Ring from Right Side */}
                <div className="gyro-3d-ring gyro-tilt-pos">
                  <div className="planet-revolver rev-pos">
                    <div className="orbit-planet">
                      <div className="sub-moon-orbit moon-orbit-pos">
                        <div className="sub-moon"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. -45° Tilted Ring from Left Side */}
                <div className="gyro-3d-ring gyro-tilt-neg">
                  <div className="planet-revolver rev-neg">
                    <div className="orbit-planet">
                      <div className="sub-moon-orbit moon-orbit-neg">
                        <div className="sub-moon"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. 90° Polar Ring Perpendicular to Equatorial Ring */}
                <div className="gyro-3d-ring gyro-polar-90">
                  <div className="planet-revolver rev-polar">
                    <div className="orbit-planet">
                      <div className="sub-moon-orbit moon-orbit-polar">
                        <div className="sub-moon"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="neural-3d-floor-shadow"></div>
          </div>
          <h2>Noesis</h2>
          <span className="auth-badge-sub">Autonomous Multi-Modal RAG Platform</span>
        </div>

        {/* Content Container */}
        <div className="auth-form-card auth-card-inner">
          {authMode === 'otp' ? (
            /* 1. OTP Verification Mode */
            <div className="auth-otp-view anim-fade-in">
              <div className="auth-otp-header">
                <div className="auth-otp-icon-wrap">
                  <KeyRound size={22} className="auth-key-icon" />
                </div>
                <h3>Verify your email</h3>
                <p>
                  Enter the 6-digit verification code sent to <br />
                  <strong>{email}</strong>
                </p>
              </div>

              {errorMessage && (
                <div className="auth-error-banner anim-slide-up">
                  <AlertCircle size={14} className="error-icon" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="auth-success-banner anim-slide-up">
                  <CheckCircle2 size={14} className="success-icon" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* 6-Digit OTP Input Box Group */}
              <div className="auth-otp-boxes-row" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`auth-otp-box ${digit ? 'filled' : ''}`}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <button 
                type="button" 
                className="auth-primary-submit-btn" 
                onClick={() => handleSubmit()}
                disabled={isLoading || otpDigits.join('').length !== 6}
              >
                {isLoading ? (
                  <span className="auth-spinner"></span>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="auth-otp-footer">
                <button
                  type="button"
                  className={`auth-resend-btn ${cooldown > 0 ? 'disabled' : ''}`}
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isLoading}
                >
                  <RotateCw size={13} className={isLoading ? 'anim-spin' : ''} />
                  <span>
                    {cooldown > 0 
                      ? `Resend code in ${formatCooldown(cooldown)}` 
                      : 'Resend code'}
                  </span>
                </button>

                <button 
                  type="button" 
                  className="auth-back-link" 
                  onClick={() => switchMode('signup')}
                >
                  <ArrowLeft size={13} />
                  <span>Back to Sign Up</span>
                </button>
              </div>
            </div>
          ) : authMode === 'forgot' ? (
            /* 2. Forgot Password Mode */
            resetSent ? (
              <div className="auth-reset-success-box anim-fade-in">
                <div className="auth-success-circle">
                  <CheckCircle2 size={32} />
                </div>
                <h3>Check your email</h3>
                <p>
                  We have sent password recovery instructions to <strong>{email}</strong>
                </p>
                <button 
                  type="button" 
                  className="auth-back-btn"
                  onClick={() => switchMode('signin')}
                >
                  <ArrowLeft size={14} />
                  <span>Return to Sign In</span>
                </button>
              </div>
            ) : (
              <div className="auth-forgot-view anim-fade-in">
                <div className="auth-header-text">
                  <h3>Reset your password</h3>
                  <p>Enter your account email to receive reset instructions.</p>
                </div>

                {errorMessage && (
                  <div className="auth-error-banner anim-slide-up">
                    <AlertCircle size={14} className="error-icon" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="auth-input-form">
                  <div className="auth-field-group">
                    <label htmlFor="auth-forgot-email">Account email</label>
                    <div className="auth-input-wrapper">
                      <Mail size={15} className="auth-field-icon" />
                      <input 
                        id="auth-forgot-email"
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-primary-submit-btn" disabled={isLoading}>
                    {isLoading ? (
                      <span className="auth-spinner"></span>
                    ) : (
                      <>
                        <span>Send Instructions</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-toggle-footer">
                  <button 
                    type="button" 
                    className="auth-back-link" 
                    onClick={() => switchMode('signin')}
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            /* 3. Sign In & Sign Up Modes */
            <>
              <div className="auth-header-text">
                <h3>{authMode === 'signin' ? 'Sign in' : 'Create an account'}</h3>
              </div>

              {errorMessage && (
                <div className="auth-error-banner anim-slide-up">
                  <AlertCircle size={14} className="error-icon" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="auth-success-banner anim-slide-up">
                  <CheckCircle2 size={14} className="success-icon" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-input-form">
                {/* Full Name field (smooth expandable for Sign Up) */}
                <div className={`auth-field-group auth-expandable-field ${authMode === 'signup' ? 'is-expanded' : ''}`}>
                  <label htmlFor="auth-name">Full name</label>
                  <div className="auth-input-wrapper">
                    <User size={15} className="auth-field-icon" />
                    <input 
                      id="auth-name"
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      autoComplete="name"
                      required={authMode === 'signup'}
                      tabIndex={authMode === 'signup' ? 0 : -1}
                    />
                  </div>
                </div>

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
                      autoComplete="email"
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
                        onClick={() => switchMode('forgot')}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="auth-input-wrapper">
                    <Lock size={15} className="auth-field-icon" />
                    <input 
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                      onCopy={preventClipboard}
                      onPaste={preventClipboard}
                      onCut={preventClipboard}
                      required
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field (smooth expandable for Sign Up) */}
                <div className={`auth-field-group auth-expandable-field ${authMode === 'signup' ? 'is-expanded' : ''}`}>
                  <label htmlFor="auth-confirm-password">Confirm password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={15} className="auth-field-icon" />
                    <input 
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      onCopy={preventClipboard}
                      onPaste={preventClipboard}
                      onCut={preventClipboard}
                      required={authMode === 'signup'}
                      tabIndex={authMode === 'signup' ? 0 : -1}
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-primary-submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <span className="auth-spinner"></span>
                  ) : (
                    <>
                      <span>{authMode === 'signin' ? 'Sign In' : 'Create Account & Send Code'}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>OR CONTINUE WITH</span>
              </div>

              {/* Official Google Identity Button Container */}
              <div className="auth-social-row" style={{ display: 'flex', justifyContent: 'center', minHeight: '44px' }}>
                <div 
                  id="google-signin-btn-container" 
                  ref={googleBtnContainerRef} 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  <button 
                    type="button" 
                    className="auth-google-btn"
                    onClick={handleCustomGoogleClick}
                    disabled={isLoading}
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
              </div>

              {/* Mode Toggle */}
              <div className="auth-toggle-footer">
                <span>
                  {authMode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                </span>
                <button 
                  type="button" 
                  className="auth-toggle-btn"
                  onClick={() => switchMode(authMode === 'signin' ? 'signup' : 'signin')}
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
