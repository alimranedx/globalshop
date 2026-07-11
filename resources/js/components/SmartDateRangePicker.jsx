import React, { useState, useEffect, useRef } from 'react';
import useTheme from '../hooks/useTheme';
import useTranslation from '../hooks/useTranslation';

export default function SmartDateRangePicker({ startDate, endDate, preset, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { colors, isDark } = useTheme();
    const t = useTranslation();

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
        if (preset === 'all') return t('date_all_time');
        if (preset === 'today') return t('date_today');
        if (preset === 'yesterday') return t('date_yesterday');
        if (preset === 'last7') return t('date_last_7_days');
        if (preset === 'last30') return t('date_last_1_month');
        if (preset === 'custom') {
            if (startDate && endDate) return `${startDate} to ${endDate}`;
            if (startDate) return `Since ${startDate}`;
            if (endDate) return `Until ${endDate}`;
            return t('date_custom_range');
        }
        return t('date_custom_range');
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
            <label style={{ fontSize: '0.8rem', color: colors.textMuted }}>{t('date_filter')}</label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    color: colors.text,
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
                <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>📅</span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    zIndex: 9999,
                    boxShadow: colors.shadow,
                    marginTop: '4px',
                    padding: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem',
                    width: '320px'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                        {[
                            { id: 'all', label: t('all_time') },
                            { id: 'today', label: t('today') },
                            { id: 'yesterday', label: t('yesterday') },
                            { id: 'last7', label: t('last_7_days') },
                            { id: 'last30', label: t('last_1_month') },
                            { id: 'custom', label: t('custom_range') }
                        ].map(p => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => applyPreset(p.id)}
                                style={{
                                    background: preset === p.id ? colors.accentBg : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                                    border: preset === p.id ? '1px solid #6366f1' : `1px solid ${colors.border}`,
                                    color: preset === p.id ? (isDark ? '#fff' : '#4f46e5') : colors.textMuted,
                                    padding: '0.4rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    fontWeight: preset === p.id ? '600' : '500',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {preset === 'custom' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: `1px solid ${colors.border}`, paddingTop: '0.6rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                                    <label style={{ fontSize: '0.72rem', color: colors.textMuted }}>From</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => handleCustomChange('start', e.target.value)}
                                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.3rem', borderRadius: '4px', fontSize: '0.8rem', outline: 'none', colorScheme: isDark ? 'dark' : 'light' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                                    <label style={{ fontSize: '0.72rem', color: colors.textMuted }}>To</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => handleCustomChange('end', e.target.value)}
                                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.3rem', borderRadius: '4px', fontSize: '0.8rem', outline: 'none', colorScheme: isDark ? 'dark' : 'light' }}
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
