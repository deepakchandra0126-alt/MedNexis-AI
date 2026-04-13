import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AdminHeader } from './AdminDashboard';
import './Admin.css';

export default function AdminUsers({ token, onGoDashboard, onGoStats, onLogout }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const loadUsers = () => {
    axios.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUsers(res.data.users || []))
      .catch(err => setError(err.response?.data?.error || 'Could not load users'));
  };

  useEffect(loadUsers, [token]);

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user account?')) return;
    try {
      await axios.delete(`/api/admin/delete-user/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.filter(user => user._id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete user');
    }
  };

  return (
    <div className="admin-page">
      <AdminHeader title="Admin Users" onGoDashboard={onGoDashboard} onGoStats={onGoStats} onLogout={onLogout} />
      {error && <div className="admin-error">{error}</div>}

      <section className="admin-card">
        <h3>Registered Users</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td><span className={`role-pill ${user.role}`}>{user.role}</span></td>
                  <td>{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    {user.role !== 'admin' && (
                      <button className="admin-delete" onClick={() => deleteUser(user._id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
