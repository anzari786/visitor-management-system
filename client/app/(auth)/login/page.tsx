'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [activePanel, setActivePanel] = useState('login');
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 2200);
  };

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setTimeout(() => {
      setIsLoginLoading(false);
      showToast('Login successful');
      e.currentTarget.reset();
    }, 900);
  };

  const handleSignupSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSignupLoading(true);
    setTimeout(() => {
      setIsSignupLoading(false);
      showToast('Account created');
      e.currentTarget.reset();
    }, 900);
  };

  const handleResetSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsResetModalOpen(false);
    showToast('Reset link sent to your email');
    e.currentTarget.reset();
  };

  return (
    <div className="auth-page-layout">
      {/* Status Toast Notification */}
      <div className={`status-toast ${isToastVisible ? 'visible' : ''}`} id="statusToast">
        {toastMessage}
      </div>

      {/* Main Shell Container */}
      <div className="auth-shell">
        {/* Login Panel */}
        <div className={`panel ${activePanel === 'login' ? 'active' : ''}`} data-panel="login">
          <div className="brand-mark">
            <img src="/logo.png" alt="ATI Logo" />
          </div>
          <p className="brand-caption">ATI-visitor-management-system</p>
          
          <h2>Sign in</h2>

          <form id="loginForm" className="login-form" onSubmit={handleLoginSubmit}>
            <div className="input-group">
              <label>Username</label>
              <input type="text" placeholder="Enter your username" required />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="Enter your password" required />
            </div>

            <div className="form-row">
              <label className="checkbox-wrap">
                <input type="checkbox" /> Remember me
              </label>
              <button 
                type="button" 
                id="forgotPasswordButton" 
                className="forgot-link"
                onClick={() => setIsResetModalOpen(true)}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="submit-button" disabled={isLoginLoading}>
              <span className="button-text">{isLoginLoading ? 'Please wait...' : 'Log in'}</span>
              <span className="button-arrow">→</span>
            </button>

            <p className="register-copy">
              Need an account?{' '}
              <button type="button" className="inline-link" onClick={() => setActivePanel('signup')} data-switch="signup">
                Create account
              </button>
            </p>
          </form>
        </div>

        {/* Signup Panel */}
        <div className={`panel ${activePanel === 'signup' ? 'active' : ''}`} data-panel="signup">
          <div className="brand-mark">
            <img src="/logo.png" alt="ATI Logo" />
          </div>
          <p className="brand-caption">ATI-visitor-management-system</p>

          <h2>Sign up</h2>

          <form id="signupForm" className="login-form" onSubmit={handleSignupSubmit}>
            <div className="input-group">
              <label>Full name</label>
              <input type="text" placeholder="John Smith" required />
            </div>

            <div className="input-group">
              <label>Username</label>
              <input type="text" placeholder="Choose a username" required />
            </div>

            <div className="input-group">
              <label>Email address</label>
              <input type="email" placeholder="you@example.com" required />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="Create a password" required />
            </div>

            <button type="submit" className="submit-button" disabled={isSignupLoading}>
              <span className="button-text">{isSignupLoading ? 'Please wait...' : 'Create account'}</span>
              <span className="button-arrow">→</span>
            </button>

            <p className="register-copy">
              Already have an account?{' '}
              <button type="button" className="inline-link" onClick={() => setActivePanel('login')} data-switch="login">
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <div 
        className="modal-backdrop" 
        id="resetModal" 
        hidden={!isResetModalOpen}
        onClick={(e) => { if (e.target === e.currentTarget) setIsResetModalOpen(false); }}
      >
        <div className="reset-modal" role="dialog">
          <button type="button" className="modal-close" id="closeResetModal" onClick={() => setIsResetModalOpen(false)}>
            &times;
          </button>
          <h2>Reset Password</h2>
          <p>Enter your email address and we&apos;ll send you a link to reset your password.</p>
          
          <form id="resetForm" className="reset-form" onSubmit={handleResetSubmit}>
            <div className="input-group">
              <label>Email address</label>
              <input type="email" id="resetEmail" placeholder="Enter your email" required />
            </div>
            
            <button type="submit" className="submit-button">
              <span className="button-text">Send Reset Link</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}