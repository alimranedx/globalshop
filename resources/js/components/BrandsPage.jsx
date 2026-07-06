import React, { useState, useEffect, useRef } from 'react';
import SmartDateRangePicker from './SmartDateRangePicker';

function is_null(val) {
    return val === null || val === undefined;
}

// Searchable Select Component
function SearchableSelect({ label, value, options, onChange, placeholder, required = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const selectedOption = options.find(opt => opt.id === value);
    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayValue = isOpen ? searchTerm : (selectedOption ? selectedOption.name : '');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', position: 'relative' }}>
            <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
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
                        background: 'rgba(30, 30, 38, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        padding: '0.6rem',
                        borderRadius: '6px',
                        outline: 'none',
                        cursor: 'text',
                        boxSizing: 'border-box'
                    }}
                />
                <span 
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9ca3af', fontSize: '0.85rem' }}
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
                    background: '#1b1b22',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    marginTop: '4px'
                }}>
                    {filteredOptions.length === 0 ? (
                        <div style={{ padding: '0.6rem', color: '#9ca3af', fontSize: '0.85rem' }}>No results match</div>
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
                                    background: value === opt.id ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                                    color: '#fff',
                                    fontSize: '0.85rem',
                                    transition: 'background 0.2s',
                                    borderBottom: '1px solid rgba(255,255,255,0.03)'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(99, 102, 241, 0.15)'}
                                onMouseLeave={(e) => e.target.style.background = value === opt.id ? 'rgba(99, 102, 241, 0.25)' : 'transparent'}
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

// Searchable Multiselect Component with "Select All" Option
function SearchableMultiSelect({ label, placeholder, options, selectedValues, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredIds = filteredOptions.map(o => o.id);
    const allFilteredChecked = filteredIds.length > 0 && filteredIds.every(id => selectedValues.includes(id));

    const handleToggle = (id) => {
        if (selectedValues.includes(id)) {
            onChange(selectedValues.filter(val => val !== id));
        } else {
            onChange([...selectedValues, id]);
        }
    };

    const handleSelectAllToggle = () => {
        if (allFilteredChecked) {
            onChange(selectedValues.filter(id => !filteredIds.includes(id)));
        } else {
            onChange([...new Set([...selectedValues, ...filteredIds])]);
        }
    };

    const getDisplayLabel = () => {
        if (selectedValues.length === 0) return placeholder;
        if (selectedValues.length === options.length) return 'All Selected';
        if (selectedValues.length === 1) {
            const opt = options.find(o => o.id === selectedValues[0]);
            return opt ? opt.name : `${selectedValues.length} selected`;
        }
        return `${selectedValues.length} items selected`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', position: 'relative', minWidth: '220px', flex: 1 }}>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{label}</label>
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
                    boxSizing: 'border-box',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem'
                }}
            >
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{getDisplayLabel()}</span>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{isOpen ? '▲' : '▼'}</span>
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
                    maxHeight: '260px',
                    overflowY: 'auto',
                    zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    marginTop: '4px',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <input
                        type="text"
                        placeholder="Search options..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()} 
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            color: '#fff',
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.82rem',
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                    />
                    
                    {/* Select All Toggle */}
                    {filteredOptions.length > 0 && (
                        <label
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.4rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                                fontSize: '0.82rem',
                                color: '#6366f1',
                                fontWeight: '600'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={allFilteredChecked}
                                onChange={handleSelectAllToggle}
                                style={{ cursor: 'pointer' }}
                            />
                            <span>{allFilteredChecked ? 'Deselect All' : 'Select All'}</span>
                        </label>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '140px', overflowY: 'auto' }}>
                        {filteredOptions.length === 0 ? (
                            <div style={{ padding: '0.5rem', color: '#9ca3af', fontSize: '0.8rem' }}>No results match</div>
                        ) : (
                            filteredOptions.map(opt => {
                                const isChecked = selectedValues.includes(opt.id);
                                return (
                                    <label
                                        key={opt.id}
                                        onClick={(e) => e.stopPropagation()} 
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.4rem',
                                            cursor: 'pointer',
                                            background: isChecked ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                            borderRadius: '4px',
                                            fontSize: '0.82rem',
                                            color: '#fff'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleToggle(opt.id)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span>{opt.name}</span>
                                    </label>
                                );
                            })
                        )}
                    </div>
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

export default function BrandsPage({
    brands,
    categories = [],
    isSuspended,
    showBrandModal,
    setShowBrandModal,
    editingBrand,
    setEditingBrand,
    brandForm,
    setBrandForm,
    formError,
    setFormError,
    handleBrandSubmit,
    deleteBrand,
    brandSearch,
    setBrandSearch,
    brandPage,
    setBrandPage,
    PAGE_SIZE
}) {
    // Local filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [preset, setPreset] = useState('all');
    const [selectedCategories, setSelectedCategories] = useState([]);

    // Applied filter states
    const [appliedQuery, setAppliedQuery] = useState('');
    const [appliedStart, setAppliedStart] = useState('');
    const [appliedEnd, setAppliedEnd] = useState('');
    const [appliedCategories, setAppliedCategories] = useState([]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setAppliedQuery(searchQuery);
        setAppliedStart(startDate);
        setAppliedEnd(endDate);
        setAppliedCategories(selectedCategories);
        setBrandPage(1);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setPreset('all');
        setSelectedCategories([]);
        
        setAppliedQuery('');
        setAppliedStart('');
        setAppliedEnd('');
        setAppliedCategories([]);
        
        setBrandPage(1);
    };

    return (
        <div style={{ background: 'rgba(20, 20, 25, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Manage Brands</h3>
                {!isSuspended && (
                    <button 
                        onClick={() => {
                            setEditingBrand(null);
                            setBrandForm({ name: '', category_id: categories[0]?.id || '', logoFile: null });
                            setFormError('');
                            setShowBrandModal(true);
                        }}
                        style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Add Brand
                    </button>
                )}
            </div>

            {showBrandModal && (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontWeight: '600' }}>{editingBrand ? 'Edit Brand' : 'Create Brand'}</h4>
                    {formError && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                            {formError}
                        </div>
                    )}
                    <form onSubmit={handleBrandSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            
                            {/* Associated Category input goes FIRST */}
                            <SearchableSelect 
                                label="Associated Category"
                                value={brandForm.category_id}
                                options={categories.map(c => ({ id: c.id, name: c.name + (is_null(c.shop_id) ? ' (Global)' : '') }))}
                                onChange={id => setBrandForm({ ...brandForm, category_id: id })}
                                placeholder="Search & select category..."
                                required={true}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Brand Name</label>
                                <input type="text" value={brandForm.name} onChange={e => setBrandForm({ ...brandForm, name: e.target.value })} required style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Logo Image</label>
                                <input type="file" accept="image/*" onChange={e => setBrandForm({ ...brandForm, logoFile: e.target.files[0] })} style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '0.6rem', borderRadius: '6px' }} />
                            </div>
                            {(brandForm.logoFile || (editingBrand && editingBrand.logo_url)) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: 'span 3', marginTop: '0.5rem' }}>
                                    <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Logo Preview</label>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                                        <img src={brandForm.logoFile ? URL.createObjectURL(brandForm.logoFile) : editingBrand.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                Save Brand
                            </button>
                            <button type="button" onClick={() => setShowBrandModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <SmartDateRangePicker 
                    startDate={startDate}
                    endDate={endDate}
                    preset={preset}
                    onChange={({ startDate, endDate, preset }) => {
                        setStartDate(startDate);
                        setEndDate(endDate);
                        setPreset(preset);
                    }}
                />

                <SearchableMultiSelect 
                    label="Filter Categories"
                    placeholder="All Categories"
                    options={categories.map(c => ({ id: c.id, name: c.name + (is_null(c.shop_id) ? ' (Global)' : '') }))}
                    selectedValues={selectedCategories}
                    onChange={setSelectedCategories}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 2, minWidth: '220px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Search Name</label>
                    <input
                        type="text"
                        placeholder="Search brands by name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ background: 'rgba(30,30,38,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.55rem 1rem', borderRadius: '8px', outline: 'none', fontSize: '0.9rem' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', height: '38px', alignItems: 'center' }}>
                    <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0 1.5rem', height: '38px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                        Search
                    </button>
                    {(appliedQuery || appliedStart || appliedEnd || appliedCategories.length > 0) && (
                        <button type="button" onClick={handleClearFilters} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0 1.5rem', height: '38px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                            Clear
                        </button>
                    )}
                </div>
            </form>

            <div style={{ overflowX: 'auto' }}>
                {(() => {
                    const filtered = brands.filter(b => {
                        const nameMatches = b.name.toLowerCase().includes(appliedQuery.toLowerCase());
                        
                        let dateMatches = true;
                        if (appliedStart || appliedEnd) {
                            const createdAt = new Date(b.created_at);
                            createdAt.setHours(0,0,0,0);
                            
                            if (appliedStart) {
                                const start = new Date(appliedStart);
                                start.setHours(0,0,0,0);
                                if (createdAt < start) dateMatches = false;
                            }
                            if (appliedEnd) {
                                const end = new Date(appliedEnd);
                                end.setHours(0,0,0,0);
                                if (createdAt > end) dateMatches = false;
                            }
                        }

                        const categoryMatches = appliedCategories.length === 0 || 
                            appliedCategories.includes(b.category_id);
                        
                        return nameMatches && dateMatches && categoryMatches;
                    });

                    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
                    const safePage = Math.min(brandPage, totalPages);
                    const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                    return (
                        <>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Logo</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Brand Name</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Category</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Slug</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>{appliedQuery || appliedStart || appliedEnd || appliedCategories.length > 0 ? 'No brands match your search.' : 'No brands registered.'}</td></tr>
                                    ) : (
                                        pageItems.map(b => (
                                            <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                <td style={{ padding: '0.8rem' }}>
                                                    {b.logo_url ? (
                                                        <img src={b.logo_url} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9ca3af', fontSize: '0.65rem' }}>N/A</div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.8rem', fontWeight: '600' }}>{b.name}</td>
                                                <td>
                                                    <span style={{ fontSize: '0.8rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                                                        {b.category ? b.category.name : 'None'}
                                                    </span>
                                                </td>
                                                <td><code>{b.slug}</code></td>
                                                <td>
                                                    {!isSuspended && (
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button onClick={() => { setEditingBrand(b); setBrandForm({ name: b.name, category_id: b.category_id || '', logoFile: null }); setFormError(''); setShowBrandModal(true); }} style={{ background: 'transparent', border: '1px solid #6366f1', color: '#6366f1', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                                                            <button onClick={() => deleteBrand(b.id)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} brands</span>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button onClick={() => setBrandPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={{ background: safePage === 1 ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: safePage === 1 ? '#6b7280' : '#6366f1', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: safePage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>← Prev</button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                            <button key={pg} onClick={() => setBrandPage(pg)} style={{ background: pg === safePage ? '#6366f1' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.3)', color: pg === safePage ? '#fff' : '#9ca3af', padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: pg === safePage ? '700' : '400' }}>{pg}</button>
                                        ))}
                                        <button onClick={() => setBrandPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ background: safePage === totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: safePage === totalPages ? '#6b7280' : '#6366f1', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>Next →</button>
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );
}
