import React, { useState } from 'react';
import axios from 'axios';
import './AuthPages.css';

export default function LoginPage({ onLogin, onGoRegister }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', form);
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-glow" />
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">🏥</div>
          <h1 className="auth-title">HealthAI</h1>
          <p className="auth-subtitle">Your intelligent health companion</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="doctor@example.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : '🔐 Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          New user?{' '}
          <button className="auth-link" onClick={onGoRegister}>
            Create account →
          </button>
        </p>

        <div className="auth-demo">
          <p>Demo: use any email & password after registering</p>
        </div>
      </div>
    </div>
  );
}
