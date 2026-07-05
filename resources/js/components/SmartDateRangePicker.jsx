import React, { useState, useEffect, useRef } from 'react';

export default function SmartDateRangePicker({ startDate, endDate, preset, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const applyPreset = (p) => {
        const today = new Date();
        let start = '';
        let end = '';

        if (p === 'today') {
            start = formatDate(today);
            end = formatDate(today);
        } else if (p === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            start = formatDate(yesterday);
            end = formatDate(yesterday);
        } else if (p === 'last7') {
            const last7 = new Date();
            last7.setDate(today.getDate() - 6);
            start = formatDate(last7);
            end = formatDate(today);
        } else if (p === 'last30') {
            const last30 = new Date();
            last30.setDate(today.getDate() - 30);
            start = formatDate(last30);
            end = formatDate(today);
        } else if (p === 'custom') {
            start = startDate || '';
            end = endDate || '';
        }

        onChange({ startDate: start, endDate: end, preset: p });
        if (p !== 'custom') {
            setIsOpen(false);
        }
    };

    const handleCustomChange = (field, value) => {
        if (field === 'start') {
            onChange({ startDate: value, endDate: endDate, preset: 'custom' });
        } else {
            onChange({ startDate: startDate, endDate: value, preset: 'custom' });
        }
    };

    const getDisplayLabel = () => {
        if (preset === 'all') return 'Date: All Time';
        if (preset === 'today') return 'Date: Today';
        if (preset === 'yesterday') return 'Date: Yesterday';
        if (preset === 'last7') return 'Date: Last 7 Days';
        if (preset === 'last30') return 'Date: Last 1 Month';
        if (preset === 'custom') {
            if (startDate && endDate) return `${startDate} to ${endDate}`;
            if (startDate) return `Since ${startDate}`;
            if (endDate) return `Until ${endDate}`;
            return 'Date: Custom Range';
        }
        return 'Date Range';
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', position: 'relative', minWidth: '220px', flex: 1 }}>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Date Filter</label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'rgba(30, 30, 38, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    outline: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem'
                }}
            >
                <span>{getDisplayLabel()}</span>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>📅</span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#1b1b22',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    marginTop: '4px',
                    padding: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem',
                    width: '320px'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                        {[
                            { id: 'all', label: 'All Time' },
                            { id: 'today', label: 'Today' },
                            { id: 'yesterday', label: 'Yesterday' },
                            { id: 'last7', label: 'Last 7 Days' },
                            { id: 'last30', label: 'Last 1 Month' },
                            { id: 'custom', label: 'Custom Range' }
                        ].map(p => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => applyPreset(p.id)}
                                style={{
                                    background: preset === p.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                                    border: preset === p.id ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                                    color: preset === p.id ? '#fff' : '#9ca3af',
                                    padding: '0.4rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    fontWeight: preset === p.id ? '600' : '400',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {preset === 'custom' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.6rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                                    <label style={{ fontSize: '0.72rem', color: '#9ca3af' }}>From</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => handleCustomChange('start', e.target.value)}
                                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.3rem', borderRadius: '4px', fontSize: '0.8rem', outline: 'none', colorScheme: 'dark' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                                    <label style={{ fontSize: '0.72rem', color: '#9ca3af' }}>To</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => handleCustomChange('end', e.target.value)}
                                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.3rem', borderRadius: '4px', fontSize: '0.8rem', outline: 'none', colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}
