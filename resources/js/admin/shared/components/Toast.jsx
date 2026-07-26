import React, { useState, useEffect, useCallback } from 'react';

export function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    const colors = { success: '#10b981', error: '#ef4444', info: '#6366f1' };
    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
            background: colors[type] || colors.info, color: '#fff',
            padding: '0.875rem 1.5rem', borderRadius: '10px', fontWeight: 600,
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)', fontSize: '0.9rem',
            animation: 'slideUp 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.75rem',
            maxWidth: '400px',
        }}>
            <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span>{message}</span>
        </div>
    );
}

export function useToast() {
    const [toast, setToast] = useState(null);
    const show = useCallback((message, type = 'success') => {
        setToast({ message, type, id: Date.now() });
    }, []);
    const hide = useCallback(() => setToast(null), []);
    const ToastComponent = toast ? <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hide} /> : null;
    return { show, ToastComponent };
}
