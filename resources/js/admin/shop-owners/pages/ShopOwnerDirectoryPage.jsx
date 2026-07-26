import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopOwnerService } from '../services/shopOwnerService';
import { useToast } from '../../shared/components/Toast';
import { PageHeader } from '../../shared/components/PageHeader';
import { PageLoader } from '../../shared/components/PageLoader';
import { SectionCard } from '../../shared/components/SectionCard';
import { DataTable } from '../../shared/components/DataTable';
import { ActionBtn, ErrorAlert } from '../../shared/components/ActionBtn';
import { Modal } from '../../shared/components/Modal';
import { FormField } from '../../shared/components/FormField';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function ShopOwnerDirectoryPage() {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [resetTarget, setResetTarget] = useState(null);
    const { show, ToastComponent } = useToast();
    const navigate = useNavigate();

    const loadOwners = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (statusFilter) params.append('status', statusFilter);

        const res = await shopOwnerService.getOwners(params.toString());
        if (res?.success) setOwners(res.data || []);
        setLoading(false);
    }, [search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => { loadOwners(); }, 250);
        return () => clearTimeout(timer);
    }, [loadOwners]);

    const handleStatusToggle = async (owner, newStatus) => {
        const res = await shopOwnerService.updateStatus(owner.id, newStatus);
        if (res?.success) {
            show(`Shop Owner "${owner.name}" status updated to ${newStatus}.`, 'success');
            loadOwners();
        } else {
            show(res?.message || 'Failed to update status.', 'error');
        }
    };

    if (loading && owners.length === 0) return <PageLoader />;

    return (
        <div>
            {ToastComponent}

            <PageHeader
                title="Shop Owners Directory"
                sub="View and manage merchant shop owner accounts across all tenant shops"
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
                        placeholder="Search by shop owner name, email, or phone..."
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
                    columns={['Owner Name', 'Email', 'Owned Shops', 'Account Status', 'Last Login', 'Actions']}
                    rows={owners.map(o => [
                        <div style={{ fontWeight: 600, color: '#e5e7eb' }}>{o.name}</div>,
                        <div style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>{o.email}</div>,
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {o.owned_shops?.length > 0 ? o.owned_shops.map(s => (
                                <span key={s.id} onClick={() => navigate(`/admin/shops/${s.id}/manage`)} style={{ color: '#6366f1', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
                                    🏬 {s.name} (/{s.slug})
                                </span>
                            )) : <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>No active shop</span>}
                        </div>,
                        o.status === 'active' || !o.status
                            ? <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.78rem' }}>● Active</span>
                            : <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.78rem' }}>⛔ {o.status.toUpperCase()}</span>,
                        <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                            {o.last_login_at ? new Date(o.last_login_at).toLocaleDateString() : 'Never'}
                        </span>,
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {o.status === 'suspended' ? (
                                <ActionBtn label="Reactivate" color="#10b981" onClick={() => handleStatusToggle(o, 'active')} />
                            ) : (
                                <ActionBtn label="Suspend" color="#f59e0b" onClick={() => handleStatusToggle(o, 'suspended')} />
                            )}
                            <ActionBtn label="🔑 Reset Password" color="#6366f1" onClick={() => setResetTarget(o)} />
                        </div>,
                    ])}
                    emptyMsg="No shop owners found."
                />
            </SectionCard>

            {resetTarget && (
                <ResetPasswordModal
                    owner={resetTarget}
                    onClose={() => setResetTarget(null)}
                    onSuccess={(msg) => { setResetTarget(null); show(msg); }}
                />
            )}
        </div>
    );
}

function ResetPasswordModal({ owner, onClose, onSuccess }) {
    const [action, setAction] = useState('send_link');
    const [newPassword, setNewPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        const res = await shopOwnerService.resetPassword(owner.id, action, newPassword);
        if (res?.success) {
            onSuccess(res.message);
        } else {
            setError(res?.message || 'Failed to reset password.');
        }
        setSubmitting(false);
    };

    return (
        <Modal title={`Reset Password — ${owner.name}`} onClose={onClose}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="reset_action" checked={action === 'send_link'} onChange={() => setAction('send_link')} style={{ accentColor: '#6366f1' }} />
                        <span>Send Password Reset Email (noreply@globalshop.com)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="reset_action" checked={action === 'set_password'} onChange={() => setAction('set_password')} style={{ accentColor: '#6366f1' }} />
                        <span>Set New Secure Password Manually</span>
                    </label>
                </div>

                {action === 'set_password' && (
                    <FormField
                        label="New Password *"
                        id="reset-owner-pass"
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
