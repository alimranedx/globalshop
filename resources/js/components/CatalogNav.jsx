import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useTheme from '../hooks/useTheme';

export default function CatalogNav({ hasPermission }) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const { colors, isDark } = useTheme();

    const tabs = [
        (!hasPermission || hasPermission('categories.index')) && { path: '/catalog-hub/categories', label: 'Categories' },
        (!hasPermission || hasPermission('brands.index')) && { path: '/catalog-hub/brands', label: 'Brands' },
        (!hasPermission || hasPermission('products.index')) && { path: '/catalog-hub/products', label: 'Products' }
    ].filter(Boolean);

    return (
        <div style={{ display: 'flex', gap: '1rem', borderBottom: `1px solid ${colors.border}`, paddingBottom: '0.75rem' }}>
            {tabs.map(tab => {
                const isActive = currentPath === tab.path;
                return (
                    <button
                        key={tab.path}
                        onClick={() => navigate(tab.path)}
                        style={{
                            background: isActive ? (isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)') : 'transparent',
                            border: isActive ? '1px solid #6366f1' : '1px solid transparent',
                            color: isActive ? (isDark ? '#fff' : '#4f46e5') : colors.textMuted,
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '700',
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
