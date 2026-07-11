import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { getCsrfToken } from '../utils/api';

export default function RegisterView() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [shopName, setShopName] = useState('');
    const [shopSlug, setShopSlug] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [registered, setRegistered] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);
        try {
            const token = getCsrfToken();
            const response = await fetch('/api/v1/auth/register-owner', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify({
                    owner_name: ownerName,
                    email,
                    password,
                    shop_name: shopName,
                    shop_slug: shopSlug
                })
            });
            const res = await response.json();
            if (response.ok && res.success) {
                setRegistered(true);
                dispatch(showToast({ message: 'Registration completed! Pending admin approval.', isError: false }));
            } else {
                setFormError(res.message || 'Registration failed.');
            }
        } catch (err) {
            setFormError('Registration failed. Please check your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    if (registered) {
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
                fontFamily: 'Outfit',
                textAlign: 'center'
            }}>
                <span style={{ fontSize: '3rem' }}>⏳</span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#10b981', margin: '0.5rem 0' }}>Registration Successful</h2>
                <p style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Your shop <strong>{shopName}</strong> has been registered! 
                </p>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500', textAlign: 'left', marginTop: '0.5rem' }}>
                    ⚠️ Your shop is currently <strong>pending approval</strong> from the platform administrator. You can login, but shop features will be restricted until approved.
                </div>
                <button 
                    onClick={() => navigate('/login')}
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '1rem', width: '100%' }}
                >
                    Return to Login
                </button>
            </div>
        );
    }

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            padding: '2.5rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            fontFamily: 'Outfit'
        }}>
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>🚀</span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fff', marginTop: '0.5rem', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>Register Your Shop</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Create a new shop and admin account</p>
            </div>

            {formError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500' }}>
                    ⚠️ {formError}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>Shop Name</label>
                        <input 
                            type="text" 
                            value={shopName}
                            onChange={e => {
                                  setShopName(e.target.value);
                                  setShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                            }}
                            required
                            placeholder="My Awesome Shop"
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>Shop Slug (URL)</label>
                        <input 
                            type="text" 
                            value={shopSlug}
                            onChange={e => setShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]+/g, ''))}
                            required
                            placeholder="my-shop"
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box', width: '100%' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>Owner Name</label>
                    <input 
                        type="text" 
                        value={ownerName}
                        onChange={e => setOwnerName(e.target.value)}
                        required
                        placeholder="John Doe"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box', width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>Email Address</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="john@example.com"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box', width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>Password (min 6 chars)</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box', width: '100%' }}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={submitting}
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', marginTop: '0.5rem', fontSize: '0.9rem', width: '100%' }}
                >
                    {submitting ? 'Creating Shop...' : 'Create Shop & Account'}
                </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#9ca3af', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                Already have an account? <span onClick={() => navigate('/login')} style={{ color: '#6366f1', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>Sign In</span>
            </div>
        </div>
    );
}
