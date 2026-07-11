import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedReceipt } from '../store/uiSlice';
import { getHeaders } from '../utils/api';
import SmartDateRangePicker from '../components/SmartDateRangePicker';
import RefundModal from '../components/RefundModal';
import useTranslation from '../hooks/useTranslation';
import useCurrency from '../hooks/useCurrency';
import useTheme from '../hooks/useTheme';

export default function SalesLog() {
    const dispatch = useDispatch();
    const t = useTranslation();
    const cur = useCurrency();
    const { colors, isDark } = useTheme();

    const currentUserEmail = useSelector(state => state.auth.currentUserEmail);
    const isSuspended = useSelector(state => state.shop.shop?.status === 'suspended');

    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSaleForRefund, setSelectedSaleForRefund] = useState(null);
    
    // Filters (matching user preference: Date Range Picker first!)
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [preset, setPreset] = useState('all');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [search, setSearch] = useState('');

    const [appliedStart, setAppliedStart] = useState('');
    const [appliedEnd, setAppliedEnd] = useState('');
    const [appliedPayment, setAppliedPayment] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');

    const [exportFormat, setExportFormat] = useState('csv');

    const handleExport = () => {
        const params = new URLSearchParams();
        if (appliedStart) params.append('start_date', appliedStart);
        if (appliedEnd) params.append('end_date', appliedEnd);
        if (appliedPayment) params.append('payment_method', appliedPayment);
        if (appliedSearch) params.append('search', appliedSearch);
        params.append('format', exportFormat);

        // Direct browser download prompt preserves Content-Disposition headers and resolves Chrome GUID filename issues
        window.location.href = `/api/v1/tenant/sales/export?${params.toString()}`;
    };

    const fetchSales = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (appliedStart) params.append('start_date', appliedStart);
            if (appliedEnd) params.append('end_date', appliedEnd);
            if (appliedPayment) params.append('payment_method', appliedPayment);
            if (appliedSearch) params.append('search', appliedSearch);

            const headers = getHeaders();
            const response = await fetch(`/api/v1/tenant/sales?${params.toString()}`, {
                headers
            });
            const res = await response.json();
            if (res.success) {
                setSales(res.data);
            }
        } catch (err) {
            console.error('Error fetching sales log:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, [appliedStart, appliedEnd, appliedPayment, appliedSearch]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setAppliedStart(startDate);
        setAppliedEnd(endDate);
        setAppliedPayment(paymentMethod);
        setAppliedSearch(search);
    };

    const handleClear = () => {
        setStartDate('');
        setEndDate('');
        setPreset('all');
        setPaymentMethod('');
        setSearch('');

        setAppliedStart('');
        setAppliedEnd('');
        setAppliedPayment('');
        setAppliedSearch('');
    };

    return (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: colors.shadow }}>
            
            {/* Restructured Filter form: Date picker first, then payment, then search term */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', background: colors.cardBg, padding: '1.2rem', borderRadius: '12px', border: `1px solid ${colors.borderLight}` }}>
                
                <SmartDateRangePicker 
                    startDate={startDate}
                    endDate={endDate}
                    preset={preset}
                    onChange={({ startDate, endDate, preset }) => {
                        setStartDate(startDate);
                        setEndDate(endDate);
                        setPreset(preset);
                    }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: '180px' }}>
                    <label style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: '500' }}>{t('payment_method')}</label>
                    <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
                    >
                        <option value="" style={{ background: colors.surface, color: colors.text }}>All Payments</option>
                        <option value="cash" style={{ background: colors.surface, color: colors.text }}>Cash</option>
                        <option value="card" style={{ background: colors.surface, color: colors.text }}>Card</option>
                        <option value="mobile" style={{ background: colors.surface, color: colors.text }}>Mobile</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 2, minWidth: '220px' }}>
                    <label style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: '500' }}>{t('search')}</label>
                    <input
                        type="text"
                        placeholder="Search invoice number or customer details..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem 1rem', borderRadius: '8px', outline: 'none', fontSize: '0.9rem' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', height: '38px', alignItems: 'center' }}>
                    <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0 1.5rem', height: '38px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                        {t('search')}
                    </button>
                    {(appliedStart || appliedEnd || appliedPayment || appliedSearch) && (
                        <button type="button" onClick={handleClear} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0 1.5rem', height: '38px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                            {t('clear')}
                        </button>
                    )}
                </div>
            </form>

            {/* Export Actions Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.8rem', background: colors.cardBg, padding: '0.8rem 1.2rem', borderRadius: '12px', border: `1px solid ${colors.borderLight}`, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: '500' }}>📄 {t('export_report')}:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <select
                        value={exportFormat}
                        onChange={e => setExportFormat(e.target.value)}
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', outline: 'none', fontSize: '0.85rem' }}
                    >
                        <option value="csv" style={{ background: colors.surface, color: colors.text }}>CSV Format</option>
                        <option value="xls" style={{ background: colors.surface, color: colors.text }}>Excel (XLS) Format</option>
                    </select>
                    <button
                        onClick={handleExport}
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', padding: '0.45rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: isDark ? '0 2px 8px rgba(16,185,129,0.2)' : 'none' }}
                    >
                        📥 {t('export_report')}
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div style={{ overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ color: colors.textMuted, textAlign: 'center', padding: '3rem' }}>Loading sales transactions...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>{t('invoice')} #</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>{t('date')}</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>{t('cashier')}</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Customer</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>{t('payment_method')}</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Status</th>
                                <th style={{ textAlign: 'right', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Total</th>
                                <th style={{ textAlign: 'center', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>No transactions recorded.</td>
                                </tr>
                            ) : (
                                sales.map(sale => (
                                    <tr key={sale.id} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                                        <td style={{ padding: '0.8rem', fontWeight: '600', color: colors.text }}><code>{sale.invoice_number}</code></td>
                                        <td style={{ padding: '0.8rem', color: colors.text }}>{new Date(sale.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '0.8rem', color: colors.text }}>{sale.creator ? sale.creator.name : 'Unknown'}</td>
                                        <td style={{ padding: '0.8rem', color: colors.text }}>{sale.customer_name || 'Walk-in'}</td>
                                        <td style={{ padding: '0.8rem', textTransform: 'capitalize' }}>
                                            <span style={{ 
                                                fontSize: '0.75rem', 
                                                padding: '0.2rem 0.5rem', 
                                                borderRadius: '4px',
                                                background: sale.payment_method === 'cash' ? 'rgba(16,185,129,0.15)' : (sale.payment_method === 'card' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)'),
                                                color: sale.payment_method === 'cash' ? (isDark ? '#10b981' : '#059669') : (sale.payment_method === 'card' ? '#3b82f6' : '#8b5cf6')
                                            }}>
                                                {sale.payment_method}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.8rem' }}>
                                            <span style={{ 
                                                fontSize: '0.75rem', 
                                                padding: '0.2rem 0.5rem', 
                                                borderRadius: '20px',
                                                fontWeight: '600',
                                                background: sale.status === 'completed' ? 'rgba(16,185,129,0.15)' : (sale.status === 'partially_refunded' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'),
                                                color: sale.status === 'completed' ? (isDark ? '#10b981' : '#059669') : (sale.status === 'partially_refunded' ? '#f59e0b' : '#ef4444')
                                            }}>
                                                {sale.status === 'partially_refunded' ? 'Partially Refunded' : (sale.status === 'refunded' ? 'Refunded' : 'Completed')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: '600', color: isDark ? '#10b981' : '#059669' }}>{cur.format(sale.total)}</td>
                                        <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                <button 
                                                    onClick={() => dispatch(setSelectedReceipt(sale))}
                                                    style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                >
                                                    📄 {t('view_invoice')}
                                                </button>
                                                {sale.status !== 'refunded' && !isSuspended && (
                                                    <button 
                                                        onClick={() => setSelectedSaleForRefund(sale)}
                                                        style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                    >
                                                        🔄 Refund
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Refund Modal Popup */}
            {selectedSaleForRefund && (
                <RefundModal 
                    sale={selectedSaleForRefund}
                    onClose={() => setSelectedSaleForRefund(null)}
                    onSuccess={(msg) => {
                        alert(msg);
                        fetchSales();
                    }}
                />
            )}
        </div>
    );
}
