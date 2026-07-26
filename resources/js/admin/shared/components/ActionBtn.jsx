import React from 'react';

export function ActionBtn({ label, color, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '0.35rem 0.85rem', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 700,
                background: `${color}15`, border: `1px solid ${color}30`, color: color,
                cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s',
            }}
        >
            {label}
        </button>
    );
}

export function ErrorAlert({ msg }) {
    return (
        <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5', borderRadius: '8px', padding: '0.65rem 1rem', fontSize: '0.85rem',
        }}>⚠️ {msg}</div>
    );
}
