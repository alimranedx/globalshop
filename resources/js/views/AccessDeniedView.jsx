import React from 'react';

export default function AccessDeniedView() {
    return (
        <div style={{ 
            background: 'rgba(239, 68, 68, 0.05)', 
            border: '1px solid rgba(239, 68, 68, 0.15)', 
            borderRadius: '12px', 
            padding: '3rem', 
            textAlign: 'center',
            marginTop: '2rem',
            fontFamily: 'Outfit'
        }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ef4444', marginBottom: '0.5rem' }}>
                Access Denied
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
                You do not have the required permissions to view this page. Please contact your shop administrator.
            </p>
        </div>
    );
}
