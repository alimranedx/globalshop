import React, { useState, useEffect, useCallback } from 'react';
import { shopService } from '../services/shopService';
import { PageLoader } from '../../shared/components/PageLoader';
import { SectionCard } from '../../shared/components/SectionCard';
import { DataTable } from '../../shared/components/DataTable';
import { ActionBtn, ErrorAlert } from '../../shared/components/ActionBtn';
import { Modal } from '../../shared/components/Modal';
import { FormField } from '../../shared/components/FormField';
import { ConfirmModal } from '../../shared/components/ConfirmModal';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function ShopEmployeesTab({ shop, onRefresh, showToast }) {
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editEmp, setEditEmp] = useState(null);
    const [removeEmpTarget, setRemoveEmpTarget] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [eRes, rRes] = await Promise.all([
            shopService.getEmployees(shop.id),
            shopService.getRoles(shop.id),
        ]);
        if (eRes?.success) setEmployees(eRes.data || []);
        if (rRes?.success) setRoles(rRes.data || []);
        setLoading(false);
    }, [shop.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleRemove = async () => {
        if (!removeEmpTarget) return;
        const res = await shopService.removeEmployee(shop.id, removeEmpTarget.id);
        if (res?.success) {
            showToast('Employee removed from shop.');
            setRemoveEmpTarget(null);
            loadData();
            onRefresh();
        } else {
            showToast(res?.message || 'Failed to remove employee.', true);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>Staff & Employee Roster</h2>
                <button onClick={() => setShowAdd(true)} style={primaryBtnStyle}>+ Add Employee</button>
            </div>

            <SectionCard>
                <DataTable
                    columns={['Name', 'Email', 'Assigned Role', 'Status', 'Actions']}
                    rows={employees.map(emp => [
                        <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{emp.name}</span>,
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{emp.email}</span>,
                        <span style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.85rem' }}>{emp.role_name || 'Staff'}</span>,
                        emp.pivot_status === 'active'
                            ? <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.78rem' }}>● Active</span>
                            : <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.78rem' }}>Deactivated</span>,
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <ActionBtn label="Edit Role / Status" color="#6366f1" onClick={() => setEditEmp(emp)} />
                            <ActionBtn label="Remove" color="#ef4444" onClick={() => setRemoveEmpTarget(emp)} />
                        </div>,
                    ])}
                    emptyMsg="No employees added to this shop yet."
                />
            </SectionCard>

            {showAdd && (
                <AddEmployeeModal shop={shop} roles={roles} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadData(); onRefresh(); showToast('Employee added!'); }} />
            )}
            {editEmp && (
                <EditEmployeeModal shop={shop} roles={roles} employee={editEmp} onClose={() => setEditEmp(null)} onSaved={() => { setEditEmp(null); loadData(); showToast('Employee updated!'); }} />
            )}
            {removeEmpTarget && (
                <ConfirmModal
                    title={`Remove ${removeEmpTarget.name}?`}
                    message={`Are you sure you want to remove ${removeEmpTarget.name} (${removeEmpTarget.email}) from Shop "${shop.name}"?`}
                    confirmText="Yes, Remove"
                    onClose={() => setRemoveEmpTarget(null)}
                    onConfirm={handleRemove}
                />
            )}
        </div>
    );
}

function AddEmployeeModal({ shop, roles, onClose, onSaved }) {
    const [form, setForm] = useState({ name: '', email: '', password: 'password', role_id: roles[0]?.id || '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await shopService.addEmployee(shop.id, form);
        if (res?.success) onSaved();
        else setError(res?.message || 'Failed to add employee.');
        setSaving(false);
    };

    return (
        <Modal title="Add Staff Member to Shop" onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Full Name" id="emp-name" value={form.name} onChange={set('name')} required placeholder="Bob Manager" />
                <FormField label="Email Address" id="emp-email" type="email" value={form.email} onChange={set('email')} required placeholder="bob@alpha.com" />
                <FormField label="Initial Password" id="emp-pass" type="password" value={form.password} onChange={set('password')} required minLength={6} />
                <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Assign Role *</label>
                    <select value={form.role_id} onChange={set('role_id')} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                {error && <ErrorAlert msg={error} />}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Adding...' : 'Add Employee'}</button>
                </div>
            </form>
        </Modal>
    );
}

function EditEmployeeModal({ shop, roles, employee, onClose, onSaved }) {
    const [roleId, setRoleId] = useState(employee.role_id || roles[0]?.id || '');
    const [status, setStatus] = useState(employee.pivot_status || 'active');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const body = { role_id: roleId, status };
        if (password) body.password = password;

        const res = await shopService.updateEmployee(shop.id, employee.id, body);
        if (res?.success) onSaved();
        setSaving(false);
    };

    return (
        <Modal title={`Edit ${employee.name}`} onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Shop Role</label>
                    <select value={roleId} onChange={e => setRoleId(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                        <option value="active">● Active</option>
                        <option value="deactivated">Deactivated</option>
                    </select>
                </div>
                <FormField label="Reset Password (optional)" id="emp-reset-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep unchanged" />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving...' : 'Save Employee'}</button>
                </div>
            </form>
        </Modal>
    );
}
