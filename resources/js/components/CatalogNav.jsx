import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function CatalogNav({ hasPermission }) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const tabs = [
        (!hasPermission || hasPermission('categories.index')) && { path: '/catalog-hub/categories', label: 'Categories' },
        (!hasPermission || hasPermission('brands.index')) && { path: '/catalog-hub/brands', label: 'Brands' },
        (!hasPermission || hasPermission('products.index')) && { path: '/catalog-hub/products', label: 'Products' }
    ].filter(Boolean);

    return (
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
            {tabs.map(tab => {
                const isActive = currentPath === tab.path;
                return (
                    <button
                        key={tab.path}
                        onClick={() => navigate(tab.path)}
                        style={{
                            background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            border: isActive ? '1px solid #6366f1' : '1px solid transparent',
                            color: isActive ? '#fff' : '#9ca3af',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
