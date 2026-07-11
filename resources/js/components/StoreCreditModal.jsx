import React, { useState } from 'react';
import useTheme from '../hooks/useTheme';
import useCurrency from '../hooks/useCurrency';
import { getHeaders } from '../utils/api';

export default function StoreCreditModal({ customer, onClose, onSuccess }) {
    if (!customer) return null;

    const { colors } = useTheme();
    const cur = useCurrency();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [type, setType] = useState('add');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!amount || parseFloat(amount) <= 0) {
            setError('Amount must be greater than zero.');
            return;
        }

        if (!reason.trim()) {
            setError('Please provide a reason for this manual adjustment.');
            return;
        }

        if (type === 'deduct' && parseFloat(amount) > customer.store_credit_balance) {
            setError(`Cannot deduct more than the current balance (${cur.format(customer.store_credit_balance)}).`);
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(`/api/v1/tenant/customers/${customer.id}/credit`, {
                method: 'POST',
                headers: {
                    ...getHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, amount: parseFloat(amount), reason })
            });

            const data = await response.json();
            if (data.success) {
                onSuccess(data.message);
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
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: colors.text, margin: 0 }}>💰 Adjust Store Credit</h3>
                        <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginTop: '0.2rem' }}>Customer: {customer.name} ({customer.phone})</div>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                    >✕</button>
                </div>

                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.text }}>Current Balance:</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#6366f1' }}>{cur.format(customer.store_credit_balance)}</span>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textMuted }}>ACTION TYPE</label>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: colors.text, fontSize: '0.9rem', cursor: 'pointer' }}>
                                <input 
                                    type="radio" 
                                    name="type" 
                                    value="add" 
                                    checked={type === 'add'} 
                                    onChange={() => setType('add')}
                                    style={{ accentColor: '#10b981' }}
                                />
                                <span style={{ color: '#10b981', fontWeight: '600' }}>➕ Add Credit</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: colors.text, fontSize: '0.9rem', cursor: 'pointer' }}>
                                <input 
                                    type="radio" 
                                    name="type" 
                                    value="deduct" 
                                    checked={type === 'deduct'} 
                                    onChange={() => setType('deduct')}
                                    style={{ accentColor: '#ef4444' }}
                                />
                                <span style={{ color: '#ef4444', fontWeight: '600' }}>➖ Deduct Credit</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textMuted }}>AMOUNT *</label>
                        <input 
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            required
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textMuted }}>REASON *</label>
                        <input 
                            type="text"
                            placeholder="e.g. Compensation, Promotion, Manual Correction"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            required
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '700', cursor: submitting ? 'default' : 'pointer', fontSize: '0.9rem' }}
                        >
                            {submitting ? '⏳ Processing...' : '✅ Confirm Adjustment'}
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
