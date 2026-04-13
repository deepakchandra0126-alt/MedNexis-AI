import React, { useState } from 'react';
import axios from 'axios';
import './AuthPages.css';

export default function RegisterPage({ onRegister, onGoLogin }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    healthProfile: {
      age: '', gender: '', height: '', weight: '',
      bloodGroup: '', medications: '', chronicConditions: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        healthProfile: {
          ...form.healthProfile,
          age: parseInt(form.healthProfile.age) || undefined,
          height: parseInt(form.healthProfile.height) || undefined,
          weight: parseInt(form.healthProfile.weight) || undefined,
          medications: form.healthProfile.medications
            ? form.healthProfile.medications.split(',').map(s => s.trim())
            : [],
          chronicConditions: form.healthProfile.chronicConditions
            ? form.healthProfile.chronicConditions.split(',').map(s => s.trim())
            : []
        }
      };
      const res = await axios.post('/api/auth/register', payload);
      onRegister(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const u = (key, val) => setForm(f => ({
    ...f,
    healthProfile: { ...f.healthProfile, [key]: val }
  }));

  return (
    <div className="auth-bg">
      <div className="auth-glow" />
      <div className="auth-card auth-card-wide fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">🏥</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Step {step} of 2 — {step === 1 ? 'Basic Info' : 'Health Profile'}
          </p>
        </div>

        <div className="auth-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-line" />
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {step === 1 && (
          <div className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                placeholder="John Doe"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
              />
            </div>
            <button
              className="btn btn-primary auth-btn"
              onClick={() => {
                if (!form.name || !form.email || !form.password) {
                  setError('Please fill all fields');
                  return;
                }
                setError('');
                setStep(2);
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>Age</label>
                <input type="number" placeholder="25" value={form.healthProfile.age} onChange={e => u('age', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select value={form.healthProfile.gender} onChange={e => u('gender', e.target.value)}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Height (cm)</label>
                <input type="number" placeholder="170" value={form.healthProfile.height} onChange={e => u('height', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" placeholder="65" value={form.healthProfile.weight} onChange={e => u('weight', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Blood Group</label>
                <select value={form.healthProfile.bloodGroup} onChange={e => u('bloodGroup', e.target.value)}>
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Current Medications <span className="label-hint">(comma separated)</span></label>
              <input placeholder="Metformin, Aspirin" value={form.healthProfile.medications} onChange={e => u('medications', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Chronic Conditions <span className="label-hint">(comma separated)</span></label>
              <input placeholder="Diabetes, Hypertension" value={form.healthProfile.chronicConditions} onChange={e => u('chronicConditions', e.target.value)} />
            </div>
            <div className="form-row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : '🎉 Create Account'}
              </button>
            </div>
          </form>
        )}

        <p className="auth-switch">
          Already have an account?{' '}
          <button className="auth-link" onClick={onGoLogin}>Sign in →</button>
        </p>
      </div>
    </div>
  );
}
