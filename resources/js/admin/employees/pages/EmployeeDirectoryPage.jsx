import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../services/employeeService';
import { useToast } from '../../shared/components/Toast';
import { PageHeader } from '../../shared/components/PageHeader';
import { PageLoader } from '../../shared/components/PageLoader';
import { SectionCard } from '../../shared/components/SectionCard';
import { DataTable } from '../../shared/components/DataTable';
import { ActionBtn, ErrorAlert } from '../../shared/components/ActionBtn';
import { Modal } from '../../shared/components/Modal';
import { FormField } from '../../shared/components/FormField';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function EmployeeDirectoryPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [resetTarget, setResetTarget] = useState(null);
    const { show, ToastComponent } = useToast();
    const navigate = useNavigate();

    const loadEmployees = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (statusFilter) params.append('status', statusFilter);

        const res = await employeeService.getEmployees(params.toString());
        if (res?.success) setEmployees(res.data || []);
        setLoading(false);
    }, [search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => { loadEmployees(); }, 250);
        return () => clearTimeout(timer);
    }, [loadEmployees]);

    const handleStatusToggle = async (emp, newStatus) => {
        const res = await employeeService.updateStatus(emp.id, newStatus);
        if (res?.success) {
            show(`Employee "${emp.name}" status updated to ${newStatus}.`, 'success');
            loadEmployees();
        } else {
            show(res?.message || 'Failed to update status.', 'error');
        }
    };

    if (loading && employees.length === 0) return <PageLoader />;

    return (
        <div>
            {ToastComponent}

            <PageHeader
                title="Shop Employees Directory"
                sub="View and manage staff accounts and permissions across all tenant shops"
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
                        placeholder="Search by employee name, email, or phone..."
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
                    columns={['Employee Name', 'Email', 'Assigned Shops & Roles', 'Account Status', 'Last Login', 'Actions']}
                    rows={employees.map(emp => [
                        <div style={{ fontWeight: 600, color: '#e5e7eb' }}>{emp.name}</div>,
                        <div style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>{emp.email}</div>,
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {emp.shops?.length > 0 ? emp.shops.map(s => (
                                <span key={s.id} onClick={() => navigate(`/admin/shops/${s.id}/manage`)} style={{ color: '#6366f1', fontSize: '0.78rem', cursor: 'pointer' }}>
                                    🏬 {s.name} ({s.pivot?.role_id ? 'Role #' + s.pivot.role_id : 'Staff'})
                                </span>
                            )) : <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>Unassigned</span>}
                        </div>,
                        emp.status === 'active' || !emp.status
                            ? <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.78rem' }}>● Active</span>
                            : <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.78rem' }}>⛔ {emp.status.toUpperCase()}</span>,
                        <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                            {emp.last_login_at ? new Date(emp.last_login_at).toLocaleDateString() : 'Never'}
                        </span>,
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {emp.status === 'suspended' ? (
                                <ActionBtn label="Reactivate" color="#10b981" onClick={() => handleStatusToggle(emp, 'active')} />
                            ) : (
                                <ActionBtn label="Suspend" color="#f59e0b" onClick={() => handleStatusToggle(emp, 'suspended')} />
                            )}
                            <ActionBtn label="🔑 Reset Password" color="#6366f1" onClick={() => setResetTarget(emp)} />
                        </div>,
                    ])}
                    emptyMsg="No shop employees found."
                />
            </SectionCard>

            {resetTarget && (
                <ResetPasswordModal
                    employee={resetTarget}
                    onClose={() => setResetTarget(null)}
                    onSuccess={(msg) => { setResetTarget(null); show(msg); }}
                />
            )}
        </div>
    );
}

function ResetPasswordModal({ employee, onClose, onSuccess }) {
    const [action, setAction] = useState('send_link');
    const [newPassword, setNewPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        const res = await employeeService.resetPassword(employee.id, action, newPassword);
        if (res?.success) {
            onSuccess(res.message);
        } else {
            setError(res?.message || 'Failed to reset password.');
        }
        setSubmitting(false);
    };

    return (
        <Modal title={`Reset Password — ${employee.name}`} onClose={onClose}>
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
                        id="reset-emp-pass"
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
