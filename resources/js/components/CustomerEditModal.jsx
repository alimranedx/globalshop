import React, { useState, useEffect } from 'react';
import useTheme from '../hooks/useTheme';
import { getHeaders } from '../utils/api';

export default function CustomerEditModal({ customer, onClose, onSuccess }) {
    const { colors, isDark } = useTheme();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isEdit = !!customer;

    const [formData, setFormData] = useState({
        name: customer?.name || '',
        phone: customer?.phone || '',
        email: customer?.email || ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim() || !formData.phone.trim()) {
            setError('Name and Phone are required.');
            return;
        }

        setSubmitting(true);

        const url = isEdit 
            ? `/api/v1/tenant/customers/${customer.id}`
            : `/api/v1/tenant/customers`;
        
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    ...getHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                onSuccess(data.message, data.data);
                onClose();
            } else {
                setError(data.message || 'An error occurred.');
            }
        } catch (err) {
            console.error(err);
            setError('Network error.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, backdropFilter: 'blur(6px)' }}>
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '2rem', width: '450px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', fontFamily: 'Outfit' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.borderLight}`, paddingBottom: '0.8rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: colors.text, margin: 0 }}>
                        {isEdit ? '✏️ Edit Customer' : '👤 Add Customer'}
                    </h3>
                    <button 
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                    >✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textMuted }}>NAME *</label>
                        <input 
                            type="text"
                            name="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textMuted }}>PHONE *</label>
                        <input 
                            type="text"
                            name="phone"
                            placeholder="01733425633"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textMuted }}>EMAIL (OPTIONAL)</label>
                        <input 
                            type="email"
                            name="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '700', cursor: submitting ? 'default' : 'pointer', fontSize: '0.9rem' }}
                        >
                            {submitting ? '⏳ Saving...' : '💾 Save Customer'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ flex: 1, background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, padding: '0.75rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
