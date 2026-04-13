import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import LocationAlert from '../components/LocationAlert';
import SymptomSelector from '../components/SymptomSelector';
import DiagnosisCard from '../components/DiagnosisCard';
import './ChatPage.css';

export default function ChatPage({ user, token, onLogout, onGoProfile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationAlert, setLocationAlert] = useState(null);
  const [location, setLocation] = useState(null);
  const [showSymptomPicker, setShowSymptomPicker] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Welcome message on mount
  useEffect(() => {
    const bmi = user.healthProfile?.height && user.healthProfile?.weight
      ? (user.healthProfile.weight / Math.pow(user.healthProfile.height / 100, 2)).toFixed(1)
      : null;

    addBotMessage(
      `👋 Hello **${user.name}**! I'm HealthAI, your personal health assistant.\n\n` +
      (bmi ? `📊 Your BMI: **${bmi}** (${getBmiCategory(bmi)})\n\n` : '') +
      `Tell me your symptoms or pick them from the list below. I'll analyze and give you possible causes and precautions.\n\n` +
      `⚠️ *I'm an AI — always consult a real doctor for diagnosis.*`,
      'welcome'
    );

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });
        updateLocationOnServer(lat, lng);
      });
    }
  }, []);

  // Socket.io for real-time location alerts
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('location_alert', (data) => {
      if (data.total > 0) setLocationAlert(data);
    });

    return () => socketRef.current?.disconnect();
  }, []);

  // Send location to socket
  useEffect(() => {
    if (location && socketRef.current) {
      socketRef.current.emit('update_location', {
        userId: user.id,
        lat: location.lat,
        lng: location.lng
      });
    }
  }, [location]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateLocationOnServer = async (lat, lng) => {
    try {
      await axios.put('/api/health/update-location',
        { lat, lng },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {}
  };

  const addBotMessage = (text, type = 'text', data = null) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role: 'bot',
      text,
      type,
      data,
      time: new Date()
    }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      text,
      time: new Date()
    }]);
  };

  const handleSend = async (symptomsOverride = null) => {
    const symptoms = symptomsOverride || selectedSymptoms;
    const userText = input.trim();

    if (!symptoms.length && !userText) return;

    const finalSymptoms = symptoms.length > 0
      ? symptoms
      : userText.split(',').map(s => s.trim()).filter(Boolean);

    addUserMessage(
      symptoms.length > 0
        ? `Symptoms: ${symptoms.join(', ')}`
        : userText
    );
    setInput('');
    setSelectedSymptoms([]);
    setShowSymptomPicker(false);
    setLoading(true);

    try {
      const res = await axios.post(
        '/api/chat/predict',
        {
          symptoms: finalSymptoms,
          lat: location?.lat,
          lng: location?.lng
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      addBotMessage('', 'diagnosis', res.data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      addBotMessage(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckArea = async () => {
    if (!location) {
      addBotMessage('📍 Please allow location access to check area health stats.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/location/stats?lat=${location.lat}&lng=${location.lng}&radius=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addBotMessage('', 'area_stats', res.data);
    } catch (err) {
      addBotMessage('Could not fetch area stats. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    { label: '🤒 Fever + Headache', symptoms: ['fever', 'headache', 'fatigue'] },
    { label: '🤧 Cold & Cough', symptoms: ['cough', 'runny_nose', 'throat_irritation'] },
    { label: '🤢 Stomach Issues', symptoms: ['nausea', 'vomiting', 'stomach_pain'] },
    { label: '😴 Fatigue', symptoms: ['fatigue', 'lethargy', 'dizziness'] },
    { label: '📍 Check My Area', action: handleCheckArea },
  ];

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🏥</span>
          <span className="logo-text">HealthAI</span>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user.name[0].toUpperCase()}</div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-meta">
              {user.healthProfile?.age ? `Age ${user.healthProfile.age}` : 'Profile incomplete'}
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">QUICK CHECKS</p>
          {QUICK_PROMPTS.map((q, i) => (
            <button
              key={i}
              className="quick-btn"
              onClick={() => q.action ? q.action() : handleSend(q.symptoms)}
            >
              {q.label}
            </button>
          ))}
        </div>

        {user.healthProfile && (
          <div className="sidebar-section health-summary">
            <p className="sidebar-label">YOUR PROFILE</p>
            {user.healthProfile.age && <div className="health-stat">Age: {user.healthProfile.age}</div>}
            {user.healthProfile.bloodGroup && <div className="health-stat">Blood: {user.healthProfile.bloodGroup}</div>}
            {user.healthProfile.height && user.healthProfile.weight && (
              <div className="health-stat">
                BMI: {(user.healthProfile.weight / Math.pow(user.healthProfile.height / 100, 2)).toFixed(1)}
              </div>
            )}
            {user.healthProfile.medications?.length > 0 && (
              <div className="health-stat meds">💊 {user.healthProfile.medications.slice(0,2).join(', ')}</div>
            )}
          </div>
        )}

        <div className="sidebar-footer">
          <button className="btn btn-ghost sidebar-btn" onClick={onGoProfile}>👤 Profile</button>
          <button className="btn btn-danger sidebar-btn" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <div>
            <h2>Health Assistant</h2>
            <p className="chat-header-sub">
              {location ? '📍 Location active' : '📍 Location off'} &nbsp;·&nbsp;
              AI-powered · Not a medical substitute
            </p>
          </div>
          <div className="header-actions">
            {location && (
              <button className="btn btn-ghost" onClick={handleCheckArea}>
                🗺️ Area Stats
              </button>
            )}
          </div>
        </div>

        {/* Location alert banner */}
        {locationAlert && (
          <LocationAlert data={locationAlert} onClose={() => setLocationAlert(null)} />
        )}

        {/* Messages */}
        <div className="messages-area">
          {messages.map(msg => (
            <div key={msg.id} className={`message-row ${msg.role}`}>
              {msg.role === 'bot' && <div className="bot-avatar">🏥</div>}
              <div className={`message-bubble ${msg.role}`}>
                {msg.type === 'diagnosis' ? (
                  <DiagnosisCard data={msg.data} />
                ) : msg.type === 'area_stats' ? (
                  <AreaStatsCard data={msg.data} />
                ) : (
                  <p className="message-text" dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br/>')
                  }} />
                )}
                <span className="message-time">
                  {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row bot">
              <div className="bot-avatar">🏥</div>
              <div className="message-bubble bot typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Symptom picker */}
        {showSymptomPicker && (
          <SymptomSelector
            token={token}
            selected={selectedSymptoms}
            onChange={setSelectedSymptoms}
            onClose={() => setShowSymptomPicker(false)}
            onSubmit={() => handleSend()}
          />
        )}

        {/* Input area */}
        <div className="chat-input-area">
          {selectedSymptoms.length > 0 && (
            <div className="selected-symptoms">
              {selectedSymptoms.map(s => (
                <span key={s} className="symptom-tag">
                  {s.replace(/_/g, ' ')}
                  <button onClick={() => setSelectedSymptoms(prev => prev.filter(x => x !== s))}>×</button>
                </span>
              ))}
            </div>
          )}
          <div className="input-row">
            <button
              className="btn btn-ghost icon-btn"
              onClick={() => setShowSymptomPicker(!showSymptomPicker)}
              title="Pick symptoms"
            >
              ＋
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type symptoms like: fever, headache, cough... or pick from ＋"
            />
            <button
              className="btn btn-primary send-btn"
              onClick={() => handleSend()}
              disabled={loading || (!input.trim() && !selectedSymptoms.length)}
            >
              {loading ? <span className="spinner" /> : '➤'}
            </button>
          </div>
          <p className="input-disclaimer">
            ⚠️ AI predictions only — consult a licensed doctor for actual diagnosis
          </p>
        </div>
      </div>
    </div>
  );
}

function AreaStatsCard({ data }) {
  const riskColor = { LOW: '#34d399', MEDIUM: '#fbbf24', HIGH: '#f87171', 'VERY HIGH': '#ef4444' };
  return (
    <div className="area-stats-card">
      <div className="area-header">
        <span>📍 Area Health Report</span>
        <span className="badge" style={{ background: `${riskColor[data.riskLevel]}22`, color: riskColor[data.riskLevel] }}>
          {data.riskLevel} RISK
        </span>
      </div>
      <p className="area-total">{data.total} reports in last 30 days ({data.radiusKm}km radius)</p>
      {data.diseases.length === 0 ? (
        <p style={{ color: 'var(--green)' }}>✅ No significant disease activity nearby!</p>
      ) : (
        <div className="disease-list">
          {data.diseases.map((d, i) => (
            <div key={i} className="disease-row">
              <span className="disease-name">{d.name}</span>
              <div className="disease-bar-wrap">
                <div className="disease-bar" style={{ width: `${d.percentage}%` }} />
              </div>
              <span className="disease-pct">{d.percentage}%</span>
            </div>
          ))}
        </div>
      )}
      {data.message && <p className="area-message">{data.message}</p>}
    </div>
  );
}

function getBmiCategory(bmi) {
  const b = parseFloat(bmi);
  if (b < 18.5) return 'Underweight';
  if (b < 25) return 'Normal';
  if (b < 30) return 'Overweight';
  return 'Obese';
}
