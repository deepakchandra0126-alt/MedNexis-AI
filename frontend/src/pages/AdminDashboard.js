import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import './Admin.css';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function AdminDashboard({ token, onGoUsers, onGoStats, onLogout }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || 'Could not load admin dashboard'));
  }, [token]);

  const diseaseStats = data?.diseaseStats || [];
  const areaStats = data?.areaStats || [];
  const chartColors = ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22c55e'];

  return (
    <div className="admin-page">
      <AdminHeader title="Admin Dashboard" onGoUsers={onGoUsers} onGoStats={onGoStats} onLogout={onLogout} />
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-metric-grid">
        <MetricCard label="Total Users" value={data?.totalUsers ?? '...'} />
        <MetricCard label="Health Reports" value={data?.totalReports ?? '...'} />
        <MetricCard label="Top Diseases" value={diseaseStats.length} />
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <h3>Disease Distribution</h3>
          {diseaseStats.length ? (
            <Doughnut
              data={{
                labels: diseaseStats.map(item => item.disease),
                datasets: [{
                  data: diseaseStats.map(item => item.count),
                  backgroundColor: chartColors
                }]
              }}
            />
          ) : <p className="admin-empty">No report data yet.</p>}
        </section>

        <section className="admin-card">
          <h3>Area-wise Disease Stats</h3>
          {areaStats.length ? (
            <Bar
              data={{
                labels: areaStats.map(item => `${item.area}: ${item.disease}`),
                datasets: [{
                  label: 'Reports',
                  data: areaStats.map(item => item.count),
                  backgroundColor: '#38bdf8'
                }]
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          ) : <p className="admin-empty">No area reports yet.</p>}
        </section>
      </div>

      <p className="privacy-note">
        Privacy mode: this dashboard shows aggregated counts only. It does not connect user names with diseases.
      </p>
    </div>
  );
}

export function AdminHeader({ title, onGoDashboard, onGoUsers, onGoStats, onLogout }) {
  return (
    <div className="admin-header">
      <div>
        <h1>{title}</h1>
        <p>Monitor anonymous disease trends and user accounts.</p>
      </div>
      <div className="admin-actions">
        {onGoDashboard && <button className="btn btn-ghost" onClick={onGoDashboard}>Dashboard</button>}
        {onGoUsers && <button className="btn btn-ghost" onClick={onGoUsers}>Users</button>}
        {onGoStats && <button className="btn btn-ghost" onClick={onGoStats}>Stats</button>}
        <button className="btn btn-danger" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <section className="admin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}
