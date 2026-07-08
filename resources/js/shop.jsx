import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';

import CategoriesPage from './components/CategoriesPage';
import BrandsPage from './components/BrandsPage';
import ProductsPage from './components/ProductsPage';
import CatalogRedirect from './components/CatalogRedirect';
import CatalogNav from './components/CatalogNav';
import SmartDateRangePicker from './components/SmartDateRangePicker';

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
        } else if (location.pathname.startsWith('/sales')) {
            setActiveTab('sales');
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
            if (response.status === 401) {
                setState({ authenticated: false, user: null });
                setCurrentUserEmail('');
                return;
            }
            const data = await response.json();
            setState(data);
            if (data.shop) {
                setShopId(data.shop.id);
            }
            if (data.user) {
                setCurrentUserEmail(data.user.email);
            } else {
                setCurrentUserEmail('');
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
                fetchState();
            } else {
                showMessage(res.message, true);
            }
        } catch (error) {
            showMessage('Login failed', true);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/v1/auth/logout', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token
                }
            });
            const res = await response.json();
            if (res.success) {
                setCurrentUserEmail('');
                setShopId(null);
                setProducts([]);
                setCategories([]);
                setBrands([]);
                showMessage('Logged out successfully.');
                fetchState();
            } else {
                showMessage(res.message || 'Logout failed.', true);
            }
        } catch (err) {
            setCurrentUserEmail('');
            setShopId(null);
            setProducts([]);
            setCategories([]);
            setBrands([]);
            fetchState();
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

    // Per-role permissions sync via REST API
    const saveRolePermissions = async (roleId, pages) => {
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/roles/${roleId}/permissions`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ pages })
            });
            const res = await response.json();
            if (res.success) {
                showMessage('Role permissions saved successfully!');
                fetchState();
            } else {
                showMessage(res.message || 'Failed to save permissions', true);
            }
        } catch (e) {
            showMessage('Failed to save permissions', true);
        }
    };

    // Load permissions tree for a specific role
    const loadRolePermissions = async (roleId) => {
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/roles/${roleId}/permissions`, {
                headers: { ...headers }
            });
            const res = await response.json();
            if (res.success) return res.data;
        } catch (e) {}
        return null;
    };

    const fetchRoles = async () => {
        const headers = getHeaders();
        try {
            const response = await fetch('/api/v1/tenant/roles', { headers });
            const data = await response.json();
            if (data.success) return data.data;
        } catch (e) {
            showMessage('Failed to fetch roles', true);
        }
        return [];
    };

    const createRole = async (name) => {
        const headers = getHeaders();
        try {
            const response = await fetch('/api/v1/tenant/roles', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            if (data.success) {
                showMessage(data.message || 'Role created successfully');
                return { success: true, data: data.data };
            } else {
                showMessage(data.message || 'Failed to create role', true);
                return { success: false, error: data.message };
            }
        } catch (e) {
            showMessage('Failed to create role', true);
            return { success: false, error: 'Network error' };
        }
    };

    const deleteRole = async (roleId) => {
        const headers = getHeaders();
        try {
            const response = await fetch(`/api/v1/tenant/roles/${roleId}`, {
                method: 'DELETE',
                headers
            });
            const data = await response.json();
            if (data.success) {
                showMessage(data.message || 'Role deleted successfully');
                return { success: true };
            } else {
                showMessage(data.message || 'Failed to delete role', true);
                return { success: false, error: data.message };
            }
        } catch (e) {
            showMessage('Failed to delete role', true);
            return { success: false, error: 'Network error' };
        }
    };

    if (loading && !state) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0c' }}>
                <div style={{ fontSize: '1.2rem', color: '#9ca3af', fontFamily: 'Outfit' }}>Loading workspace state...</div>
            </div>
        );
    }

    const user = state?.user;
    const shop = state?.shop;
    const limits = state?.limits;
    const managerPerms = state?.manager_permissions || [];
    const permissionsConfig = state?.permissions_config || {};
    const userPermissions = state?.user_permissions || [];
    const isAuthenticated = state?.authenticated;

    const hasPermission = (pageKey) => {
        if (!isAuthenticated || !user) return false;
        if (user.role === 'Owner' || user.role === 'Super Admin' || user.is_platform_admin) {
            return true;
        }
        return userPermissions.includes(pageKey);
    };

    if (!isAuthenticated) {
        return (
            <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #181824 0%, #0a0a0c 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Outfit', padding: '2rem' }}>
                <Routes>
                    <Route path="/register" element={<RegisterView fetchState={fetchState} showMessage={showMessage} token={token} />} />
                    <Route path="*" element={<LoginView fetchState={fetchState} showMessage={showMessage} handleQuickLogin={handleLogin} token={token} />} />
                </Routes>
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
                    }}>
                        {toast.message}
                    </div>
                )}
            </div>
        );
    }

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
                        <option value="sam@alpha.com">Sam Sales (Sales Manager)</option>
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
                            { id: 'dashboard', label: '📊 Dashboard', visible: true },
                            { id: 'catalog', label: '🗂️ Catalog Hub', visible: hasPermission('categories.index') || hasPermission('brands.index') || hasPermission('products.index') },
                            { id: 'sales', label: '💰 Sales Hub', visible: hasPermission('sales.index') || hasPermission('sales.create') },
                            { id: 'staff', label: '👥 Staff & Roles', visible: hasPermission('employees.index') || hasPermission('roles.index') },
                            { id: 'settings', label: '⚙️ Shop Settings', visible: hasPermission('settings.general') || hasPermission('settings.shop') || hasPermission('settings.subscription') },
                            { id: 'logs', label: '📜 Activity Logs', visible: user && (user.role === 'Owner' || user.role === 'Super Admin' || hasPermission('roles.index')) }
                        ].filter(tab => tab.visible).map(tab => (
                            <li key={tab.id}>
                                <button 
                                    onClick={() => {
                                        if (tab.id === 'catalog') {
                                            if (hasPermission('categories.index')) {
                                                navigate('/catalog-hub/categories');
                                            } else if (hasPermission('brands.index')) {
                                                navigate('/catalog-hub/brands');
                                            } else {
                                                navigate('/catalog-hub/products');
                                            }
                                        } else if (tab.id === 'sales') {
                                            if (hasPermission('sales.create')) {
                                                navigate('/sales/pos');
                                            } else {
                                                navigate('/sales/history');
                                            }
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
                                    <button 
                                        onClick={handleLogout}
                                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}
                                    >
                                        Log Out
                                    </button>
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

                        {location.pathname.startsWith('/catalog-hub') && <CatalogNav hasPermission={hasPermission} />}

                        <Routes>
                            <Route path="/" element={<DashboardView products={products} categories={categories} brands={brands} limits={limits} />} />
                            <Route path="/dashboard" element={<DashboardView products={products} categories={categories} brands={brands} limits={limits} />} />
                            
                            <Route path="/catalog-hub/categories" element={
                                hasPermission('categories.index') ? (
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
                                ) : <AccessDeniedView />
                            } />
                            <Route path="/catalog-hub/brands" element={
                                hasPermission('brands.index') ? (
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
                                ) : <AccessDeniedView />
                            } />
                            <Route path="/catalog-hub/products" element={
                                hasPermission('products.index') ? (
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
                                        hasPermission={hasPermission}
                                    />
                                ) : <AccessDeniedView />
                            } />
                            <Route path="/catalog-hub" element={<CatalogRedirect hasPermission={hasPermission} />} />

                            <Route path="/sales/pos" element={
                                hasPermission('sales.create') ? (
                                    <SalesHubView 
                                        activeSubTab="pos"
                                        products={products}
                                        categories={categories}
                                        brands={brands}
                                        hasPermission={hasPermission}
                                        currentUserEmail={currentUserEmail}
                                        fetchState={fetchState}
                                        isSuspended={isRestricted}
                                    />
                                ) : <AccessDeniedView />
                            } />
                            <Route path="/sales/history" element={
                                hasPermission('sales.index') ? (
                                    <SalesHubView 
                                        activeSubTab="history"
                                        products={products}
                                        categories={categories}
                                        brands={brands}
                                        hasPermission={hasPermission}
                                        currentUserEmail={currentUserEmail}
                                        fetchState={fetchState}
                                        isSuspended={isRestricted}
                                    />
                                ) : <AccessDeniedView />
                            } />
                            <Route path="/sales" element={<SalesRedirect hasPermission={hasPermission} />} />
                            
                            <Route path="/staff" element={
                                (hasPermission('employees.index') || hasPermission('roles.index')) ? (
                                    <StaffAndRolesHub
                                        employees={employees}
                                        shopRoles={shopRoles}
                                        permissionsConfig={permissionsConfig}
                                        onAddEmployee={handleAddEmployee}
                                        onUpdateEmployee={handleUpdateEmployee}
                                        onDeleteEmployee={handleDeleteEmployee}
                                        isOwner={isOwnerOrSuper}
                                        canManageRoles={hasPermission('roles.index')}
                                        canManageStaff={hasPermission('employees.index')}
                                        isSuspended={isRestricted}
                                        saveRolePermissions={saveRolePermissions}
                                        loadRolePermissions={loadRolePermissions}
                                        fetchRoles={fetchRoles}
                                        createRole={createRole}
                                        deleteRole={deleteRole}
                                        showMessage={showMessage}
                                    />
                                ) : <AccessDeniedView />
                            } />
                            <Route path="/settings" element={
                                (hasPermission('settings.general') || hasPermission('settings.shop') || hasPermission('settings.subscription')) ? (
                                    <SettingsView shop={shop} />
                                ) : <AccessDeniedView />
                            } />
                            <Route path="/logs" element={
                                (user && (user.role === 'Owner' || user.role === 'Super Admin' || hasPermission('roles.index'))) ? (
                                    <LogsView state={state} />
                                ) : <AccessDeniedView />
                            } />
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

function StaffAndRolesHub({
    employees,
    shopRoles,
    permissionsConfig,
    onAddEmployee,
    onUpdateEmployee,
    onDeleteEmployee,
    isOwner,
    canManageRoles,
    canManageStaff,
    isSuspended,
    saveRolePermissions,
    loadRolePermissions,
    fetchRoles,
    createRole,
    deleteRole,
    showMessage
}) {
    const [activeSubTab, setActiveSubTab] = useState(canManageStaff ? 'employees' : 'roles');
    const [rolesList, setRolesList] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [rolePerms, setRolePerms] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [loadingPerms, setLoadingPerms] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    const refreshRoles = async () => {
        setLoadingRoles(true);
        const data = await fetchRoles();
        setRolesList(data);
        setLoadingRoles(false);
    };

    useEffect(() => {
        if (canManageRoles) {
            refreshRoles();
        }
    }, []);

    const handleSelectRole = async (role) => {
        setSelectedRole(role);
        setLoadingPerms(true);
        const data = await loadRolePermissions(role.id);
        if (data && data.checked_pages) {
            setRolePerms(data.checked_pages);
        } else {
            setRolePerms([]);
        }
        setLoadingPerms(false);
    };

    const handleCreateRoleSubmit = async (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;
        const res = await createRole(newRoleName);
        if (res.success) {
            setNewRoleName('');
            refreshRoles();
        }
    };

    const handleDeleteRoleClick = async (roleId) => {
        if (confirm('Are you sure you want to delete this custom role?')) {
            const res = await deleteRole(roleId);
            if (res.success) {
                if (selectedRole && selectedRole.id === roleId) {
                    setSelectedRole(null);
                    setRolePerms([]);
                }
                refreshRoles();
            }
        }
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        const checked = Array.from(document.querySelectorAll('input[name="role-permissions[]"]:checked')).map(cb => cb.value);
        await saveRolePermissions(selectedRole.id, checked);
        // Refresh permissions
        const data = await loadRolePermissions(selectedRole.id);
        if (data && data.checked_pages) {
            setRolePerms(data.checked_pages);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {canManageStaff && canManageRoles && (
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveSubTab('employees')}
                        style={{
                            background: activeSubTab === 'employees' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            color: activeSubTab === 'employees' ? '#818cf8' : '#9ca3af',
                            border: activeSubTab === 'employees' ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            fontFamily: 'Outfit'
                        }}
                    >
                        👥 Employees Directory
                    </button>
                    <button
                        onClick={() => setActiveSubTab('roles')}
                        style={{
                            background: activeSubTab === 'roles' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            color: activeSubTab === 'roles' ? '#818cf8' : '#9ca3af',
                            border: activeSubTab === 'roles' ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            fontFamily: 'Outfit'
                        }}
                    >
                        🔑 Roles & Permissions
                    </button>
                </div>
            )}

            {activeSubTab === 'employees' && canManageStaff && (
                <StaffView
                    employees={employees}
                    shopRoles={shopRoles}
                    onAddEmployee={onAddEmployee}
                    onUpdateEmployee={onUpdateEmployee}
                    onDeleteEmployee={onDeleteEmployee}
                    isOwner={isOwner}
                    isSuspended={isSuspended}
                />
            )}

            {activeSubTab === 'roles' && canManageRoles && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
                    {/* Left Column: Create custom role form and role list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {isOwner && !isSuspended && (
                            <div style={{ background: 'rgba(20, 20, 25, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', borderRadius: '16px' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Create Custom Role</h4>
                                <form onSubmit={handleCreateRoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <input
                                        type="text"
                                        placeholder="e.g. Supervisor"
                                        value={newRoleName}
                                        onChange={e => setNewRoleName(e.target.value)}
                                        required
                                        style={{
                                            background: 'rgba(30, 30, 38, 0.45)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            color: '#fff',
                                            padding: '0.6rem',
                                            borderRadius: '8px',
                                            outline: 'none',
                                            fontFamily: 'Outfit'
                                        }}
                                    />
                                    <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Outfit' }}>
                                        + Add Custom Role
                                    </button>
                                </form>
                            </div>
                        )}

                        <div style={{ background: 'rgba(20, 20, 25, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', borderRadius: '16px' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Shop Roles</h4>
                            {loadingRoles ? (
                                <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Loading roles...</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {rolesList.map(role => {
                                        const isSelected = selectedRole?.id === role.id;
                                        return (
                                            <div
                                                key={role.id}
                                                onClick={() => handleSelectRole(role)}
                                                style={{
                                                    background: isSelected ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)' : 'rgba(0,0,0,0.15)',
                                                    border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
                                                    borderRadius: '8px',
                                                    padding: '0.8rem 1rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                    <span style={{ fontWeight: '600', color: isSelected ? '#fff' : '#d1d5db' }}>{role.name}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                        {role.is_custom ? 'Custom' : 'System'} • {role.member_count} {role.member_count === 1 ? 'member' : 'members'}
                                                    </span>
                                                </div>
                                                {role.is_custom && role.member_count === 0 && isOwner && !isSuspended && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteRoleClick(role.id);
                                                        }}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            padding: '0.2rem'
                                                        }}
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: permissions checklist for active role */}
                    <div style={{ background: 'rgba(20, 20, 25, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '2rem', borderRadius: '16px' }}>
                        {selectedRole ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Permissions Matrix: {selectedRole.name}</h3>
                                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                                            {selectedRole.is_custom ? 'Custom' : 'System'} Role Permissions Mapping
                                        </p>
                                    </div>
                                    {isOwner && !isSuspended && (
                                        <button
                                            onClick={handleSavePermissions}
                                            style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Outfit' }}
                                        >
                                            Save Permissions
                                        </button>
                                    )}
                                </div>

                                {loadingPerms ? (
                                    <div style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem' }}>Loading permissions...</div>
                                ) : (
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
                                                                <div style={{ color: '#6366f1', fontWeight: '500', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                                                                    {sub.label}
                                                                </div>
                                                                <div className="tree-pages" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                                    {Object.keys(sub.pages).map(pageKey => {
                                                                        const pageLabel = sub.pages[pageKey];
                                                                        const isChecked = rolePerms.includes(pageKey);
                                                                        return (
                                                                            <label key={pageKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#9ca3af', cursor: (isOwner && !isSuspended) ? 'pointer' : 'default' }}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    name="role-permissions[]"
                                                                                    value={pageKey}
                                                                                    defaultChecked={isChecked}
                                                                                    key={`${selectedRole.id}-${pageKey}-${isChecked}`} // force reset state on role update
                                                                                    disabled={!isOwner || isSuspended}
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
                                )}
                            </div>
                        ) : (
                            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '5rem 2rem' }}>
                                👈 Select a role from the list to view and manage its permissions matrix.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
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

// 6. Access Denied View
function AccessDeniedView() {
    return (
        <div style={{ 
            background: 'rgba(239, 68, 68, 0.05)', 
            border: '1px solid rgba(239, 68, 68, 0.15)', 
            borderRadius: '12px', 
            padding: '3rem', 
            textAlign: 'center',
            marginTop: '2rem',
            fontFamily: 'Outfit'
        }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ef4444', marginBottom: '0.5rem' }}>
                Access Denied
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
                You do not have the required permissions to view this page. Please contact your shop administrator.
            </p>
        </div>
    );
}

// Login View Component
function LoginView({ fetchState, showMessage, handleQuickLogin, token }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify({ email, password })
            });
            const res = await response.json();
            if (response.ok && res.success) {
                showMessage(`Logged in successfully.`);
                fetchState();
            } else {
                setFormError(res.message || 'Invalid credentials.');
            }
        } catch (err) {
            setFormError('Authentication failed. Please check your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    const triggerQuickLogin = async (demoEmail) => {
        await handleQuickLogin(demoEmail);
        fetchState();
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '460px',
            padding: '2.5rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            fontFamily: 'Outfit'
        }}>
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>🏬</span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fff', marginTop: '0.5rem', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>Shop Management</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Sign in to access your shop workspace</p>
            </div>

            {formError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500' }}>
                    ⚠️ {formError}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '500' }}>Email Address</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.75rem', borderRadius: '8px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', width: '100%' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '500' }}>Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.75rem', borderRadius: '8px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', width: '100%' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={submitting}
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', marginTop: '0.5rem', width: '100%' }}
                >
                    {submitting ? 'Authenticating...' : 'Sign In'}
                </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#9ca3af', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                Don't have a shop? <span onClick={() => navigate('/register')} style={{ color: '#6366f1', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>Register here</span>
            </div>

            {/* Quick Demo Login */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚡ Quick Login (Demo Accounts)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button onClick={() => triggerQuickLogin('john@alpha.com')} style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        🔑 John (Owner)
                    </button>
                    <button onClick={() => triggerQuickLogin('bob@alpha.com')} style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        🔑 Bob (Manager)
                    </button>
                    <button onClick={() => triggerQuickLogin('charlie@alpha.com')} style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        🔑 Charlie (Worker)
                    </button>
                    <button onClick={() => triggerQuickLogin('grace@marketplace.com')} style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        🔑 Grace (Admin)
                    </button>
                </div>
            </div>
        </div>
    );
}

// Register View Component
function RegisterView({ fetchState, showMessage, token }) {
    const navigate = useNavigate();
    const [shopName, setShopName] = useState('');
    const [shopSlug, setShopSlug] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [registered, setRegistered] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);
        try {
            const response = await fetch('/api/v1/auth/register-owner', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify({
                    owner_name: ownerName,
                    email,
                    password,
                    shop_name: shopName,
                    shop_slug: shopSlug
                })
            });
            const res = await response.json();
            if (response.ok && res.success) {
                setRegistered(true);
                showMessage('Registration completed! Pending admin approval.');
            } else {
                setFormError(res.message || 'Registration failed.');
            }
        } catch (err) {
            setFormError('Registration failed. Please check your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    if (registered) {
        return (
            <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '460px',
                padding: '2.5rem',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                fontFamily: 'Outfit',
                textAlign: 'center'
            }}>
                <span style={{ fontSize: '3rem' }}>⏳</span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#10b981', margin: '0.5rem 0' }}>Registration Successful</h2>
                <p style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Your shop <strong>{shopName}</strong> has been registered! 
                </p>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500', textAlign: 'left', marginTop: '0.5rem' }}>
                    ⚠️ Your shop is currently <strong>pending approval</strong> from the platform administrator. You can login, but shop features will be restricted until approved.
                </div>
                <button 
                    onClick={() => navigate('/login')}
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '1rem', width: '100%' }}
                >
                    Return to Login
                </button>
            </div>
        );
    }

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            padding: '2.5rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            fontFamily: 'Outfit'
        }}>
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>🚀</span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fff', marginTop: '0.5rem', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>Register Your Shop</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Create a new shop and admin account</p>
            </div>

            {formError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500' }}>
                    ⚠️ {formError}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>Shop Name</label>
                        <input 
                            type="text" 
                            value={shopName}
                            onChange={e => {
                                setShopName(e.target.value);
                                setShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                            }}
                            required
                            placeholder="My Awesome Shop"
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>Shop Slug (URL)</label>
                        <input 
                            type="text" 
                            value={shopSlug}
                            onChange={e => setShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]+/g, ''))}
                            required
                            placeholder="my-shop"
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box', width: '100%' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>Owner Name</label>
                    <input 
                        type="text" 
                        value={ownerName}
                        onChange={e => setOwnerName(e.target.value)}
                        required
                        placeholder="John Doe"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box', width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>Email Address</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="john@example.com"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box', width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>Password (min 6 chars)</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box', width: '100%' }}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={submitting}
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', marginTop: '0.5rem', fontSize: '0.9rem', width: '100%' }}
                >
                    {submitting ? 'Creating Shop...' : 'Create Shop & Account'}
                </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#9ca3af', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                Already have an account? <span onClick={() => navigate('/login')} style={{ color: '#6366f1', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>Sign In</span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// SALES & POS MODULE COMPONENTS
// ---------------------------------------------------------

function SalesRedirect({ hasPermission }) {
    const navigate = useNavigate();
    useEffect(() => {
        if (hasPermission('sales.create')) {
            navigate('/sales/pos', { replace: true });
        } else if (hasPermission('sales.index')) {
            navigate('/sales/history', { replace: true });
        } else {
            navigate('/dashboard', { replace: true });
        }
    }, [hasPermission]);
    return null;
}

function SalesHubView({ activeSubTab, products, categories, brands, hasPermission, currentUserEmail, fetchState, isSuspended }) {
    const navigate = useNavigate();
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            {/* Sub Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: '1.5rem', paddingBottom: '0.5rem' }}>
                {hasPermission('sales.create') && (
                    <button 
                        onClick={() => navigate('/sales/pos')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeSubTab === 'pos' ? '2px solid #6366f1' : '2px solid transparent',
                            color: activeSubTab === 'pos' ? '#fff' : '#9ca3af',
                            fontWeight: '600',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        🛒 POS Terminal
                    </button>
                )}
                {hasPermission('sales.index') && (
                    <button 
                        onClick={() => navigate('/sales/history')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeSubTab === 'history' ? '2px solid #6366f1' : '2px solid transparent',
                            color: activeSubTab === 'history' ? '#fff' : '#9ca3af',
                            fontWeight: '600',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        📜 Sales Log
                    </button>
                )}
            </div>

            {activeSubTab === 'pos' ? (
                <POSTerminal 
                    products={products}
                    categories={categories}
                    brands={brands}
                    isSuspended={isSuspended}
                    fetchState={fetchState}
                    setSelectedReceipt={setSelectedReceipt}
                    currentUserEmail={currentUserEmail}
                />
            ) : (
                <SalesLog 
                    isSuspended={isSuspended}
                    setSelectedReceipt={setSelectedReceipt}
                    currentUserEmail={currentUserEmail}
                />
            )}

            {/* Receipt Popup Modal */}
            {selectedReceipt && (
                <ReceiptModal 
                    sale={selectedReceipt}
                    onClose={() => setSelectedReceipt(null)}
                />
            )}
        </div>
    );
}

function POSTerminal({ products, categories, brands, isSuspended, fetchState, setSelectedReceipt, currentUserEmail }) {
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [discount, setDiscount] = useState('0');
    
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const filteredProducts = products.filter(p => {
        if (p.status !== 'published') return false;
        if (categoryFilter && p.category_id.toString() !== categoryFilter.toString()) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const addToCart = (product) => {
        if (product.stock_quantity <= 0) return;
        setCart(prev => {
            const existing = prev.find(item => item.product_id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock_quantity) return prev;
                return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1, maxStock: product.stock_quantity }];
        });
    };

    const updateQty = (productId, newQty) => {
        const qty = parseFloat(newQty);
        if (isNaN(qty) || qty <= 0) return;
        setCart(prev => prev.map(item => {
            if (item.product_id === productId) {
                const checkedQty = Math.min(qty, item.maxStock);
                return { ...item, quantity: checkedQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.product_id !== productId));
    };

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const discountAmount = parseFloat(discount) || 0;
    const total = Math.max(0, subtotal - discountAmount + tax);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;
        if (isSuspended) {
            setErrorMsg('Access restricted. Active subscription is suspended.');
            return;
        }

        setSubmitting(true);
        setErrorMsg('');

        try {
            const response = await fetch('/api/v1/tenant/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': currentUserEmail ? `Bearer ${currentUserEmail}` : ''
                },
                body: JSON.stringify({
                    customer_name: customerName || null,
                    customer_email: customerEmail || null,
                    payment_method: paymentMethod,
                    discount: discountAmount,
                    tax: tax,
                    items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
                })
            });

            const res = await response.json();
            if (res.success) {
                setCart([]);
                setCustomerName('');
                setCustomerEmail('');
                setDiscount('0');
                setPaymentMethod('cash');
                setSelectedReceipt(res.data);
                fetchState();
            } else {
                setErrorMsg(res.message || 'Checkout failed.');
            }
        } catch (err) {
            setErrorMsg('Network error. Checkout failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', flexGrow: 1, minHeight: '500px' }}>
            {/* Products grid */}
            <div style={{ background: 'rgba(20,20,25,0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                        type="text"
                        placeholder="Search product..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.55rem 1rem', borderRadius: '8px', flex: 1, outline: 'none', fontSize: '0.9rem' }}
                    />
                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        style={{ background: 'rgba(30,30,38,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', overflowY: 'auto', maxHeight: '550px', paddingRight: '0.2rem' }}>
                    {filteredProducts.length === 0 ? (
                        <div style={{ color: '#9ca3af', textAlign: 'center', gridColumn: 'span 3', padding: '2rem' }}>No products match filters.</div>
                    ) : (
                        filteredProducts.map(p => {
                            const inCart = cart.find(item => item.product_id === p.id);
                            const currentQty = inCart ? inCart.quantity : 0;
                            const isOutOfStock = p.stock_quantity <= 0;
                            const isMaxedOut = currentQty >= p.stock_quantity;

                            return (
                                <div 
                                    key={p.id}
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: '0.5rem',
                                        opacity: isOutOfStock ? 0.6 : 1,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        {p.images && p.images.length > 0 ? (
                                            <img src={p.images[0].image_url} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9ca3af', fontSize: '0.65rem' }}>N/A</div>
                                        )}
                                        {isOutOfStock ? (
                                            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: '700' }}>OUT OF STOCK</span>
                                        ) : (
                                            <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.7rem', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: '600' }}>
                                                {p.stock_quantity - currentQty} in stock
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{p.brand ? p.brand.name : 'No Brand'}</div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                                        <span style={{ color: '#10b981', fontWeight: '700', fontSize: '1rem' }}>${parseFloat(p.price).toFixed(2)}</span>
                                        <button
                                            onClick={() => addToCart(p)}
                                            disabled={isOutOfStock || isMaxedOut}
                                            style={{
                                                background: isOutOfStock || isMaxedOut ? 'rgba(255,255,255,0.05)' : '#6366f1',
                                                color: isOutOfStock || isMaxedOut ? '#6b7280' : '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '0.35rem 0.75rem',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                cursor: isOutOfStock || isMaxedOut ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Cart summary */}
            <div style={{ background: 'rgba(20,20,25,0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>Current Order</h4>

                {errorMsg && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                        ⚠️ {errorMsg}
                    </div>
                )}

                <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {cart.length === 0 ? (
                        <div style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem 0', fontSize: '0.9rem' }}>Cart is empty. Select products from left side catalog.</div>
                    ) : (
                        cart.map(item => (
                            <div 
                                key={item.product_id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.01)',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.04)'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#fff' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#10b981' }}>${parseFloat(item.price).toFixed(2)}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button 
                                        type="button"
                                        onClick={() => updateQty(item.product_id, item.quantity - 1)}
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number"
                                        min="1"
                                        max={item.maxStock}
                                        value={item.quantity}
                                        onChange={e => updateQty(item.product_id, e.target.value)}
                                        style={{ width: '40px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', textAlign: 'center', padding: '0.15rem', borderRadius: '4px', fontSize: '0.85rem', outline: 'none' }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => updateQty(item.product_id, item.quantity + 1)}
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        +
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => removeFromCart(item.product_id)}
                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '0 0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Customer Name</label>
                            <input 
                                type="text"
                                placeholder="Walk-in Customer"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.45rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Customer Email</label>
                            <input 
                                type="email"
                                placeholder="customer@example.com"
                                value={customerEmail}
                                onChange={e => setCustomerEmail(e.target.value)}
                                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.45rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.8rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Payment Method</label>
                            <select 
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                                style={{ background: 'rgba(20,20,25,0.75)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.45rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
                            >
                                <option value="cash">💵 Cash Payment</option>
                                <option value="card">💳 Card Terminal</option>
                                <option value="mobile">📱 Mobile Wallet</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Discount ($)</label>
                            <input 
                                type="number"
                                min="0"
                                step="0.01"
                                value={discount}
                                onChange={e => setDiscount(e.target.value)}
                                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.45rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Calculations */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#9ca3af' }}>Subtotal:</span>
                            <span style={{ color: '#fff' }}>${subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#9ca3af' }}>Discount:</span>
                            <span style={{ color: '#ef4444' }}>-${discountAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#9ca3af' }}>Tax (5%):</span>
                            <span style={{ color: '#fff' }}>+${tax.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem', fontWeight: '700', fontSize: '1rem' }}>
                            <span style={{ color: '#818cf8' }}>Net Total:</span>
                            <span style={{ color: '#10b981' }}>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || cart.length === 0}
                        style={{
                            background: submitting || cart.length === 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: submitting || cart.length === 0 ? '#6b7280' : '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            cursor: submitting || cart.length === 0 ? 'not-allowed' : 'pointer',
                            boxShadow: submitting || cart.length === 0 ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
                            transition: 'all 0.2s',
                            textAlign: 'center'
                        }}
                    >
                        {submitting ? 'Processing Checkout...' : `Complete Order ($${total.toFixed(2)})`}
                    </button>
                </form>
            </div>
        </div>
    );
}

function SalesLog({ isSuspended, setSelectedReceipt, currentUserEmail }) {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters (matching user preference: Date Range Picker first!)
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [preset, setPreset] = useState('all');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [search, setSearch] = useState('');

    const [appliedStart, setAppliedStart] = useState('');
    const [appliedEnd, setAppliedEnd] = useState('');
    const [appliedPayment, setAppliedPayment] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');

    const fetchSales = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (appliedStart) params.append('start_date', appliedStart);
            if (appliedEnd) params.append('end_date', appliedEnd);
            if (appliedPayment) params.append('payment_method', appliedPayment);
            if (appliedSearch) params.append('search', appliedSearch);

            const response = await fetch(`/api/v1/tenant/sales?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': currentUserEmail ? `Bearer ${currentUserEmail}` : ''
                }
            });
            const res = await response.json();
            if (res.success) {
                setSales(res.data);
            }
        } catch (err) {
            console.error('Error fetching sales log:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, [appliedStart, appliedEnd, appliedPayment, appliedSearch]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setAppliedStart(startDate);
        setAppliedEnd(endDate);
        setAppliedPayment(paymentMethod);
        setAppliedSearch(search);
    };

    const handleClear = () => {
        setStartDate('');
        setEndDate('');
        setPreset('all');
        setPaymentMethod('');
        setSearch('');

        setAppliedStart('');
        setAppliedEnd('');
        setAppliedPayment('');
        setAppliedSearch('');
    };

    return (
        <div style={{ background: 'rgba(20,20,25,0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* Restructured Filter form: Date picker first, then payment, then search term */}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: '180px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Payment Method</label>
                    <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        style={{ background: 'rgba(30,30,38,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
                    >
                        <option value="">All Payments</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="mobile">Mobile</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 2, minWidth: '220px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Search Invoice / Customer</label>
                    <input
                        type="text"
                        placeholder="Search invoice number or customer details..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ background: 'rgba(30,30,38,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.55rem 1rem', borderRadius: '8px', outline: 'none', fontSize: '0.9rem' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', height: '38px', alignItems: 'center' }}>
                    <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0 1.5rem', height: '38px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                        Search
                    </button>
                    {(appliedStart || appliedEnd || appliedPayment || appliedSearch) && (
                        <button type="button" onClick={handleClear} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0 1.5rem', height: '38px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                            Clear
                        </button>
                    )}
                </div>
            </form>

            {/* Logs Table */}
            <div style={{ overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem' }}>Loading sales transactions...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Invoice #</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Date</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Cashier</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Customer</th>
                                <th style={{ textAlign: 'left', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Payment</th>
                                <th style={{ textAlign: 'right', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Total</th>
                                <th style={{ textAlign: 'center', padding: '0.8rem', borderBottom: '2px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No transactions recorded.</td>
                                </tr>
                            ) : (
                                sales.map(sale => (
                                    <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <td style={{ padding: '0.8rem', fontWeight: '600' }}><code>{sale.invoice_number}</code></td>
                                        <td style={{ padding: '0.8rem' }}>{new Date(sale.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '0.8rem' }}>{sale.creator ? sale.creator.name : 'Unknown'}</td>
                                        <td style={{ padding: '0.8rem' }}>{sale.customer_name || 'Walk-in'}</td>
                                        <td style={{ padding: '0.8rem', textTransform: 'capitalize' }}>
                                            <span style={{ 
                                                fontSize: '0.75rem', 
                                                padding: '0.2rem 0.5rem', 
                                                borderRadius: '4px',
                                                background: sale.payment_method === 'cash' ? 'rgba(16,185,129,0.15)' : (sale.payment_method === 'card' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)'),
                                                color: sale.payment_method === 'cash' ? '#10b981' : (sale.payment_method === 'card' ? '#3b82f6' : '#8b5cf6')
                                            }}>
                                                {sale.payment_method}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>${parseFloat(sale.total).toFixed(2)}</td>
                                        <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                                            <button 
                                                onClick={() => setSelectedReceipt(sale)}
                                                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                                📄 View Invoice
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function ReceiptModal({ sale, onClose }) {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
            <div style={{ background: '#1c1c24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '2rem', width: '420px', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', fontFamily: 'monospace' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px dashed rgba(255,255,255,0.15)', paddingBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#fff', margin: '0 0 0.5rem 0' }}>RECEIPT / INVOICE</h3>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Invoice #: {sale.invoice_number}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Date: {new Date(sale.created_at).toLocaleString()}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem', color: '#d1d5db' }}>
                    <div><strong>Customer:</strong> {sale.customer_name || 'Walk-in Customer'}</div>
                    {sale.customer_email && <div><strong>Email:</strong> {sale.customer_email}</div>}
                    <div><strong>Cashier:</strong> {sale.creator ? sale.creator.name : 'System'}</div>
                    <div style={{ textTransform: 'capitalize' }}><strong>Payment:</strong> {sale.payment_method}</div>
                </div>

                <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.15)', borderTop: '1px dashed rgba(255,255,255,0.15)', padding: '0.8rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.2rem' }}>
                        <span>Item Name [Qty]</span>
                        <span>Total</span>
                    </div>
                    {sale.items && sale.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#fff' }}>
                            <span>{item.product_name} x {parseFloat(item.quantity)}</span>
                            <span>${parseFloat(item.total).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem', color: '#d1d5db', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal:</span>
                        <span>${parseFloat(sale.subtotal).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                        <span>Discount:</span>
                        <span>-${parseFloat(sale.discount).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tax (5%):</span>
                        <span>+${parseFloat(sale.tax).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.4rem', fontWeight: '700', fontSize: '1.1rem', color: '#10b981' }}>
                        <span>GRAND TOTAL:</span>
                        <span>${parseFloat(sale.total).toFixed(2)}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button 
                        onClick={() => window.print()}
                        style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', flex: 1, textAlign: 'center' }}
                    >
                        🖨️ Print
                    </button>
                    <button 
                        onClick={onClose}
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#9ca3af', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', flex: 1, textAlign: 'center' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
