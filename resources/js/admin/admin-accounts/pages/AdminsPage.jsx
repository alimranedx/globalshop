import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import { CreateAdminModal } from '../components/CreateAdminModal';
import { PermissionsModal } from '../components/PermissionsModal';
import { PLATFORM_PERMISSIONS_CONFIG } from '../../shared/constants/options';
import { useAuth } from '../../shared/context/AuthContext';
import { useToast } from '../../shared/components/Toast';
import { PageHeader } from '../../shared/components/PageHeader';
import { PageLoader } from '../../shared/components/PageLoader';
import { SectionCard } from '../../shared/components/SectionCard';
import { DataTable } from '../../shared/components/DataTable';
import { ActionBtn } from '../../shared/components/ActionBtn';
import { primaryBtnStyle } from '../../shared/components/Styles';

export function AdminsPage() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [permTarget, setPermTarget] = useState(null);
    const { show, ToastComponent } = useToast();
    const { user } = useAuth();

    const load = useCallback(async () => {
        setLoading(true);
        const res = await adminService.getAdmins();
        if (res?.success) setAdmins(res.data || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return <PageLoader />;

    return (
        <div>
            {ToastComponent}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <PageHeader title="Admin Accounts" sub={`${admins.length} platform administrator${admins.length !== 1 ? 's' : ''}`} inline />
                {user?.isSuperAdmin && (
                    <button id="create-admin-btn" onClick={() => setShowCreate(true)} style={primaryBtnStyle}>+ Add Admin</button>
                )}
            </div>

            <SectionCard>
                <DataTable
                    columns={['Name', 'Email', 'Type', 'Permissions', 'Actions']}
                    rows={admins.map(admin => {
                        const isSuper = admin.email === 'superadmin@marketplace.com';
                        const permCount = Array.isArray(admin.admin_permissions) ? admin.admin_permissions.length : 0;
                        return [
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                    background: isSuper ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.85rem', fontWeight: 700, color: '#fff',
                                }}>{admin.name?.[0]?.toUpperCase()}</div>
                                <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{admin.name}</span>
                            </div>,
                            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{admin.email}</span>,
                            isSuper
                                ? <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.78rem' }}>⭐ SUPER ADMIN</span>
                                : <span style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.78rem' }}>PLATFORM ADMIN</span>,
                            isSuper
                                ? <span style={{ color: '#34d399', fontSize: '0.78rem' }}>All Access</span>
                                : <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{permCount}/{Object.keys(PLATFORM_PERMISSIONS_CONFIG).length} pages</span>,
                            !isSuper && user?.isSuperAdmin
                                ? <ActionBtn label="Permissions" color="#6366f1" onClick={() => setPermTarget(admin)} />
                                : <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>—</span>,
                        ];
                    })}
                    emptyMsg="No admin accounts found."
                />
            </SectionCard>

            {showCreate && (
                <CreateAdminModal
                    onClose={() => setShowCreate(false)}
                    onSaved={() => { setShowCreate(false); load(); show('Admin account created!'); }}
                />
            )}
            {permTarget && (
                <PermissionsModal
                    admin={permTarget}
                    onClose={() => setPermTarget(null)}
                    onSaved={() => { setPermTarget(null); load(); show('Permissions updated!'); }}
                />
            )}
        </div>
    );
}
