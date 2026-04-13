import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

export default function Dashboard({ user, token, onGoChat, onLogout }) {
  const [history, setHistory] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/health/my-history', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/alerts/trending')
    ]).then(([h, t]) => {
      setHistory(h.data);
      setTrending(t.data.trending || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const bmi = user.healthProfile?.height && user.healthProfile?.weight
    ? (user.healthProfile.weight / Math.pow(user.healthProfile.height / 100, 2)).toFixed(1)
    : null;

  const getBmiInfo = (b) => {
    const n = parseFloat(b);
    if (n < 18.5) return { label: 'Underweight', color: '#38bdf8' };
    if (n < 25) return { label: 'Healthy', color: '#34d399' };
    if (n < 30) return { label: 'Overweight', color: '#fbbf24' };
    return { label: 'Obese', color: '#f87171' };
  };

  const bmiInfo = bmi ? getBmiInfo(bmi) : null;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">My Health Dashboard</h1>
          <p className="dash-sub">Welcome back, {user.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={onGoChat}>💬 Chat</button>
          <button className="btn btn-danger" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="dash-grid">
        {/* Profile card */}
        <div className="card dash-profile">
          <h3 className="card-title">👤 Your Profile</h3>
          <div className="profile-stats">
            {[
              { label: 'Age', value: user.healthProfile?.age || '—' },
              { label: 'Gender', value: user.healthProfile?.gender || '—' },
              { label: 'Height', value: user.healthProfile?.height ? `${user.healthProfile.height} cm` : '—' },
              { label: 'Weight', value: user.healthProfile?.weight ? `${user.healthProfile.weight} kg` : '—' },
              { label: 'Blood', value: user.healthProfile?.bloodGroup || '—' },
            ].map(s => (
              <div key={s.label} className="profile-stat">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value">{s.value}</span>
              </div>
            ))}
          </div>

          {bmi && (
            <div className="bmi-box" style={{ borderColor: bmiInfo.color }}>
              <div className="bmi-value" style={{ color: bmiInfo.color }}>{bmi}</div>
              <div>
                <div className="bmi-label">BMI</div>
                <div className="bmi-category" style={{ color: bmiInfo.color }}>{bmiInfo.label}</div>
              </div>
            </div>
          )}

          {user.healthProfile?.medications?.length > 0 && (
            <div className="meds-section">
              <p className="card-subtitle">Current Medications</p>
              <div className="meds-list">
                {user.healthProfile.medications.map(m => (
                  <span key={m} className="badge badge-blue">💊 {m}</span>
                ))}
              </div>
            </div>
          )}

          {user.healthProfile?.chronicConditions?.length > 0 && (
            <div className="meds-section">
              <p className="card-subtitle">Chronic Conditions</p>
              <div className="meds-list">
                {user.healthProfile.chronicConditions.map(c => (
                  <span key={c} className="badge badge-yellow">⚕️ {c}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="card dash-history">
          <h3 className="card-title">📋 Diagnosis History</h3>
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <p>No diagnoses yet.</p>
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={onGoChat}>
                Start Chat →
              </button>
            </div>
          ) : (
            <div className="history-list">
              {history.map((h, i) => (
                <div key={i} className="history-item">
                  <div className="history-main">
                    <span className="history-disease">{h.predictedDisease}</span>
                    <span className={`badge badge-${h.severity === 'severe' ? 'red' : h.severity === 'moderate' ? 'yellow' : 'green'}`}>
                      {h.severity}
                    </span>
                  </div>
                  <div className="history-symptoms">
                    {h.symptoms?.slice(0, 3).map(s => (
                      <span key={s} className="sym-tag">{s.replace(/_/g, ' ')}</span>
                    ))}
                    {h.symptoms?.length > 3 && <span className="sym-more">+{h.symptoms.length - 3}</span>}
                  </div>
                  <div className="history-date">
                    {new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trending diseases */}
        <div className="card dash-trending">
          <h3 className="card-title">📈 Trending Diseases (7 days)</h3>
          {trending.length === 0 ? (
            <div className="empty-state">No data yet. Be the first to report!</div>
          ) : (
            <div className="trending-list">
              {trending.map((t, i) => (
                <div key={i} className="trending-item">
                  <span className="trending-rank">#{i + 1}</span>
                  <span className="trending-name">{t.disease}</span>
                  <span className="trending-count">{t.count} reports</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
