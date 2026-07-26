import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
    { id: 'dashboard', path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
    { id: 'shops', path: '/admin/shops', label: 'Shop Directory', icon: '🏢' },
    { id: 'customers', path: '/admin/customers', label: 'Customers', icon: '🛍️' },
    { id: 'shop-owners', path: '/admin/shop-owners', label: 'Shop Owners', icon: '👑' },
    { id: 'employees', path: '/admin/employees', label: 'Shop Staff', icon: '👔' },
    { id: 'tickets', path: '/admin/support-tickets', label: 'Support Tickets Desk', icon: '🎫' },
    { id: 'plans', path: '/admin/plans', label: 'Subscription Plans', icon: '💳' },
    { id: 'admins', path: '/admin/admins', label: 'Admin Accounts', icon: '👥' },
    { id: 'logs', path: '/admin/logs', label: 'Audit Logs', icon: '📜' },
];

export function AdminLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const isActive = (item) => {
        if (item.exact) return location.pathname === item.path;
        return location.pathname.startsWith(item.path);
    };

    return (
        <div style={{
            display: 'flex', minHeight: '100vh', fontFamily: "'Outfit', sans-serif",
            background: '#0a0a0c', color: '#f3f4f6', overflow: 'hidden',
        }}>
            <aside style={{
                width: sidebarOpen ? '260px' : '72px', flexShrink: 0,
                background: 'rgba(12,12,18,0.95)', backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', padding: '1.5rem 0',
                transition: 'width 0.25s ease', overflow: 'hidden',
                position: 'sticky', top: 0, height: '100vh',
            }}>
                <div style={{
                    padding: '0 1.25rem 1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                    <div style={{
                        width: '36px', height: '36px', flexShrink: 0, borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
                    }}>🛡️</div>
                    {sidebarOpen && (
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>GlobalShop</div>
                            <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin Console</div>
                        </div>
                    )}
                </div>

                <nav style={{ flex: 1, padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            id={`nav-${item.id}`}
                            onClick={() => navigate(item.path)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.875rem',
                                padding: sidebarOpen ? '0.7rem 1rem' : '0.7rem',
                                borderRadius: '10px', border: 'none', cursor: 'pointer',
                                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                background: isActive(item)
                                    ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))'
                                    : 'transparent',
                                color: isActive(item) ? '#a5b4fc' : '#6b7280',
                                fontFamily: "'Outfit', sans-serif",
                                fontWeight: isActive(item) ? 600 : 500, fontSize: '0.875rem',
                                transition: 'all 0.15s',
                                borderLeft: isActive(item) ? '2px solid #6366f1' : '2px solid transparent',
                            }}
                        >
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                            {sidebarOpen && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                {sidebarOpen && (
                    <div style={{
                        margin: '0 0.75rem',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                background: user?.isSuperAdmin
                                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.875rem', fontWeight: 700, color: '#fff',
                            }}>
                                {user?.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user?.name || 'Administrator'}
                                </div>
                                <div style={{
                                    fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em',
                                    color: user?.isSuperAdmin ? '#fbbf24' : '#818cf8', textTransform: 'uppercase',
                                }}>
                                    {user?.isSuperAdmin ? 'Super Admin' : 'Admin'}
                                </div>
                            </div>
                        </div>
                        <button
                            id="admin-logout-btn"
                            onClick={logout}
                            style={{
                                width: '100%', padding: '0.5rem', borderRadius: '8px',
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                color: '#f87171', fontSize: '0.8rem', fontWeight: 600,
                                cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                            }}
                        >
                            🚪 Sign Out
                        </button>
                    </div>
                )}
            </aside>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minWidth: 0 }}>
                <header style={{
                    padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(10,10,14,0.8)', backdropFilter: 'blur(10px)',
                    position: 'sticky', top: 0, zIndex: 100,
                }}>
                    <button
                        onClick={() => setSidebarOpen(o => !o)}
                        style={{
                            width: '34px', height: '34px', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                            color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}
                    >☰</button>
                    <div style={{ flex: 1 }}>
                        <span style={{ color: '#4b5563', fontSize: '0.8rem' }}>GlobalShop / </span>
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500 }}>
                            {NAV_ITEMS.find(i => isActive(i))?.label || 'Admin Console'}
                        </span>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.75rem', borderRadius: '20px',
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                        color: '#34d399', fontSize: '0.75rem', fontWeight: 600,
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                        System Online
                    </div>
                </header>

                <main style={{ flex: 1, padding: '1.75rem', overflow: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
