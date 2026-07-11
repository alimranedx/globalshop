import React from 'react';
import useCurrency from '../hooks/useCurrency';
import useTheme from '../hooks/useTheme';

export default function ReceiptModal({ sale, onClose }) {
    if (!sale) return null;
    const cur = useCurrency();
    const { colors, isDark } = useTheme();

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '2rem', width: '420px', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: colors.shadow, fontFamily: 'monospace' }}>
                <div style={{ textAlign: 'center', borderBottom: `1px dashed ${colors.border}`, paddingBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: colors.text, margin: '0 0 0.5rem 0' }}>RECEIPT / INVOICE</h3>
                    <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>Invoice #: {sale.invoice_number}</div>
                    <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>Date: {new Date(sale.created_at).toLocaleString()}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem', color: colors.text }}>
                    <div><strong>Customer:</strong> {sale.customer_name || 'Walk-in Customer'}</div>
                    {sale.customer_email && <div><strong>Email:</strong> {sale.customer_email}</div>}
                    <div><strong>Cashier:</strong> {sale.creator ? sale.creator.name : 'System'}</div>
                    <div style={{ textTransform: 'capitalize' }}><strong>Payment:</strong> {sale.payment_method}</div>
                </div>

                <div style={{ borderBottom: `1px dashed ${colors.border}`, borderTop: `1px dashed ${colors.border}`, padding: '0.8rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '0.2rem' }}>
                        <span>Item Name [Qty]</span>
                        <span>Total</span>
                    </div>
                    {sale.items && sale.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: colors.text }}>
                            <span>{item.product_name} x {parseFloat(item.quantity)}</span>
                            <span>{cur.format(item.total)}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem', color: colors.text, textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal:</span>
                        <span>{cur.format(sale.subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                        <span>Discount:</span>
                        <span>-{cur.format(sale.discount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tax (5%):</span>
                        <span>+{cur.format(sale.tax)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${colors.border}`, paddingTop: '0.4rem', fontWeight: '700', fontSize: '1.1rem', color: isDark ? '#10b981' : '#059669' }}>
                        <span>GRAND TOTAL:</span>
                        <span>{cur.format(sale.total)}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button 
                        onClick={() => window.print()}
                        style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', flex: 1, textAlign: 'center' }}
                    >
                        🖨️ Print
                    </button>
                    <button 
                        onClick={onClose}
                        style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', flex: 1, textAlign: 'center', fontWeight: '600' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
