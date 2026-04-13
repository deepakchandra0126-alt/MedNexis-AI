import React, { useState } from 'react';
import './DiagnosisCard.css';

export default function DiagnosisCard({ data }) {
  const [tab, setTab] = useState('overview');

  const severityColor = {
    mild: '#34d399',
    moderate: '#fbbf24',
    severe: '#f87171'
  };

  const confidencePct = data.confidence || 0;
  const color = severityColor[data.severity] || '#38bdf8';

  return (
    <div className="diagnosis-card">
      {/* Header */}
      <div className="diag-header">
        <div className="diag-disease">
          <span className="diag-icon">🔬</span>
          <div>
            <h3 className="diag-name">{data.disease}</h3>
            <span className="diag-severity" style={{ color }}>
              {data.severity?.toUpperCase()} · {confidencePct}% match
            </span>
          </div>
        </div>
        <div className="confidence-ring">
          <svg viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="var(--bg3)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke={color} strokeWidth="3"
              strokeDasharray={`${confidencePct * 0.942} 94.2`}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
          </svg>
          <span style={{ color }}>{confidencePct}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="diag-tabs">
        {['overview', 'precautions', 'diet & care', 'alternatives'].map(t => (
          <button
            key={t}
            className={`diag-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="diag-content">
        {tab === 'overview' && (
          <div>
            <p className="diag-description">{data.description}</p>
            {data.matched_symptoms?.length > 0 && (
              <div className="diag-symptoms">
                <p className="diag-section-label">Matched Symptoms</p>
                <div className="symptom-chips">
                  {data.matched_symptoms.map(s => (
                    <span key={s} className="symptom-chip matched">
                      ✓ {s.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {data.unmatched_symptoms?.map(s => (
                    <span key={s} className="symptom-chip unmatched">
                      ? {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'precautions' && (
          <div>
            <p className="diag-section-label">Recommended Precautions</p>
            <ul className="diag-list">
              {data.precautions?.map((p, i) => (
                <li key={i} className="diag-list-item precaution">
                  <span className="list-icon">🛡️</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'diet & care' && (
          <div>
            {data.diets?.length > 0 && (
              <>
                <p className="diag-section-label">Diet Recommendations</p>
                <ul className="diag-list">
                  {data.diets.map((d, i) => (
                    <li key={i} className="diag-list-item">
                      <span className="list-icon">🥗</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {data.workouts?.length > 0 && (
              <>
                <p className="diag-section-label" style={{ marginTop: 12 }}>Activity & Recovery</p>
                <ul className="diag-list">
                  {data.workouts.map((w, i) => (
                    <li key={i} className="diag-list-item">
                      <span className="list-icon">🏃</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {tab === 'alternatives' && (
          <div>
            <p className="diag-section-label">Other Possible Conditions</p>
            {data.alternatives?.length > 0 ? (
              <div className="alternatives-list">
                {data.alternatives.map((a, i) => (
                  <div key={i} className="alt-item">
                    <span className="alt-name">{a.disease}</span>
                    <div className="alt-bar-wrap">
                      <div className="alt-bar" style={{ width: `${a.confidence}%` }} />
                    </div>
                    <span className="alt-pct">{a.confidence}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>No close alternatives found.</p>
            )}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="diag-disclaimer">
        ⚠️ {data.disclaimer}
      </div>
    </div>
  );
}
