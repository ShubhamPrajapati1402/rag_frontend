import { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import './Auth.css';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate authentication
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-glass-panel glass-panel">
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to access your RAG workspace' : 'Join to start interacting with your data'}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <User className="input-icon" size={20} />
              <input type="text" placeholder="Full Name" required disabled={isLoading} />
            </div>
          )}
          
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input type="email" placeholder="Email Address" required disabled={isLoading} />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input type="password" placeholder="Password" required disabled={isLoading} />
          </div>

          {isLoading ? (
            <div className="skeleton auth-btn-skeleton"></div>
          ) : (
            <button type="submit" className="btn-primary auth-submit">
              {isLogin ? 'Sign In' : 'Sign Up'}
              <ArrowRight size={18} />
            </button>
          )}
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <button className="btn-secondary auth-social" disabled={isLoading}>
          Continue with Google
        </button>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="auth-link" onClick={() => !isLoading && setIsLogin(!isLogin)}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
