import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const token = localStorage.getItem('token');

  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <p>You are logged in successfully.</p>
      {token && (
        <div>
          <p><strong>Token</strong>: {token}</p>
        </div>
      )}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
