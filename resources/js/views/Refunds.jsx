import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getHeaders } from '../utils/api';
import useCurrency from '../hooks/useCurrency';
import useTheme from '../hooks/useTheme';
import SmartDateRangePicker from '../components/SmartDateRangePicker';

export default function Refunds() {
    const cur = useCurrency();
    const { colors, isDark } = useTheme();

    const currentUserEmail = useSelector(state => state.auth.currentUserEmail);
    const user = useSelector(state => state.auth.user);
    const isSuspended = useSelector(state => state.shop.shop?.status === 'suspended');

    const [refunds, setRefunds] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [preset, setPreset] = useState('all');
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');

    const [appliedStart, setAppliedStart] = useState('');
    const [appliedEnd, setAppliedEnd] = useState('');
    const [appliedStatus, setAppliedStatus] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');

    // Modal state for viewing detail
    const [selectedRefund, setSelectedRefund] = useState(null);

    const fetchRefunds = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (appliedStart) params.append('start_date', appliedStart);
            if (appliedEnd) params.append('end_date', appliedEnd);
            if (appliedStatus) params.append('status', appliedStatus);
            if (appliedSearch) params.append('search', appliedSearch);

            const headers = getHeaders();
            const response = await fetch(`/api/v1/tenant/refunds?${params.toString()}`, {
                headers
            });
            const res = await response.json();
            if (res.success) {
                setRefunds(res.data);
            }
        } catch (err) {
            console.error('Error fetching refunds:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/v1/tenant/refunds/customers', {
                headers: getHeaders()
            });
            const res = await response.json();
            if (res.success) {
                setCustomers(res.data);
            }
        } catch (err) {
            console.error('Error fetching customers:', err);
        }
    };

    useEffect(() => {
        fetchRefunds();
        fetchCustomers();
    }, [appliedStart, appliedEnd, appliedStatus, appliedSearch]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setAppliedStart(startDate);
        setAppliedEnd(endDate);
        setAppliedStatus(status);
        setAppliedSearch(search);
    };

    const handleClear = () => {
        setStartDate('');
        setEndDate('');
        setPreset('all');
        setStatus('');
        setSearch('');

        setAppliedStart('');
        setAppliedEnd('');
        setAppliedStatus('');
        setAppliedSearch('');
    };

    // Actions
    const handleApprove = async (refundId) => {
        if (!confirm('Are you sure you want to approve this refund request? This will deduct the amount and restock products if specified.')) return;
        try {
            const response = await fetch(`/api/v1/tenant/refunds/${refundId}/approve`, {
                method: 'POST',
                headers: getHeaders()
            });
            const res = await response.json();
            if (res.success) {
                alert('Refund approved successfully!');
                fetchRefunds();
                fetchCustomers();
                if (selectedRefund && selectedRefund.id === refundId) {
                    setSelectedRefund(null);
                }
            } else {
                alert(res.message || 'Failed to approve refund.');
            }
        } catch (err) {
            console.error(err);
            alert('Error occurred while approving.');
        }
    };

    const handleReject = async (refundId) => {
        if (!confirm('Are you sure you want to reject/cancel this refund request?')) return;
        try {
            const response = await fetch(`/api/v1/tenant/refunds/${refundId}/cancel`, {
                method: 'POST',
                headers: getHeaders()
            });
            const res = await response.json();
            if (res.success) {
                alert('Refund request rejected.');
                fetchRefunds();
                if (selectedRefund && selectedRefund.id === refundId) {
                    setSelectedRefund(null);
                }
            } else {
                alert(res.message || 'Failed to reject refund.');
            }
        } catch (err) {
            console.error(err);
            alert('Error occurred while rejecting.');
        }
    };

    // Calculate aggregated stats
    const totalRefundedSum = refunds
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + parseFloat(r.refund_amount), 0);

    const pendingCount = refunds.filter(r => r.status === 'pending').length;
    const totalCustomersWithCredit = customers.filter(c => parseFloat(c.store_credit_balance) > 0).length;

    // Checks if the user is owner or manager (has approve authority)
    const canManageApprove = user?.role === 'Owner' || user?.role === 'Manager' || user?.is_platform_admin;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: colors.shadow }}>
                    <div style={{ background: 'rgba(239,68,68,0.12)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#ef4444' }}>🔄</div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted, display: 'block', fontWeight: '500' }}>TOTAL REFUNDED</span>
                        <strong style={{ fontSize: '1.3rem', color: colors.text, fontWeight: '700' }}>{cur.format(totalRefundedSum)}</strong>
                    </div>
                </div>

                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: colors.shadow }}>
                    <div style={{ background: 'rgba(245,158,11,0.12)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#f59e0b' }}>⏳</div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted, display: 'block', fontWeight: '500' }}>PENDING APPROVALS</span>
                        <strong style={{ fontSize: '1.3rem', color: colors.text, fontWeight: '700' }}>{pendingCount} request{pendingCount !== 1 ? 's' : ''}</strong>
                    </div>
                </div>

                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: colors.shadow }}>
                    <div style={{ background: 'rgba(99,102,241,0.12)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#6366f1' }}>💳</div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted, display: 'block', fontWeight: '500' }}>ACTIVE STORE CREDIT</span>
                        <strong style={{ fontSize: '1.3rem', color: colors.text, fontWeight: '700' }}>{totalCustomersWithCredit} customer{totalCustomersWithCredit !== 1 ? 's' : ''}</strong>
                    </div>
                </div>
            </div>

            {/* Filters Form */}
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '1.5rem', boxShadow: colors.shadow }}>
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: '160px' }}>
                        <label style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: '500' }}>Status</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
                        >
                            <option value="" style={{ background: colors.surface, color: colors.text }}>All Statuses</option>
                            <option value="pending" style={{ background: colors.surface, color: colors.text }}>Pending</option>
                            <option value="completed" style={{ background: colors.surface, color: colors.text }}>Completed</option>
                            <option value="cancelled" style={{ background: colors.surface, color: colors.text }}>Cancelled</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 2, minWidth: '200px' }}>
                        <label style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: '500' }}>Search term</label>
                        <input
                            type="text"
                            placeholder="Search refund #, original invoice or reason..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem 1rem', borderRadius: '8px', outline: 'none', fontSize: '0.9rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', height: '38px', alignItems: 'center' }}>
                        <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0 1.5rem', height: '38px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                            Apply Filters
                        </button>
                        {(appliedStart || appliedEnd || appliedStatus || appliedSearch) && (
                            <button type="button" onClick={handleClear} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0 1.5rem', height: '38px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                Clear
                            </button>
                        )}
                    </div>
                </form>

                {/* Table */}
                <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
                    {loading ? (
                        <div style={{ color: colors.textMuted, textAlign: 'center', padding: '3rem' }}>Loading refunds...</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                                    <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Refund #</th>
                                    <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Original Sale</th>
                                    <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Date</th>
                                    <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Type</th>
                                    <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Method</th>
                                    <th style={{ textAlign: 'right', padding: '0.8rem', color: colors.tableHeaderColor }}>Amount</th>
                                    <th style={{ textAlign: 'center', padding: '0.8rem', color: colors.tableHeaderColor }}>Status</th>
                                    <th style={{ textAlign: 'center', padding: '0.8rem', color: colors.tableHeaderColor }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {refunds.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: colors.textMuted }}>No refund records found.</td>
                                    </tr>
                                ) : (
                                    refunds.map(refund => (
                                        <tr key={refund.id} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                                            <td style={{ padding: '0.8rem', fontWeight: '600', color: colors.text }}><code>{refund.refund_number}</code></td>
                                            <td style={{ padding: '0.8rem' }}>
                                                {refund.sale ? (
                                                    <span style={{ color: colors.text }}><code>{refund.sale.invoice_number}</code></span>
                                                ) : (
                                                    <span style={{ color: colors.textMuted }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.8rem', color: colors.text }}>{new Date(refund.created_at).toLocaleString()}</td>
                                            <td style={{ padding: '0.8rem', textTransform: 'capitalize', color: colors.text }}>{refund.type}</td>
                                            <td style={{ padding: '0.8rem', textTransform: 'capitalize', color: colors.textMuted }}>{refund.refund_method.replace('_', ' ')}</td>
                                            <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: '600', color: '#ef4444' }}>{cur.format(refund.refund_amount)}</td>
                                            <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                                                <span style={{ 
                                                    fontSize: '0.75rem', 
                                                    padding: '0.2rem 0.5rem', 
                                                    borderRadius: '20px',
                                                    fontWeight: '600',
                                                    background: refund.status === 'completed' ? 'rgba(16,185,129,0.15)' : (refund.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'),
                                                    color: refund.status === 'completed' ? (isDark ? '#10b981' : '#059669') : (refund.status === 'pending' ? '#f59e0b' : '#ef4444')
                                                }}>
                                                    {refund.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                    <button 
                                                        onClick={() => setSelectedRefund(refund)}
                                                        style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                    >
                                                        Details
                                                    </button>
                                                    {refund.status === 'pending' && canManageApprove && !isSuspended && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleApprove(refund.id)}
                                                                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                            >
                                                                Approve
                                                            </button>
                                                            <button 
                                                                onClick={() => handleReject(refund.id)}
                                                                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
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
            </div>

            {/* Store Credit Customer List */}
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '1.5rem', boxShadow: colors.shadow }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: colors.text, margin: '0 0 1rem 0' }}>💳 Regular Customer Store Credit Balances</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                                <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Membership #</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Customer Name</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Phone</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Email</th>
                                <th style={{ textAlign: 'right', padding: '0.8rem', color: colors.tableHeaderColor }}>Credit Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>No customers registered with store credit.</td>
                                </tr>
                            ) : (
                                customers.map(customer => (
                                    <tr key={customer.id} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                                        <td style={{ padding: '0.8rem', fontWeight: '600', color: colors.text }}><code>{customer.membership_number}</code></td>
                                        <td style={{ padding: '0.8rem', color: colors.text, fontWeight: '500' }}>{customer.name}</td>
                                        <td style={{ padding: '0.8rem', color: colors.textMuted }}>{customer.phone || '—'}</td>
                                        <td style={{ padding: '0.8rem', color: colors.textMuted }}>{customer.email || '—'}</td>
                                        <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: '700', color: isDark ? '#10b981' : '#059669' }}>{cur.format(customer.store_credit_balance)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Refund Detail Modal */}
            {selectedRefund && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '2rem', width: '450px', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: colors.shadow }}>
                        <div style={{ borderBottom: `1px solid ${colors.borderLight}`, paddingBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: colors.text, margin: 0 }}>Refund Request Details</h3>
                            <button onClick={() => setSelectedRefund(null)} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem', color: colors.text }}>
                            <div><strong>Refund Number:</strong> <code>{selectedRefund.refund_number}</code></div>
                            {selectedRefund.sale && <div><strong>Original Invoice:</strong> <code>{selectedRefund.sale.invoice_number}</code></div>}
                            <div><strong>Requested By:</strong> {selectedRefund.creator ? selectedRefund.creator.name : 'Unknown'}</div>
                            <div><strong>Request Date:</strong> {new Date(selectedRefund.created_at).toLocaleString()}</div>
                            <div><strong>Refund Amount:</strong> <strong style={{ color: '#ef4444' }}>{cur.format(selectedRefund.refund_amount)}</strong></div>
                            <div style={{ textTransform: 'capitalize' }}><strong>Refund Method:</strong> {selectedRefund.refund_method.replace('_', ' ')}</div>
                            <div><strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: '700', color: selectedRefund.status === 'completed' ? '#10b981' : (selectedRefund.status === 'pending' ? '#f59e0b' : '#ef4444') }}>{selectedRefund.status}</span></div>
                            {selectedRefund.approved_by && <div><strong>Approved By:</strong> {selectedRefund.approver ? selectedRefund.approver.name : 'Unknown'}</div>}
                            <div><strong>Reason:</strong> {selectedRefund.reason}</div>
                            {selectedRefund.notes && <div><strong>Notes:</strong> {selectedRefund.notes}</div>}
                        </div>

                        {selectedRefund.items && selectedRefund.items.length > 0 && (
                            <div style={{ border: `1px solid ${colors.borderLight}`, borderRadius: '8px', overflow: 'hidden', marginTop: '0.5rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead style={{ background: colors.cardBg }}>
                                        <tr style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                                            <th style={{ padding: '0.4rem', color: colors.tableHeaderColor, textAlign: 'left' }}>Product</th>
                                            <th style={{ padding: '0.4rem', color: colors.tableHeaderColor, textAlign: 'center' }}>Qty</th>
                                            <th style={{ padding: '0.4rem', color: colors.tableHeaderColor, textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRefund.items.map(item => (
                                            <tr key={item.id} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                                                <td style={{ padding: '0.4rem', color: colors.text }}>{item.product_name}</td>
                                                <td style={{ padding: '0.4rem', color: colors.text, textAlign: 'center' }}>{parseFloat(item.quantity)}</td>
                                                <td style={{ padding: '0.4rem', color: '#ef4444', textAlign: 'right' }}>{cur.format(item.refund_amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                            {selectedRefund.status === 'pending' && canManageApprove && !isSuspended && (
                                <>
                                    <button 
                                        onClick={() => handleApprove(selectedRefund.id)}
                                        style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', padding: '0.55rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleReject(selectedRefund.id)}
                                        style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', border: 'none', padding: '0.55rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            <button 
                                onClick={() => setSelectedRefund(null)}
                                style={{ flex: 1, background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, padding: '0.55rem', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
