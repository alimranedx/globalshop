import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { fetchState, handleQuickLogin } from '../store/actions';
import { getCsrfToken } from '../utils/api';

export default function LoginView() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);
        try {
            const token = getCsrfToken();
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify({ email, password })
            });
            const res = await response.json();
            if (response.ok && res.success) {
                if (res.csrf_token) {
                    const meta = document.querySelector('meta[name="csrf-token"]');
                    if (meta) meta.setAttribute('content', res.csrf_token);
                }
                dispatch(showToast({ message: `Logged in successfully.`, isError: false }));
                dispatch(fetchState());
                navigate('/dashboard');
            } else {
                setFormError(res.message || 'Invalid credentials.');
            }
        } catch (err) {
            setFormError('Authentication failed. Please check your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    const triggerQuickLogin = async (demoEmail) => {
        await dispatch(handleQuickLogin(demoEmail));
        navigate('/dashboard');
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '460px',
            padding: '2.5rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            fontFamily: 'Outfit'
        }}>
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>🏬</span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fff', marginTop: '0.5rem', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>Shop Management</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Sign in to access your shop workspace</p>
            </div>

            {formError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500' }}>
                    ⚠️ {formError}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '500' }}>Email Address</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.75rem', borderRadius: '8px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', width: '100%' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '500' }}>Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.75rem', borderRadius: '8px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', width: '100%' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={submitting}
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', marginTop: '0.5rem', width: '100%' }}
                >
                    {submitting ? 'Authenticating...' : 'Sign In'}
                </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#9ca3af', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                Don't have a shop? <span onClick={() => navigate('/register')} style={{ color: '#6366f1', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>Register here</span>
            </div>

            {/* Quick Demo Login */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚡ Quick Login (Demo Accounts)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button onClick={() => triggerQuickLogin('john@alpha.com')} style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        🔑 John (Owner)
                    </button>
                    <button onClick={() => triggerQuickLogin('bob@alpha.com')} style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        🔑 Bob (Manager)
                    </button>
                    <button onClick={() => triggerQuickLogin('charlie@alpha.com')} style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        🔑 Charlie (Worker)
                    </button>
                    <button onClick={() => triggerQuickLogin('grace@marketplace.com')} style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        🔑 Grace (Admin)
                    </button>
                </div>
            </div>
        </div>
    );
}
