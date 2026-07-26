import React, { useState, useEffect } from 'react';
import { shopService } from '../services/shopService';
import { Modal } from '../../shared/components/Modal';
import { FormField } from '../../shared/components/FormField';
import { ErrorAlert } from '../../shared/components/ActionBtn';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function AssignOwnerModal({ shop, onClose, onSaved }) {
    const [type, setType] = useState('select');
    const [users, setUsers] = useState([]);
    const [ownerId, setOwnerId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('password');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadUsers() {
            const res = await shopService.getUsers();
            if (res?.success) setUsers(res.data || []);
        }
        loadUsers();
    }, []);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const body = type === 'select' ? { owner_id: ownerId } : { name, email, password };
        const res = await shopService.assignOwner(shop.id, body);
        if (res?.success) onSaved();
        else setError(res?.message || 'Failed to assign owner.');
        setSaving(false);
    };

    return (
        <Modal title="Assign Shop Owner" onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="own_type" checked={type === 'select'} onChange={() => setType('select')} style={{ accentColor: '#6366f1' }} />
                        <span>Select Existing User</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="own_type" checked={type === 'create'} onChange={() => setType('create')} style={{ accentColor: '#6366f1' }} />
                        <span>Create New Owner</span>
                    </label>
                </div>

                {type === 'select' ? (
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Select User</label>
                        <select value={ownerId} onChange={e => setOwnerId(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                            <option value="">Select a user...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                        </select>
                    </div>
                ) : (
                    <>
                        <FormField label="Full Name *" id="aown-name" value={name} onChange={e => setName(e.target.value)} required />
                        <FormField label="Email *" id="aown-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        <FormField label="Password *" id="aown-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                    </>
                )}

                {error && <ErrorAlert msg={error} />}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Assigning...' : 'Assign Owner'}</button>
                </div>
            </form>
        </Modal>
    );
}
