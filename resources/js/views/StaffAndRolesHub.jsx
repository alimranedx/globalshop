import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { setShopRoles } from '../store/employeesSlice';
import { fetchState, fetchCatalogData } from '../store/actions';
import { getHeaders } from '../utils/api';
import useTheme from '../hooks/useTheme';
import useHasPermission from '../hooks/useHasPermission';
import { confirmModal } from '../shared/services/confirmService';

export default function StaffAndRolesHub() {
    const dispatch = useDispatch();
    const { colors, isDark } = useTheme();
    const hasPermission = useHasPermission();

    const employees = useSelector(state => state.employees.employees);
    const shopRoles = useSelector(state => state.employees.shopRoles);
    const permissionsConfig = useSelector(state => state.auth.permissionsConfig);
    const currentUser = useSelector(state => state.auth.user);
    const activeShop = useSelector(state => state.shop.shop);
    const isSuspended = activeShop?.status === 'suspended';

    const canManageStaff = hasPermission('employees.index');
    const canManageRoles = hasPermission('roles.index');

    const [activeSubTab, setActiveSubTab] = useState(canManageStaff ? 'employees' : 'roles');
    const [rolesList, setRolesList] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [rolePerms, setRolePerms] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [loadingPerms, setLoadingPerms] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    const showMsg = (message, isError = false) => {
        dispatch(showToast({ message, isError }));
    };

    // Employee CRUD
    const handleAddEmployee = async (name, email, password, roleId) => {
        const headers = getHeaders();
        try {
            const response = await fetch('/api/v1/tenant/employees', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role_id: roleId })
            });
            const data = await response.json();
            if (data.success) {
                showMsg('Employee added successfully');
                dispatch(fetchCatalogData());
                dispatch(fetchState());
                return { success: true };
            } else {
                showMsg(data.message || 'Failed to add employee', true);
                return { success: false, error: data.message };
            }
        } catch (e) {
            showMsg('Failed to add employee', true);
            return { success: false, error: 'Network error' };
        }
    };

    const handleUpdateEmployee = async (employeeId, { name, email, password, roleId }) => {
        const headers = getHeaders();
        try {
            const body = { name, email, role_id: roleId };
            if (password) body.password = password;
            const response = await fetch(`/api/v1/tenant/employees/${employeeId}`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (data.success) {
                showMsg('Employee updated successfully');
                dispatch(fetchCatalogData());
                dispatch(fetchState());
                return { success: true };
            } else {
                showMsg(data.message || 'Failed to update employee', true);
                return { success: false, error: data.message };
            }
        } catch (e) {
            showMsg('Failed to update employee', true);
            return { success: false, error: 'Network error' };
        }
    };

    const handleDeleteEmployee = async (employeeId) => {
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/employees/${employeeId}`, {
                method: 'DELETE',
                headers
            });
            const data = await response.json();
            if (data.success) {
                showMsg('Employee removed');
                dispatch(fetchCatalogData());
                dispatch(fetchState());
            } else {
                showMsg(data.message || 'Failed to remove employee', true);
            }
        } catch (e) {
            showMsg('Failed to remove employee', true);
        }
    };

    // Role Permissions API CRUD
    const fetchRoles = async () => {
        const headers = getHeaders();
        try {
            const response = await fetch('/api/v1/tenant/roles', { headers });
            const data = await response.json();
            if (data.success) return data.data;
        } catch (e) {
            showMsg('Failed to fetch roles', true);
        }
        return [];
    };

    const createRole = async (name) => {
        const headers = getHeaders();
        try {
            const response = await fetch('/api/v1/tenant/roles', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            if (data.success) {
                showMsg(data.message || 'Role created successfully');
                return { success: true, data: data.data };
            } else {
                showMsg(data.message || 'Failed to create role', true);
                return { success: false, error: data.message };
            }
        } catch (e) {
            showMsg('Failed to create role', true);
            return { success: false, error: 'Network error' };
        }
    };

    const deleteRole = async (roleId) => {
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/roles/${roleId}`, {
                method: 'DELETE',
                headers
            });
            const data = await response.json();
            if (data.success) {
                showMsg(data.message || 'Role deleted successfully');
                return { success: true };
            } else {
                showMsg(data.message || 'Failed to delete role', true);
                return { success: false, error: data.message };
            }
        } catch (e) {
            showMsg('Failed to delete role', true);
            return { success: false, error: 'Network error' };
        }
    };

    const saveRolePermissions = async (roleId, pages) => {
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/roles/${roleId}/permissions`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ pages })
            });
            const res = await response.json();
            if (res.success) {
                showMsg('Role permissions saved successfully!');
                dispatch(fetchState());
            } else {
                showMsg(res.message || 'Failed to save permissions', true);
            }
        } catch (e) {
            showMsg('Failed to save permissions', true);
        }
    };

    const loadRolePermissions = async (roleId) => {
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/roles/${roleId}/permissions`, {
                headers: { ...headers }
            });
            const res = await response.json();
            if (res.success) return res.data;
        } catch (e) {}
        return null;
    };

    const refreshRoles = async () => {
        setLoadingRoles(true);
        const data = await fetchRoles();
        if (Array.isArray(data)) {
            setRolesList(data);
            dispatch(setShopRoles(data));
        }
        setLoadingRoles(false);
    };

    useEffect(() => {
        if (canManageRoles || canManageStaff) {
            refreshRoles();
        }
    }, [canManageRoles, canManageStaff]);

    const handleSelectRole = async (role) => {
        setSelectedRole(role);
        setLoadingPerms(true);
        const data = await loadRolePermissions(role.id);
        if (data && data.checked_pages) {
            setRolePerms(data.checked_pages);
        } else {
            setRolePerms([]);
        }
        setLoadingPerms(false);
    };

    const handleCreateRoleSubmit = async (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;
        const res = await createRole(newRoleName);
        if (res.success) {
            setNewRoleName('');
            await refreshRoles();
        }
    };

    const handleDeleteRoleClick = async (roleId, roleName) => {
        await confirmModal({
            variant: 'delete',
            title: 'Delete Role?',
            message: `Are you sure you want to delete ${roleName ? `the role "${roleName}"` : 'this role'}?\nAll associated permission mappings and staff member role assignments will be permanently removed.`,
            confirmText: 'Delete Role',
            onConfirm: async () => {
                const res = await deleteRole(roleId);
                if (res.success) {
                    if (selectedRole && selectedRole.id === roleId) {
                        setSelectedRole(null);
                        setRolePerms([]);
                    }
                    refreshRoles();
                    dispatch(fetchCatalogData());
                    dispatch(fetchState());
                } else {
                    throw new Error(res.message || 'Failed to delete role.');
                }
            }
        });
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        const checked = Array.from(document.querySelectorAll('input[name="role-permissions[]"]:checked')).map(cb => cb.value);
        await saveRolePermissions(selectedRole.id, checked);
        const data = await loadRolePermissions(selectedRole.id);
        if (data && data.checked_pages) {
            setRolePerms(data.checked_pages);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {canManageStaff && canManageRoles && (
                <div style={{ display: 'flex', gap: '1rem', borderBottom: `1px solid ${colors.border}`, paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveSubTab('employees')}
                        style={{
                            background: activeSubTab === 'employees' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            color: activeSubTab === 'employees' ? (isDark ? '#818cf8' : '#4f46e5') : colors.textMuted,
                            border: activeSubTab === 'employees' ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            fontFamily: 'Outfit'
                        }}
                    >
                        👥 Employees Directory
                    </button>
                    <button
                        onClick={() => setActiveSubTab('roles')}
                        style={{
                            background: activeSubTab === 'roles' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            color: activeSubTab === 'roles' ? (isDark ? '#818cf8' : '#4f46e5') : colors.textMuted,
                            border: activeSubTab === 'roles' ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            fontFamily: 'Outfit'
                        }}
                    >
                        🔑 Roles & Permissions
                    </button>
                </div>
            )}

            {activeSubTab === 'employees' && canManageStaff && (
                <StaffView
                    employees={employees}
                    shopRoles={rolesList.length > 0 ? rolesList : shopRoles}
                    onAddEmployee={handleAddEmployee}
                    onUpdateEmployee={handleUpdateEmployee}
                    onDeleteEmployee={handleDeleteEmployee}
                    canManageStaff={canManageStaff}
                    currentUser={currentUser}
                    activeShop={activeShop}
                    isSuspended={isSuspended}
                    onOpenAddModal={refreshRoles}
                />
            )}

            {activeSubTab === 'roles' && canManageRoles && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
                    {/* Left Column: Create custom role form and role list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {canManageRoles && !isSuspended && (
                            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '1.5rem', borderRadius: '16px', boxShadow: colors.shadow }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: colors.text }}>Create Custom Role</h4>
                                <form onSubmit={handleCreateRoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <input
                                        type="text"
                                        placeholder="e.g. Supervisor"
                                        value={newRoleName}
                                        onChange={e => setNewRoleName(e.target.value)}
                                        required
                                        style={{
                                            background: colors.inputBg,
                                            border: `1px solid ${colors.inputBorder}`,
                                            color: colors.text,
                                            padding: '0.6rem',
                                            borderRadius: '8px',
                                            outline: 'none',
                                            fontFamily: 'Outfit',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Outfit' }}>
                                        + Add Custom Role
                                    </button>
                                </form>
                            </div>
                        )}

                        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '1.5rem', borderRadius: '16px', boxShadow: colors.shadow }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: colors.text }}>Shop Roles</h4>
                            {loadingRoles ? (
                                <div style={{ color: colors.textMuted, fontSize: '0.9rem' }}>Loading roles...</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {rolesList.map(role => {
                                        const isSelected = selectedRole?.id === role.id;
                                        return (
                                            <div
                                                key={role.id}
                                                onClick={() => handleSelectRole(role)}
                                                style={{
                                                    background: isSelected ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)' : colors.cardBg,
                                                    border: isSelected ? '1px solid #6366f1' : `1px solid ${colors.border}`,
                                                    borderRadius: '8px',
                                                    padding: '0.8rem 1rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                    <span style={{ fontWeight: '600', color: isSelected ? (isDark ? '#fff' : '#4f46e5') : colors.text }}>{role.name}</span>
                                                    <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                                                        {role.is_custom ? 'Custom' : 'System'} • {role.member_count} {role.member_count === 1 ? 'member' : 'members'}
                                                    </span>
                                                </div>
                                                {canManageRoles && !isSuspended && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteRoleClick(role.id, role.name);
                                                        }}
                                                        title={`Delete ${role.name} role`}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            padding: '0.25rem 0.4rem',
                                                            borderRadius: '4px',
                                                            transition: 'background 0.15s'
                                                        }}
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Right Column: permissions checklist for active role */}
                    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '2rem', borderRadius: '16px', boxShadow: colors.shadow }}>
                        {selectedRole ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, paddingBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: colors.text }}>Permissions Matrix: {selectedRole.name}</h3>
                                        <p style={{ fontSize: '0.8rem', color: colors.textMuted, marginTop: '0.2rem' }}>
                                            {selectedRole.is_custom ? 'Custom' : 'System'} Role Permissions Mapping
                                        </p>
                                    </div>
                                    {canManageRoles && !isSuspended && (
                                        <button
                                            onClick={handleSavePermissions}
                                            style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Outfit' }}
                                        >
                                            Save Permissions
                                        </button>
                                    )}
                                </div>

                                {loadingPerms ? (
                                    <div style={{ color: colors.textMuted, textAlign: 'center', padding: '3rem' }}>Loading permissions...</div>
                                ) : (
                                    <div className="tree-container">
                                        {Object.keys(permissionsConfig).map(moduleKey => {
                                            const mod = permissionsConfig[moduleKey];
                                            return (
                                                <div key={moduleKey} className="tree-module" style={{ background: colors.cardBg, border: `1px solid ${colors.borderLight}`, padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                                    <div className="tree-module-header" style={{ display: 'flex', gap: '0.5rem', fontWeight: '600', marginBottom: '0.5rem', color: colors.text }}>
                                                        <span>📁 {mod.label}</span>
                                                    </div>
                                                    {Object.keys(mod.sub_modules).map(subKey => {
                                                        const sub = mod.sub_modules[subKey];
                                                        return (
                                                            <div key={subKey} className="tree-submodule" style={{ marginLeft: '1.5rem', paddingLeft: '1rem', borderLeft: `1px dashed ${colors.border}`, marginBottom: '0.5rem' }}>
                                                                <div style={{ color: '#6366f1', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                                                                    {sub.label}
                                                                </div>
                                                                <div className="tree-pages" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                                    {Object.keys(sub.pages).map(pageKey => {
                                                                        const pageLabel = sub.pages[pageKey];
                                                                        const isChecked = rolePerms.includes(pageKey);
                                                                        return (
                                                                            <label key={pageKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: colors.textMuted, cursor: (canManageRoles && !isSuspended) ? 'pointer' : 'default' }}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    name="role-permissions[]"
                                                                                    value={pageKey}
                                                                                    defaultChecked={isChecked}
                                                                                    key={`${selectedRole.id}-${pageKey}-${isChecked}`} // force reset state on role update
                                                                                    disabled={!canManageRoles || isSuspended}
                                                                                />
                                                                                <span>{pageLabel} (<code>{pageKey}</code>)</span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ color: colors.textMuted, textAlign: 'center', padding: '5rem 2rem' }}>
                                👈 Select a role from the list to view and manage its permissions matrix.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function StaffView({ employees, shopRoles, onAddEmployee, onUpdateEmployee, onDeleteEmployee, canManageStaff, currentUser, activeShop, isSuspended, onOpenAddModal }) {
    // Add employee form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [addError, setAddError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    const handleOpenAddModal = () => {
        if (onOpenAddModal) onOpenAddModal();
        setShowAddModal(true);
    };

    // Edit employee modal
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRoleId, setEditRoleId] = useState('');
    const [editError, setEditError] = useState('');
    const [updating, setUpdating] = useState(false);

    const { colors, isDark } = useTheme();

    // ── Remove Employee with Global confirmModal ─────────────────
    const handleRemoveClick = async (emp) => {
        await confirmModal({
            variant: 'delete',
            title: 'Remove Employee?',
            message: `Are you sure you want to remove "${emp.name}" (${emp.email}) from the shop?\nThis will revoke their shop access immediately.`,
            confirmText: 'Remove Employee',
            onConfirm: async () => {
                await onDeleteEmployee(emp.id);
            }
        });
    };

    // ── Add Employee ───────────────────────────────────────────
    const handleAdd = async (e) => {
        e.preventDefault();
        setAddError('');
        if (!roleId) { setAddError('Please select a role.'); return; }
        setSubmitting(true);
        const res = await onAddEmployee(name, email, password, roleId);
        setSubmitting(false);
        if (res.success) {
            setName(''); setEmail(''); setPassword(''); setRoleId('');
            setShowAddModal(false);
        } else {
            setAddError(res.error || 'Failed to add employee');
        }
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setName(''); setEmail(''); setPassword(''); setRoleId(''); setAddError('');
    };

    // ── Edit Employee ──────────────────────────────────────────
    const openEditModal = (emp) => {
        setEditingEmployee(emp);
        setEditName(emp.name);
        setEditEmail(emp.email);
        setEditPassword('');
        setEditRoleId(emp.role_id || '');
        setEditError('');
    };

    const closeEditModal = () => {
        setEditingEmployee(null);
        setEditName(''); setEditEmail(''); setEditPassword(''); setEditRoleId(''); setEditError('');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingEmployee || !editRoleId) return;
        setEditError('');
        setUpdating(true);
        const res = await onUpdateEmployee(editingEmployee.id, {
            name: editName, email: editEmail,
            password: editPassword || null, roleId: editRoleId
        });
        setUpdating(false);
        if (res.success) { closeEditModal(); }
        else { setEditError(res.error || 'Failed to update employee'); }
    };

    // ── Shared style helpers ───────────────────────────────────
    const modalOverlayStyle = {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '1rem',
    };
    const cardStyle = (maxW = '480px') => ({
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: '20px', padding: '2rem', width: '100%',
        maxWidth: maxW, boxShadow: '0 30px 70px rgba(0,0,0,0.4)', position: 'relative',
    });
    const inputStyle = {
        background: colors.inputBg, border: `1px solid ${colors.inputBorder}`,
        color: colors.text, padding: '0.65rem 0.9rem', borderRadius: '10px',
        outline: 'none', fontFamily: 'Outfit', width: '100%',
        boxSizing: 'border-box', fontSize: '0.9rem',
    };
    const labelStyle = {
        fontSize: '0.75rem', fontWeight: '700', color: colors.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.06em',
    };
    const field = (label, input) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={labelStyle}>{label}</label>
            {input}
        </div>
    );

    return (
        <>
            {/* ══ Add Employee Modal ══ */}
            {showAddModal && (
                <div style={modalOverlayStyle} onClick={closeAddModal}>
                    <div style={cardStyle()} onClick={e => e.stopPropagation()}>
                        <button onClick={closeAddModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '1.3rem' }}>✕</button>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: colors.text, margin: 0 }}>➕ Add New Employee</h3>
                            <p style={{ fontSize: '0.82rem', color: colors.textMuted, marginTop: '0.3rem' }}>Fill in the details to register a new team member.</p>
                        </div>
                        {addError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem' }}>⚠️ {addError}</div>}
                        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {field('Full Name', <input type="text" placeholder="e.g. John Smith" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />)}
                            {field('Email Address', <input type="email" placeholder="employee@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />)}
                            {field('Password', <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />)}
                            {field('Assign Role', (
                                <select value={roleId} onChange={e => setRoleId(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                                    <option value="">Select a Role</option>
                                    {shopRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            ))}
                            <div style={{ display: 'flex', gap: '0.7rem', marginTop: '0.4rem' }}>
                                <button type="submit" disabled={submitting} style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '700', cursor: submitting ? 'default' : 'pointer', fontFamily: 'Outfit', fontSize: '0.9rem', opacity: submitting ? 0.7 : 1 }}>
                                    {submitting ? '⏳ Adding...' : '✅ Add Employee'}
                                </button>
                                <button type="button" onClick={closeAddModal} style={{ flex: 1, background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, padding: '0.75rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Outfit', fontSize: '0.9rem' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Edit Employee Modal ══ */}
            {editingEmployee && canManageStaff && !isSuspended && (
                <div style={modalOverlayStyle} onClick={closeEditModal}>
                    <div style={cardStyle('500px')} onClick={e => e.stopPropagation()}>
                        <button onClick={closeEditModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '1.3rem' }}>✕</button>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.5rem', paddingBottom: '1.2rem', borderBottom: `1px solid ${colors.borderLight}` }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>✏️</div>
                            <div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: colors.text, margin: 0 }}>Edit Employee</h3>
                                <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: 0 }}>Update profile details for <strong style={{ color: isDark ? '#f59e0b' : '#d97706' }}>{editingEmployee.name}</strong></p>
                            </div>
                        </div>

                        {editError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem' }}>⚠️ {editError}</div>}

                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                {field('Full Name', <input type="text" placeholder="Full Name" value={editName} onChange={e => setEditName(e.target.value)} required style={inputStyle} />)}
                                {field('Email Address', <input type="email" placeholder="Email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required style={inputStyle} />)}
                            </div>
                            {field('New Password', (
                                <div style={{ position: 'relative' }}>
                                    <input type="password" placeholder="Leave blank to keep current password" value={editPassword} onChange={e => setEditPassword(e.target.value)} style={inputStyle} />
                                    <span style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: colors.textMuted, pointerEvents: 'none', background: colors.inputBg, paddingLeft: '0.3rem' }}>optional</span>
                                </div>
                            ))}
                            {field('Role', (
                                <select value={editRoleId} onChange={e => setEditRoleId(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                                    <option value="">Select a Role</option>
                                    {shopRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            ))}

                            <div style={{ display: 'flex', gap: '0.7rem', marginTop: '0.4rem' }}>
                                <button type="submit" disabled={updating} style={{ flex: 1, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', border: 'none', padding: '0.78rem', borderRadius: '10px', fontWeight: '700', cursor: updating ? 'default' : 'pointer', fontFamily: 'Outfit', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(245,158,11,0.3)', opacity: updating ? 0.7 : 1 }}>
                                    {updating ? '⏳ Saving...' : '✅ Save Changes'}
                                </button>
                                <button type="button" onClick={closeEditModal} style={{ flex: 1, background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, padding: '0.78rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Outfit', fontSize: '0.9rem' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Employee Table ══ */}
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '2rem', borderRadius: '16px', boxShadow: colors.shadow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.text, margin: 0 }}>👥 Shop Employees</h3>
                        <p style={{ fontSize: '0.82rem', color: colors.textMuted, marginTop: '0.25rem' }}>{employees.length} team member{employees.length !== 1 ? 's' : ''} registered</p>
                    </div>
                    {canManageStaff && !isSuspended && (
                        <button onClick={handleOpenAddModal} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: isDark ? '0 4px 15px rgba(99,102,241,0.3)' : '0 2px 8px rgba(99,102,241,0.25)', fontFamily: 'Outfit' }}>
                            ➕ Add Employee
                        </button>
                    )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                                <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Email</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Role</th>
                                {canManageStaff && !isSuspended && <th style={{ textAlign: 'center', padding: '0.8rem', color: colors.tableHeaderColor }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: colors.textMuted }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
                                        No employees registered yet.
                                        {canManageStaff && !isSuspended && (
                                            <div style={{ marginTop: '0.8rem' }}>
                                                <button onClick={handleOpenAddModal} style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Outfit' }}>
                                                    Add your first employee →
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                employees.map(emp => {
                                    const isOwnerAccount = emp.id === activeShop?.owner_id || emp.role_name === 'Owner';
                                    const isSelfAccount = emp.id === currentUser?.id;

                                    return (
                                        <tr key={emp.id}
                                            style={{ borderBottom: `1px solid ${colors.tableRowBorder}`, transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '0.9rem 0.8rem', color: colors.text, fontWeight: '600' }}>
                                                {emp.name} {isSelfAccount && <span style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.2)', color: '#6366f1', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.3rem' }}>You</span>}
                                            </td>
                                            <td style={{ padding: '0.9rem 0.8rem', color: colors.textMuted }}>{emp.email}</td>
                                            <td style={{ padding: '0.9rem 0.8rem' }}>
                                                {emp.role_name === 'No Role Assigned' || !emp.role_id ? (
                                                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: '700', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                                        ⚠️ No Role Assigned
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', color: isDark ? '#818cf8' : '#4f46e5', fontWeight: '600' }}>
                                                        {emp.role_name}
                                                    </span>
                                                )}
                                            </td>

                                            {canManageStaff && !isSuspended && (
                                                <td style={{ padding: '0.9rem 0.8rem', textAlign: 'center' }}>
                                                    {!isOwnerAccount ? (
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => openEditModal(emp)}
                                                                style={{ background: 'rgba(251,191,36,0.15)', color: '#f59e0b', border: '1px solid rgba(251,191,36,0.3)', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                                            >
                                                                ✏️ Edit
                                                            </button>
                                                            {!isSelfAccount && (
                                                                <button
                                                                    onClick={() => handleRemoveClick(emp)}
                                                                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                                                >
                                                                    🗑️ Remove
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: colors.textMuted, fontStyle: 'italic' }}>Owner Account</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}


