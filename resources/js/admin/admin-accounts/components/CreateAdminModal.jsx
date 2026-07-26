import React, { useState } from 'react';
import { adminService } from '../services/adminService';
import { Modal } from '../../shared/components/Modal';
import { FormField } from '../../shared/components/FormField';
import { ErrorAlert } from '../../shared/components/ActionBtn';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function CreateAdminModal({ onClose, onSaved }) {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await adminService.createAdmin(form);
        if (res?.success) onSaved();
        else setError(res?.message || 'Failed to create admin.');
        setSaving(false);
    };

    return (
        <Modal title="Create Platform Admin Account" onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Full Name" id="new-admin-name" value={form.name} onChange={set('name')} required />
                <FormField label="Email Address" id="new-admin-email" type="email" value={form.email} onChange={set('email')} required />
                <FormField label="Password" id="new-admin-password" type="password" value={form.password} onChange={set('password')} required minLength={6} />
                {error && <ErrorAlert msg={error} />}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Creating...' : 'Create Admin'}</button>
                </div>
            </form>
        </Modal>
    );
}
