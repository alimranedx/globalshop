import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';

import store from './store';
import { clearAuthState } from './store/authSlice';
import { clearShopState, setUserLanguage } from './store/shopSlice';
import { clearCatalogState } from './store/catalogSlice';
import { clearEmployeesState } from './store/employeesSlice';
import { clearUiState, showToast, clearToast } from './store/uiSlice';
import { fetchState, handleQuickLogin } from './store/actions';
import { getCsrfToken, getHeaders } from './utils/api';
import useHasPermission from './hooks/useHasPermission';
import useTranslation from './hooks/useTranslation';
import useTheme from './hooks/useTheme';

import CategoriesPage from './components/CategoriesPage';
import BrandsPage from './components/BrandsPage';
import ProductsPage from './components/ProductsPage';
import CatalogNav from './components/CatalogNav';

import AccessDeniedView from './views/AccessDeniedView';
import DashboardView from './views/DashboardView';
import LogsView from './views/LogsView';
import CustomersView from './views/CustomersView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import SettingsView from './views/SettingsView';
import StaffAndRolesHub from './views/StaffAndRolesHub';
import SalesHubView from './views/SalesHubView';
import ProfileView from './views/ProfileView';

function CatalogRedirect() {
    const hasPermission = useHasPermission();
    if (hasPermission('categories.index')) return <Navigate to="/catalog-hub/categories" replace />;
    if (hasPermission('brands.index')) return <Navigate to="/catalog-hub/brands" replace />;
    if (hasPermission('products.index')) return <Navigate to="/catalog-hub/products" replace />;
    return <AccessDeniedView />;
}

function SalesRedirect() {
    const hasPermission = useHasPermission();
    if (hasPermission('sales.create')) return <Navigate to="/sales/pos" replace />;
    if (hasPermission('sales.index')) return <Navigate to="/sales/history" replace />;
    return <AccessDeniedView />;
}

function ShopManagerApp() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const t = useTranslation();
    const { themeName, colors, toggle, isDark } = useTheme();

    const authenticated = useSelector(state => state.auth.authenticated);
    const user = useSelector(state => state.auth.user);
    const shop = useSelector(state => state.shop.shop);
    const toast = useSelector(state => state.ui.toast);
    const currentUserEmail = useSelector(state => state.auth.currentUserEmail);
    const activeLanguage = useSelector(state => state.shop.userLanguage || state.shop.shop?.language || localStorage.getItem('app_language') || 'en');

    const hasPermission = useHasPermission();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [loadingState, setLoadingState] = useState(true);

    useEffect(() => {
        document.body.style.background = colors.background;
        document.body.style.color = colors.text;
        document.body.style.transition = 'background 0.25s, color 0.25s';
    }, [colors]);

    useEffect(() => {
        if (toast && toast.show) {
            const timer = setTimeout(() => {
                dispatch(clearToast());
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toast, dispatch]);

    useEffect(() => {
        if (location.pathname.startsWith('/catalog-hub')) {
            setActiveTab('catalog');
        } else if (location.pathname.startsWith('/sales')) {
            setActiveTab('sales');
        } else if (location.pathname.startsWith('/customers')) {
            setActiveTab('customers');
        } else if (location.pathname === '/matrix') {
            setActiveTab('matrix');
        } else if (location.pathname === '/staff') {
            setActiveTab('staff');
        } else if (location.pathname === '/settings') {
            setActiveTab('settings');
        } else if (location.pathname === '/logs') {
            setActiveTab('logs');
        } else if (location.pathname === '/profile') {
            setActiveTab('profile');
        } else {
            setActiveTab('dashboard');
        }
    }, [location.pathname]);

    useEffect(() => {
        const init = async () => {
            await dispatch(fetchState());
            setLoadingState(false);
        };
        init();
    }, [currentUserEmail]);

    const handleLogout = async () => {
        try {
            const token = getCsrfToken();
            const response = await fetch('/api/v1/auth/logout', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token
                }
            });
            const res = await response.json();
            if (res.success) {
                if (res.csrf_token) {
                    const meta = document.querySelector('meta[name="csrf-token"]');
                    if (meta) meta.setAttribute('content', res.csrf_token);
                }
                dispatch(clearAuthState());
                dispatch(clearShopState());
                dispatch(clearCatalogState());
                dispatch(clearEmployeesState());
                dispatch(clearUiState());
                dispatch(showToast({ message: 'Logged out successfully.', isError: false }));
                navigate('/dashboard');
            } else {
                dispatch(showToast({ message: res.message || 'Logout failed.', isError: true }));
            }
        } catch (err) {
            dispatch(clearAuthState());
            dispatch(clearShopState());
            dispatch(clearCatalogState());
            dispatch(clearEmployeesState());
            dispatch(clearUiState());
        }
    };

    const handleLanguageChange = async (newLang) => {
        dispatch(setUserLanguage(newLang));
        dispatch(showToast({ message: newLang === 'bn' ? 'ভাষা বাংলায় পরিবর্তিত হয়েছে' : 'Language changed to English', isError: false }));

        if (shop && (user?.id === shop?.owner_id || user?.is_platform_admin)) {
            const headers = getHeaders();
            try {
                await fetch('/api/v1/tenant/settings', {
                    method: 'PUT',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: shop.name,
                        status: shop.status,
                        currency: shop.currency || 'USD',
                        language: newLang
                    })
                });
            } catch (err) {
                // Ignore silent network sync error for tenant settings
            }
        }
    };

    if (loadingState) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0c' }}>
                <div style={{ fontSize: '1.2rem', color: '#9ca3af', fontFamily: 'Outfit' }}>Loading workspace state...</div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #181824 0%, #0a0a0c 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Outfit', padding: '2rem' }}>
                <Routes>
                    <Route path="/register" element={<RegisterView />} />
                    <Route path="*" element={<LoginView />} />
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
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: colors.background, color: colors.text }}>
            {/* Top Swapper */}
            <div style={{ background: colors.topBarBg, borderBottom: `1px solid ${colors.topBarBorder}`, padding: '0.6rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: colors.text }}>
                <span>⚙️ <strong>SaaS Shop Panel Simulator (React JS)</strong></span>
                <div>
                    <span>Active User Context: </span>
                    <select 
                        value={currentUserEmail} 
                        onChange={(e) => dispatch(handleQuickLogin(e.target.value))}
                        style={{ background: colors.isDark ? '#141419' : '#fff', border: `1px solid ${colors.border}`, color: colors.text, padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', outline: 'none' }}
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
                <aside style={{ background: colors.sidebarBg, backdropFilter: 'blur(20px)', borderRight: `1px solid ${colors.border}`, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: '700', color: colors.text, letterSpacing: '-0.02em' }}>
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
                            { id: 'dashboard', label: t('dashboard'), visible: true },
                            { id: 'catalog', label: t('catalog'), visible: hasPermission('categories.index') || hasPermission('brands.index') || hasPermission('products.index') },
                            { id: 'sales', label: t('sales'), visible: hasPermission('sales.index') || hasPermission('sales.create') },
                            { id: 'customers', label: t('customers') || 'Customers', visible: hasPermission('customers.index') || hasPermission('customers.edit') },
                            { id: 'staff', label: t('staff'), visible: hasPermission('employees.index') || hasPermission('roles.index') },
                            { id: 'settings', label: t('settings'), visible: hasPermission('settings.general') || hasPermission('settings.shop') || hasPermission('settings.subscription') },
                            { id: 'logs', label: t('logs'), visible: user && (user.role === 'Owner' || user.role === 'Super Admin' || hasPermission('roles.index')) },
                            { id: 'profile', label: t('profile'), visible: true }
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
                                        color: activeTab === tab.id ? (colors.isDark ? '#fff' : '#4f46e5') : colors.textMuted,
                                        padding: '0.8rem 1rem',
                                        textAlign: 'left',
                                        fontSize: '0.95rem',
                                        fontWeight: '600',
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
                    <div style={{ background: colors.surfaceHeader, backdropFilter: 'blur(10px)', borderBottom: `1px solid ${colors.border}`, padding: '1rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.text }}>
                            {activeTab === 'catalog' ? t('catalog') : t(activeTab).replace(/^[^\w\u00C0-\u017F\u0980-\u09FF\s]+/, '')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {user && (
                                <>
                                    {/* Language Segment Switch */}
                                    <div style={{ display: 'flex', alignItems: 'center', background: colors.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)', border: `1px solid ${colors.border}`, padding: '0.2rem', borderRadius: '8px', marginRight: '0.5rem' }}>
                                        <button 
                                            onClick={() => handleLanguageChange('en')}
                                            style={{ 
                                                background: activeLanguage === 'en' ? '#6366f1' : 'transparent',
                                                color: activeLanguage === 'en' ? '#fff' : colors.textMuted,
                                                border: 'none',
                                                padding: '0.35rem 0.8rem',
                                                borderRadius: '6px',
                                                fontSize: '0.82rem',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                outline: 'none',
                                                boxShadow: activeLanguage === 'en' ? '0 2px 6px rgba(99, 102, 241, 0.4)' : 'none'
                                            }}
                                        >
                                            EN
                                        </button>
                                        <button 
                                            onClick={() => handleLanguageChange('bn')}
                                            style={{ 
                                                background: activeLanguage === 'bn' ? '#6366f1' : 'transparent',
                                                color: activeLanguage === 'bn' ? '#fff' : colors.textMuted,
                                                border: 'none',
                                                padding: '0.35rem 0.8rem',
                                                borderRadius: '6px',
                                                fontSize: '0.82rem',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                outline: 'none',
                                                boxShadow: activeLanguage === 'bn' ? '0 2px 6px rgba(99, 102, 241, 0.4)' : 'none'
                                            }}
                                        >
                                            বাংলা
                                        </button>
                                    </div>
                                    <button 
                                        onClick={toggle}
                                        style={{ 
                                            background: colors.cardBg, 
                                            border: `1px solid ${colors.border}`, 
                                            color: colors.text, 
                                            padding: '0.4rem 0.8rem', 
                                            borderRadius: '6px', 
                                            fontSize: '0.85rem', 
                                            cursor: 'pointer', 
                                            fontWeight: '500', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.3rem',
                                            marginRight: '0.5rem',
                                            outline: 'none'
                                        }}
                                    >
                                        {isDark ? '☀️ Light' : '🌙 Dark'}
                                    </button>
                                     <div 
                                        onClick={() => navigate('/profile')}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '8px', transition: 'background 0.2s', background: activeTab === 'profile' ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') : 'transparent' }}
                                        title="View Profile"
                                    >
                                        {user.avatar_url ? (
                                            <img 
                                                src={user.avatar_url} 
                                                alt={user.name} 
                                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }} 
                                            />
                                        ) : (
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.85rem', fontWeight: '700' }}>
                                                {user.name ? (user.name.split(' ').length >= 2 ? (user.name.split(' ')[0][0] + user.name.split(' ')[1][0]).toUpperCase() : user.name.slice(0, 2).toUpperCase()) : 'U'}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <span style={{ fontWeight: '600', color: colors.text, fontSize: '0.88rem', lineHeight: '1.2' }}>{user.name}</span>
                                            <span style={{ fontSize: '0.7rem', color: colors.textMuted, lineHeight: '1.2' }}>{user.role}</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => navigate('/profile')}
                                        style={{ 
                                            background: activeTab === 'profile' ? 'rgba(99, 102, 241, 0.2)' : colors.cardBg, 
                                            border: `1px solid ${activeTab === 'profile' ? '#6366f1' : colors.border}`, 
                                            color: activeTab === 'profile' ? (colors.isDark ? '#fff' : '#4f46e5') : colors.text, 
                                            padding: '0.4rem 0.8rem', 
                                            borderRadius: '6px', 
                                            fontSize: '0.85rem', 
                                            cursor: 'pointer', 
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            outline: 'none'
                                        }}
                                    >
                                        Profile
                                    </button>

                                    {(hasPermission('settings.general') || hasPermission('settings.shop') || hasPermission('settings.subscription')) && (
                                        <button 
                                            onClick={() => navigate('/settings')}
                                            style={{ 
                                                background: activeTab === 'settings' ? 'rgba(99, 102, 241, 0.2)' : colors.cardBg, 
                                                border: `1px solid ${activeTab === 'settings' ? '#6366f1' : colors.border}`, 
                                                color: activeTab === 'settings' ? (colors.isDark ? '#fff' : '#4f46e5') : colors.text, 
                                                padding: '0.4rem 0.8rem', 
                                                borderRadius: '6px', 
                                                fontSize: '0.85rem', 
                                                cursor: 'pointer', 
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                outline: 'none'
                                            }}
                                        >
                                            Settings
                                        </button>
                                    )}

                                    <button 
                                        onClick={handleLogout}
                                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}
                                    >
                                        Log Out
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <main style={{ flexGrow: 1, padding: '2.5rem', overflowY: 'auto' }}>
                        
                        {/* Status Warning banners */}
                        {isSuspended && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem 1.5rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '500' }}>
                                🛑 <strong>Suspended Tenant Scope:</strong> Your shop has been suspended by the platform administrator. Access to catalog edits, staff adjustments, settings, and POS checkouts is strictly blocked.
                            </div>
                        )}
                        
                        {isPending && (
                            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '1rem 1.5rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '500' }}>
                                ⏳ <strong>Pending Approval:</strong> Your shop setup is pending approval. You can view components in read-only mode, but core workspace functions are disabled.
                            </div>
                        )}

                        <Routes>
                            <Route path="/dashboard" element={<DashboardView />} />
                            
                            {/* Catalog Page Routes with Navigation Layout */}
                            <Route path="/catalog-hub/*" element={
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <CatalogNav />
                                    <Routes>
                                        <Route path="categories" element={
                                            hasPermission('categories.index') ? <CategoriesPage /> : <AccessDeniedView />
                                        } />
                                        <Route path="brands" element={
                                            hasPermission('brands.index') ? <BrandsPage /> : <AccessDeniedView />
                                        } />
                                        <Route path="products" element={
                                            hasPermission('products.index') ? <ProductsPage /> : <AccessDeniedView />
                                        } />
                                        <Route path="*" element={<CatalogRedirect />} />
                                    </Routes>
                                </div>
                            } />
                            <Route path="/catalog-hub" element={<CatalogRedirect />} />

                            <Route path="/sales/pos" element={
                                hasPermission('sales.create') ? <SalesHubView activeSubTab="pos" /> : <AccessDeniedView />
                            } />
                            <Route path="/sales/history" element={
                                hasPermission('sales.index') ? <SalesHubView activeSubTab="history" /> : <AccessDeniedView />
                            } />
                            <Route path="/sales/refunds" element={
                                hasPermission('sales.index') ? <SalesHubView activeSubTab="refunds" /> : <AccessDeniedView />
                            } />
                            <Route path="/sales" element={<SalesRedirect />} />
                            
                            <Route path="/customers" element={
                                (hasPermission('customers.index') || hasPermission('customers.edit')) ? <CustomersView /> : <AccessDeniedView />
                            } />
                            
                            <Route path="/staff" element={
                                (hasPermission('employees.index') || hasPermission('roles.index')) ? <StaffAndRolesHub /> : <AccessDeniedView />
                            } />
                            
                            <Route path="/settings" element={
                                (hasPermission('settings.general') || hasPermission('settings.shop') || hasPermission('settings.subscription')) ? <SettingsView /> : <AccessDeniedView />
                            } />
                            
                            <Route path="/logs" element={
                                (user && (user.role === 'Owner' || user.role === 'Super Admin' || hasPermission('roles.index'))) ? <LogsView /> : <AccessDeniedView />
                            } />

                            <Route path="/profile" element={<ProfileView />} />
                            
                            <Route path="*" element={<DashboardView />} />
                        </Routes>
                    </main>
                </div>
            </div>

            {/* Global Dispatch alert toast */}
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

const shopSlug = window.AppConfig?.shopSlug || 'alpha';

// Render root element
const rootEl = document.getElementById('shop-owner-root');
if (rootEl) {
    if (!window.__reactRoot) {
        window.__reactRoot = createRoot(rootEl);
    }
    window.__reactRoot.render(
        <Provider store={store}>
            <BrowserRouter basename={`/shop/${shopSlug}`}>
                <ShopManagerApp />
            </BrowserRouter>
        </Provider>
    );
}

