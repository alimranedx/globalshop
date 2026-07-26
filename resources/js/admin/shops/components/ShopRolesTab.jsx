import React, { useState, useEffect, useCallback } from 'react';
import { shopService } from '../services/shopService';
import { ShopRolePermissionModal } from './ShopRolePermissionModal';
import { PageLoader } from '../../shared/components/PageLoader';
import { SectionCard } from '../../shared/components/SectionCard';
import { DataTable } from '../../shared/components/DataTable';
import { ActionBtn } from '../../shared/components/ActionBtn';
import { Modal } from '../../shared/components/Modal';
import { FormField } from '../../shared/components/FormField';
import { ConfirmModal } from '../../shared/components/ConfirmModal';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function ShopRolesTab({ shop, onRefresh, showToast }) {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [permRole, setPermRole] = useState(null);
    const [deleteRoleTarget, setDeleteRoleTarget] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        const res = await shopService.getRoles(shop.id);
        if (res?.success) setRoles(res.data || []);
        setLoading(false);
    }, [shop.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDeleteRole = async () => {
        if (!deleteRoleTarget) return;
        const res = await shopService.deleteRole(shop.id, deleteRoleTarget.id);
        if (res?.success) {
            showToast(`Role "${deleteRoleTarget.name}" deleted.`);
            setDeleteRoleTarget(null);
            loadData();
            onRefresh();
        } else {
            showToast(res?.message || 'Failed to delete role.', true);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>Shop Employee Roles</h2>
                <button onClick={() => setShowAdd(true)} style={primaryBtnStyle}>+ Create Custom Role</button>
            </div>

            <SectionCard>
                <DataTable
                    columns={['Role Name', 'Permitted Pages', 'Type', 'Actions']}
                    rows={roles.map(r => [
                        <span style={{ fontWeight: 700, color: '#e5e7eb' }}>{r.name}</span>,
                        <span style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>{r.pages_count ?? 0} pages assigned</span>,
                        r.is_custom ? <span style={{ color: '#818cf8', fontSize: '0.78rem' }}>Custom</span> : <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>System Default</span>,
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <ActionBtn label="🔑 Edit Page Permissions" color="#6366f1" onClick={() => setPermRole(r)} />
                            {r.is_custom && <ActionBtn label="Delete" color="#ef4444" onClick={() => setDeleteRoleTarget(r)} />}
                        </div>,
                    ])}
                    emptyMsg="No roles found for this shop."
                />
            </SectionCard>

            {showAdd && (
                <AddRoleModal shop={shop} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadData(); onRefresh(); showToast('Role created!'); }} />
            )}
            {permRole && (
                <ShopRolePermissionModal shop={shop} role={permRole} onClose={() => setPermRole(null)} onSaved={() => { setPermRole(null); loadData(); showToast('Permissions synced!'); }} />
            )}
            {deleteRoleTarget && (
                <ConfirmModal
                    title={`Delete Role "${deleteRoleTarget.name}"?`}
                    message={`Are you sure you want to delete role "${deleteRoleTarget.name}"?`}
                    confirmText="Yes, Delete Role"
                    onClose={() => setDeleteRoleTarget(null)}
                    onConfirm={handleDeleteRole}
                />
            )}
        </div>
    );
}

function AddRoleModal({ shop, onClose, onSaved }) {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await shopService.createRole(shop.id, { name });
        if (res?.success) onSaved();
        setSaving(false);
    };

    return (
        <Modal title="Create Custom Shop Role" onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Role Name" id="role-name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. POS Cashier" />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Creating...' : 'Create Role'}</button>
                </div>
            </form>
        </Modal>
    );
}
