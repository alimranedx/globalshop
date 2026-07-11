import React from 'react';
import useTheme from '../hooks/useTheme';
import useCurrency from '../hooks/useCurrency';
import useTranslation from '../hooks/useTranslation';
import POSCustomerSearch from './POSCustomerSearch';

export default function POSCheckoutModal({ 
    onClose, 
    cartTotal, 
    customerData, 
    setCustomerData, 
    paymentMethod, 
    setPaymentMethod, 
    cashReceived, 
    setCashReceived, 
    submitting, 
    onSubmit,
    onModeChange
}) {
    const { colors, isDark } = useTheme();
    const cur = useCurrency();
    const t = useTranslation();

    const changeDue = cashReceived && parseFloat(cashReceived) >= cartTotal
        ? parseFloat(cashReceived) - cartTotal
        : 0;

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(e);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '2rem', width: '480px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', fontFamily: 'Outfit' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.borderLight}`, paddingBottom: '0.8rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: colors.text, margin: 0 }}>
                        💳 Checkout & Payment
                    </h3>
                    <button 
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                    >✕</button>
                </div>

                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    
                    {/* Cart Total Display */}
                    <div style={{ background: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: colors.textMuted, fontWeight: '600' }}>Total Amount to Pay:</span>
                        <span style={{ fontSize: '1.6rem', fontWeight: '800', color: isDark ? '#10b981' : '#059669' }}>
                            {cur.format(cartTotal)}
                        </span>
                    </div>

                    {/* Customer Info Section */}
                    <POSCustomerSearch 
                        value={customerData}
                        onCustomerChange={(data) => setCustomerData(data)}
                        onModeChange={onModeChange}
                    />

                    {/* Payment Selector Cards Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: '600' }}>Payment Method:</span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {[
                                { key: 'cash', label: '💵 Cash' },
                                { key: 'card', label: '💳 Card' },
                                { key: 'mobile', label: '📱 Mobile' }
                            ].map(method => {
                                const active = paymentMethod === method.key;
                                return (
                                    <button
                                        key={method.key}
                                        type="button"
                                        onClick={() => {
                                            setPaymentMethod(method.key);
                                            if (method.key !== 'cash') setCashReceived('');
                                        }}
                                        style={{
                                            flex: 1,
                                            background: active 
                                                ? (isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)')
                                                : colors.inputBg,
                                            border: active 
                                                ? '2px solid #6366f1' 
                                                : `1px solid ${colors.inputBorder}`,
                                            color: active ? '#6366f1' : colors.text,
                                            padding: '0.55rem 0',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: '700',
                                            transition: 'all 0.15s',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {method.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Smart Cash Return Calculator */}
                    {paymentMethod === 'cash' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', padding: '0.8rem', borderRadius: '10px', border: `1px solid ${colors.borderLight}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Cash Received:</span>
                                <input 
                                    type="number"
                                    placeholder="0.00"
                                    value={cashReceived}
                                    onChange={e => setCashReceived(e.target.value)}
                                    style={{ width: '100px', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.35rem 0.5rem', borderRadius: '6px', textAlign: 'right', outline: 'none', fontSize: '0.85rem' }}
                                />
                            </div>
                            
                            {/* Quick cash received presets */}
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {[
                                    { label: 'Exact', value: Math.ceil(cartTotal) },
                                    { label: '+$10', value: Math.ceil(cartTotal / 10) * 10 },
                                    { label: '+$20', value: Math.ceil(cartTotal / 20) * 20 },
                                    { label: '+$50', value: Math.ceil(cartTotal / 50) * 50 },
                                    { label: '+$100', value: Math.ceil(cartTotal / 100) * 100 }
                                ].map((preset, idx) => {
                                    if (preset.value < cartTotal && preset.label !== 'Exact') return null;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setCashReceived(String(preset.value))}
                                            style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontSize: '0.7rem', padding: '0.2rem 0.4rem', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            {preset.label} ({cur.format(preset.value)})
                                        </button>
                                    );
                                })}
                            </div>

                            {parseFloat(cashReceived) >= cartTotal && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px dashed ${colors.borderLight}`, paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: colors.textMuted }}>Change Due:</span>
                                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#10b981' }}>
                                        {cur.format(parseFloat(cashReceived) - cartTotal)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Row */}
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#fff',
                                border: 'none',
                                padding: '0.75rem',
                                borderRadius: '10px',
                                fontWeight: '700',
                                cursor: submitting ? 'default' : 'pointer',
                                fontSize: '0.95rem'
                            }}
                        >
                            {submitting ? '⏳ Processing...' : 'Confirm & Complete Payment'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                padding: '0.75rem',
                                borderRadius: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
