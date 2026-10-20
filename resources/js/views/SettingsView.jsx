import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { fetchState } from '../store/actions';
import { getHeaders } from '../utils/api';
import useTheme from '../hooks/useTheme';

export default function SettingsView() {
    const dispatch = useDispatch();
    const shop = useSelector(state => state.shop.shop);
    const userRole = useSelector(state => state.auth.user?.role);
    const isOwner = userRole === 'Owner';
    const { colors, isDark } = useTheme();

    const [name, setName] = useState(shop ? shop.name : '');
    const [status, setStatus] = useState(shop ? shop.status : 'active');
    const [currency, setCurrency] = useState(shop ? (shop.currency || 'USD') : 'USD');
    const [language, setLanguage] = useState(shop ? (shop.language || 'en') : 'en');
    const [refundWindowDays, setRefundWindowDays] = useState(shop ? (shop.refund_window_days ?? 30) : 30);
    const [customDomainInput, setCustomDomainInput] = useState(shop ? (shop.custom_domain || '') : '');
    const [saving, setSaving] = useState(false);
    const [savingDomain, setSavingDomain] = useState(false);
    const [verifyingDomain, setVerifyingDomain] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (shop) {
            setName(shop.name);
            setStatus(shop.status);
            setCurrency(shop.currency || 'USD');
            setLanguage(shop.language || 'en');
            setRefundWindowDays(shop.refund_window_days ?? 30);
            setCustomDomainInput(shop.custom_domain || '');
        }
    }, [shop]);

    const handleSaveCustomDomain = async (e) => {
        if (e) e.preventDefault();
        setSavingDomain(true);
        const headers = getHeaders();
        try {
            const response = await fetch('/api/v1/tenant/custom-domain', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ custom_domain: customDomainInput.trim() })
            });
            const res = await response.json();
            if (res.success) {
                dispatch(showToast({ message: res.message || 'Custom domain updated!', isError: false }));
                dispatch(fetchState());
            } else {
                dispatch(showToast({ message: res.message || 'Failed to update custom domain.', isError: true }));
            }
        } catch (err) {
            dispatch(showToast({ message: 'Connection error updating domain.', isError: true }));
        } finally {
            setSavingDomain(false);
        }
    };

    const handleRemoveCustomDomain = async () => {
        if (!confirm('Are you sure you want to disconnect this custom domain?')) return;
        setSavingDomain(true);
        const headers = getHeaders();
        try {
            const response = await fetch('/api/v1/tenant/custom-domain', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ custom_domain: '' })
            });
            const res = await response.json();
            if (res.success) {
                dispatch(showToast({ message: 'Custom domain removed.', isError: false }));
                setCustomDomainInput('');
                dispatch(fetchState());
            } else {
                dispatch(showToast({ message: res.message || 'Failed to remove domain.', isError: true }));
            }
        } catch (err) {
            dispatch(showToast({ message: 'Connection error.', isError: true }));
        } finally {
            setSavingDomain(false);
        }
    };

    const handleVerifyCustomDomain = async () => {
        setVerifyingDomain(true);
        const headers = getHeaders();
        try {
            const response = await fetch('/api/v1/tenant/custom-domain/verify', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
            const res = await response.json();
            if (res.success && res.verified) {
                dispatch(showToast({ message: res.message || 'Domain verified successfully!', isError: false }));
                dispatch(fetchState());
            } else {
                dispatch(showToast({ message: res.message || 'DNS verification pending.', isError: true }));
            }
        } catch (err) {
            dispatch(showToast({ message: 'DNS verification check failed.', isError: true }));
        } finally {
            setVerifyingDomain(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        const headers = getHeaders();
        try {
            const response = await fetch('/api/v1/tenant/settings', {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, status, currency, language, refund_window_days: refundWindowDays })
            });
            const res = await response.json();
            if (res.success) {
                dispatch(showToast({ message: 'Shop settings updated successfully!', isError: false }));
                dispatch(fetchState());
                setIsEditing(false);
            } else {
                dispatch(showToast({ message: res.message || 'Failed to update settings.', isError: true }));
            }
        } catch (err) {
            dispatch(showToast({ message: 'Connection error. Failed to update settings.', isError: true }));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '2rem', borderRadius: '16px', boxShadow: colors.shadow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: colors.text }}>Shop Settings</h3>
                    {isOwner && !isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            style={{ 
                                background: '#6366f1', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '0.5rem 1rem', 
                                borderRadius: '8px', 
                                fontWeight: '600', 
                                cursor: 'pointer', 
                                fontFamily: 'Outfit' 
                            }}
                        >
                            ✏️ Edit Shop Settings
                        </button>
                    )}
                </div>
                
                {isEditing ? (
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '480px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: '500' }}>Shop Name</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                required 
                                disabled={saving}
                                style={{ 
                                    background: colors.inputBg, 
                                    border: `1px solid ${colors.inputBorder}`, 
                                    color: colors.text, 
                                    padding: '0.7rem', 
                                    borderRadius: '8px', 
                                    outline: 'none', 
                                    fontFamily: 'Outfit',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }} 
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: '500' }}>Shop Status</label>
                            <select 
                                value={status} 
                                onChange={e => setStatus(e.target.value)} 
                                disabled={saving}
                                style={{ 
                                    background: colors.inputBg, 
                                    border: `1px solid ${colors.inputBorder}`, 
                                    color: colors.text, 
                                    padding: '0.7rem', 
                                    borderRadius: '8px', 
                                    outline: 'none', 
                                    cursor: 'pointer',
                                    fontFamily: 'Outfit',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="active" style={{ background: colors.surface, color: colors.text }}>Active</option>
                                <option value="inactive" style={{ background: colors.surface, color: colors.text }}>Deactive</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: '500' }}>Shop Currency</label>
                            <select 
                                value={currency} 
                                onChange={e => setCurrency(e.target.value)} 
                                disabled={saving}
                                style={{ 
                                    background: colors.inputBg, 
                                    border: `1px solid ${colors.inputBorder}`, 
                                    color: colors.text, 
                                    padding: '0.7rem', 
                                    borderRadius: '8px', 
                                    outline: 'none', 
                                    cursor: 'pointer',
                                    fontFamily: 'Outfit',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="USD" style={{ background: colors.surface, color: colors.text }}>USD ($)</option>
                                <option value="BDT" style={{ background: colors.surface, color: colors.text }}>BDT (৳)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: '500' }}>Default Language</label>
                            <select 
                                value={language} 
                                onChange={e => setLanguage(e.target.value)} 
                                disabled={saving}
                                style={{ 
                                    background: colors.inputBg, 
                                    border: `1px solid ${colors.inputBorder}`, 
                                    color: colors.text, 
                                    padding: '0.7rem', 
                                    borderRadius: '8px', 
                                    outline: 'none', 
                                    cursor: 'pointer',
                                    fontFamily: 'Outfit',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="en" style={{ background: colors.surface, color: colors.text }}>English</option>
                                <option value="bn" style={{ background: colors.surface, color: colors.text }}>Bangla (বাংলা)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: '500' }}>Refund Window (Days)</label>
                            <input 
                                type="number" 
                                min="0"
                                max="365"
                                value={refundWindowDays} 
                                onChange={e => setRefundWindowDays(e.target.value)} 
                                disabled={saving}
                                style={{ 
                                    background: colors.inputBg, 
                                    border: `1px solid ${colors.inputBorder}`, 
                                    color: colors.text, 
                                    padding: '0.7rem', 
                                    borderRadius: '8px', 
                                    outline: 'none', 
                                    fontFamily: 'Outfit',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button 
                                type="submit" 
                                disabled={saving}
                                style={{ 
                                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                                    color: '#fff', 
                                    border: 'none', 
                                    padding: '0.75rem 1.5rem', 
                                    borderRadius: '8px', 
                                    fontWeight: '600', 
                                    cursor: saving ? 'default' : 'pointer', 
                                    transition: 'all 0.2s', 
                                    fontFamily: 'Outfit'
                                }}
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setIsEditing(false);
                                    if (shop) {
                                        setName(shop.name);
                                        setStatus(shop.status);
                                        setCurrency(shop.currency || 'USD');
                                        setLanguage(shop.language || 'en');
                                        setRefundWindowDays(shop.refund_window_days ?? 30);
                                    }
                                }}
                                disabled={saving}
                                style={{ 
                                    background: 'transparent', 
                                    border: `1px solid ${colors.border}`, 
                                    color: colors.textMuted, 
                                    padding: '0.75rem 1.5rem', 
                                    borderRadius: '8px', 
                                    fontWeight: '600', 
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s', 
                                    fontFamily: 'Outfit'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    shop && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem', color: colors.text }}>
                            <div>Shop Name: <strong>{shop.name}</strong></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>Shop Status:</span>
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    padding: '0.2rem 0.5rem', 
                                    borderRadius: '4px', 
                                    background: shop.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                                    color: shop.status === 'active' ? (isDark ? '#10b981' : '#059669') : '#ef4444', 
                                    fontWeight: '600',
                                    textTransform: 'capitalize'
                                }}>
                                    {shop.status === 'inactive' ? 'Deactive' : shop.status}
                                </span>
                            </div>
                            <div>Subdomain Slug: <code>{shop.slug}</code></div>
                            <div>Subdomain URL: <a href={`https://${shop.subdomain || shop.slug}.shopbusket.com`} target="_blank" rel="noreferrer" style={{ color: '#6366f1', fontWeight: 600 }}>https://{shop.subdomain || shop.slug}.shopbusket.com</a></div>
                            {shop.custom_domain && (
                                <div>Custom Domain: <a href={`https://${shop.custom_domain}`} target="_blank" rel="noreferrer" style={{ color: '#10b981', fontWeight: 700 }}>https://{shop.custom_domain}</a> ({shop.custom_domain_status || 'verified'})</div>
                            )}
                            <div>Tenant ULID ID: <code>{shop.id}</code></div>
                            <div>Currency Code: <strong>{shop.currency || 'USD'}</strong></div>
                            <div>Active Interface Language: <strong>{shop.language === 'bn' ? 'Bangla (বাংলা)' : 'English'}</strong></div>
                            <div>Refund Window Period: <strong>{shop.refund_window_days ?? 30} days</strong></div>
                        </div>
                    )
                )}
            </div>

            {/* Custom Domain Settings Card */}
            {isOwner && (
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '2rem', borderRadius: '16px', boxShadow: colors.shadow }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: colors.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🌐</span> Custom Domain Configuration
                        </h3>
                        <p style={{ color: colors.textMuted, fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            Connect your own separate brand domain (e.g. <code>alphagear.com</code> or <code>store.mybrand.com</code>) to open this shop directly.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '580px' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                                Default Subdomain (Always Active)
                            </label>
                            <div style={{ padding: '0.65rem 0.9rem', borderRadius: '8px', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: '#6366f1', fontSize: '0.9rem', fontWeight: '600' }}>
                                https://{shop?.subdomain || shop?.slug}.shopbusket.com
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                                Branded Custom Domain
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <input 
                                    type="text"
                                    placeholder="e.g. alphagear.com"
                                    value={customDomainInput}
                                    onChange={e => setCustomDomainInput(e.target.value)}
                                    disabled={savingDomain}
                                    style={{
                                        flex: 1,
                                        minWidth: '220px',
                                        background: colors.inputBg,
                                        border: `1px solid ${colors.inputBorder}`,
                                        color: colors.text,
                                        padding: '0.7rem 0.9rem',
                                        borderRadius: '8px',
                                        outline: 'none',
                                        fontFamily: 'Outfit',
                                        fontSize: '0.9rem'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleSaveCustomDomain}
                                    disabled={savingDomain || !customDomainInput.trim()}
                                    style={{
                                        background: '#6366f1',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '0.7rem 1.25rem',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: (savingDomain || !customDomainInput.trim()) ? 'default' : 'pointer',
                                        fontFamily: 'Outfit',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {savingDomain ? 'Saving...' : 'Connect Domain'}
                                </button>
                                {shop?.custom_domain && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveCustomDomain}
                                        disabled={savingDomain}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid #ef4444',
                                            color: '#ef4444',
                                            padding: '0.7rem 1rem',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontFamily: 'Outfit'
                                        }}
                                    >
                                        Disconnect
                                    </button>
                                )}
                            </div>
                        </div>

                        {shop?.custom_domain ? (
                            <div style={{ padding: '1rem', borderRadius: '12px', background: isDark ? 'rgba(99,102,241,0.08)' : '#f8fafc', border: `1px solid ${colors.border}`, fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: '600', color: colors.text }}>Domain Status:</span>
                                        <span style={{ 
                                            padding: '0.2rem 0.6rem', 
                                            borderRadius: '6px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: '700', 
                                            textTransform: 'uppercase',
                                            background: shop.custom_domain_status === 'verified' ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)',
                                            color: shop.custom_domain_status === 'verified' ? '#10b981' : '#f59e0b'
                                        }}>
                                            {shop.custom_domain_status === 'verified' ? '✓ Active & Pointed' : '⏳ Pending DNS Check'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleVerifyCustomDomain}
                                        disabled={verifyingDomain}
                                        style={{
                                            background: 'transparent',
                                            border: `1px solid ${colors.border}`,
                                            color: colors.text,
                                            padding: '0.35rem 0.75rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontFamily: 'Outfit'
                                        }}
                                    >
                                        {verifyingDomain ? 'Checking...' : '🔄 Verify DNS'}
                                    </button>
                                </div>

                                <div style={{ color: colors.textMuted, fontSize: '0.8rem', lineHeight: 1.5, borderTop: `1px solid ${colors.border}`, paddingTop: '0.6rem' }}>
                                    📌 <strong>DNS Setup Instructions:</strong><br />
                                    1. Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.).<br />
                                    2. Add a <strong>CNAME</strong> record pointing to <code>shopbusket.com</code> (or an <strong>A Record</strong> pointing to <code>104.152.168.205</code>).<br />
                                    3. In your cPanel, add <code>{shop.custom_domain}</code> under <strong>Domains</strong> pointing to <code>/public_html</code>.
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
