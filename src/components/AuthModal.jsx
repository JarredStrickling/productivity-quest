import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './AuthModal.css';

const INITIAL_ERRORS = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  general: '',
};

export default function AuthModal({ isOpen, onAuthSuccess }) {
  const { register, login, resetPassword, getAuthErrorMessage } = useAuth();

  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'
  const [username, setUsername] = useState(() => localStorage.getItem('rememberedUsername') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState('');

  if (!isOpen) return null;

  function clearError(field) {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function setError(field, message) {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }

  function resetForm() {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setErrors(INITIAL_ERRORS);
    setIsSubmitting(false);
    setShowSuccess('');
  }

  function switchView(newView) {
    resetForm();
    setView(newView);
  }

  // ── Register submit ────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();

    const newErrors = { ...INITIAL_ERRORS };
    let hasError = false;

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      newErrors.username = 'Username must be 3–20 characters (letters, numbers, underscores only).';
      hasError = true;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
      hasError = true;
    }

    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
      hasError = true;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors(INITIAL_ERRORS);

    try {
      await register(username, email, password);
      setShowSuccess('Account created!');
      setTimeout(() => {
        onAuthSuccess();
      }, 1500);
    } catch (error) {
      setIsSubmitting(false);
      const message = getAuthErrorMessage(error);
      const code = error.code || '';

      if (code === 'USERNAME_TAKEN' || code === 'auth/invalid-username') {
        setError('username', message);
      } else if (code === 'auth/email-already-in-use' || code === 'auth/invalid-email') {
        setError('email', message);
      } else if (code === 'auth/weak-password') {
        setError('password', message);
      } else {
        setError('general', message);
      }
    }
  }

  // ── Login submit ───────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors(INITIAL_ERRORS);

    try {
      await login(username, password);
      localStorage.setItem('rememberedUsername', username);
      onAuthSuccess();
    } catch (error) {
      setIsSubmitting(false);
      setError('general', getAuthErrorMessage(error));
    }
  }

  // ── Forgot password submit ─────────────────────────────────────────
  async function handleForgot(e) {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('email', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrors(INITIAL_ERRORS);

    try {
      await resetPassword(email);
      setShowSuccess('Check your email for a reset link');
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      setError('email', getAuthErrorMessage(error));
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-logo-wrap">
          <img
            src="/assets/sprites/scrolls-of-doom-logo.png"
            alt="Scrolls of Doom"
            className="auth-logo"
          />
        </div>

        {showSuccess ? (
          <div className="auth-success-message">{showSuccess}</div>
        ) : (
          <>
            {errors.general && (
              <div className="auth-general-error">{errors.general}</div>
            )}

            {/* ── Register view ───────────────────────────────── */}
            {view === 'register' && (
              <form className="auth-form" onSubmit={handleRegister} noValidate>
                <div className="auth-field">
                  <label htmlFor="auth-username">Username</label>
                  <input
                    id="auth-username"
                    type="text"
                    value={username}
                    autoComplete="username"
                    onChange={(e) => { setUsername(e.target.value); clearError('username'); }}
                    disabled={isSubmitting}
                  />
                  {errors.username && (
                    <span className="auth-field-error">{errors.username}</span>
                  )}
                </div>

                <div className="auth-field">
                  <label htmlFor="auth-email">Email</label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <span className="auth-field-error">{errors.email}</span>
                  )}
                </div>

                <div className="auth-field">
                  <label htmlFor="auth-password">Password</label>
                  <div className="auth-password-wrapper">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      autoComplete="new-password"
                      onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="auth-toggle-password"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="auth-field-error">{errors.password}</span>
                  )}
                </div>

                <div className="auth-field">
                  <label htmlFor="auth-confirm-password">Confirm Password</label>
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                    disabled={isSubmitting}
                  />
                  {errors.confirmPassword && (
                    <span className="auth-field-error">{errors.confirmPassword}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <span className="auth-spinner" /> : 'Sign Up'}
                </button>

                <p className="auth-toggle-link">
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchView('login')}>
                    Log In
                  </button>
                </p>
              </form>
            )}

            {/* ── Login view ──────────────────────────────────── */}
            {view === 'login' && (
              <form className="auth-form" onSubmit={handleLogin} noValidate>
                <div className="auth-field">
                  <label htmlFor="auth-username-login">Username</label>
                  <input
                    id="auth-username-login"
                    type="text"
                    value={username}
                    autoComplete="username"
                    onChange={(e) => { setUsername(e.target.value); clearError('username'); }}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="auth-password-login">Password</label>
                  <div className="auth-password-wrapper">
                    <input
                      id="auth-password-login"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      autoComplete="current-password"
                      onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="auth-toggle-password"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => switchView('forgot')}
                >
                  Forgot password?
                </button>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <span className="auth-spinner" /> : 'Log In'}
                </button>

                <p className="auth-toggle-link">
                  Don&apos;t have an account?{' '}
                  <button type="button" onClick={() => switchView('register')}>
                    Sign Up
                  </button>
                </p>
              </form>
            )}

            {/* ── Forgot password view ────────────────────────── */}
            {view === 'forgot' && (
              <form className="auth-form" onSubmit={handleForgot} noValidate>
                <div className="auth-field">
                  <label htmlFor="auth-forgot-email">Email</label>
                  <input
                    id="auth-forgot-email"
                    type="email"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <span className="auth-field-error">{errors.email}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <span className="auth-spinner" /> : 'Send Reset Link'}
                </button>

                <p className="auth-toggle-link">
                  <button type="button" onClick={() => switchView('login')}>
                    Back to Log In
                  </button>
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
