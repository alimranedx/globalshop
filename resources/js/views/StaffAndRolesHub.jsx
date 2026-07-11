import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { fetchState, fetchCatalogData } from '../store/actions';
import { getHeaders } from '../utils/api';
import useTheme from '../hooks/useTheme';

export default function StaffAndRolesHub() {
    const dispatch = useDispatch();
    const { colors, isDark } = useTheme();

    const employees = useSelector(state => state.employees.employees);
    const shopRoles = useSelector(state => state.employees.shopRoles);
    const permissionsConfig = useSelector(state => state.auth.permissionsConfig);
    const userRole = useSelector(state => state.auth.user?.role);
    const isOwner = userRole === 'Owner';
    const isSuspended = useSelector(state => state.shop.shop?.status === 'suspended');

    const userPermissions = useSelector(state => state.auth.userPermissions);
    const canManageStaff = isOwner || userPermissions.includes('employees.index');
    const canManageRoles = isOwner || userPermissions.includes('roles.index');

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

    const handleUpdateEmployee = async (employeeId, roleId) => {
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/employees/${employeeId}`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ role_id: roleId })
            });
            const data = await response.json();
            if (data.success) {
                showMsg('Employee role updated');
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
        setRolesList(data);
        setLoadingRoles(false);
    };

    useEffect(() => {
        if (canManageRoles) {
            refreshRoles();
        }
    }, []);

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
            refreshRoles();
        }
    };

    const handleDeleteRoleClick = async (roleId) => {
        if (confirm('Are you sure you want to delete this custom role?')) {
            const res = await deleteRole(roleId);
            if (res.success) {
                if (selectedRole && selectedRole.id === roleId) {
                    setSelectedRole(null);
                    setRolePerms([]);
                }
                refreshRoles();
            }
        }
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
                    shopRoles={shopRoles}
                    onAddEmployee={handleAddEmployee}
                    onUpdateEmployee={handleUpdateEmployee}
                    onDeleteEmployee={handleDeleteEmployee}
                    isOwner={isOwner}
                    isSuspended={isSuspended}
                />
            )}

            {activeSubTab === 'roles' && canManageRoles && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
                    {/* Left Column: Create custom role form and role list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {isOwner && !isSuspended && (
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
                                                {role.is_custom && role.member_count === 0 && isOwner && !isSuspended && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteRoleClick(role.id);
                                                        }}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            padding: '0.2rem'
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
                                    {isOwner && !isSuspended && (
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
                                                                            <label key={pageKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: colors.textMuted, cursor: (isOwner && !isSuspended) ? 'pointer' : 'default' }}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    name="role-permissions[]"
                                                                                    value={pageKey}
                                                                                    defaultChecked={isChecked}
                                                                                    key={`${selectedRole.id}-${pageKey}-${isChecked}`} // force reset state on role update
                                                                                    disabled={!isOwner || isSuspended}
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

function StaffView({ employees, shopRoles, onAddEmployee, onUpdateEmployee, onDeleteEmployee, isOwner, isSuspended }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editRoleId, setEditRoleId] = useState('');
    const [updating, setUpdating] = useState(false);
    const { colors, isDark } = useTheme();

    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');
        if (!roleId) {
            setError('Please select a role.');
            return;
        }
        setSubmitting(true);
        const res = await onAddEmployee(name, email, password, roleId);
        setSubmitting(false);
        if (res.success) {
            setName('');
            setEmail('');
            setPassword('');
            setRoleId('');
        } else {
            setError(res.error || 'Failed to add employee');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingEmployee || !editRoleId) return;
        setUpdating(true);
        const res = await onUpdateEmployee(editingEmployee.id, editRoleId);
        setUpdating(false);
        if (res.success) {
            setEditingEmployee(null);
            setEditRoleId('');
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '2rem', borderRadius: '16px', boxShadow: colors.shadow }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: colors.text }}>Shop Employees</h3>
                
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                                <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Email</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', color: colors.tableHeaderColor }}>Role</th>
                                <th style={{ textAlign: 'center', padding: '0.8rem', color: colors.tableHeaderColor }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>No employees registered.</td>
                                </tr>
                            ) : (
                                employees.map(emp => (
                                    <tr key={emp.id} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                                        <td style={{ padding: '0.8rem', color: colors.text, fontWeight: '500' }}>{emp.name}</td>
                                        <td style={{ padding: '0.8rem', color: colors.textMuted }}>{emp.email}</td>
                                        <td style={{ padding: '0.8rem' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: '600' }}>
                                                {emp.role_name}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                                            {isOwner && !isSuspended && (
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => {
                                                            setEditingEmployee(emp);
                                                            setEditRoleId(emp.role_id || '');
                                                        }}
                                                        style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                    >
                                                        Edit Role
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to remove this employee?')) {
                                                                onDeleteEmployee(emp.id);
                                                            }
                                                        }}
                                                        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {editingEmployee && isOwner && !isSuspended && (
                    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '1.5rem', borderRadius: '16px', boxShadow: colors.shadow }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: colors.text }}>Edit Role: {editingEmployee.name}</h4>
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <select
                                value={editRoleId}
                                onChange={e => setEditRoleId(e.target.value)}
                                required
                                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontFamily: 'Outfit', width: '100%', boxSizing: 'border-box' }}
                            >
                                <option value="" style={{ background: colors.surface, color: colors.text }}>Select a Role</option>
                                {shopRoles.map(role => (
                                    <option key={role.id} value={role.id} style={{ background: colors.surface, color: colors.text }}>{role.name}</option>
                                ))}
                            </select>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" disabled={updating} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', flex: 1, fontFamily: 'Outfit' }}>
                                    {updating ? 'Updating...' : 'Update'}
                                </button>
                                <button type="button" onClick={() => setEditingEmployee(null)} style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, padding: '0.6rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', flex: 1, fontFamily: 'Outfit' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {isOwner && !isSuspended && (
                    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '1.5rem', borderRadius: '16px', boxShadow: colors.shadow }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: colors.text }}>Add New Employee</h4>
                        
                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '8px', outline: 'none', fontFamily: 'Outfit', width: '100%', boxSizing: 'border-box' }}
                            />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '8px', outline: 'none', fontFamily: 'Outfit', width: '100%', boxSizing: 'border-box' }}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '8px', outline: 'none', fontFamily: 'Outfit', width: '100%', boxSizing: 'border-box' }}
                            />
                            <select
                                value={roleId}
                                onChange={e => setRoleId(e.target.value)}
                                required
                                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontFamily: 'Outfit', width: '100%', boxSizing: 'border-box' }}
                            >
                                <option value="" style={{ background: colors.surface, color: colors.text }}>Select a Role</option>
                                {shopRoles.map(role => (
                                    <option key={role.id} value={role.id} style={{ background: colors.surface, color: colors.text }}>{role.name}</option>
                                ))}
                            </select>
                            <button type="submit" disabled={submitting} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '0.65rem', borderRadius: '8px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer', fontFamily: 'Outfit', marginTop: '0.4rem', width: '100%' }}>
                                {submitting ? 'Adding...' : 'Add Employee'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
