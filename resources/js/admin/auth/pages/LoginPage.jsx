import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { PageLoader } from '../../shared/components/PageLoader';
import { ErrorAlert } from '../../shared/components/ActionBtn';

export function LoginPage() {
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && user) navigate('/admin', { replace: true });
    }, [user, loading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        const res = await login(email, password);
        if (res.success) {
            navigate('/admin', { replace: true });
        } else {
            setError(res.message);
        }
        setSubmitting(false);
    };

    if (loading) return <PageLoader />;

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0a0a0c',
            backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(16,185,129,0.08) 0%, transparent 50%)',
            fontFamily: "'Outfit', sans-serif",
        }}>
            <div style={{
                width: '100%', maxWidth: '420px', padding: '2.5rem',
                background: 'rgba(20,20,28,0.85)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.75rem', margin: '0 auto 1rem',
                        boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
                    }}>🛡️</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>
                        Admin Console
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.375rem' }}>
                        GlobalShop Platform Administration
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Email Address
                        </label>
                        <input
                            id="admin-login-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                            placeholder="superadmin@marketplace.com"
                            style={{
                                width: '100%', padding: '0.875rem 1rem', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#f3f4f6', fontSize: '0.925rem', outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Password
                        </label>
                        <input
                            id="admin-login-password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{
                                width: '100%', padding: '0.875rem 1rem', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#f3f4f6', fontSize: '0.925rem', outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {error && <ErrorAlert msg={error} />}

                    <button
                        id="admin-login-btn"
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: '100%', padding: '0.9rem', borderRadius: '10px',
                            background: submitting ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                            border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                        }}
                    >
                        {submitting ? '⌛ Authenticating...' : '🔐 Sign In to Admin Panel'}
                    </button>
                </form>
            </div>
        </div>
    );
}
