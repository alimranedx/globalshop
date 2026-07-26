import React, { useState, useEffect } from 'react';
import { shopService } from '../services/shopService';
import { Modal } from '../../shared/components/Modal';
import { PageLoader } from '../../shared/components/PageLoader';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function ShopRolePermissionModal({ shop, role, onClose, onSaved }) {
    const [selectedPages, setSelectedPages] = useState(new Set());
    const [modules, setModules] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchPerms() {
            setLoading(true);
            const res = await shopService.getPermissions(shop.id, role.id);
            if (res?.success) {
                setSelectedPages(new Set(res.data.pages || []));
                setModules(res.data.available_modules || {});
            }
            setLoading(false);
        }
        fetchPerms();
    }, [shop.id, role.id]);

    const togglePage = (pageKey) => {
        setSelectedPages(prev => {
            const next = new Set(prev);
            next.has(pageKey) ? next.delete(pageKey) : next.add(pageKey);
            return next;
        });
    };

    const toggleSubModule = (subModulePages, selectAll) => {
        setSelectedPages(prev => {
            const next = new Set(prev);
            Object.keys(subModulePages).forEach(pKey => {
                if (selectAll) next.add(pKey);
                else next.delete(pKey);
            });
            return next;
        });
    };

    const save = async () => {
        setSaving(true);
        const res = await shopService.syncPermissions(shop.id, role.id, [...selectedPages]);
        if (res?.success) onSaved();
        setSaving(false);
    };

    if (loading) return <Modal title="Loading Permissions..." onClose={onClose}><PageLoader /></Modal>;

    return (
        <Modal title={`Page Permissions — Role: ${role.name}`} onClose={onClose} maxWidth="650px">
            <p style={{ color: '#9ca3af', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
                Select pages to grant to this role. Granted pages provide access to the page and all its available actions.
            </p>

            <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: '0.5rem' }}>
                {Object.entries(modules).map(([modKey, mod]) => (
                    <div key={modKey} style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px', padding: '1rem',
                    }}>
                        <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.95rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem' }}>
                            📦 {mod.label}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '0.5rem' }}>
                            {Object.entries(mod.sub_modules || {}).map(([subKey, sub]) => {
                                const pageEntries = Object.entries(sub.pages || {});
                                const allSubSelected = pageEntries.every(([pk]) => selectedPages.has(pk));

                                return (
                                    <div key={subKey}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, color: '#a5b4fc', fontSize: '0.85rem' }}>🔹 {sub.label}</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleSubModule(sub.pages, !allSubSelected)}
                                                style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                {allSubSelected ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingLeft: '0.75rem' }}>
                                            {pageEntries.map(([pageKey, pageLabel]) => (
                                                <label key={pageKey} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    fontSize: '0.825rem', color: selectedPages.has(pageKey) ? '#e5e7eb' : '#6b7280',
                                                    cursor: 'pointer', padding: '0.35rem 0.6rem', borderRadius: '6px',
                                                    background: selectedPages.has(pageKey) ? 'rgba(99,102,241,0.1)' : 'transparent',
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPages.has(pageKey)}
                                                        onChange={() => togglePage(pageKey)}
                                                        style={{ accentColor: '#6366f1' }}
                                                    />
                                                    <span>{pageLabel}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 600 }}>{selectedPages.size} pages selected</span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="button" onClick={save} disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving...' : 'Sync Permissions'}</button>
                </div>
            </div>
        </Modal>
    );
}
