import React, { useState, useEffect, useRef } from 'react';
import useTheme from '../hooks/useTheme';
import { getHeaders } from '../utils/api';

export default function POSCustomerSearch({ value, onCustomerChange, onModeChange }) {
    const { colors, isDark } = useTheme();
    
    // Modes: 'existing', 'guest'
    // 'new' will trigger the modal and keep mode as 'existing' internally or 'new'.
    const [mode, setMode] = useState('existing');

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    
    const [guestPhone, setGuestPhone] = useState('');
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');

    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch matching customers
    useEffect(() => {
        const fetchCustomers = async () => {
            if (!query.trim() || mode !== 'existing') {
                setResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const res = await fetch(`/api/v1/tenant/customers?search=${encodeURIComponent(query)}`, {
                    headers: getHeaders()
                });
                const data = await res.json();
                if (data.success) {
                    setResults(data.data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(() => {
            if (query.trim()) fetchCustomers();
        }, 300);

        return () => clearTimeout(timer);
    }, [query, mode]);

    // Update parent when state changes
    useEffect(() => {
        if (mode === 'existing' && selectedCustomer) {
            onCustomerChange({
                id: selectedCustomer.id,
                name: selectedCustomer.name,
                phone: selectedCustomer.phone,
                email: selectedCustomer.email
            });
        } else if (mode === 'guest') {
            onCustomerChange({
                id: null,
                name: guestName,
                phone: guestPhone,
                email: guestEmail
            });
        } else {
            onCustomerChange(null);
        }
    }, [selectedCustomer, mode, guestName, guestPhone, guestEmail]);

    // Reset internal state if parent sets value to null (e.g., after successful sale)
    useEffect(() => {
        if (value === null) {
            if (selectedCustomer !== null) setSelectedCustomer(null);
            if (mode !== 'existing') setMode('existing');
            if (query !== '') setQuery('');
            if (guestName !== '') setGuestName('');
            if (guestPhone !== '') setGuestPhone('');
            if (guestEmail !== '') setGuestEmail('');
        } else if (value && value.id) {
            setSelectedCustomer(value);
            setMode('existing');
        }
    }, [value]);

    const handleSelect = (customer) => {
        setSelectedCustomer(customer);
        setQuery('');
        setShowDropdown(false);
    };

    const clearSelection = () => {
        setSelectedCustomer(null);
        setQuery('');
        setGuestName('');
        setGuestPhone('');
        setGuestEmail('');
    };

    const handleModeChange = (e) => {
        const newMode = e.target.value;
        if (newMode === 'new') {
            onModeChange('create');
            // Revert select back to existing visually, since new will pop a modal
            setMode('existing');
            return;
        }
        setMode(newMode);
        clearSelection();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: colors.textMuted, flexShrink: 0 }}>Customer:</span>
                <select
                    value={mode}
                    onChange={handleModeChange}
                    style={{ flex: 1, background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.45rem', borderRadius: '6px', cursor: 'pointer', outline: 'none', fontSize: '0.8rem' }}
                >
                    <option value="existing">👤 Existing Member</option>
                    <option value="new">➕ New Member</option>
                    <option value="guest">📞 Just Phone (Guest)</option>
                </select>
            </div>

            {mode === 'existing' && (
                selectedCustomer ? (
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.6rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: colors.text, fontWeight: '600' }}>{selectedCustomer.name}</div>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>📞 {selectedCustomer.phone}</div>
                        </div>
                        <button 
                            type="button"
                            onClick={clearSelection}
                            style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                        >×</button>
                    </div>
                ) : (
                    <div ref={wrapperRef} style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="🔍 Search Customer (Phone/Name/Email)..."
                            value={query}
                            onChange={e => {
                                setQuery(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            style={{ width: '100%', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }}
                        />
                        
                        {showDropdown && query.trim() !== '' && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}>
                                {isSearching ? (
                                    <div style={{ padding: '0.8rem', color: colors.textMuted, fontSize: '0.8rem', textAlign: 'center' }}>Searching...</div>
                                ) : results.length > 0 ? (
                                    results.map(customer => (
                                        <div 
                                            key={customer.id} 
                                            onClick={() => handleSelect(customer)}
                                            style={{ padding: '0.5rem 0.8rem', borderBottom: `1px solid ${colors.borderLight}`, cursor: 'pointer', ':hover': { background: colors.hoverBg } }}
                                        >
                                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.text }}>{customer.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>📞 {customer.phone}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '0.8rem', textAlign: 'center', color: colors.textMuted, fontSize: '0.8rem' }}>
                                        No matching customers found.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            )}

            {mode === 'guest' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${colors.borderLight}` }}>
                    <input
                        type="text"
                        placeholder="Guest Phone * (e.g. 01733425633)"
                        value={guestPhone}
                        onChange={e => setGuestPhone(e.target.value)}
                        required
                        style={{ width: '100%', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.5rem', borderRadius: '6px', outline: 'none', fontSize: '0.8rem' }}
                    />
                    <input
                        type="text"
                        placeholder="Guest Name (Optional)"
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        style={{ width: '100%', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.5rem', borderRadius: '6px', outline: 'none', fontSize: '0.8rem' }}
                    />
                    <input
                        type="email"
                        placeholder="Guest Email (Optional)"
                        value={guestEmail}
                        onChange={e => setGuestEmail(e.target.value)}
                        style={{ width: '100%', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.5rem', borderRadius: '6px', outline: 'none', fontSize: '0.8rem' }}
                    />
                </div>
            )}
        </div>
    );
}
