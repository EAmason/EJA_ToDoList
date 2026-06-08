import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import './SignUp.css';

function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // TODO: Add additional client-side validation.

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Sign up failed');
                return;
            }

            // On success, navigate to login page
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Could not connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="sign-up-wrapper">
        <div className="sign-up-form-container">
            <h2 className="sign-up-title">Create Account</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
                <Form.Group className="sign-up-form" controlId="formBasicFirstName">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="sign-up-form" controlId="formBasicLastName">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="sign-up-form" controlId="formBasicEmail">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="sign-up-form" controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="sign-up-form" controlId="formBasicConfirmPassword">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </Form.Group>

                <Button variant="primary" type="submit" className="sign-up-button" disabled={loading}>
                {loading ? 'Signing up...' : 'Sign Up'}
                </Button>
            </Form>
            <div className="login-link-container">
                <p>
                    <Link to="/login" className="login-link">
                    Already have an account? Login
                    </Link>
                </p>
            </div>
        </div>
    </div>
  );
}

export default SignUp;