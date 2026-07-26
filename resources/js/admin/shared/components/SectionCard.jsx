import React from 'react';

export function SectionCard({ title, children }) {
    return (
        <div style={{
            background: 'rgba(18,18,25,0.7)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px', overflow: 'hidden',
        }}>
            {title && (
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#d1d5db', margin: 0 }}>{title}</h2>
                </div>
            )}
            <div style={{ padding: title ? '0' : '0' }}>{children}</div>
        </div>
    );
}
