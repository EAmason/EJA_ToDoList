import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5082';

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please enter both your email address and your password.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Login failed');
                return;
            }

            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            if (data.user && data.user.id) {
                localStorage.setItem('userId', String(data.user.id));
            }

            navigate('/dashboard');
        } catch (err) {
            setError('Could not connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="login-wrapper">
        <div className="login-form-container">
            <h2 className="login-title">Task Tracker</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
                <Form.Group className="login-form" controlId="formBasicEmail">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="login-form" controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </Form.Group>

                <Button variant="primary" type="submit" className="login-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
                </Button>
            </Form>
            <div className="signup-link-container">
                <p>
                    <Link to="/signup" className="signup-link">
                    Create an account
                    </Link>
                </p>
            </div>
        </div>
    </div>
  );
}

export default Login;