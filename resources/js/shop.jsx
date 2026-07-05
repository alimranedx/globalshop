import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';

import CategoriesPage from './components/CategoriesPage';
import BrandsPage from './components/BrandsPage';
import ProductsPage from './components/ProductsPage';
import CatalogRedirect from './components/CatalogRedirect';
import CatalogNav from './components/CatalogNav';

function ShopManagerApp() {
    const navigate = useNavigate();
    const location = useLocation();

    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentUserEmail, setCurrentUserEmail] = useState('');
    
    useEffect(() => {
        if (location.pathname.startsWith('/catalog-hub')) {
            setActiveTab('catalog');
        } else if (location.pathname === '/matrix') {
            setActiveTab('matrix');
        } else if (location.pathname === '/staff') {
            setActiveTab('staff');
        } else if (location.pathname === '/settings') {
            setActiveTab('settings');
        } else if (location.pathname === '/logs') {
            setActiveTab('logs');
        } else {
            setActiveTab('dashboard');
        }
    }, [location.pathname]);
    const [shopId, setShopId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', isError: false });

    // Data lists
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [shopRoles, setShopRoles] = useState([]);
    
    // Modals & form state
    const [showProductModal, setShowProductModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showBrandModal, setShowBrandModal] = useState(false);

    const [editingProduct, setEditingProduct] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingBrand, setEditingBrand] = useState(null);

    // Form inputs states
    const [productForm, setProductForm] = useState({ name: '', price: '', stock_quantity: '10', stock_unit: 'pcs', category_id: '', brand_id: '', status: 'published', imageFiles: [] });
    const [categoryForm, setCategoryForm] = useState({ name: '', logoFile: null });
    const [brandForm, setBrandForm] = useState({ name: '', logoFile: null });

    // Image upload track states
    const [existingProductImages, setExistingProductImages] = useState([]);
    const [deleteImageIds, setDeleteImageIds] = useState([]);

    const [formError, setFormError] = useState('');

    // Search & Pagination states
    const PAGE_SIZE = 10;
    const [productSearch, setProductSearch] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [brandSearch, setBrandSearch] = useState('');
    const [productPage, setProductPage] = useState(1);
    const [categoryPage, setCategoryPage] = useState(1);
    const [brandPage, setBrandPage] = useState(1);

    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const showMessage = (msg, isErr = false) => {
        setToast({ show: true, message: msg, isError: isErr });
        setTimeout(() => setToast({ show: false, message: '', isError: false }), 4000);
    };

    useEffect(() => {
        fetchState();
    }, [currentUserEmail]);

    useEffect(() => {
        if (shopId) {
            fetchCatalogData(shopId);
        }
    }, [shopId]);

    const getHeaders = () => {
        const headers = {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': token,
            'X-Tenant-ID': shopId || ''
        };
        if (currentUserEmail) {
            headers['Authorization'] = 'Bearer ' + currentUserEmail;
        }
        return headers;
    };

    const fetchState = async () => {
        setLoading(true);
        try {
            const headers = getHeaders();
            const response = await fetch('/demo/state', { headers: { ...headers, 'Content-Type': 'application/json' } });
            const data = await response.json();
            setState(data);
            if (data.shop) {
                setShopId(data.shop.id);
            }
            if (data.user && !currentUserEmail) {
                setCurrentUserEmail(data.user.email);
            }
        } catch (e) {
            showMessage('Failed to load state', true);
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalogData = async (currentShopId) => {
        const id = currentShopId || shopId;
        const headers = {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': token,
            'X-Tenant-ID': id || '',
            ...(currentUserEmail ? { 'Authorization': 'Bearer ' + currentUserEmail } : {})
        };
        try {
            // Fetch Products
            const resProd = await fetch('/api/v1/tenant/products', { headers });
            const dataProd = await resProd.json();
            if (dataProd.success) setProducts(dataProd.data);

            // Fetch Categories
            const resCat = await fetch('/api/v1/tenant/categories', { headers });
            const dataCat = await resCat.json();
            if (dataCat.success) setCategories(dataCat.data);

            // Fetch Brands
            const resBrand = await fetch('/api/v1/tenant/brands', { headers });
            const dataBrand = await resBrand.json();
            if (dataBrand.success) setBrands(dataBrand.data);

            // Fetch Employees
            const resEmp = await fetch('/api/v1/tenant/employees', { headers });
            if (resEmp.status === 200) {
                const dataEmp = await resEmp.json();
                if (dataEmp.success) {
                    setEmployees(dataEmp.data);
                    setShopRoles(dataEmp.roles || []);
                }
            } else {
                setEmployees([]);
                setShopRoles([]);
            }
        } catch (e) {
            showMessage('Failed to fetch catalog lists', true);
        }
    };

    const handleLogin = async (email) => {
        if (!email) {
            setCurrentUserEmail('');
            setShopId(null);
            setProducts([]);
            setCategories([]);
            setBrands([]);
            try {
                await fetch('/logout');
            } catch (e) {}
            showMessage('Logged out. Browsing as Guest.');
            fetchState();
            return;
        }

        try {
            const response = await fetch('/demo/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify({ email: email })
            });
            const res = await response.json();
            if (res.success) {
                setCurrentUserEmail(email);
                showMessage(`Logged in as ${res.user.name}`);
            } else {
                showMessage(res.message, true);
            }
        } catch (error) {
            showMessage('Login failed', true);
        }
    };

    // Product CRUD
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        const headers = getHeaders();
        const isEditing = !!editingProduct;
        const url = isEditing 
            ? `/api/v1/tenant/products/${editingProduct.id}` 
            : '/api/v1/tenant/products';

        // Prepare multipart form data for uploading files
        const formData = new FormData();
        formData.append('category_id', productForm.category_id);
        formData.append('brand_id', productForm.brand_id || '');
        formData.append('name', productForm.name);
        formData.append('price', productForm.price);
        formData.append('stock_quantity', productForm.stock_quantity);
        formData.append('stock_unit', productForm.stock_unit);
        formData.append('status', productForm.status);

        // Append new images
        productForm.imageFiles.forEach(file => {
            formData.append('images[]', file);
        });

        // Append deletion list
        deleteImageIds.forEach(id => {
            formData.append('delete_image_ids[]', id);
        });

        if (isEditing) {
            formData.append('_method', 'PUT'); // Method spoofing for Laravel PUT
        }

        try {
            const response = await fetch(url, {
                method: 'POST', // Always POST for file upload payload
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
                showMessage(isEditing ? 'Product updated' : 'Product added');
                setShowProductModal(false);
                setEditingProduct(null);
                setProductForm({ name: '', price: '', stock_quantity: '10', stock_unit: 'pcs', category_id: '', brand_id: '', status: 'published', imageFiles: [] });
                setExistingProductImages([]);
                setDeleteImageIds([]);
                fetchCatalogData();
                fetchState(); // refresh quota limits
            } else {
                setFormError(data.message || 'An error occurred');
            }
        } catch (err) {
            setFormError('Failed to process request');
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
                showMessage('Product deleted');
                fetchCatalogData();
                fetchState();
            } else {
                showMessage(data.message || 'Failed to delete product', true);
            }
        } catch (e) {
            showMessage('Failed to delete product', true);
        }
    };

    // Category CRUD
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
                showMessage(isEditing ? 'Category updated' : 'Category added');
                setShowCategoryModal(false);
                setEditingCategory(null);
                setCategoryForm({ name: '', logoFile: null });
                fetchCatalogData();
            } else {
                setFormError(data.message || 'An error occurred');
            }
        } catch (err) {
            setFormError('Failed to process request');
        }
    };

    const deleteCategory = async (id) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/categories/${id}`, {
                method: 'DELETE',
                headers
            });
            const data = await response.json();
            if (data.success) {
                showMessage('Category deleted');
                fetchCatalogData();
            } else {
                showMessage(data.message || 'Failed to delete category', true);
            }
        } catch (e) {
            showMessage('Failed to delete category', true);
        }
    };

    // Brand CRUD
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
        if (brandForm.category_id) {
            formData.append('category_id', brandForm.category_id);
        }
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
                showMessage(isEditing ? 'Brand updated' : 'Brand added');
                setShowBrandModal(false);
                setEditingBrand(null);
                setBrandForm({ name: '', logoFile: null });
                fetchCatalogData();
            } else {
                setFormError(data.message || 'An error occurred');
            }
        } catch (err) {
            setFormError('Failed to process request');
        }
    };

    const deleteBrand = async (id) => {
        if (!confirm('Are you sure you want to delete this brand?')) return;
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/brands/${id}`, {
                method: 'DELETE',
                headers
            });
            const data = await response.json();
            if (data.success) {
                showMessage('Brand deleted');
                fetchCatalogData();
            } else {
                showMessage(data.message || 'Failed to delete brand', true);
            }
        } catch (e) {
            showMessage('Failed to delete brand', true);
        }
    };

    // Employee CRUD actions
    const handleAddEmployee = async (name, email, password, roleId) => {
        const headers = getHeaders();
        try {
            const response = await fetch('/api/v1/tenant/employees', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role_id: roleId })
            });
            const data = await response.json();
            if (data.success) {
                showMessage('Employee added successfully');
                fetchCatalogData();
                fetchState();
                return { success: true };
            } else {
                showMessage(data.message || 'Failed to add employee', true);
                return { success: false, error: data.message };
            }
        } catch (e) {
            showMessage('Failed to add employee', true);
            return { success: false, error: 'Network error' };
        }
    };

    const handleUpdateEmployee = async (employeeId, roleId) => {
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/employees/${employeeId}`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ role_id: roleId })
            });
            const data = await response.json();
            if (data.success) {
                showMessage('Employee role updated');
                fetchCatalogData();
                fetchState();
                return { success: true };
            } else {
                showMessage(data.message || 'Failed to update employee', true);
                return { success: false, error: data.message };
            }
        } catch (e) {
            showMessage('Failed to update employee', true);
            return { success: false, error: 'Network error' };
        }
    };

    const handleDeleteEmployee = async (employeeId) => {
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/employees/${employeeId}`, {
                method: 'DELETE',
                headers
            });
            const data = await response.json();
            if (data.success) {
                showMessage('Employee removed');
                fetchCatalogData();
                fetchState();
            } else {
                showMessage(data.message || 'Failed to remove employee', true);
            }
        } catch (e) {
            showMessage('Failed to remove employee', true);
        }
    };

    // Matrix Perms Sync
    const saveRolePermissions = async (pages) => {
        const headers = getHeaders();
        try {
            const response = await fetch('/demo/permissions', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ pages })
            });
            const res = await response.json();
            if (res.success) {
                showMessage('Manager permissions saved');
                fetchState();
            } else {
                showMessage(res.message || 'Failed to save permissions', true);
            }
        } catch (e) {
            showMessage('Failed to save permissions', true);
        }
    };

    if (loading && !state) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ fontSize: '1.2rem', color: '#9ca3af' }}>Loading workspace state...</div>
            </div>
        );
    }

    const user = state?.user;
    const shop = state?.shop;
    const limits = state?.limits;
    const managerPerms = state?.manager_permissions || [];
    const permissionsConfig = state?.permissions_config || {};

    const isSuspended = shop?.status === 'suspended';
    const isPending = shop?.status === 'pending';
    const isRestricted = isSuspended || isPending;
    const isOwnerOrSuper = user && (user.role === 'Owner' || user.role === 'Super Admin');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Top Swapper */}
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', borderBottom: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.6rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span>⚙️ <strong>SaaS Shop Panel Simulator (React JS)</strong></span>
                <div>
                    <span>Active User Context: </span>
                    <select 
                        value={currentUserEmail} 
                        onChange={(e) => handleLogin(e.target.value)}
                        style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', outline: 'none' }}
                    >
                        <option value="john@alpha.com">John Owner (Owner)</option>
                        <option value="bob@alpha.com">Bob Manager (Manager)</option>
                        <option value="charlie@alpha.com">Charlie Worker (Worker)</option>
                        <option value="alice@customer.com">Alice Customer (Customer)</option>
                        <option value="">Guest (Public)</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', flexGrow: 1 }}>
                {/* Sidebar */}
                <aside style={{ background: 'rgba(15, 15, 20, 0.85)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255, 255, 255, 0.08)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>
                            🏢 {shop ? shop.name : 'No Shop Scope'}
                        </div>
                        {shop && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: isSuspended ? '#ef4444' : '#10b981', fontWeight: '600' }}>
                                    ● {shop.status}
                                </span>
                            </div>
                        )}
                    </div>

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                            { id: 'dashboard', label: '📊 Dashboard' },
                            { id: 'catalog', label: '🗂️ Catalog Hub' },
                            { id: 'matrix', label: '🔒 Permissions Matrix' },
                            { id: 'staff', label: '👥 Staff Directory' },
                            { id: 'settings', label: '⚙️ Shop Settings' },
                            { id: 'logs', label: '📜 Activity Logs' }
                        ].map(tab => (
                            /* Deprecated catalog UI removed, now using React Router routes */
                            <li key={tab.id}>
                                <button 
                                    onClick={() => {
                                        if (tab.id === 'catalog') {
                                            navigate('/catalog-hub/categories');
                                        } else {
                                            navigate(`/${tab.id}`);
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)' : 'transparent',
                                        border: activeTab === tab.id ? '1px solid #6366f1' : '1px solid transparent',
                                        color: activeTab === tab.id ? '#fff' : '#9ca3af',
                                        padding: '0.8rem 1rem',
                                        textAlign: 'left',
                                        fontSize: '0.95rem',
                                        fontWeight: '500',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: activeTab === tab.id ? '0 0 10px rgba(99, 102, 241, 0.15)' : 'none'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Content */}
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    {/* Top Bar */}
                    <div style={{ background: 'rgba(15, 15, 20, 0.4)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '1rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                            {activeTab === 'catalog' ? '🗂️ Catalog Hub' : activeTab.toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {user && (
                                <>
                                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: '600', textTransform: 'uppercase', background: '#6366f1', color: '#fff' }}>
                                        {user.role}
                                    </span>
                                    <span style={{ fontWeight: '500' }}>{user.name}</span>
                                </>
                            )}
                            <button onClick={() => window.location.href='/'} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                Exit Panel
                            </button>
                        </div>
                    </div>

                    {/* View panels using React Router */}
                    <main style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
                        {isSuspended && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem 1.5rem', borderRadius: '10px', fontWeight: '600' }}>
                                ⚠️ This shop has been suspended by the platform administrator. Features are restricted.
                            </div>
                        )}

                        {isPending && (
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '1rem 1.5rem', borderRadius: '10px', fontWeight: '600' }}>
                                ⚠️ This shop is pending administrator approval. Features are restricted.
                            </div>
                        )}

                        {location.pathname.startsWith('/catalog-hub') && <CatalogNav />}

                        <Routes>
                            <Route path="/" element={<DashboardView products={products} categories={categories} brands={brands} limits={limits} />} />
                            <Route path="/dashboard" element={<DashboardView products={products} categories={categories} brands={brands} limits={limits} />} />
                            
                            <Route path="/catalog-hub/categories" element={
                                <CategoriesPage
                                    categories={categories}
                                    isSuspended={isRestricted}
                                    showCategoryModal={showCategoryModal}
                                    setShowCategoryModal={setShowCategoryModal}
                                    editingCategory={editingCategory}
                                    setEditingCategory={setEditingCategory}
                                    categoryForm={categoryForm}
                                    setCategoryForm={setCategoryForm}
                                    formError={formError}
                                    setFormError={setFormError}
                                    handleCategorySubmit={handleCategorySubmit}
                                    deleteCategory={deleteCategory}
                                    categorySearch={categorySearch}
                                    setCategorySearch={setCategorySearch}
                                    categoryPage={categoryPage}
                                    setCategoryPage={setCategoryPage}
                                    PAGE_SIZE={PAGE_SIZE}
                                />
                            } />
                            <Route path="/catalog-hub/brands" element={
                                <BrandsPage
                                    brands={brands}
                                    categories={categories}
                                    isSuspended={isRestricted}
                                    showBrandModal={showBrandModal}
                                    setShowBrandModal={setShowBrandModal}
                                    editingBrand={editingBrand}
                                    setEditingBrand={setEditingBrand}
                                    brandForm={brandForm}
                                    setBrandForm={setBrandForm}
                                    formError={formError}
                                    setFormError={setFormError}
                                    handleBrandSubmit={handleBrandSubmit}
                                    deleteBrand={deleteBrand}
                                    brandSearch={brandSearch}
                                    setBrandSearch={setBrandSearch}
                                    brandPage={brandPage}
                                    setBrandPage={setBrandPage}
                                    PAGE_SIZE={PAGE_SIZE}
                                />
                            } />
                            <Route path="/catalog-hub/products" element={
                                <ProductsPage
                                    products={products}
                                    categories={categories}
                                    brands={brands}
                                    isSuspended={isRestricted}
                                    showProductModal={showProductModal}
                                    setShowProductModal={setShowProductModal}
                                    editingProduct={editingProduct}
                                    setEditingProduct={setEditingProduct}
                                    productForm={productForm}
                                    setProductForm={setProductForm}
                                    formError={formError}
                                    setFormError={setFormError}
                                    handleProductSubmit={handleProductSubmit}
                                    deleteProduct={deleteProduct}
                                    existingProductImages={existingProductImages}
                                    setExistingProductImages={setExistingProductImages}
                                    deleteImageIds={deleteImageIds}
                                    setDeleteImageIds={setDeleteImageIds}
                                    productSearch={productSearch}
                                    setProductSearch={setProductSearch}
                                    productPage={productPage}
                                    setProductPage={setProductPage}
                                    PAGE_SIZE={PAGE_SIZE}
                                />
                            } />
                            <Route path="/catalog-hub" element={<CatalogRedirect />} />
                            
                            <Route path="/matrix" element={
                                <MatrixView 
                                    permissionsConfig={permissionsConfig} 
                                    managerPerms={managerPerms} 
                                    isOwnerOrSuper={isOwnerOrSuper} 
                                    saveRolePermissions={saveRolePermissions} 
                                />
                            } />
                            <Route path="/staff" element={
                                <StaffView 
                                    employees={employees} 
                                    shopRoles={shopRoles} 
                                    onAddEmployee={handleAddEmployee} 
                                    onUpdateEmployee={handleUpdateEmployee} 
                                    onDeleteEmployee={handleDeleteEmployee}
                                    isOwner={user && user.role === 'Owner'}
                                    isSuspended={isRestricted}
                                />
                            } />
                            <Route path="/settings" element={<SettingsView shop={shop} />} />
                            <Route path="/logs" element={<LogsView state={state} />} />
                            <Route path="*" element={<DashboardView products={products} categories={categories} brands={brands} limits={limits} />} />
                        </Routes>
                    </main>
                </div>
            </div>

            {/* Toast Alert */}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                    background: toast.isError ? '#ef4444' : '#10b981',
                    color: '#fff',
                    zIndex: 1000,
                    animation: 'slideIn 0.3s ease'
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
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

// Utility function to check nulls
function is_null(val) {
    return val === null || val === undefined;
}

// Render root element
const rootEl = document.getElementById('shop-owner-root');
if (rootEl) {
    createRoot(rootEl).render(
        <BrowserRouter basename="/shop">
            <ShopManagerApp />
        </BrowserRouter>
    );
}

// 1. Dashboard View
function DashboardView({ products, categories, brands, limits }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Catalog Products</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700' }}>{products.length}</div>
                </div>
                <div style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Categories</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700' }}>{categories.length}</div>
                </div>
                <div style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Brands</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700' }}>{brands.length}</div>
                </div>
            </div>

            {limits && (
                <div style={{ background: 'rgba(20, 20, 25, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '2rem', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Subscription Limits Progress</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                                <span>Products Added ({products.length} / {limits.max_products})</span>
                                <span>{Math.min(100, Math.round((products.length / limits.max_products) * 100))}%</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, (products.length / limits.max_products) * 100)}%`, background: products.length >= limits.max_products ? '#ef4444' : '#6366f1', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// 2. Permissions Matrix View
function MatrixView({ permissionsConfig, managerPerms, isOwnerOrSuper, saveRolePermissions }) {
    return (
        <div style={{ background: 'rgba(20, 20, 25, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Manager Permissions Matrix</h3>
                {isOwnerOrSuper && (
                    <button 
                        onClick={() => {
                            const checked = Array.from(document.querySelectorAll('input[name="react-permissions[]"]:checked')).map(cb => cb.value);
                            saveRolePermissions(checked);
                        }}
                        style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Save Matrix
                    </button>
                )}
            </div>

            {!isOwnerOrSuper && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '0.8rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                    Read-only mode. Only Shop Owners or Platform Admins can synchronize staff permissions.
                </div>
            )}

            <div className="tree-container">
                {Object.keys(permissionsConfig).map(moduleKey => {
                    const mod = permissionsConfig[moduleKey];
                    return (
                        <div key={moduleKey} className="tree-module" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.06)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <div className="tree-module-header" style={{ display: 'flex', gap: '0.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                <span>📁 {mod.label}</span>
                            </div>
                            {Object.keys(mod.sub_modules).map(subKey => {
                                const sub = mod.sub_modules[subKey];
                                return (
                                    <div key={subKey} className="tree-submodule" style={{ marginLeft: '1.5rem', paddingLeft: '1rem', borderLeft: '1px dashed rgba(255,255,255,0.1)', marginBottom: '0.5rem' }}>
                                        <div className="tree-submodule-header" style={{ color: '#6366f1', fontWeight: '500', marginBottom: '0.3rem' }}>
                                            {sub.label}
                                        </div>
                                        <div className="tree-pages" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                            {Object.keys(sub.pages).map(pageKey => {
                                                const pageLabel = sub.pages[pageKey];
                                                const isChecked = managerPerms.includes(pageKey);
                                                return (
                                                    <label key={pageKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#9ca3af', cursor: isOwnerOrSuper ? 'pointer' : 'default' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            name="react-permissions[]"
                                                            value={pageKey} 
                                                            defaultChecked={isChecked}
                                                            disabled={!isOwnerOrSuper}
                                                        />
                                                        <span>{pageLabel} (<code>{pageKey}</code>)</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// 3. Staff Directory View
function StaffView({ employees, shopRoles, onAddEmployee, onUpdateEmployee, onDeleteEmployee, isOwner, isSuspended }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!roleId && shopRoles.length > 0) {
            setError('Please select a role');
            return;
        }
        const res = await onAddEmployee(name, email, password, roleId || shopRoles[0]?.id);
        if (res.success) {
            setName('');
            setEmail('');
            setPassword('');
            setRoleId('');
            setShowAddForm(false);
        } else {
            setError(res.error || 'Failed to add employee');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(20, 20, 25, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '2rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Employee Directory</h3>
                    {isOwner && !isSuspended && !showAddForm && (
                        <button 
                            onClick={() => {
                                setShowAddForm(true);
                                setRoleId(shopRoles[0]?.id || '');
                            }}
                            style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                        >
                            + Add Employee
                        </button>
                    )}
                </div>

                {showAddForm && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h4 style={{ fontWeight: '600', marginBottom: '1rem' }}>Invite New Employee</h4>
                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Full Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Email Address</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '0.6rem', borderRadius: '6px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Role Type</label>
                                <select value={roleId} onChange={e => setRoleId(e.target.value)} style={{ background: 'rgba(30, 30, 38, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '0.6rem', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}>
                                    {shopRoles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                    Save Employee
                                </button>
                                <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Email</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Role</th>
                                {isOwner && <th style={{ textAlign: 'right', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => {
                                const isOwnerRow = emp.role_name === 'Owner';
                                return (
                                    <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <td style={{ padding: '0.8rem', fontWeight: '600' }}>{emp.name}</td>
                                        <td style={{ padding: '0.8rem' }}><code>{emp.email}</code></td>
                                        <td style={{ padding: '0.8rem' }}>
                                            {isOwner && !isOwnerRow && !isSuspended ? (
                                                <select 
                                                    value={emp.role_id || ''} 
                                                    onChange={(e) => onUpdateEmployee(emp.id, e.target.value)}
                                                    style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.2rem 0.4rem', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
                                                >
                                                    {shopRoles.map(r => (
                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span style={{ 
                                                    fontSize: '0.75rem', 
                                                    padding: '0.2rem 0.5rem', 
                                                    borderRadius: '4px', 
                                                    background: isOwnerRow ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)', 
                                                    color: isOwnerRow ? '#10b981' : '#6366f1', 
                                                    fontWeight: '600' 
                                                }}>
                                                    {emp.role_name}
                                                </span>
                                            )}
                                        </td>
                                        {isOwner && (
                                            <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                                                {!isOwnerRow && !isSuspended && (
                                                    <button 
                                                        onClick={() => {
                                                            if (confirm(`Are you sure you want to remove employee ${emp.name}?`)) {
                                                                onDeleteEmployee(emp.id);
                                                            }
                                                        }}
                                                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// 4. Shop Settings View
function SettingsView({ shop }) {
    return (
        <div style={{ background: 'rgba(20, 20, 25, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '2rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>Shop Scope Details</h3>
            {shop && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
                    <div>Shop Name: <strong>{shop.name}</strong></div>
                    <div>Subdomain Slug: <code>{shop.slug}</code></div>
                    <div>Mock Domain: <code>{shop.domain || `${shop.slug}.globalshop.test`}</code></div>
                    <div>Tenant ULID ID: <code>{shop.id}</code></div>
                </div>
            )}
        </div>
    );
}

// 5. Activity Logs View
function LogsView({ state }) {
    return (
        <div style={{ background: 'rgba(20, 20, 25, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '2rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>Audit Trail Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {state?.activity_logs?.length === 0 ? (
                    <div style={{ color: '#9ca3af' }}>No logs recorded.</div>
                ) : (
                    state?.activity_logs?.map(log => {
                        const time = new Date(log.created_at).toLocaleTimeString();
                        return (
                            <div key={log.id} style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '0.2rem' }}>
                                    <span style={{ color: '#6366f1' }}>{log.action}</span>
                                    <span style={{ color: '#9ca3af' }}>{time}</span>
                                </div>
                                <div>{log.description}</div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
