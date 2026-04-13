import React from 'react';
import './LocationAlert.css';

export default function LocationAlert({ data, onClose }) {
  const riskColors = {
    LOW: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' },
    MEDIUM: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' },
    HIGH: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', color: '#f87171' },
    'VERY HIGH': { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#ef4444' },
  };

  const style = riskColors[data.riskLevel] || riskColors.LOW;

  return (
    <div className="location-alert fade-in" style={{
      background: style.bg,
      borderColor: style.border,
    }}>
      <div className="alert-icon" style={{ color: style.color }}>
        {data.riskLevel === 'LOW' ? '✅' : data.riskLevel === 'MEDIUM' ? '⚠️' : '🚨'}
      </div>
      <div className="alert-content">
        <div className="alert-title" style={{ color: style.color }}>
          {data.riskLevel} RISK ZONE — {data.total} reports nearby (30 days)
        </div>
        <div className="alert-diseases">
          {data.diseases?.slice(0, 3).map((d, i) => (
            <span key={i} className="alert-tag" style={{ color: style.color, borderColor: style.border }}>
              {d.name} ({d.percentage}%)
            </span>
          ))}
        </div>
        {data.diseases?.[0]?.precautions?.[0] && (
          <div className="alert-tip">
            💡 Tip: {data.diseases[0].precautions[0]}
          </div>
        )}
      </div>
      <button className="alert-close" onClick={onClose}>✕</button>
    </div>
  );
}
