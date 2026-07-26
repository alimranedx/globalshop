import React from 'react';

export function FormSelect({ label, id, value, onChange, options = [], required }) {
    return (
        <div>
            {label && (
                <label htmlFor={id} style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    {label}
                </label>
            )}
            <select
                id={id}
                value={value}
                onChange={onChange}
                required={required}
                style={{
                    width: '100%', padding: '0.75rem 0.875rem', borderRadius: '8px',
                    background: '#141419', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f3f4f6', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                }}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
