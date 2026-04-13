import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { AdminHeader } from './AdminDashboard';
import './Admin.css';

export default function AdminStats({ token, onGoDashboard, onGoUsers, onLogout }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setStats(res.data))
      .catch(err => setError(err.response?.data?.error || 'Could not load stats'));
  }, [token]);

  const diseaseStats = stats?.diseaseStats || [];
  const symptomStats = stats?.symptomStats || [];
  const ageGroupStats = stats?.ageGroupStats || [];

  return (
    <div className="admin-page">
      <AdminHeader title="Admin Stats" onGoDashboard={onGoDashboard} onGoUsers={onGoUsers} onLogout={onLogout} />
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-grid">
        <section className="admin-card">
          <h3>Disease-wise Count</h3>
          {diseaseStats.length ? (
            <Bar
              data={{
                labels: diseaseStats.map(item => item.disease),
                datasets: [{
                  label: 'Reports',
                  data: diseaseStats.map(item => item.count),
                  backgroundColor: '#34d399'
                }]
              }}
            />
          ) : <p className="admin-empty">No disease reports yet.</p>}
        </section>

        <section className="admin-card">
          <h3>Top Symptoms</h3>
          {symptomStats.length ? (
            <Bar
              data={{
                labels: symptomStats.map(item => item.symptom.replace(/_/g, ' ')),
                datasets: [{
                  label: 'Reports',
                  data: symptomStats.map(item => item.count),
                  backgroundColor: '#fbbf24'
                }]
              }}
              options={{ indexAxis: 'y' }}
            />
          ) : <p className="admin-empty">No symptom data yet.</p>}
        </section>

        <section className="admin-card">
          <h3>Age Group Reports</h3>
          {ageGroupStats.length ? (
            <Pie
              data={{
                labels: ageGroupStats.map(item => item.ageGroup),
                datasets: [{
                  data: ageGroupStats.map(item => item.count),
                  backgroundColor: ['#38bdf8', '#34d399', '#fbbf24', '#f87171']
                }]
              }}
            />
          ) : <p className="admin-empty">No age group data yet.</p>}
        </section>
      </div>

      <section className="admin-card">
        <h3>Example Percentages</h3>
        <div className="stat-list">
          {diseaseStats.map(item => (
            <div key={item.disease} className="stat-row">
              <span>{item.disease}</span>
              <strong>{item.percentage}%</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
