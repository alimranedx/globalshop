import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { fetchCatalogData, fetchState } from '../store/actions';
import { getHeaders } from '../utils/api';
import SmartDateRangePicker from './SmartDateRangePicker';
import useTheme from '../hooks/useTheme';

function is_null(val) {
    return val === null || val === undefined;
}

// Searchable Select Component
function SearchableSelect({ label, value, options, onChange, placeholder, required = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { colors, isDark } = useTheme();

    const selectedOption = options.find(opt => opt.id === value);
    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', position: 'relative', flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>{label}</label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    color: colors.text,
                    padding: '0.6rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                }}
            >
                <span>{selectedOption ? selectedOption.name : placeholder}</span>
                <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>{isOpen ? '▲' : '▼'}</span>
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
                    marginTop: '4px',
                    padding: '0.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem'
                }}>
                    <input 
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: colors.inputBg,
                            border: `1px solid ${colors.inputBorder}`,
                            color: colors.text,
                            padding: '0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            outline: 'none',
                            marginBottom: '0.2rem'
                        }}
                    />
                    {filteredOptions.length === 0 ? (
                        <div style={{ padding: '0.4rem', color: colors.textMuted, fontSize: '0.8rem' }}>No results match</div>
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
                                    padding: '0.4rem',
                                    cursor: 'pointer',
                                    background: opt.id === value ? colors.accentBg : 'transparent',
                                    color: colors.text,
                                    borderRadius: '4px',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {opt.name}
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

// Searchable Multi-Select Component
function SearchableMultiSelect({ label, placeholder, options, selectedValues, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { colors, isDark } = useTheme();

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggle = (id) => {
        if (selectedValues.includes(id)) {
            onChange(selectedValues.filter(val => val !== id));
        } else {
            onChange([...selectedValues, id]);
        }
    };

    const handleSelectAllToggle = () => {
        const filteredIds = filteredOptions.map(o => o.id);
        const allFilteredChecked = filteredIds.every(id => selectedValues.includes(id));
        
        if (allFilteredChecked) {
            onChange(selectedValues.filter(val => !filteredIds.includes(val)));
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
            <label style={{ fontSize: '0.8rem', color: colors.textMuted }}>{label}</label>
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
                    boxSizing: 'border-box',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem'
                }}
            >
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{getDisplayLabel()}</span>
                <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>{isOpen ? '▲' : '▼'}</span>
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
                    maxHeight: '260px',
                    overflowY: 'auto',
                    zIndex: 9999,
                    boxShadow: colors.shadow,
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
                            background: colors.inputBg,
                            border: `1px solid ${colors.inputBorder}`,
                            borderRadius: '6px',
                            color: colors.text,
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
                                borderBottom: `1px solid ${colors.border}`,
                                fontSize: '0.82rem',
                                color: '#6366f1',
                                fontWeight: '600'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={filteredOptions.map(o => o.id).every(id => selectedValues.includes(id))}
                                onChange={handleSelectAllToggle}
                                style={{ cursor: 'pointer' }}
                            />
                            <span>Select All</span>
                        </label>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '140px', overflowY: 'auto' }}>
                        {filteredOptions.length === 0 ? (
                            <div style={{ padding: '0.5rem', color: colors.textMuted, fontSize: '0.8rem' }}>No results match</div>
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
                                            background: isChecked ? colors.accentBg : 'transparent',
                                            borderRadius: '4px',
                                            fontSize: '0.82rem',
                                            color: colors.text
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

export default function BrandsPage() {
    const dispatch = useDispatch();
    const { colors, isDark } = useTheme();

    const brands = useSelector(state => state.catalog.brands);
    const categories = useSelector(state => state.catalog.categories);
    const isSuspended = useSelector(state => state.shop.shop?.status === 'suspended');

    const PAGE_SIZE = 10;
    const [brandPage, setBrandPage] = useState(1);
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [formError, setFormError] = useState('');

    const [brandForm, setBrandForm] = useState({ name: '', category_id: '', logoFile: null });

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

    useEffect(() => {
        if (categories && categories.length > 0 && !brandForm.category_id) {
            setBrandForm(f => ({ ...f, category_id: categories[0].id }));
        }
    }, [categories]);

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

    const handleBrandSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        const headers = getHeaders();
        const isEditing = !!editingBrand;
        const url = isEditing 
            ? `/api/v1/tenant/brands/${editingBrand.id}` 
            : '/api/v1/tenant/brands';

        const formData = new FormData();
        formData.append('name', brandForm.name);
        formData.append('category_id', brandForm.category_id);
        if (brandForm.logoFile) {
            formData.append('logo', brandForm.logoFile);
        }
        if (isEditing) {
            formData.append('_method', 'PUT');
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData
            });

            if (response.status === 422 || response.status === 403) {
                const errData = await response.json();
                setFormError(errData.message || 'Error processing request');
                return;
            }

            const data = await response.json();
            if (data.success) {
                dispatch(showToast({ message: isEditing ? 'Brand updated' : 'Brand added', isError: false }));
                setShowBrandModal(false);
                setEditingBrand(null);
                setBrandForm({ name: '', category_id: categories[0]?.id || '', logoFile: null });
                dispatch(fetchCatalogData());
            } else {
                setFormError(data.message || 'An error occurred');
            }
        } catch (err) {
            setFormError('Failed to process request');
        }
    };

    const deleteBrand = async (id) => {
        if (!confirm('Are you sure you want to delete this brand? All its products will lose brand scoping.')) return;
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/brands/${id}`, {
                method: 'DELETE',
                headers
            });
            const data = await response.json();
            if (data.success) {
                dispatch(showToast({ message: 'Brand deleted', isError: false }));
                dispatch(fetchCatalogData());
            } else {
                dispatch(showToast({ message: data.message || 'Failed to delete brand', isError: true }));
            }
        } catch (e) {
            dispatch(showToast({ message: 'Failed to delete brand', isError: true }));
        }
    };

    return (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: colors.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: colors.text }}>Manage Brands</h3>
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
                <div style={{ background: colors.cardBg, padding: '1.5rem', borderRadius: '10px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontWeight: '600', color: colors.text }}>{editingBrand ? 'Edit Brand' : 'Create Brand'}</h4>
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
                                <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>Brand Name</label>
                                <input type="text" value={brandForm.name} onChange={e => setBrandForm({ ...brandForm, name: e.target.value })} required style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>Logo Image</label>
                                <input type="file" accept="image/*" onChange={e => setBrandForm({ ...brandForm, logoFile: e.target.files[0] })} style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '6px' }} />
                            </div>
                            {(brandForm.logoFile || (editingBrand && editingBrand.logo_url)) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: 'span 3', marginTop: '0.5rem' }}>
                                    <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>Logo Preview</label>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                                        <img src={brandForm.logoFile ? URL.createObjectURL(brandForm.logoFile) : editingBrand.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                Save Brand
                            </button>
                            <button type="button" onClick={() => setShowBrandModal(false)} style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', background: colors.cardBg, padding: '1.2rem', borderRadius: '12px', border: `1px solid ${colors.borderLight}` }}>
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
                    <label style={{ fontSize: '0.8rem', color: colors.textMuted }}>Search Name</label>
                    <input
                        type="text"
                        placeholder="Search brands by name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem 1rem', borderRadius: '8px', outline: 'none', fontSize: '0.9rem' }}
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
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Logo</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Brand Name</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Category</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Slug</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>{appliedQuery || appliedStart || appliedEnd || appliedCategories.length > 0 ? 'No brands match your search.' : 'No brands registered.'}</td></tr>
                                    ) : (
                                        pageItems.map(b => (
                                            <tr key={b.id} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                                                <td style={{ padding: '0.8rem' }}>
                                                    {b.logo_url ? (
                                                        <img src={b.logo_url} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: colors.textMuted, fontSize: '0.65rem' }}>N/A</div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.8rem', fontWeight: '600', color: colors.text }}>{b.name}</td>
                                                <td>
                                                    <span style={{ fontSize: '0.8rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                                                        {b.category ? b.category.name : 'None'}
                                                    </span>
                                                </td>
                                                <td style={{ color: colors.text }}><code>{b.slug}</code></td>
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
                                    <span style={{ fontSize: '0.82rem', color: colors.textMuted }}>Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} brands</span>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button onClick={() => setBrandPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={{ background: safePage === 1 ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') : 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: safePage === 1 ? '#6b7280' : '#6366f1', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: safePage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>← Prev</button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                            <button key={pg} onClick={() => setBrandPage(pg)} style={{ background: pg === safePage ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'), border: '1px solid rgba(99,102,241,0.3)', color: pg === safePage ? '#fff' : colors.textMuted, padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: pg === safePage ? '700' : '400' }}>{pg}</button>
                                        ))}
                                        <button onClick={() => setBrandPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ background: safePage === totalPages ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') : 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: safePage === totalPages ? '#6b7280' : '#6366f1', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>Next →</button>
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
