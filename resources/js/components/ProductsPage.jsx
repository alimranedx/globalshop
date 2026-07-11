import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { fetchCatalogData, fetchState } from '../store/actions';
import { getHeaders } from '../utils/api';
import useHasPermission from '../hooks/useHasPermission';
import useCurrency from '../hooks/useCurrency';
import useTheme from '../hooks/useTheme';
import SmartDateRangePicker from './SmartDateRangePicker';

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
                            width: '100%',
                            boxSizing: 'border-box',
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

export default function ProductsPage() {
    const dispatch = useDispatch();
    const hasPermission = useHasPermission();
    const cur = useCurrency();
    const { colors, isDark } = useTheme();

    const products = useSelector(state => state.catalog.products);
    const categories = useSelector(state => state.catalog.categories);
    const brands = useSelector(state => state.catalog.brands);
    const limits = useSelector(state => state.shop.limits);
    const isSuspended = useSelector(state => state.shop.shop?.status === 'suspended');

    const PAGE_SIZE = 10;
    const [productPage, setProductPage] = useState(1);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formError, setFormError] = useState('');

    const [productForm, setProductForm] = useState({
        name: '',
        price: '',
        stock_quantity: '10',
        stock_unit: 'pcs',
        category_id: categories[0]?.id || '',
        brand_id: '',
        status: 'published',
        imageFiles: []
    });

    const [existingProductImages, setExistingProductImages] = useState([]);
    const [deleteImageIds, setDeleteImageIds] = useState([]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [preset, setPreset] = useState('all');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);

    // Applied filter states
    const [appliedQuery, setAppliedQuery] = useState('');
    const [appliedStart, setAppliedStart] = useState('');
    const [appliedEnd, setAppliedEnd] = useState('');
    const [appliedCategories, setAppliedCategories] = useState([]);
    const [appliedBrands, setAppliedBrands] = useState([]);

    useEffect(() => {
        if (categories && categories.length > 0 && !productForm.category_id) {
            setProductForm(f => ({ ...f, category_id: categories[0].id }));
        }
    }, [categories]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setAppliedQuery(searchQuery);
        setAppliedStart(startDate);
        setAppliedEnd(endDate);
        setAppliedCategories(selectedCategories);
        setAppliedBrands(selectedBrands);
        setProductPage(1);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setPreset('all');
        setSelectedCategories([]);
        setSelectedBrands([]);
        setAppliedQuery('');
        setAppliedStart('');
        setAppliedEnd('');
        setAppliedCategories([]);
        setAppliedBrands([]);
        setProductPage(1);
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        const headers = getHeaders();
        const isEditing = !!editingProduct;
        const url = isEditing 
            ? `/api/v1/tenant/products/${editingProduct.id}` 
            : '/api/v1/tenant/products';

        const formData = new FormData();
        formData.append('name', productForm.name);
        formData.append('price', productForm.price);
        formData.append('stock_quantity', productForm.stock_quantity);
        formData.append('stock_unit', productForm.stock_unit);
        formData.append('category_id', productForm.category_id);
        formData.append('brand_id', productForm.brand_id);
        formData.append('status', productForm.status);

        if (isEditing) {
            formData.append('_method', 'PUT');
            deleteImageIds.forEach(id => {
                formData.append('delete_image_ids[]', id);
            });
        }

        if (productForm.imageFiles && productForm.imageFiles.length > 0) {
            productForm.imageFiles.forEach(file => {
                formData.append('images[]', file);
            });
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
                dispatch(showToast({ message: isEditing ? 'Product details updated' : 'Product onboarded', isError: false }));
                setShowProductModal(false);
                setEditingProduct(null);
                setProductForm({
                    name: '',
                    price: '',
                    stock_quantity: '10',
                    stock_unit: 'pcs',
                    category_id: categories[0]?.id || '',
                    brand_id: '',
                    status: 'published',
                    imageFiles: []
                });
                setExistingProductImages([]);
                setDeleteImageIds([]);
                dispatch(fetchCatalogData());
                dispatch(fetchState());
            } else {
                setFormError(data.message || 'An error occurred');
            }
        } catch (err) {
            setFormError('Failed to process product');
        }
    };

    const deleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/products/${id}`, {
                method: 'DELETE',
                headers
            });
            const data = await response.json();
            if (data.success) {
                dispatch(showToast({ message: 'Product deleted', isError: false }));
                dispatch(fetchCatalogData());
                dispatch(fetchState());
            } else {
                dispatch(showToast({ message: data.message || 'Failed to delete product', isError: true }));
            }
        } catch (e) {
            dispatch(showToast({ message: 'Failed to delete product', isError: true }));
        }
    };

    return (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: colors.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: colors.text }}>Shop Products</h3>
                {!isSuspended && hasPermission('products.create') && (
                    <button 
                        onClick={() => {
                            setEditingProduct(null);
                            setProductForm({
                                name: '',
                                price: '',
                                stock_quantity: '10',
                                stock_unit: 'pcs',
                                category_id: categories[0]?.id || '',
                                brand_id: '',
                                status: 'published',
                                imageFiles: []
                            });
                            setExistingProductImages([]);
                            setDeleteImageIds([]);
                            setFormError('');
                            setShowProductModal(true);
                        }}
                        style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Add Product
                    </button>
                )}
            </div>

            {/* Product Modal Form */}
            {showProductModal && (
                <div style={{ background: colors.cardBg, padding: '1.5rem', borderRadius: '10px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontWeight: '600', color: colors.text }}>{editingProduct ? 'Edit Product Details' : 'Onboard New Product'}</h4>
                    {formError && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                            {formError}
                        </div>
                    )}
                    <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <SearchableSelect 
                                label="Category"
                                value={productForm.category_id}
                                options={categories.map(c => ({ id: c.id, name: c.name + (is_null(c.shop_id) ? ' (Global)' : '') }))}
                                onChange={id => setProductForm({ ...productForm, category_id: id, brand_id: '' })}
                                placeholder="Search & select category..."
                                required={true}
                            />
                            <SearchableSelect 
                                label="Brand (Optional)"
                                value={productForm.brand_id}
                                options={[{ id: '', name: 'None / No Brand' }, ...brands.filter(b => b.category_id === productForm.category_id).map(b => ({ id: b.id, name: b.name }))] }
                                onChange={id => setProductForm({ ...productForm, brand_id: id })}
                                placeholder="Search & select brand..."
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>Product Name</label>
                                <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>Retail Price</label>
                                <input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>Stock Quantity</label>
                                <input type="number" value={productForm.stock_quantity} onChange={e => setProductForm({ ...productForm, stock_quantity: e.target.value })} required style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>Stock Unit</label>
                                <input type="text" value={productForm.stock_unit} onChange={e => setProductForm({ ...productForm, stock_unit: e.target.value })} style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>Upload Product Images</label>
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={e => setProductForm({ ...productForm, imageFiles: Array.from(e.target.files) })}
                                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem', borderRadius: '6px' }}
                            />
                        </div>

                        {existingProductImages.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: colors.textMuted }}>Active Images (Click to delete):</label>
                                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                    {existingProductImages.map(img => {
                                        const isDeleted = deleteImageIds.includes(img.id);
                                        return (
                                            <div 
                                                key={img.id}
                                                onClick={() => {
                                                    if (isDeleted) {
                                                        setDeleteImageIds(deleteImageIds.filter(id => id !== img.id));
                                                    } else {
                                                        setDeleteImageIds([...deleteImageIds, img.id]);
                                                    }
                                                }}
                                                style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', cursor: 'pointer', border: isDeleted ? '2px solid #ef4444' : `1px solid ${colors.border}`, overflow: 'hidden', opacity: isDeleted ? 0.35 : 1 }}
                                            >
                                                <img src={img.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                {isDeleted && <span style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.4)', color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem' }}>DEL</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                Save Product
                            </button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setShowProductModal(false);
                                    setEditingProduct(null);
                                }} 
                                style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                            >
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

                <SearchableMultiSelect 
                    label="Filter Categories"
                    placeholder="All Categories"
                    options={categories.map(c => ({ id: c.id, name: c.name + (is_null(c.shop_id) ? ' (Global)' : '') }))}
                    selectedValues={selectedCategories}
                    onChange={setSelectedCategories}
                />

                <SearchableMultiSelect 
                    label="Filter Brands"
                    placeholder="All Brands"
                    options={brands.map(b => ({ id: b.id, name: b.name }))}
                    selectedValues={selectedBrands}
                    onChange={setSelectedBrands}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 2, minWidth: '220px' }}>
                    <label style={{ fontSize: '0.8rem', color: colors.textMuted }}>Search Name / Category / Brand</label>
                    <input
                        type="text"
                        placeholder="Type keyword to search..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem 1rem', borderRadius: '8px', outline: 'none', fontSize: '0.9rem' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', height: '38px', alignItems: 'center' }}>
                    <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0 1.5rem', height: '38px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                        Search
                    </button>
                    {(appliedQuery || appliedStart || appliedEnd || appliedCategories.length > 0 || appliedBrands.length > 0) && (
                        <button type="button" onClick={handleClearFilters} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0 1.5rem', height: '38px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                            Clear
                        </button>
                    )}
                </div>
            </form>

            <div style={{ overflowX: 'auto' }}>
                {(() => {
                    const filtered = products.filter(p => {
                        const textMatches = appliedQuery === '' || 
                            p.name.toLowerCase().includes(appliedQuery.toLowerCase()) ||
                            (p.category?.name || '').toLowerCase().includes(appliedQuery.toLowerCase()) ||
                            (p.brand?.name || '').toLowerCase().includes(appliedQuery.toLowerCase());

                        let dateMatches = true;
                        if (appliedStart || appliedEnd) {
                            const createdAt = new Date(p.created_at);
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
                            appliedCategories.includes(p.category_id);

                        const brandMatches = appliedBrands.length === 0 || 
                            appliedBrands.includes(p.brand_id);

                        return textMatches && dateMatches && categoryMatches && brandMatches;
                    });

                    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
                    const safePage = Math.min(productPage, totalPages);
                    const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                    return (
                        <>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Image</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Product Name</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Category</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Brand</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Price</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Stock</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: `2px solid ${colors.border}`, color: colors.tableHeaderColor }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>{appliedQuery || appliedStart || appliedEnd || appliedCategories.length > 0 || appliedBrands.length > 0 ? 'No products match your search.' : 'No products registered.'}</td>
                                        </tr>
                                    ) : (
                                        pageItems.map(p => (
                                            <tr key={p.id} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                                                <td style={{ padding: '0.8rem' }}>
                                                    {p.images && p.images.length > 0 ? (
                                                        <img src={p.images[0].image_url} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: colors.textMuted, fontSize: '0.7rem' }}>N/A</div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.8rem', fontWeight: '600', color: colors.text }}>{p.name}</td>
                                                <td>
                                                    <span style={{ fontSize: '0.8rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                                                        {p.category ? p.category.name : 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td style={{ color: colors.text }}>{p.brand ? p.brand.name : '—'}</td>
                                                <td style={{ padding: '0.8rem', color: isDark ? '#10b981' : '#059669', fontWeight: '600' }}>{cur.format(p.price)}</td>
                                                <td style={{ padding: '0.8rem', color: colors.text }}>{parseFloat(p.stock_quantity)} {p.stock_unit || 'pcs'}</td>
                                                <td style={{ padding: '0.8rem' }}>
                                                    {!isSuspended && (
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            {hasPermission('products.edit') && (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingProduct(p);
                                                                        setProductForm({
                                                                            name: p.name,
                                                                            price: p.price,
                                                                            stock_quantity: p.stock_quantity.toString(),
                                                                            stock_unit: p.stock_unit || 'pcs',
                                                                            category_id: p.category_id,
                                                                            brand_id: p.brand_id || '',
                                                                            status: p.status,
                                                                            imageFiles: []
                                                                        });
                                                                        setExistingProductImages(p.images || []);
                                                                        setDeleteImageIds([]);
                                                                        setFormError('');
                                                                        setShowProductModal(true);
                                                                    }}
                                                                    style={{ background: 'transparent', border: '1px solid #6366f1', color: '#6366f1', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                                                                >
                                                                    Edit
                                                                </button>
                                                            )}
                                                            {hasPermission('products.destroy') && (
                                                                <button
                                                                    onClick={() => deleteProduct(p.id)}
                                                                    style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
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
                                    <span style={{ fontSize: '0.82rem', color: colors.textMuted }}>Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} products</span>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button onClick={() => setProductPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={{ background: safePage === 1 ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') : 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: safePage === 1 ? '#6b7280' : '#6366f1', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: safePage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>← Prev</button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                            <button key={pg} onClick={() => setProductPage(pg)} style={{ background: pg === safePage ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'), border: '1px solid rgba(99,102,241,0.3)', color: pg === safePage ? '#fff' : colors.textMuted, padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: pg === safePage ? '700' : '400' }}>{pg}</button>
                                        ))}
                                        <button onClick={() => setProductPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ background: safePage === totalPages ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') : 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: safePage === totalPages ? '#6b7280' : '#6366f1', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>Next →</button>
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
