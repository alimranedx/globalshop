import React from 'react';

export function Modal({ title, onClose, children, maxWidth = '480px' }) {
    return (
        <>
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000,
                backdropFilter: 'blur(4px)',
            }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 1001, width: '100%', maxWidth: maxWidth,
                background: 'rgba(18,18,28,0.97)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '16px', padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                fontFamily: "'Outfit', sans-serif",
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f3f4f6', margin: 0 }}>{title}</h3>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af',
                        width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem',
                    }}>✕</button>
                </div>
                {children}
            </div>
        </>
    );
}
