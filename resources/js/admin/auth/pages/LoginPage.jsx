import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { PageLoader } from '../../shared/components/PageLoader';
import { ErrorAlert } from '../../shared/components/ActionBtn';
import { Modal } from '../../shared/components/Modal';
import { FormField } from '../../shared/components/FormField';
import { apiPost } from '../../shared/api/client';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function LoginPage() {
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);

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

                <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                        type="button"
                        onClick={() => setShowSupportModal(true)}
                        style={{ background: 'transparent', border: 'none', color: '#a5b4fc', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Having trouble signing in? Contact Support
                    </button>
                </div>
            </div>

            {showSupportModal && (
                <PublicSupportModal onClose={() => setShowSupportModal(false)} />
            )}
        </div>
    );
}

function PublicSupportModal({ onClose }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [category, setCategory] = useState('login_problem');
    const [subject, setSubject] = useState('Unable to access my account');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');
        const res = await apiPost('/api/v1/support/tickets/public', {
            name, email, phone, category, subject, message
        });

        if (res?.success) {
            setSuccessMsg(`Your support ticket #${res.ticket_number} has been created successfully. Our team will review your request.`);
        } else {
            setError(res?.message || 'Failed to submit support ticket.');
        }
        setSending(false);
    };

    return (
        <Modal title="GlobalShop Account Support & Recovery" onClose={onClose} maxWidth="550px">
            {successMsg ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '1rem', borderRadius: '10px', fontSize: '0.9rem' }}>
                        ✓ {successMsg}
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '0.825rem' }}>
                        System notification sender is <strong style={{ color: '#fff' }}>noreply@globalshop.com</strong>.
                    </p>
                    <button type="button" onClick={onClose} style={primaryBtnStyle}>Close Support Form</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', lineHeight: '1.4' }}>
                        Need help accessing your account? Submit a support ticket and our platform team will investigate your account status and send recovery instructions.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FormField label="Your Full Name *" id="pub-name" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Owner" />
                        <FormField label="Email Address *" id="pub-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jane@shop.com" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FormField label="Phone Number" id="pub-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555-0199" />
                        <div>
                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                                Issue Category *
                            </label>
                            <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                                <option value="login_problem">🔐 Login Problem / Wrong Password</option>
                                <option value="account_locked">🔒 Account Locked / Suspended</option>
                                <option value="password_reset">🔑 Request Password Reset Link</option>
                                <option value="shop_access_problem">🏬 Shop Access Problem</option>
                                <option value="other">💬 Other Inquiry</option>
                            </select>
                        </div>
                    </div>

                    <FormField label="Subject *" id="pub-subj" value={subject} onChange={e => setSubject(e.target.value)} required />

                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                            Describe Your Problem *
                        </label>
                        <textarea
                            rows={3}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            required
                            placeholder="I am using my correct email and password but I cannot log in..."
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                                fontFamily: "'Outfit', sans-serif",
                            }}
                        />
                    </div>

                    {error && <ErrorAlert msg={error} />}

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                        <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                        <button type="submit" disabled={sending} style={primaryBtnStyle}>{sending ? 'Submitting...' : '🎫 Submit Support Ticket'}</button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
