import React, { useState, useEffect, useCallback } from 'react';
import { customerService } from '../services/customerService';
import { useToast } from '../../shared/components/Toast';
import { PageHeader } from '../../shared/components/PageHeader';
import { PageLoader } from '../../shared/components/PageLoader';
import { SectionCard } from '../../shared/components/SectionCard';
import { DataTable } from '../../shared/components/DataTable';
import { ActionBtn, ErrorAlert } from '../../shared/components/ActionBtn';
import { Modal } from '../../shared/components/Modal';
import { FormField } from '../../shared/components/FormField';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function CustomerDirectoryPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [resetTarget, setResetTarget] = useState(null);
    const { show, ToastComponent } = useToast();

    const loadCustomers = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (statusFilter) params.append('status', statusFilter);

        const res = await customerService.getCustomers(params.toString());
        if (res?.success) setCustomers(res.data || []);
        setLoading(false);
    }, [search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => { loadCustomers(); }, 250);
        return () => clearTimeout(timer);
    }, [loadCustomers]);

    const handleStatusToggle = async (customer, newStatus) => {
        const res = await customerService.updateStatus(customer.id, newStatus);
        if (res?.success) {
            show(`Customer "${customer.name || customer.phone}" status updated to ${newStatus}.`, 'success');
            loadCustomers();
        } else {
            show(res?.message || 'Failed to update status.', 'error');
        }
    };

    if (loading && customers.length === 0) return <PageLoader />;

    return (
        <div>
            {ToastComponent}

            <PageHeader
                title="Marketplace Customers Directory"
                sub="View and manage self-registered marketplace shoppers and accounts"
            />

            {/* Controls Bar */}
            <div style={{
                background: 'rgba(18,18,25,0.7)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem',
                display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center',
            }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                    <input
                        type="text"
                        placeholder="Search by customer name, phone, or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '0.7rem 1rem', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f3f4f6', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                </div>
                <div style={{ width: '180px' }}>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{
                            width: '100%', padding: '0.7rem 1rem', borderRadius: '8px',
                            background: '#141419', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f3f4f6', fontSize: '0.875rem', outline: 'none', cursor: 'pointer',
                        }}
                    >
                        <option value="">All Account Statuses</option>
                        <option value="active">● Active</option>
                        <option value="suspended">⛔ Suspended</option>
                        <option value="deactivated">Inactive / Deactivated</option>
                    </select>
                </div>
            </div>

            <SectionCard>
                <DataTable
                    columns={['Customer Name', 'Phone / Email', 'Verification', 'Account Status', 'Registered', 'Actions']}
                    rows={customers.map(c => [
                        <div style={{ fontWeight: 600, color: '#e5e7eb' }}>{c.name || 'Unnamed Customer'}</div>,
                        <div>
                            <div style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.85rem' }}>{c.phone}</div>
                            <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>{c.email || 'No email registered'}</div>
                        </div>,
                        c.verified_at
                            ? <span style={{ color: '#34d399', fontWeight: 600, fontSize: '0.78rem' }}>✓ Verified</span>
                            : <span style={{ color: '#fbbf24', fontSize: '0.78rem' }}>Unverified</span>,
                        c.status === 'active' || !c.status
                            ? <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.78rem' }}>● Active</span>
                            : <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.78rem' }}>⛔ {c.status.toUpperCase()}</span>,
                        <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{new Date(c.created_at).toLocaleDateString()}</span>,
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {c.status === 'suspended' ? (
                                <ActionBtn label="Reactivate" color="#10b981" onClick={() => handleStatusToggle(c, 'active')} />
                            ) : (
                                <ActionBtn label="Suspend" color="#f59e0b" onClick={() => handleStatusToggle(c, 'suspended')} />
                            )}
                            <ActionBtn label="🔑 Reset Password" color="#6366f1" onClick={() => setResetTarget(c)} />
                        </div>,
                    ])}
                    emptyMsg="No marketplace customers found."
                />
            </SectionCard>

            {resetTarget && (
                <ResetPasswordModal
                    customer={resetTarget}
                    onClose={() => setResetTarget(null)}
                    onSuccess={(msg) => { setResetTarget(null); show(msg); }}
                />
            )}
        </div>
    );
}

function ResetPasswordModal({ customer, onClose, onSuccess }) {
    const [action, setAction] = useState('send_link');
    const [newPassword, setNewPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        const res = await customerService.resetPassword(customer.id, action, newPassword);
        if (res?.success) {
            onSuccess(res.message);
        } else {
            setError(res?.message || 'Failed to reset password.');
        }
        setSubmitting(false);
    };

    return (
        <Modal title={`Reset Password — ${customer.name || customer.phone}`} onClose={onClose}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="reset_action" checked={action === 'send_link'} onChange={() => setAction('send_link')} style={{ accentColor: '#6366f1' }} />
                        <span>Send Password Reset Email / Token (Simulated link via noreply@globalshop.com)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="reset_action" checked={action === 'set_password'} onChange={() => setAction('set_password')} style={{ accentColor: '#6366f1' }} />
                        <span>Set New Secure Password Manually</span>
                    </label>
                </div>

                {action === 'set_password' && (
                    <FormField
                        label="New Password *"
                        id="reset-cust-pass"
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="••••••••"
                    />
                )}

                {error && <ErrorAlert msg={error} />}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={submitting} style={primaryBtnStyle}>{submitting ? 'Processing...' : 'Confirm Reset'}</button>
                </div>
            </form>
        </Modal>
    );
}
