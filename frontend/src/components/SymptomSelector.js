import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SymptomSelector.css';

const COMMON_SYMPTOMS = [
  'fever','headache','cough','fatigue','nausea','vomiting','dizziness',
  'chest_pain','back_pain','stomach_pain','runny_nose','throat_irritation',
  'skin_rash','itching','breathlessness','joint_pain','muscle_weakness',
  'loss_of_appetite','weight_loss','blurred_vision','sweating','chills',
  'constipation','diarrhoea','yellowish_skin','dark_urine','abdominal_pain'
];

export default function SymptomSelector({ token, selected, onChange, onClose, onSubmit }) {
  const [allSymptoms, setAllSymptoms] = useState(COMMON_SYMPTOMS);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/chat/symptoms-list', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.data.symptoms?.length > 0) setAllSymptoms(res.data.symptoms);
    }).catch(() => {});
  }, [token]);

  const filtered = allSymptoms.filter(s =>
    s.toLowerCase().includes(search.toLowerCase().replace(/\s/g, '_'))
  ).slice(0, 40);

  const toggle = (s) => {
    if (selected.includes(s)) {
      onChange(selected.filter(x => x !== s));
    } else if (selected.length < 10) {
      onChange([...selected, s]);
    }
  };

  return (
    <div className="symptom-overlay">
      <div className="symptom-panel fade-in">
        <div className="sp-header">
          <h3>Select Symptoms</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="sp-count">{selected.length}/10 selected</span>
            <button className="sp-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <input
          className="sp-search"
          placeholder="Search symptoms..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />

        <div className="sp-grid">
          {filtered.map(s => (
            <button
              key={s}
              className={`sp-item ${selected.includes(s) ? 'selected' : ''}`}
              onClick={() => toggle(s)}
            >
              {selected.includes(s) && <span className="sp-check">✓</span>}
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="sp-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={selected.length === 0}
          >
            Analyze {selected.length > 0 ? `(${selected.length})` : ''} →
          </button>
        </div>
      </div>
    </div>
  );
}
