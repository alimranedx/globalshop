import React, { useState } from 'react';
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

// Searchable Multiselect Component for Filtering with "Select All" Option
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

export default function ProductsPage({
    products,
    categories,
    brands,
    isSuspended,
    showProductModal,
    setShowProductModal,
    editingProduct,
    setEditingProduct,
    productForm,
    setProductForm,
    formError,
    setFormError,
    handleProductSubmit,
    deleteProduct,
    existingProductImages,
    setExistingProductImages,
    deleteImageIds,
    setDeleteImageIds,
    productSearch,
    setProductSearch,
    productPage,
    setProductPage,
    PAGE_SIZE,
    limits
}) {
    // Local filter states
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

    const handleCategoriesFilterChange = (newCats) => {
        setSelectedCategories(newCats);
        if (newCats.length > 0) {
            const allowedBrandIds = brands.filter(b => newCats.includes(b.category_id)).map(b => b.id);
            setSelectedBrands(prev => prev.filter(id => allowedBrandIds.includes(id)));
        }
    };

    return (
        <div style={{ background: 'rgba(20, 20, 25, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Shop Products</h3>
                {!isSuspended && (
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
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontWeight: '600' }}>{editingProduct ? 'Edit Product Details' : 'Onboard New Product'}</h4>
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
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Product Name</label>
                                <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Price ($)</label>
                                <input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Stock Quantity</label>
                                <input type="number" step="any" value={productForm.stock_quantity} onChange={e => setProductForm({ ...productForm, stock_quantity: e.target.value })} required style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Stock Unit</label>
                                <select value={productForm.stock_unit} onChange={e => setProductForm({ ...productForm, stock_unit: e.target.value })} style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '0.6rem', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}>
                                    <option value="pcs">piece (pcs)</option>
                                    <option value="kg">kilogram (kg)</option>
                                    <option value="ltr">litre (ltr)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Status</label>
                                <select value={productForm.status} onChange={e => setProductForm({ ...productForm, status: e.target.value })} style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '0.6rem', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}>
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            {/* Product Image uploads section */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: 'span 2' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Upload Product Images (Max {limits?.max_images_per_product || 2} images allowed)</label>
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*" 
                                    onChange={e => setProductForm({ ...productForm, imageFiles: Array.from(e.target.files) })} 
                                    style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '0.6rem', borderRadius: '6px' }} 
                                />
                                
                                {/* Previews */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    {existingProductImages.map(img => {
                                        const isDeleted = deleteImageIds.includes(img.id);
                                        return (
                                            <div key={img.id} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', opacity: isDeleted ? 0.3 : 1 }}>
                                                <img src={img.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        if (isDeleted) {
                                                            setDeleteImageIds(deleteImageIds.filter(id => id !== img.id));
                                                        } else {
                                                            setDeleteImageIds([...deleteImageIds, img.id]);
                                                        }
                                                    }}
                                                    style={{ position: 'absolute', top: 2, right: 2, background: isDeleted ? '#10b981' : '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.6rem', padding: '0.15rem 0.3rem' }}
                                                >
                                                    {isDeleted ? 'Keep' : 'Del'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {productForm.imageFiles.map((file, i) => (
                                        <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', border: '1px solid #6366f1', overflow: 'hidden' }}>
                                            <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <span style={{ position: 'absolute', bottom: 2, left: 2, fontSize: '0.55rem', background: '#6366f1', color: '#fff', padding: '0.1rem 0.2rem', borderRadius: '2px' }}>New</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                Save Product
                            </button>
                            <button type="button" onClick={() => setShowProductModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter Search Form with Date Range, Searchable MultiSelect categories and brands */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 2, minWidth: '220px' }}>
                        <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Search Name / Category / Brand</label>
                        <input
                            type="text"
                            placeholder="Type keyword to search..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ background: 'rgba(30,30,38,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.55rem 1rem', borderRadius: '8px', outline: 'none', fontSize: '0.9rem' }}
                        />
                    </div>
                    
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
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <SearchableMultiSelect 
                        label="Filter Categories (Multiselect)"
                        placeholder="All Categories"
                        options={categories.map(c => ({ id: c.id, name: c.name + (is_null(c.shop_id) ? ' (Global)' : '') }))}
                        selectedValues={selectedCategories}
                        onChange={handleCategoriesFilterChange}
                    />

                    <SearchableMultiSelect 
                        label="Filter Brands (Multiselect)"
                        placeholder="All Brands"
                        options={brands.filter(b => selectedCategories.length === 0 || selectedCategories.includes(b.category_id)).map(b => ({ id: b.id, name: b.name }))}
                        selectedValues={selectedBrands}
                        onChange={setSelectedBrands}
                    />

                    <div style={{ display: 'flex', gap: '0.5rem', height: '38px', marginTop: '0.3rem' }}>
                        <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                            Search
                        </button>
                        {(appliedQuery || appliedStart || appliedEnd || appliedCategories.length > 0 || appliedBrands.length > 0) && (
                            <button type="button" onClick={handleClearFilters} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                Clear
                            </button>
                        )}
                    </div>
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
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Image</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Product Name</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Category</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Brand</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Price</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Stock</th>
                                        <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>{appliedQuery || appliedStart || appliedEnd || appliedCategories.length > 0 || appliedBrands.length > 0 ? 'No products match your search.' : 'No products registered.'}</td>
                                        </tr>
                                    ) : (
                                        pageItems.map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                <td style={{ padding: '0.8rem' }}>
                                                    {p.images && p.images.length > 0 ? (
                                                        <img src={p.images[0].image_url} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9ca3af', fontSize: '0.7rem' }}>N/A</div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.8rem', fontWeight: '600' }}>{p.name}</td>
                                                <td>
                                                    <span style={{ fontSize: '0.8rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                                                        {p.category ? p.category.name : 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td>{p.brand ? p.brand.name : '—'}</td>
                                                <td style={{ padding: '0.8rem', color: '#10b981', fontWeight: '600' }}>${parseFloat(p.price).toFixed(2)}</td>
                                                <td style={{ padding: '0.8rem' }}>{parseFloat(p.stock_quantity)} {p.stock_unit || 'pcs'}</td>
                                                <td style={{ padding: '0.8rem' }}>
                                                    {!isSuspended && (
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                                                            <button
                                                                onClick={() => deleteProduct(p.id)}
                                                                style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                                                            >
                                                                Delete
                                                            </button>
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
                                    <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} products</span>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button onClick={() => setProductPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={{ background: safePage === 1 ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: safePage === 1 ? '#6b7280' : '#6366f1', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: safePage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>← Prev</button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                            <button key={pg} onClick={() => setProductPage(pg)} style={{ background: pg === safePage ? '#6366f1' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.3)', color: pg === safePage ? '#fff' : '#9ca3af', padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: pg === safePage ? '700' : '400' }}>{pg}</button>
                                        ))}
                                        <button onClick={() => setProductPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ background: safePage === totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: safePage === totalPages ? '#6b7280' : '#6366f1', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>Next →</button>
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
