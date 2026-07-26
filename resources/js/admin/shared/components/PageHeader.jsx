import React from 'react';

export function PageHeader({ title, sub, inline }) {
    if (inline) return (
        <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>{title}</h1>
            {sub && <p style={{ color: '#6b7280', fontSize: '0.825rem', margin: '0.25rem 0 0' }}>{sub}</p>}
        </div>
    );
    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>{title}</h1>
            {sub && <p style={{ color: '#6b7280', fontSize: '0.825rem', marginTop: '0.25rem' }}>{sub}</p>}
        </div>
    );
}
