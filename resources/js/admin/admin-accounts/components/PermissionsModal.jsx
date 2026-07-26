import React, { useState } from 'react';
import { adminService } from '../services/adminService';
import { PLATFORM_PERMISSIONS_CONFIG } from '../../shared/constants/options';
import { Modal } from '../../shared/components/Modal';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function PermissionsModal({ admin, onClose, onSaved }) {
    const [selected, setSelected] = useState(new Set(Array.isArray(admin.admin_permissions) ? admin.admin_permissions : []));
    const [saving, setSaving] = useState(false);

    const toggle = (key) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const save = async () => {
        setSaving(true);
        const res = await adminService.updatePermissions(admin.id, [...selected]);
        if (res?.success) onSaved();
        setSaving(false);
    };

    return (
        <Modal title={`Permissions — ${admin.name}`} onClose={onClose}>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Configure which platform pages this admin can access.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {Object.entries(PLATFORM_PERMISSIONS_CONFIG).map(([key, label]) => (
                    <label key={key} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1rem', borderRadius: '10px', cursor: 'pointer',
                        background: selected.has(key) ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${selected.has(key) ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                        <input
                            type="checkbox"
                            checked={selected.has(key)}
                            onChange={() => toggle(key)}
                            style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
                        />
                        <span style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
                        <code style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '0.7rem' }}>{key}</code>
                    </label>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                <button onClick={save} disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving...' : 'Save Permissions'}</button>
            </div>
        </Modal>
    );
}
