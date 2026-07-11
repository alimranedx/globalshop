import React, { useState, useEffect } from 'react';
import useCurrency from '../hooks/useCurrency';
import useTheme from '../hooks/useTheme';
import { getHeaders } from '../utils/api';

export default function RefundModal({ sale, onClose, onSuccess }) {
    if (!sale) return null;

    const cur = useCurrency();
    const { colors, isDark } = useTheme();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Data from backend
    const [refundableData, setRefundableData] = useState(null);

    // Form inputs
    const [type, setType] = useState('full'); // 'full' or 'partial'
    const [refundMethod, setRefundMethod] = useState('original_method'); // 'original_method', 'cash', 'card', 'mobile', 'store_credit'
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');

    // Guest customer details (if store_credit selected and sale has no customer_id)
    const [customerName, setCustomerName] = useState(sale.customer_name || '');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState(sale.customer_email || '');

    // Quantities to refund per item: map of sale_item_id -> { quantity, restock }
    const [refundItems, setRefundItems] = useState({});

    // Fetch refundable info from backend
    const fetchRefundable = async () => {
        setLoading(true);
        try {
            const headers = getHeaders();
            const response = await fetch(`/api/v1/tenant/sales/${sale.id}/refundable`, {
                headers
            });
            const res = await response.json();
            if (res.success) {
                setRefundableData(res.data);
                
                // Initialize quantities
                const itemsMap = {};
                res.data.items.forEach(item => {
                    itemsMap[item.sale_item_id] = {
                        quantity: 0,
                        restock: true,
                        price: item.price,
                        max: item.available_qty
                    };
                });
                setRefundItems(itemsMap);
            } else {
                setError(res.message || 'Failed to load refundable details.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch refundable information.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefundable();
    }, [sale.id]);

    // Handle type change (full vs partial)
    useEffect(() => {
        if (!refundableData) return;
        
        const updated = { ...refundItems };
        refundableData.items.forEach(item => {
            if (type === 'full') {
                updated[item.sale_item_id] = {
                    ...updated[item.sale_item_id],
                    quantity: item.available_qty
                };
            } else {
                updated[item.sale_item_id] = {
                    ...updated[item.sale_item_id],
                    quantity: 0
                };
            }
        });
        setRefundItems(updated);
    }, [type, refundableData]);

    const handleQtyChange = (itemId, val) => {
        const item = refundItems[itemId];
        if (!item) return;

        let num = parseFloat(val) || 0;
        if (num < 0) num = 0;
        if (num > item.max) num = item.max;

        setRefundItems({
            ...refundItems,
            [itemId]: { ...item, quantity: num }
        });
    };

    const handleRestockToggle = (itemId) => {
        const item = refundItems[itemId];
        if (!item) return;

        setRefundItems({
            ...refundItems,
            [itemId]: { ...item, restock: !item.restock }
        });
    };

    // Calculate total refund amount
    const calculateTotalRefund = () => {
        if (type === 'full') {
            return refundableData ? refundableData.remaining_refundable : 0;
        }
        
        return Object.values(refundItems).reduce((sum, item) => {
            return sum + (item.quantity * item.price);
        }, 0);
    };

    const totalRefundAmount = calculateTotalRefund();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (totalRefundAmount <= 0) {
            setError('Refund amount must be greater than zero.');
            return;
        }

        if (!reason.trim()) {
            setError('Please provide a reason for the refund.');
            return;
        }

        if (refundMethod === 'store_credit' && !refundableData.customer_id && !customerPhone.trim()) {
            setError('A phone number is required to register store credit for a guest customer.');
            return;
        }

        setSubmitting(true);

        try {
            // Build items payload
            const itemsPayload = Object.entries(refundItems)
                .filter(([_, item]) => item.quantity > 0)
                .map(([itemId, item]) => ({
                    sale_item_id: parseInt(itemId),
                    quantity: item.quantity,
                    refund_amount: roundAmount(item.quantity * item.price),
                    restock: item.restock
                }));

            const payload = {
                refund_amount: roundAmount(totalRefundAmount),
                type,
                refund_method: refundMethod,
                reason,
                notes,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                items: itemsPayload
            };

            const response = await fetch(`/api/v1/tenant/sales/${sale.id}/refund`, {
                method: 'POST',
                headers: {
                    ...getHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const res = await response.json();
            if (res.success) {
                onSuccess(res.message);
                onClose();
            } else {
                setError(res.message || 'Failed to process refund.');
            }
        } catch (err) {
            console.error(err);
            setError('Network error occurred during refund processing.');
        } finally {
            setSubmitting(false);
        }
    };

    const roundAmount = (val) => {
        return Math.round(val * 100) / 100;
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, backdropFilter: 'blur(6px)' }}>
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '2rem', width: '520px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Outfit' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.borderLight}`, paddingBottom: '0.8rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: colors.text, margin: 0 }}>🔄 Process Refund</h3>
                        <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginTop: '0.2rem' }}>Invoice: <code>{sale.invoice_number}</code></div>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: colors.textMuted }}>Loading refundable details...</div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        
                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Totals info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', background: colors.cardBg, padding: '0.8rem', borderRadius: '10px', fontSize: '0.85rem', border: `1px solid ${colors.borderLight}` }}>
                            <div>
                                <span style={{ color: colors.textMuted, display: 'block' }}>Sale Total</span>
                                <strong style={{ color: colors.text, fontSize: '0.95rem' }}>{cur.format(refundableData?.total)}</strong>
                            </div>
                            <div>
                                <span style={{ color: colors.textMuted, display: 'block' }}>Refunded</span>
                                <strong style={{ color: '#ef4444', fontSize: '0.95rem' }}>{cur.format(refundableData?.refunded_amount)}</strong>
                            </div>
                            <div>
                                <span style={{ color: colors.textMuted, display: 'block' }}>Remaining</span>
                                <strong style={{ color: isDark ? '#10b981' : '#059669', fontSize: '0.95rem' }}>{cur.format(refundableData?.remaining_refundable)}</strong>
                            </div>
                        </div>

                        {/* Refund Type Selection */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textMuted }}>REFUND TYPE</label>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: colors.text, fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input 
                                        type="radio" 
                                        name="type" 
                                        value="full" 
                                        checked={type === 'full'} 
                                        onChange={() => setType('full')}
                                        style={{ accentColor: '#6366f1' }}
                                    />
                                    Full Refund ({cur.format(refundableData?.remaining_refundable)})
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: colors.text, fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input 
                                        type="radio" 
                                        name="type" 
                                        value="partial" 
                                        checked={type === 'partial'} 
                                        onChange={() => setType('partial')}
                                        style={{ accentColor: '#6366f1' }}
                                    />
                                    Partial Refund
                                </label>
                            </div>
                        </div>

                        {/* Items Table for Partial Refunds */}
                        {type === 'partial' && (
                            <div style={{ border: `1px solid ${colors.borderLight}`, borderRadius: '10px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                                    <thead style={{ background: colors.cardBg }}>
                                        <tr style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                                            <th style={{ padding: '0.5rem', color: colors.tableHeaderColor }}>Product</th>
                                            <th style={{ padding: '0.5rem', color: colors.tableHeaderColor, textAlign: 'center' }}>Avail</th>
                                            <th style={{ padding: '0.5rem', color: colors.tableHeaderColor, width: '70px', textAlign: 'center' }}>Return</th>
                                            <th style={{ padding: '0.5rem', color: colors.tableHeaderColor, textAlign: 'right' }}>Price</th>
                                            <th style={{ padding: '0.5rem', color: colors.tableHeaderColor, textAlign: 'center' }}>Restock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {refundableData?.items.map(item => {
                                            const key = item.sale_item_id;
                                            const qty = refundItems[key]?.quantity || 0;
                                            const restock = refundItems[key]?.restock ?? true;
                                            return (
                                                <tr key={key} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                                                    <td style={{ padding: '0.5rem', color: colors.text, fontWeight: '500' }}>{item.product_name}</td>
                                                    <td style={{ padding: '0.5rem', color: colors.textMuted, textAlign: 'center' }}>{parseFloat(item.available_qty)}</td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                        <input 
                                                            type="number"
                                                            min="0"
                                                            max={item.available_qty}
                                                            step="any"
                                                            value={qty || ''}
                                                            onChange={e => handleQtyChange(key, e.target.value)}
                                                            style={{ width: '55px', padding: '0.2rem 0.4rem', border: `1px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.text, borderRadius: '4px', textAlign: 'center', outline: 'none' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.5rem', color: colors.text, textAlign: 'right' }}>{cur.format(item.price)}</td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                        <input 
                                                            type="checkbox"
                                                            checked={restock}
                                                            onChange={() => handleRestockToggle(key)}
                                                            style={{ cursor: 'pointer', accentColor: '#10b981' }}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Refund Method */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textMuted }}>REFUND METHOD</label>
                            <select
                                value={refundMethod}
                                onChange={e => setRefundMethod(e.target.value)}
                                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
                            >
                                <option value="original_method">Original Method ({sale.payment_method})</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="mobile">Mobile Money</option>
                                <option value="store_credit">Store Credit (Regular Customer balance)</option>
                            </select>
                        </div>

                        {/* Guest / Membership details for Store Credit */}
                        {refundMethod === 'store_credit' && !refundableData?.customer_id && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(99, 102, 241, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px dashed rgba(99, 102, 241, 0.2)' }}>
                                <div style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: '600' }}>👤 GUEST CUSTOMER REGISTRATION FOR STORE CREDIT</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <label style={{ fontSize: '0.75rem', color: colors.textMuted }}>Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="Guest Name"
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.45rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <label style={{ fontSize: '0.75rem', color: colors.textMuted }}>Phone *</label>
                                        <input 
                                            type="text" 
                                            placeholder="Phone Number"
                                            value={customerPhone}
                                            onChange={e => setCustomerPhone(e.target.value)}
                                            required
                                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.45rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: colors.textMuted }}>Email (Optional)</label>
                                    <input 
                                        type="email" 
                                        placeholder="email@example.com"
                                        value={customerEmail}
                                        onChange={e => setCustomerEmail(e.target.value)}
                                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.45rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Reason */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textMuted }}>REASON FOR REFUND *</label>
                            <input 
                                type="text"
                                placeholder="e.g. Broken or incorrect product, change of mind..."
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                required
                                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem', borderRadius: '8px', outline: 'none', fontSize: '0.9rem' }}
                            />
                        </div>

                        {/* Notes */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textMuted }}>ADDITIONAL NOTES</label>
                            <textarea 
                                placeholder="Any extra notes or comments..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem', borderRadius: '8px', outline: 'none', fontSize: '0.9rem', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </div>

                        {/* Summary & Refund Amount Display */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.text }}>Total Refund:</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#6366f1' }}>{cur.format(totalRefundAmount)}</span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '700', cursor: submitting ? 'default' : 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            >
                                {submitting ? '⏳ Processing...' : '🔄 Issue Refund'}
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
                )}
            </div>
        </div>
    );
}
