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
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (shop) {
            setName(shop.name);
            setStatus(shop.status);
            setCurrency(shop.currency || 'USD');
            setLanguage(shop.language || 'en');
        }
    }, [shop]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        const headers = getHeaders();
        try {
            const response = await fetch('/api/v1/tenant/settings', {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, status, currency, language })
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
                            <div>Mock Domain: <code>{shop.domain || `${shop.slug}.globalshop.test`}</code></div>
                            <div>Tenant ULID ID: <code>{shop.id}</code></div>
                            <div>Currency Code: <strong>{shop.currency || 'USD'}</strong></div>
                            <div>Active Interface Language: <strong>{shop.language === 'bn' ? 'Bangla (বাংলা)' : 'English'}</strong></div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
