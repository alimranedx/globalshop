import React, { useState } from 'react';
import useTheme from '../hooks/useTheme';

export default function SearchableSelect({ label, value, options, onChange, placeholder, required = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { colors, isDark } = useTheme();

    const selectedOption = options.find(opt => opt.id === value);
    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayValue = isOpen ? searchTerm : (selectedOption ? selectedOption.name : '');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', position: 'relative' }}>
            <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={displayValue}
                    onChange={(e) => {
                        setIsOpen(true);
                        setSearchTerm(e.target.value);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearchTerm('');
                    }}
                    required={required && !value}
                    style={{
                        width: '100%',
                        background: colors.inputBg,
                        border: `1px solid ${colors.inputBorder}`,
                        color: colors.text,
                        padding: '0.6rem',
                        borderRadius: '6px',
                        outline: 'none',
                        cursor: 'text',
                        boxSizing: 'border-box'
                    }}
                />
                <span 
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: colors.textMuted, fontSize: '0.85rem' }}
                >
                    {isOpen ? '▲' : '▼'}
                </span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 9999,
                    boxShadow: colors.shadow,
                    marginTop: '4px'
                }}>
                    {filteredOptions.length === 0 ? (
                        <div style={{ padding: '0.6rem', color: colors.textMuted, fontSize: '0.85rem' }}>No results match</div>
                    ) : (
                        filteredOptions.map(opt => (
                            <div
                                key={opt.id}
                                onClick={() => {
                                    onChange(opt.id);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                                style={{
                                    padding: '0.6rem',
                                    cursor: 'pointer',
                                    background: value === opt.id ? colors.accentBg : 'transparent',
                                    color: colors.text,
                                    fontSize: '0.85rem',
                                    transition: 'background 0.2s',
                                    borderBottom: `1px solid ${colors.borderLight}`
                                }}
                                onMouseEnter={(e) => e.target.style.background = colors.accentBg}
                                onMouseLeave={(e) => e.target.style.background = value === opt.id ? colors.accentBg : 'transparent'}
                            >
                                {opt.name} {opt.isGlobal ? '(Global)' : ''}
                            </div>
                        ))
                    )}
                </div>
            )}
            
            {isOpen && (
                <div 
                    onClick={() => setIsOpen(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}
                />
            )}
        </div>
    );
}

export function is_null(val) {
    return val === null || val === undefined;
}
