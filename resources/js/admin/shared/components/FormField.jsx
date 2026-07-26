import React from 'react';

export function FormField({ label, id, type = 'text', value, onChange, required, min, step, minLength, placeholder }) {
    return (
        <div>
            <label htmlFor={id} style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {label}
            </label>
            <input
                id={id} type={type} value={value} onChange={onChange} required={required}
                min={min} step={step} minLength={minLength} placeholder={placeholder}
                style={{
                    width: '100%', padding: '0.75rem 0.875rem', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f3f4f6', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: "'Outfit', sans-serif",
                }}
            />
        </div>
    );
}
