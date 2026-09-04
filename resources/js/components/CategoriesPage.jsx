import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { fetchCatalogData, fetchState } from '../store/actions';
import { getHeaders } from '../utils/api';
import SmartDateRangePicker from './SmartDateRangePicker';
import useTheme from '../hooks/useTheme';
import { confirmModal } from '../shared/services/confirmService';

function is_null(val) {
    return val === null || val === undefined;
}

export default function CategoriesPage() {
    const dispatch = useDispatch();
    const { colors, isDark } = useTheme();

    const categories = useSelector(state => state.catalog.categories);
    const isSuspended = useSelector(state => state.shop.shop?.status === 'suspended');

    const PAGE_SIZE = 10;
    const [categoryPage, setCategoryPage] = useState(1);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formError, setFormError] = useState('');

    const [categoryForm, setCategoryForm] = useState({ name: '', logoFile: null });

    // Local filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [preset, setPreset] = useState('all');

    const [appliedQuery, setAppliedQuery] = useState('');
    const [appliedStart, setAppliedStart] = useState('');
    const [appliedEnd, setAppliedEnd] = useState('');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setAppliedQuery(searchQuery);
        setAppliedStart(startDate);
        setAppliedEnd(endDate);
        setCategoryPage(1);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setPreset('all');
        setAppliedQuery('');
        setAppliedStart('');
        setAppliedEnd('');
        setCategoryPage(1);
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        const headers = getHeaders();
        const isEditing = !!editingCategory;
        const url = isEditing 
            ? `/api/v1/tenant/categories/${editingCategory.id}` 
            : '/api/v1/tenant/categories';

        const formData = new FormData();
        formData.append('name', categoryForm.name);
        if (categoryForm.logoFile) {
            formData.append('logo', categoryForm.logoFile);
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
                dispatch(showToast({ message: isEditing ? 'Category updated' : 'Category added', isError: false }));
                setShowCategoryModal(false);
                setEditingCategory(null);
                setCategoryForm({ name: '', logoFile: null });
                dispatch(fetchCatalogData());
                dispatch(fetchState());
            } else {
                setFormError(data.message || 'An error occurred');
            }
        } catch (err) {
            setFormError('Failed to process request');
        }
    };

    const deleteCategory = async (cat) => {
        const catId = typeof cat === 'object' ? cat.id : cat;
        const catName = typeof cat === 'object' ? cat.name : '';
        await confirmModal({
            variant: 'delete',
            title: 'Delete Category?',
            message: `Are you sure you want to delete ${catName ? `the category "${catName}"` : 'this category'}?\nAll associated brands and products will lose their category classification.`,
            confirmText: 'Delete Category',
            onConfirm: async () => {
                const headers = getHeaders();
                const response = await fetch(`/api/v1/tenant/categories/${catId}`, {
                    method: 'DELETE',
                    headers
                });
                const data = await response.json();
                if (data.success) {
                    dispatch(showToast({ message: 'Category deleted successfully', isError: false }));
                    dispatch(fetchCatalogData());
                    dispatch(fetchState());
                } else {
                    throw new Error(data.message || 'Failed to delete category');
                }
            }
        });
    };

    return (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: colors.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: colors.text }}>Manage Categories</h3>
                {!isSuspended && (
                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            setCategoryForm({ name: '', logoFile: null });
                            setFormError('');
                            setShowCategoryModal(true);
                        }}
                        style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Add Category
                    </button>
                )}
            </div>

            {showCategoryModal && (
                <div style={{ background: colors.cardBg, padding: '1.5rem', borderRadius: '10px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontWeight: '600', color: colors.text }}>{editingCategory ? 'Edit Category' : 'Create Category'}</h4>
                    {formError && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                            {formError}
                        </div>
                    )}
                    <form onSubmit={handleCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>Category Name</label>
                                <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} required style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>Logo Image</label>
                                <input type="file" accept="image/*" onChange={e => setCategoryForm({ ...categoryForm, logoFile: e.target.files[0] })} style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '6px' }} />
                            </div>
                            {(categoryForm.logoFile || (editingCategory && editingCategory.logo_url)) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: 'span 2', marginTop: '0.5rem' }}>
                                    <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>Logo Preview</label>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                                        <img src={categoryForm.logoFile ? URL.createObjectURL(categoryForm.logoFile) : editingCategory.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                Save Category
                            </button>
                            <button type="button" onClick={() => setShowCategoryModal(false)} style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter Search Form with Smart Date Range Picker */}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 2, minWidth: '200px' }}>
                    <label style={{ fontSize: '0.8rem', color: colors.textMuted }}>Search Name</label>
                    <input
                        type="text"
                        placeholder="Search categories by name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem 1rem', borderRadius: '8px', outline: 'none', fontSize: '0.9rem' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.55rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                        Search
                    </button>
                    {(appliedQuery || appliedStart || appliedEnd) && (
                        <button type="button" onClick={handleClearFilters} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.55rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                            Clear
                        </button>
                    )}
                </div>
            </form>

            <div style={{ overflowX: 'auto' }}>
                {(() => {
                    const filtered = categories.filter(c => {
                        const nameMatches = c.name.toLowerCase().includes(appliedQuery.toLowerCase());
                        
                        let dateMatches = true;
                        if (appliedStart || appliedEnd) {
                            const createdAt = new Date(c.created_at);
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
                        
                        return nameMatches && dateMatches;
                    });
                    
                    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
                    const safePage = Math.min(categoryPage, totalPages);
                    const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                    return (
                        <>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Logo</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Category Name</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Slug</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Status</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>{appliedQuery || appliedStart || appliedEnd ? 'No categories match your search.' : 'No categories found.'}</td></tr>
                                    ) : (
                                        pageItems.map(c => {
                                            return (
                                                <tr key={c.id} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                                                    <td style={{ padding: '0.8rem' }}>
                                                        {c.logo_url ? (
                                                            <img src={c.logo_url} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: colors.textMuted, fontSize: '0.65rem' }}>N/A</div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.8rem', fontWeight: '600', color: colors.text }}>{c.name}</td>
                                                    <td style={{ color: colors.text }}><code>{c.slug}</code></td>
                                                    <td>
                                                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '600' }}>
                                                            Active
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {!isSuspended && (
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button onClick={() => { setEditingCategory(c); setCategoryForm({ name: c.name, logoFile: null }); setFormError(''); setShowCategoryModal(true); }} style={{ background: 'transparent', border: '1px solid #6366f1', color: '#6366f1', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                                                                <button onClick={() => deleteCategory(c)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.82rem', color: colors.textMuted }}>Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} categories</span>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button onClick={() => setCategoryPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={{ background: safePage === 1 ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') : 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: safePage === 1 ? '#6b7280' : '#6366f1', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: safePage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>← Prev</button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                            <button key={pg} onClick={() => setCategoryPage(pg)} style={{ background: pg === safePage ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'), border: '1px solid rgba(99,102,241,0.3)', color: pg === safePage ? '#fff' : colors.textMuted, padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: pg === safePage ? '700' : '400' }}>{pg}</button>
                                        ))}
                                        <button onClick={() => setCategoryPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ background: safePage === totalPages ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') : 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: safePage === totalPages ? '#6b7280' : '#6366f1', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>Next →</button>
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
