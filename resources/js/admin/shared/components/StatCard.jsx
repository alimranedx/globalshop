import React from 'react';

export function StatCard({ icon, label, value, color, sub }) {
    return (
        <div style={{
            background: 'rgba(20,20,28,0.6)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
            borderTop: `2px solid ${color}30`,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                    fontSize: '1.4rem', width: '44px', height: '44px', borderRadius: '12px',
                    background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{icon}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f3f4f6', letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ color: '#6b7280', fontSize: '0.825rem', fontWeight: 500 }}>{label}</div>
            {sub && <div style={{ color: color, fontSize: '0.75rem', fontWeight: 600 }}>{sub}</div>}
        </div>
    );
}
