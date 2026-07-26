import React from 'react';

export function PageLoader() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '0.75rem' }}>
            <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1',
                animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</span>
        </div>
    );
}
