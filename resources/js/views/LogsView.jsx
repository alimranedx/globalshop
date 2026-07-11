import React from 'react';
import { useSelector } from 'react-redux';
import useTheme from '../hooks/useTheme';

export default function LogsView() {
    const logs = useSelector(state => state.ui.activityLogs);
    const { colors } = useTheme();

    return (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '2rem', borderRadius: '16px', boxShadow: colors.shadow }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: colors.text }}>Shop Activity Logs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {logs.length === 0 ? (
                    <div style={{ color: colors.textMuted, fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>No activity logs recorded.</div>
                ) : (
                    logs.map(log => (
                        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: colors.cardBg, borderRadius: '8px', border: `1px solid ${colors.borderLight}`, alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <span style={{ fontSize: '0.9rem', color: colors.text, fontWeight: '500' }}>{log.description}</span>
                                <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Action: <code>{log.action}</code></span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
