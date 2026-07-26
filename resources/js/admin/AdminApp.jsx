import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────
   API Helpers
───────────────────────────────────────────────────────────── */
const API = '/api/v1';

const getCsrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

async function apiGet(url) {
    try {
        const r = await fetch(url, {
            headers: { Accept: 'application/json', 'X-CSRF-TOKEN': getCsrf() },
            credentials: 'same-origin',
        });
        return await r.json();
    } catch { return null; }
}

async function apiPost(url, body = {}) {
    try {
        const r = await fetch(url, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
            credentials: 'same-origin',
            body: JSON.stringify(body),
        });
        return await r.json();
    } catch { return null; }
}

async function apiPut(url, body = {}) {
    try {
        const r = await fetch(url, {
            method: 'PUT',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
            credentials: 'same-origin',
            body: JSON.stringify(body),
        });
        return await r.json();
    } catch { return null; }
}

/* ─────────────────────────────────────────────────────────────
   Auth Context
───────────────────────────────────────────────────────────── */
const AuthContext = React.createContext(null);

function useAuth() { return React.useContext(AuthContext); }

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/auth/me`, {
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': getCsrf() },
                credentials: 'same-origin',
            });
            const data = await r.json();
            if (data.success && data.user?.is_platform_admin) {
                setUser({
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    isSuperAdmin: data.user.email === 'superadmin@marketplace.com',
                    is_platform_admin: true,
                    adminPermissions: data.user.admin_permissions || [],
                });
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        }
        setLoading(false);
    }, []);


    useEffect(() => { checkAuth(); }, [checkAuth]);

    const login = async (email, password) => {
        const res = await apiPost(`${API}/auth/login`, { email, password });
        if (res?.success && res.user?.is_platform_admin) {
            setUser({
                name: res.user.name,
                email: res.user.email,
                isSuperAdmin: res.user.email === 'superadmin@marketplace.com',
                is_platform_admin: true,
                adminPermissions: res.user.admin_permissions || [],
            });
            return { success: true };
        }
        if (res?.success && !res.user?.is_platform_admin) {
            // Logged in but not an admin — logout and deny
            await apiPost(`${API}/auth/logout`);
            return { success: false, message: 'Access denied. You are not a platform administrator.' };
        }
        return { success: false, message: res?.message || 'Invalid credentials.' };
    };

    const logout = async () => {
        await fetch('/logout', {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': getCsrf() },
            credentials: 'same-origin',
        });
        setUser(null);
        window.location.href = '/admin/login';
    };

    const refreshUser = async () => {
        // Re-fetch admin list to get current user's permissions
        const res = await apiGet(`${API}/platform/admins`);
        if (res?.success) {
            // user already set via login
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

/* ─────────────────────────────────────────────────────────────
   Toast Notification
───────────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    const colors = { success: '#10b981', error: '#ef4444', info: '#6366f1' };
    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
            background: colors[type] || colors.info, color: '#fff',
            padding: '0.875rem 1.5rem', borderRadius: '10px', fontWeight: 600,
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)', fontSize: '0.9rem',
            animation: 'slideUp 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.75rem',
            maxWidth: '380px',
        }}>
            <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span>{message}</span>
        </div>
    );
}

function useToast() {
    const [toast, setToast] = useState(null);
    const show = useCallback((message, type = 'success') => {
        setToast({ message, type, id: Date.now() });
    }, []);
    const hide = useCallback(() => setToast(null), []);
    const ToastComponent = toast ? <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hide} /> : null;
    return { show, ToastComponent };
}

/* ─────────────────────────────────────────────────────────────
   Admin Login Page
───────────────────────────────────────────────────────────── */
function LoginPage() {
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && user) navigate('/admin', { replace: true });
    }, [user, loading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        const res = await login(email, password);
        if (res.success) {
            navigate('/admin', { replace: true });
        } else {
            setError(res.message);
        }
        setSubmitting(false);
    };

    if (loading) return <LoadingScreen />;

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0a0a0c',
            backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(16,185,129,0.08) 0%, transparent 50%)',
            fontFamily: "'Outfit', sans-serif",
        }}>
            <div style={{
                width: '100%', maxWidth: '420px', padding: '2.5rem',
                background: 'rgba(20,20,28,0.85)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.75rem', margin: '0 auto 1rem',
                        boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
                    }}>🛡️</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>
                        Admin Console
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.375rem' }}>
                        GlobalShop Platform Administration
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Email Address
                        </label>
                        <input
                            id="admin-login-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                            placeholder="superadmin@marketplace.com"
                            style={{
                                width: '100%', padding: '0.875rem 1rem', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#f3f4f6', fontSize: '0.925rem', outline: 'none',
                                transition: 'border-color 0.2s', boxSizing: 'border-box',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Password
                        </label>
                        <input
                            id="admin-login-password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{
                                width: '100%', padding: '0.875rem 1rem', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#f3f4f6', fontSize: '0.925rem', outline: 'none',
                                transition: 'border-color 0.2s', boxSizing: 'border-box',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#fca5a5', borderRadius: '8px', padding: '0.75rem 1rem',
                            fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        id="admin-login-btn"
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: '100%', padding: '0.9rem', borderRadius: '10px',
                            background: submitting ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                            border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                            letterSpacing: '0.025em',
                        }}
                    >
                        {submitting ? '⌛ Authenticating...' : '🔐 Sign In to Admin Panel'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#4b5563', fontSize: '0.8rem' }}>
                    Platform Administration Access Only
                </p>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Loading Screen
───────────────────────────────────────────────────────────── */
function LoadingScreen() {
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0a0a0c', fontFamily: "'Outfit', sans-serif", flexDirection: 'column', gap: '1rem',
        }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1',
                animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading Admin Console...</p>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Admin Layout — Sidebar + Header
───────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
    { id: 'dashboard', path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
    { id: 'shops', path: '/admin/shops', label: 'Shop Directory', icon: '🏢' },
    { id: 'plans', path: '/admin/plans', label: 'Subscription Plans', icon: '💳' },
    { id: 'admins', path: '/admin/admins', label: 'Admin Accounts', icon: '👥' },
    { id: 'logs', path: '/admin/logs', label: 'Audit Logs', icon: '📜' },
];

function AdminLayout({ children }) {
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
            {/* Sidebar */}
            <aside style={{
                width: sidebarOpen ? '260px' : '72px', flexShrink: 0,
                background: 'rgba(12,12,18,0.95)', backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', padding: '1.5rem 0',
                transition: 'width 0.25s ease', overflow: 'hidden',
                position: 'sticky', top: 0, height: '100vh',
            }}>
                {/* Brand */}
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

                {/* Navigation */}
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
                            onMouseEnter={e => { if (!isActive(item)) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#d1d5db'; } }}
                            onMouseLeave={e => { if (!isActive(item)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; } }}
                        >
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                            {sidebarOpen && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                {/* User profile at bottom */}
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
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                        >
                            🚪 Sign Out
                        </button>
                    </div>
                )}
            </aside>

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minWidth: 0 }}>
                {/* Topbar */}
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
                        title="Toggle Sidebar"
                    >☰</button>
                    <div style={{ flex: 1 }}>
                        <span style={{ color: '#4b5563', fontSize: '0.8rem' }}>GlobalShop / </span>
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500 }}>
                            {NAV_ITEMS.find(i => isActive(i))?.label || 'Admin Console'}
                        </span>
                    </div>
                    {/* System status badge */}
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

                {/* Page Content */}
                <main style={{ flex: 1, padding: '1.75rem', overflow: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Dashboard Page
───────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, sub }) {
    return (
        <div style={{
            background: 'rgba(20,20,28,0.6)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
            borderTop: `2px solid ${color}30`,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                    fontSize: '1.4rem', width: '44px', height: '44px', borderRadius: '12px',
                    background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{icon}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f3f4f6', letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ color: '#6b7280', fontSize: '0.825rem', fontWeight: 500 }}>{label}</div>
            {sub && <div style={{ color: color, fontSize: '0.75rem', fontWeight: 600 }}>{sub}</div>}
        </div>
    );
}

function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        async function load() {
            setLoading(true);
            const [sRes, lRes] = await Promise.all([
                apiGet(`${API}/platform/state`),
                apiGet(`${API}/platform/logs`),
            ]);
            if (sRes?.success) setStats(sRes.stats);
            if (lRes?.success) setLogs(lRes.data || []);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <PageLoader />;

    return (
        <div>
            <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>
                    Platform Overview
                </h1>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Welcome back, <strong style={{ color: '#a5b4fc' }}>{user?.name}</strong>
                </p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard icon="🏢" label="Total Shops" value={stats?.total_shops ?? '—'} color="#6366f1" />
                <StatCard icon="✅" label="Active Shops" value={stats?.active_shops ?? '—'} color="#10b981" sub="Running normally" />
                <StatCard icon="⛔" label="Suspended Shops" value={stats?.suspended_shops ?? '—'} color="#ef4444" />
                <StatCard icon="💳" label="Subscription Plans" value={stats?.total_plans ?? '—'} color="#f59e0b" />
                <StatCard icon="👥" label="Platform Admins" value={stats?.total_admins ?? '—'} color="#8b5cf6" />
                <StatCard icon="📜" label="Audit Log Entries" value={stats?.total_logs ?? '—'} color="#06b6d4" />
            </div>

            {/* Recent Logs */}
            <SectionCard title="Recent Audit Operations">
                <DataTable
                    columns={['Action', 'Description', 'Time']}
                    rows={logs.slice(0, 10).map(l => [
                        <code style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>{l.action}</code>,
                        <span style={{ color: '#d1d5db', fontSize: '0.85rem' }}>{l.description}</span>,
                        <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{new Date(l.created_at).toLocaleString()}</span>,
                    ])}
                    emptyMsg="No audit logs yet."
                />
            </SectionCard>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Shops Page
───────────────────────────────────────────────────────────── */
function ShopsPage() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editShop, setEditShop] = useState(null);
    const { show, ToastComponent } = useToast();
    const { user } = useAuth();

    const load = useCallback(async () => {
        setLoading(true);
        const res = await apiGet(`${API}/platform/shops`);
        if (res?.success) setShops(res.data || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggleSuspend = async (shop) => {
        const res = await apiPost(`${API}/platform/shops/${shop.id}/toggle-suspension`);
        if (res?.success) {
            show(`Shop "${shop.name}" is now ${res.status}.`, 'success');
            load();
        } else {
            show(res?.message || 'Action failed.', 'error');
        }
    };

    const approveShop = async (shop) => {
        const res = await apiPost(`${API}/platform/shops/${shop.id}/approve`);
        if (res?.success) {
            show(`Shop "${shop.name}" approved!`, 'success');
            load();
        } else {
            show(res?.message || 'Approval failed.', 'error');
        }
    };

    const statusBadge = (status) => {
        const cfg = {
            active: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)', label: '● Active' },
            suspended: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)', label: '● Suspended' },
            pending: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', label: '⏳ Pending' },
        };
        const c = cfg[status] || cfg.pending;
        return (
            <span style={{
                padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                background: c.bg, color: c.color, border: `1px solid ${c.border}`,
            }}>{c.label}</span>
        );
    };

    if (loading) return <PageLoader />;

    return (
        <div>
            {ToastComponent}
            <PageHeader title="Shop Directory" sub={`${shops.length} registered merchant${shops.length !== 1 ? 's' : ''}`} />

            <SectionCard>
                <DataTable
                    columns={['Shop', 'Owner', 'Plan', 'Status', 'Actions']}
                    rows={shops.map(shop => [
                        <div>
                            <div style={{ fontWeight: 600, color: '#e5e7eb' }}>{shop.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>/{shop.slug}</div>
                        </div>,
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{shop.owner?.name || '—'}</span>,
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{shop.active_subscription?.plan?.name || 'No Plan'}</span>,
                        statusBadge(shop.status),
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {shop.status === 'pending' && (
                                <ActionBtn label="Approve" color="#10b981" onClick={() => approveShop(shop)} />
                            )}
                            <ActionBtn
                                label={shop.status === 'suspended' ? 'Activate' : 'Suspend'}
                                color={shop.status === 'suspended' ? '#10b981' : '#ef4444'}
                                onClick={() => toggleSuspend(shop)}
                            />
                            <ActionBtn label="Edit" color="#6366f1" onClick={() => setEditShop({ ...shop })} />
                        </div>,
                    ])}
                    emptyMsg="No shops registered."
                />
            </SectionCard>

            {editShop && (
                <EditShopModal shop={editShop} onClose={() => setEditShop(null)} onSaved={() => { setEditShop(null); load(); show('Shop updated!'); }} />
            )}
        </div>
    );
}

function EditShopModal({ shop, onClose, onSaved }) {
    const [name, setName] = useState(shop.name);
    const [slug, setSlug] = useState(shop.slug);
    const [domain, setDomain] = useState(shop.domain || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const res = await apiPut(`${API}/platform/shops/${shop.id}`, { name, slug, domain });
        if (res?.success) {
            onSaved();
        } else {
            setError(res?.message || 'Failed to update shop.');
        }
        setSaving(false);
    };

    return (
        <Modal title="Edit Shop Details" onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Shop Name" id="edit-shop-name" value={name} onChange={e => setName(e.target.value)} required />
                <FormField label="Slug" id="edit-shop-slug" value={slug} onChange={e => setSlug(e.target.value)} required />
                <FormField label="Custom Domain (optional)" id="edit-shop-domain" value={domain} onChange={e => setDomain(e.target.value)} />
                {error && <ErrorAlert msg={error} />}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
            </form>
        </Modal>
    );
}

/* ─────────────────────────────────────────────────────────────
   Plans Page
───────────────────────────────────────────────────────────── */
function PlansPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editPlan, setEditPlan] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const { show, ToastComponent } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        const res = await apiGet(`${API}/platform/plans`);
        if (res?.success) setPlans(res.data || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return <PageLoader />;

    return (
        <div>
            {ToastComponent}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <PageHeader title="Subscription Plans" sub={`${plans.length} plan${plans.length !== 1 ? 's' : ''} configured`} inline />
                <button id="create-plan-btn" onClick={() => setShowCreate(true)} style={primaryBtnStyle}>+ New Plan</button>
            </div>

            <SectionCard>
                <DataTable
                    columns={['Plan Name', 'Price', 'Max Products', 'Max Images', 'Max Employees', 'Actions']}
                    rows={plans.map(plan => [
                        <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{plan.name}</span>,
                        <span style={{ color: '#34d399', fontWeight: 700 }}>${Number(plan.price).toFixed(2)}/mo</span>,
                        <span style={{ color: '#9ca3af' }}>{plan.limits?.max_products ?? '—'}</span>,
                        <span style={{ color: '#9ca3af' }}>{plan.limits?.max_images_per_product ?? '—'}</span>,
                        <span style={{ color: '#9ca3af' }}>{plan.limits?.max_employees ?? '—'}</span>,
                        <ActionBtn label="Edit" color="#6366f1" onClick={() => setEditPlan({ ...plan })} />,
                    ])}
                    emptyMsg="No subscription plans found."
                />
            </SectionCard>

            {(showCreate || editPlan) && (
                <PlanFormModal
                    plan={editPlan}
                    onClose={() => { setShowCreate(false); setEditPlan(null); }}
                    onSaved={() => { setShowCreate(false); setEditPlan(null); load(); show(editPlan ? 'Plan updated!' : 'Plan created!'); }}
                />
            )}
        </div>
    );
}

function PlanFormModal({ plan, onClose, onSaved }) {
    const isEdit = !!plan;
    const [form, setForm] = useState({
        name: plan?.name || '',
        price: plan?.price || '',
        max_products: plan?.limits?.max_products || '',
        max_images_per_product: plan?.limits?.max_images_per_product || '',
        max_employees: plan?.limits?.max_employees || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const body = {
            name: form.name,
            price: parseFloat(form.price),
            limits: {
                max_products: parseInt(form.max_products),
                max_images_per_product: parseInt(form.max_images_per_product),
                max_employees: parseInt(form.max_employees),
            },
        };
        const res = isEdit
            ? await apiPut(`${API}/platform/plans/${plan.id}`, body)
            : await apiPost(`${API}/platform/plans`, body);
        if (res?.success) {
            onSaved();
        } else {
            setError(res?.message || 'Failed to save plan.');
        }
        setSaving(false);
    };

    return (
        <Modal title={isEdit ? 'Edit Subscription Plan' : 'Create Subscription Plan'} onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Plan Name" id="plan-name" value={form.name} onChange={set('name')} required />
                <FormField label="Monthly Price ($)" id="plan-price" type="number" value={form.price} onChange={set('price')} required min="0" step="0.01" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormField label="Max Products" id="plan-max-products" type="number" value={form.max_products} onChange={set('max_products')} required min="1" />
                    <FormField label="Max Images/Product" id="plan-max-images" type="number" value={form.max_images_per_product} onChange={set('max_images_per_product')} required min="1" />
                    <FormField label="Max Employees" id="plan-max-employees" type="number" value={form.max_employees} onChange={set('max_employees')} required min="1" />
                </div>
                {error && <ErrorAlert msg={error} />}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving...' : (isEdit ? 'Update Plan' : 'Create Plan')}</button>
                </div>
            </form>
        </Modal>
    );
}

/* ─────────────────────────────────────────────────────────────
   Admins Page
───────────────────────────────────────────────────────────── */
const PLATFORM_PERMISSIONS_CONFIG = {
    'admin.shops': 'Shop Directory Management',
    'admin.plans': 'Subscription Plans Quotas',
    'admin.logs': 'Platform System Logs',
    'admin.admins': 'Admin Accounts Management',
};

function AdminsPage() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [permTarget, setPermTarget] = useState(null);
    const { show, ToastComponent } = useToast();
    const { user } = useAuth();

    const load = useCallback(async () => {
        setLoading(true);
        const res = await apiGet(`${API}/platform/admins`);
        if (res?.success) setAdmins(res.data || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return <PageLoader />;

    return (
        <div>
            {ToastComponent}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <PageHeader title="Admin Accounts" sub={`${admins.length} platform administrator${admins.length !== 1 ? 's' : ''}`} inline />
                {user?.isSuperAdmin && (
                    <button id="create-admin-btn" onClick={() => setShowCreate(true)} style={primaryBtnStyle}>+ Add Admin</button>
                )}
            </div>

            <SectionCard>
                <DataTable
                    columns={['Name', 'Email', 'Type', 'Permissions', 'Actions']}
                    rows={admins.map(admin => {
                        const isSuper = admin.email === 'superadmin@marketplace.com';
                        const permCount = Array.isArray(admin.admin_permissions) ? admin.admin_permissions.length : 0;
                        return [
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                    background: isSuper ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.85rem', fontWeight: 700, color: '#fff',
                                }}>{admin.name?.[0]?.toUpperCase()}</div>
                                <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{admin.name}</span>
                            </div>,
                            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{admin.email}</span>,
                            isSuper
                                ? <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.78rem' }}>⭐ SUPER ADMIN</span>
                                : <span style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.78rem' }}>PLATFORM ADMIN</span>,
                            isSuper
                                ? <span style={{ color: '#34d399', fontSize: '0.78rem' }}>All Access</span>
                                : <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{permCount}/{Object.keys(PLATFORM_PERMISSIONS_CONFIG).length} pages</span>,
                            !isSuper && user?.isSuperAdmin
                                ? <ActionBtn label="Permissions" color="#6366f1" onClick={() => setPermTarget(admin)} />
                                : <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>—</span>,
                        ];
                    })}
                    emptyMsg="No admin accounts found."
                />
            </SectionCard>

            {showCreate && (
                <CreateAdminModal
                    onClose={() => setShowCreate(false)}
                    onSaved={() => { setShowCreate(false); load(); show('Admin account created!'); }}
                />
            )}
            {permTarget && (
                <PermissionsModal
                    admin={permTarget}
                    onClose={() => setPermTarget(null)}
                    onSaved={() => { setPermTarget(null); load(); show('Permissions updated!'); }}
                />
            )}
        </div>
    );
}

function CreateAdminModal({ onClose, onSaved }) {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await apiPost(`${API}/platform/admins`, form);
        if (res?.success) onSaved();
        else setError(res?.message || 'Failed to create admin.');
        setSaving(false);
    };

    return (
        <Modal title="Create Platform Admin Account" onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Full Name" id="new-admin-name" value={form.name} onChange={set('name')} required />
                <FormField label="Email Address" id="new-admin-email" type="email" value={form.email} onChange={set('email')} required />
                <FormField label="Password" id="new-admin-password" type="password" value={form.password} onChange={set('password')} required minLength={6} />
                {error && <ErrorAlert msg={error} />}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Creating...' : 'Create Admin'}</button>
                </div>
            </form>
        </Modal>
    );
}

function PermissionsModal({ admin, onClose, onSaved }) {
    const [selected, setSelected] = useState(new Set(Array.isArray(admin.admin_permissions) ? admin.admin_permissions : []));
    const [saving, setSaving] = useState(false);

    const toggle = (key) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const save = async () => {
        setSaving(true);
        const res = await apiPut(`${API}/platform/admins/${admin.id}/permissions`, { pages: [...selected] });
        if (res?.success) onSaved();
        setSaving(false);
    };

    return (
        <Modal title={`Permissions — ${admin.name}`} onClose={onClose}>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Configure which platform pages this admin can access.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {Object.entries(PLATFORM_PERMISSIONS_CONFIG).map(([key, label]) => (
                    <label key={key} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1rem', borderRadius: '10px', cursor: 'pointer',
                        background: selected.has(key) ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${selected.has(key) ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        transition: 'all 0.15s',
                    }}>
                        <input
                            type="checkbox"
                            checked={selected.has(key)}
                            onChange={() => toggle(key)}
                            style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
                        />
                        <span style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
                        <code style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '0.7rem' }}>{key}</code>
                    </label>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                <button onClick={save} disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving...' : 'Save Permissions'}</button>
            </div>
        </Modal>
    );
}

/* ─────────────────────────────────────────────────────────────
   Logs Page
───────────────────────────────────────────────────────────── */
function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await apiGet(`${API}/platform/logs`);
            if (res?.success) setLogs(res.data || []);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <PageLoader />;

    return (
        <div>
            <PageHeader title="Audit Trail" sub={`${logs.length} recent log entries`} />

            <SectionCard>
                <DataTable
                    columns={['Action', 'Description', 'Shop', 'Performed By', 'Time']}
                    rows={logs.map(l => [
                        <code style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>{l.action}</code>,
                        <span style={{ color: '#d1d5db', fontSize: '0.85rem' }}>{l.description}</span>,
                        <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{l.shop_id ? `#${l.shop_id}` : '—'}</span>,
                        <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{l.user_id ? `User #${l.user_id}` : '—'}</span>,
                        <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{new Date(l.created_at).toLocaleString()}</span>,
                    ])}
                    emptyMsg="No audit logs recorded."
                />
            </SectionCard>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Shared UI Primitives
───────────────────────────────────────────────────────────── */
function PageLoader() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '0.75rem' }}>
            <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1',
                animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</span>
        </div>
    );
}

function PageHeader({ title, sub, inline }) {
    if (inline) return (
        <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>{title}</h1>
            {sub && <p style={{ color: '#6b7280', fontSize: '0.825rem', margin: '0.25rem 0 0' }}>{sub}</p>}
        </div>
    );
    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>{title}</h1>
            {sub && <p style={{ color: '#6b7280', fontSize: '0.825rem', marginTop: '0.25rem' }}>{sub}</p>}
        </div>
    );
}

function SectionCard({ title, children }) {
    return (
        <div style={{
            background: 'rgba(18,18,25,0.7)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px', overflow: 'hidden',
        }}>
            {title && (
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#d1d5db', margin: 0 }}>{title}</h2>
                </div>
            )}
            <div style={{ padding: title ? '0' : '0' }}>{children}</div>
        </div>
    );
}

function DataTable({ columns, rows, emptyMsg }) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} style={{
                                padding: '0.75rem 1.25rem', textAlign: 'left',
                                fontSize: '0.75rem', fontWeight: 700, color: '#6b7280',
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                whiteSpace: 'nowrap',
                            }}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} style={{ padding: '2.5rem', textAlign: 'center', color: '#4b5563', fontSize: '0.875rem' }}>
                                {emptyMsg || 'No data.'}
                            </td>
                        </tr>
                    ) : rows.map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            {row.map((cell, ci) => (
                                <td key={ci} style={{ padding: '0.875rem 1.25rem', verticalAlign: 'middle' }}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Modal({ title, onClose, children }) {
    return (
        <>
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000,
                backdropFilter: 'blur(4px)',
            }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 1001, width: '100%', maxWidth: '480px',
                background: 'rgba(18,18,28,0.97)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '16px', padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                fontFamily: "'Outfit', sans-serif",
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f3f4f6', margin: 0 }}>{title}</h3>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af',
                        width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem',
                    }}>✕</button>
                </div>
                {children}
            </div>
        </>
    );
}

function FormField({ label, id, type = 'text', value, onChange, required, min, step, minLength }) {
    return (
        <div>
            <label htmlFor={id} style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {label}
            </label>
            <input
                id={id} type={type} value={value} onChange={onChange} required={required}
                min={min} step={step} minLength={minLength}
                style={{
                    width: '100%', padding: '0.75rem 0.875rem', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f3f4f6', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: "'Outfit', sans-serif",
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
        </div>
    );
}

function ActionBtn({ label, color, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '0.35rem 0.85rem', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 700,
                background: `${color}15`, border: `1px solid ${color}30`, color: color,
                cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${color}28`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${color}15`; }}
        >
            {label}
        </button>
    );
}

function ErrorAlert({ msg }) {
    return (
        <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5', borderRadius: '8px', padding: '0.65rem 1rem', fontSize: '0.85rem',
        }}>⚠️ {msg}</div>
    );
}

const primaryBtnStyle = {
    padding: '0.65rem 1.25rem', borderRadius: '9px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', fontWeight: 700, fontSize: '0.875rem', border: 'none', cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif", letterSpacing: '0.02em',
    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
};
const ghostBtnStyle = {
    padding: '0.65rem 1.25rem', borderRadius: '9px', background: 'transparent',
    color: '#9ca3af', fontWeight: 600, fontSize: '0.875rem',
    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
};

/* ─────────────────────────────────────────────────────────────
   Protected Route Wrapper
───────────────────────────────────────────────────────────── */
function RequireAdmin({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />;
    return children;
}

/* ─────────────────────────────────────────────────────────────
   Global CSS Animations
───────────────────────────────────────────────────────────── */
const globalStyles = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; background: #0a0a0c; }
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { opacity: 1; }
`;

/* ─────────────────────────────────────────────────────────────
   Root App
───────────────────────────────────────────────────────────── */
export default function AdminApp() {
    return (
        <>
            <style>{globalStyles}</style>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        {/* Public Admin Login */}
                        <Route path="/admin/login" element={<LoginPage />} />

                        {/* Protected Admin Panel */}
                        <Route path="/admin" element={
                            <RequireAdmin>
                                <AdminLayout><DashboardPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/shops" element={
                            <RequireAdmin>
                                <AdminLayout><ShopsPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/plans" element={
                            <RequireAdmin>
                                <AdminLayout><PlansPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/admins" element={
                            <RequireAdmin>
                                <AdminLayout><AdminsPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/logs" element={
                            <RequireAdmin>
                                <AdminLayout><LogsPage /></AdminLayout>
                            </RequireAdmin>
                        } />

                        {/* Fallback: unknown /admin/* routes go to dashboard */}
                        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </>
    );
}
