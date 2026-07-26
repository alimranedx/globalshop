import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';

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

async function apiDelete(url) {
    try {
        const r = await fetch(url, {
            method: 'DELETE',
            headers: { Accept: 'application/json', 'X-CSRF-TOKEN': getCsrf() },
            credentials: 'same-origin',
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

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

/* ─────────────────────────────────────────────────────────────
   Toast Notification Component
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
            maxWidth: '400px',
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
   Custom Confirmation Modal (No browser alert)
───────────────────────────────────────────────────────────── */
function ConfirmModal({ title, message, confirmText = 'Confirm', confirmColor = '#ef4444', onClose, onConfirm }) {
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        setSubmitting(true);
        await onConfirm();
        setSubmitting(false);
    };

    return (
        <Modal title={title || 'Confirm Action'} onClose={onClose}>
            <p style={{ color: '#d1d5db', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                {message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} style={ghostBtnStyle} disabled={submitting}>Cancel</button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={submitting}
                    style={{
                        padding: '0.65rem 1.25rem', borderRadius: '9px', background: confirmColor,
                        color: '#fff', fontWeight: 700, fontSize: '0.875rem', border: 'none', cursor: 'pointer',
                        fontFamily: "'Outfit', sans-serif", opacity: submitting ? 0.7 : 1,
                    }}
                >
                    {submitting ? 'Processing...' : confirmText}
                </button>
            </div>
        </Modal>
    );
}

/* ─────────────────────────────────────────────────────────────
   Status Badge Utility
───────────────────────────────────────────────────────────── */
function ShopStatusBadge({ status }) {
    const configs = {
        active: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)', label: '● Active' },
        ready_for_handover: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)', label: '✨ Ready for Handover' },
        setup_in_progress: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', label: '⚙️ Setup in Progress' },
        draft: { bg: 'rgba(156,163,175,0.12)', color: '#9ca3af', border: 'rgba(156,163,175,0.25)', label: '📝 Draft' },
        suspended: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)', label: '⛔ Suspended' },
        pending: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', label: '⏳ Pending' },
    };
    const c = configs[status] || configs.draft;
    return (
        <span style={{
            padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
            background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap',
        }}>{c.label}</span>
    );
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

    if (loading) return <PageLoader />;

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
                                boxSizing: 'border-box',
                            }}
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
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {error && <ErrorAlert msg={error} />}

                    <button
                        id="admin-login-btn"
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: '100%', padding: '0.9rem', borderRadius: '10px',
                            background: submitting ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                            border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                        }}
                    >
                        {submitting ? '⌛ Authenticating...' : '🔐 Sign In to Admin Panel'}
                    </button>
                </form>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Admin Layout Component
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard icon="🏢" label="Total Shops" value={stats?.total_shops ?? '—'} color="#6366f1" />
                <StatCard icon="✅" label="Active Shops" value={stats?.active_shops ?? '—'} color="#10b981" sub="Running normally" />
                <StatCard icon="⛔" label="Suspended Shops" value={stats?.suspended_shops ?? '—'} color="#ef4444" />
                <StatCard icon="💳" label="Subscription Plans" value={stats?.total_plans ?? '—'} color="#f59e0b" />
                <StatCard icon="👥" label="Platform Admins" value={stats?.total_admins ?? '—'} color="#8b5cf6" />
                <StatCard icon="📜" label="Audit Log Entries" value={stats?.total_logs ?? '—'} color="#06b6d4" />
            </div>

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
   Shop Directory Page (/admin/shops)
───────────────────────────────────────────────────────────── */
function ShopsPage() {
    const [shops, setShops] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [showWizard, setShowWizard] = useState(false);
    const [editShop, setEditShop] = useState(null);
    const [deleteShopTarget, setDeleteShopTarget] = useState(null);
    const { show, ToastComponent } = useToast();
    const navigate = useNavigate();

    const loadShops = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (statusFilter) params.append('status', statusFilter);
        if (planFilter) params.append('plan_id', planFilter);

        const [sRes, pRes] = await Promise.all([
            apiGet(`${API}/platform/shops?${params.toString()}`),
            apiGet(`${API}/platform/plans`),
        ]);
        if (sRes?.success) setShops(sRes.data || []);
        if (pRes?.success) setPlans(pRes.data || []);
        setLoading(false);
    }, [search, statusFilter, planFilter]);

    useEffect(() => {
        const timer = setTimeout(() => { loadShops(); }, 250);
        return () => clearTimeout(timer);
    }, [loadShops]);

    const toggleSuspend = async (shop) => {
        const res = await apiPost(`${API}/platform/shops/${shop.id}/toggle-suspension`);
        if (res?.success) {
            show(`Shop "${shop.name}" status updated to ${res.status}.`, 'success');
            loadShops();
        } else {
            show(res?.message || 'Action failed.', 'error');
        }
    };

    const handleDeleteShop = async () => {
        if (!deleteShopTarget) return;
        const res = await apiDelete(`${API}/platform/shops/${deleteShopTarget.id}`);
        if (res?.success) {
            show(`Shop "${deleteShopTarget.name}" deleted successfully.`);
            setDeleteShopTarget(null);
            loadShops();
        } else {
            show(res?.message || 'Failed to delete shop.', 'error');
        }
    };

    return (
        <div>
            {ToastComponent}
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>Shop Directory</h1>
                    <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Manage, provision, and configure SaaS merchant shops
                    </p>
                </div>
                <button
                    id="btn-create-shop-wizard"
                    onClick={() => setShowWizard(true)}
                    style={{
                        padding: '0.75rem 1.4rem', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                        border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                        boxShadow: '0 4px 18px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                >
                    <span>✨</span>
                    <span>Create & Provision Shop</span>
                </button>
            </div>

            {/* Controls Bar */}
            <div style={{
                background: 'rgba(18,18,25,0.7)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem',
                display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center',
            }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                    <input
                        type="text"
                        placeholder="Search shops by name, slug, or owner..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '0.7rem 1rem', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f3f4f6', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                </div>
                <div style={{ width: '180px' }}>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{
                            width: '100%', padding: '0.7rem 1rem', borderRadius: '8px',
                            background: '#141419', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f3f4f6', fontSize: '0.875rem', outline: 'none', cursor: 'pointer',
                        }}
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">📝 Draft</option>
                        <option value="setup_in_progress">⚙️ Setup in Progress</option>
                        <option value="ready_for_handover">✨ Ready for Handover</option>
                        <option value="active">● Active</option>
                        <option value="suspended">⛔ Suspended</option>
                        <option value="pending">⏳ Pending</option>
                    </select>
                </div>
                <div style={{ width: '180px' }}>
                    <select
                        value={planFilter}
                        onChange={e => setPlanFilter(e.target.value)}
                        style={{
                            width: '100%', padding: '0.7rem 1rem', borderRadius: '8px',
                            background: '#141419', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f3f4f6', fontSize: '0.875rem', outline: 'none', cursor: 'pointer',
                        }}
                    >
                        <option value="">All Subscription Plans</option>
                        {plans.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <SectionCard>
                {loading ? <PageLoader /> : (
                    <DataTable
                        columns={['Shop Name', 'Owner', 'Plan', 'Setup Progress', 'Status', 'Actions']}
                        rows={shops.map(shop => [
                            <div>
                                <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.925rem' }}>{shop.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6366f1' }}>/{shop.slug}</div>
                            </div>,
                            <div>
                                <div style={{ color: '#e5e7eb', fontSize: '0.85rem', fontWeight: 500 }}>{shop.owner?.name || 'Unassigned'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{shop.owner?.email || '—'}</div>
                            </div>,
                            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{shop.active_subscription?.plan?.name || 'No Plan'}</span>,
                            <div style={{ minWidth: '140px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                                    <span>Progress</span>
                                    <span style={{ fontWeight: 700, color: '#a5b4fc' }}>{shop.setup_progress ?? 0}%</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${shop.setup_progress ?? 0}%`, height: '100%',
                                        background: (shop.setup_progress ?? 0) === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                        transition: 'width 0.3s ease',
                                    }} />
                                </div>
                            </div>,
                            <ShopStatusBadge status={shop.status} />,
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <ActionBtn label="⚙️ Manage Hub" color="#6366f1" onClick={() => navigate(`/admin/shops/${shop.id}/manage`)} />
                                <ActionBtn label="Edit" color="#a5b4fc" onClick={() => setEditShop({ ...shop })} />
                                <ActionBtn
                                    label={shop.status === 'suspended' ? 'Activate' : 'Suspend'}
                                    color={shop.status === 'suspended' ? '#10b981' : '#f59e0b'}
                                    onClick={() => toggleSuspend(shop)}
                                />
                                <ActionBtn label="Delete" color="#ef4444" onClick={() => setDeleteShopTarget(shop)} />
                            </div>,
                        ])}
                        emptyMsg="No matching shops found."
                    />
                )}
            </SectionCard>

            {/* Create Shop Wizard */}
            {showWizard && (
                <CreateShopWizardModal
                    plans={plans}
                    onClose={() => setShowWizard(false)}
                    onCreated={(newShop) => {
                        setShowWizard(false);
                        loadShops();
                        show(`Shop "${newShop.name}" created successfully!`, 'success');
                        navigate(`/admin/shops/${newShop.id}/manage`);
                    }}
                />
            )}

            {/* Edit Shop Details Modal */}
            {editShop && (
                <EditShopModal
                    shop={editShop}
                    onClose={() => setEditShop(null)}
                    onSaved={() => { setEditShop(null); loadShops(); show('Shop updated successfully!'); }}
                />
            )}

            {/* Custom Confirm Delete Modal */}
            {deleteShopTarget && (
                <ConfirmModal
                    title={`Delete Shop "${deleteShopTarget.name}"?`}
                    message={`Are you sure you want to soft-delete shop "${deleteShopTarget.name}"? All shop data will be archived safely.`}
                    confirmText="Yes, Delete Shop"
                    confirmColor="#ef4444"
                    onClose={() => setDeleteShopTarget(null)}
                    onConfirm={handleDeleteShop}
                />
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Multi-Step Create Shop Provisioning Wizard Modal
───────────────────────────────────────────────────────────── */
function CreateShopWizardModal({ plans, onClose, onCreated }) {
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [userOptions, setUserOptions] = useState([]);

    // Wizard Form State
    const [form, setForm] = useState({
        // Step 1: Info
        name: '', slug: '', domain: '', logo_url: '', email: '', phone: '', address: '', city: '', country: '', currency: 'USD', timezone: 'UTC',
        // Step 2: Owner
        owner_type: 'create', // 'select' or 'create'
        owner_id: '', owner_name: '', owner_email: '', owner_password: 'password',
        // Step 3: Subscription
        plan_id: plans[0]?.id || '',
        // Step 7: Initial Status
        status: 'draft',
    });

    useEffect(() => {
        async function fetchUsers() {
            const res = await apiGet(`${API}/platform/users`);
            if (res?.success) setUserOptions(res.data || []);
        }
        fetchUsers();
    }, []);

    const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleAutoSlug = (nameVal) => {
        updateForm('name', nameVal);
        if (!form.slug) {
            const autoSlug = nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            updateForm('slug', autoSlug);
        }
    };

    const handleComplete = async () => {
        setSaving(true);
        setError('');
        const payload = { ...form };
        if (payload.owner_type === 'select') {
            delete payload.owner_name;
            delete payload.owner_email;
            delete payload.owner_password;
        } else {
            delete payload.owner_id;
        }

        const res = await apiPost(`${API}/platform/shops`, payload);
        if (res?.success) {
            onCreated(res.data);
        } else {
            setError(res?.message || 'Shop creation failed.');
        }
        setSaving(false);
    };

    const WIZARD_STEPS = [
        { num: 1, title: 'Shop Info' },
        { num: 2, title: 'Shop Owner' },
        { num: 3, title: 'Subscription' },
        { num: 4, title: 'Review & Create' },
    ];

    return (
        <Modal title="✨ Create & Provision New Shop Wizard" onClose={onClose} maxWidth="600px">
            {/* Step Indicator Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                {WIZARD_STEPS.map(s => (
                    <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: step === s.num ? '#6366f1' : step > s.num ? '#10b981' : 'rgba(255,255,255,0.1)',
                            color: '#fff', fontSize: '0.8rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {step > s.num ? '✓' : s.num}
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: step === s.num ? 700 : 500, color: step === s.num ? '#f3f4f6' : '#6b7280' }}>
                            {s.title}
                        </span>
                    </div>
                ))}
            </div>

            {/* STEP 1: Shop Information */}
            {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <FormField label="Shop Name *" id="wiz-name" value={form.name} onChange={e => handleAutoSlug(e.target.value)} required placeholder="e.g. Apex Electronics" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FormField label="URL Slug (Subdomain) *" id="wiz-slug" value={form.slug} onChange={e => updateForm('slug', e.target.value)} required placeholder="apex" />
                        <FormField label="Custom Domain" id="wiz-domain" value={form.domain} onChange={e => updateForm('domain', e.target.value)} placeholder="apex.com" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FormField label="Shop Email" id="wiz-email" type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="contact@apex.com" />
                        <FormField label="Shop Phone" id="wiz-phone" value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="+1 555-0192" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FormField label="Currency" id="wiz-currency" value={form.currency} onChange={e => updateForm('currency', e.target.value)} placeholder="USD" />
                        <FormField label="Timezone" id="wiz-tz" value={form.timezone} onChange={e => updateForm('timezone', e.target.value)} placeholder="UTC" />
                    </div>
                </div>
            )}

            {/* STEP 2: Shop Owner */}
            {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input type="radio" name="owner_type" checked={form.owner_type === 'create'} onChange={() => updateForm('owner_type', 'create')} style={{ accentColor: '#6366f1' }} />
                            <span>Create New Shop Owner Account</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input type="radio" name="owner_type" checked={form.owner_type === 'select'} onChange={() => updateForm('owner_type', 'select')} style={{ accentColor: '#6366f1' }} />
                            <span>Select Existing User</span>
                        </label>
                    </div>

                    {form.owner_type === 'create' ? (
                        <>
                            <FormField label="Owner Full Name *" id="wiz-owner-name" value={form.owner_name} onChange={e => updateForm('owner_name', e.target.value)} required placeholder="John Owner" />
                            <FormField label="Owner Email Address *" id="wiz-owner-email" type="email" value={form.owner_email} onChange={e => updateForm('owner_email', e.target.value)} required placeholder="john@apex.com" />
                            <FormField label="Initial Password *" id="wiz-owner-pass" type="password" value={form.owner_password} onChange={e => updateForm('owner_password', e.target.value)} required minLength={6} />
                        </>
                    ) : (
                        <div>
                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                                Select User Account *
                            </label>
                            <select
                                value={form.owner_id}
                                onChange={e => updateForm('owner_id', e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '8px',
                                    background: '#141419', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff', fontSize: '0.9rem', outline: 'none',
                                }}
                            >
                                <option value="">Select a user...</option>
                                {userOptions.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 3: Subscription Plan */}
            {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>Select Active Subscription Plan</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {plans.map(p => (
                            <label key={p.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '1rem', borderRadius: '10px', cursor: 'pointer',
                                background: form.plan_id == p.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${form.plan_id == p.id ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <input type="radio" name="plan_id" value={p.id} checked={form.plan_id == p.id} onChange={e => updateForm('plan_id', e.target.value)} style={{ accentColor: '#6366f1' }} />
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#f3f4f6' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Max {p.limits?.max_products} Products | Max {p.limits?.max_employees} Staff</div>
                                    </div>
                                </div>
                                <span style={{ fontWeight: 700, color: '#34d399' }}>${Number(p.price).toFixed(2)}/mo</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* STEP 4: Review & Complete */}
            {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <div><strong style={{ color: '#6366f1' }}>Shop Name:</strong> {form.name || '—'}</div>
                        <div><strong style={{ color: '#6366f1' }}>Slug URL:</strong> /{form.slug || '—'}</div>
                        <div><strong style={{ color: '#6366f1' }}>Owner:</strong> {form.owner_type === 'create' ? form.owner_email : userOptions.find(u => u.id == form.owner_id)?.email || '—'}</div>
                        <div><strong style={{ color: '#6366f1' }}>Subscription Plan:</strong> {plans.find(p => p.id == form.plan_id)?.name || 'Default'}</div>
                    </div>

                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                            Set Initial Handover Status
                        </label>
                        <select
                            value={form.status}
                            onChange={e => updateForm('status', e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                background: '#141419', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: '0.9rem', outline: 'none',
                            }}
                        >
                            <option value="draft">📝 Draft (Super Admin Setup Only)</option>
                            <option value="setup_in_progress">⚙️ Setup in Progress</option>
                            <option value="ready_for_handover">✨ Ready for Handover (Owner Access Ready)</option>
                            <option value="active">● Active Immediately</option>
                        </select>
                    </div>

                    {error && <ErrorAlert msg={error} />}
                </div>
            )}

            {/* Navigation Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {step > 1 ? (
                    <button type="button" onClick={() => setStep(s => s - 1)} style={ghostBtnStyle}>← Back</button>
                ) : <div />}

                {step < 4 ? (
                    <button
                        type="button"
                        onClick={() => {
                            if (step === 1 && !form.name) return setError('Shop Name is required.');
                            setError('');
                            setStep(s => s + 1);
                        }}
                        style={primaryBtnStyle}
                    >
                        Next Step →
                    </button>
                ) : (
                    <button type="button" onClick={handleComplete} disabled={saving} style={primaryBtnStyle}>
                        {saving ? 'Provisioning Shop...' : '🚀 Complete & Provision Shop'}
                    </button>
                )}
            </div>
        </Modal>
    );
}

/* ─────────────────────────────────────────────────────────────
   Centralized Shop Management Hub (/admin/shops/:shopId/manage)
───────────────────────────────────────────────────────────── */
function ShopHubPage() {
    const { shopId } = useParams();
    const navigate = useNavigate();
    const [hubData, setHubData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const { show, ToastComponent } = useToast();

    // Modals in Hub
    const [showEditInfo, setShowEditInfo] = useState(false);
    const [showAssignOwner, setShowAssignOwner] = useState(false);
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [showAddRole, setShowAddRole] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [rolePermTarget, setRolePermTarget] = useState(null);

    const loadHubData = useCallback(async () => {
        setLoading(true);
        const res = await apiGet(`${API}/platform/shops/${shopId}`);
        if (res?.success) setHubData(res.data);
        setLoading(false);
    }, [shopId]);

    useEffect(() => { loadHubData(); }, [loadHubData]);

    const handleHandoverStatusChange = async (newStatus) => {
        const res = await apiPost(`${API}/platform/shops/${shopId}/handover`, { status: newStatus });
        if (res?.success) {
            show(`Shop status updated to ${newStatus}!`, 'success');
            loadHubData();
        } else {
            show(res?.message || 'Failed to update status.', 'error');
        }
    };

    if (loading) return <PageLoader />;
    if (!hubData?.shop) return <div style={{ color: '#ef4444' }}>Shop not found.</div>;

    const shop = hubData.shop;
    const checklist = hubData.setup_checklist || [];
    const progress = hubData.setup_progress || 0;

    return (
        <div>
            {ToastComponent}

            {/* Top Navigation Back Button */}
            <div style={{ marginBottom: '1rem' }}>
                <button onClick={() => navigate('/admin/shops')} style={ghostBtnStyle}>
                    ← Back to Shop Directory
                </button>
            </div>

            {/* Shop Hub Header Banner */}
            <div style={{
                background: 'rgba(20,20,28,0.85)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '16px', padding: '1.75rem', marginBottom: '1.75rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.75rem', fontWeight: 800, color: '#fff',
                        boxShadow: '0 8px 25px rgba(99,102,241,0.3)',
                    }}>
                        {shop.name[0]?.toUpperCase()}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f3f4f6', margin: 0 }}>{shop.name}</h1>
                            <ShopStatusBadge status={shop.status} />
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.35rem', display: 'flex', gap: '1rem' }}>
                            <span>Slug: <strong style={{ color: '#a5b4fc' }}>/{shop.slug}</strong></span>
                            <span>Owner: <strong style={{ color: '#e5e7eb' }}>{shop.owner?.name || 'Unassigned'}</strong></span>
                            <span>Plan: <strong style={{ color: '#34d399' }}>{shop.active_subscription?.plan?.name || 'No Plan'}</strong></span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Change Handover Status:</div>
                        <select
                            value={shop.status}
                            onChange={e => handleHandoverStatusChange(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem', borderRadius: '8px',
                                background: '#141419', border: '1px solid rgba(99,102,241,0.4)',
                                color: '#fff', fontSize: '0.875rem', fontWeight: 600, outline: 'none', cursor: 'pointer',
                            }}
                        >
                            <option value="draft">📝 Draft</option>
                            <option value="setup_in_progress">⚙️ Setup in Progress</option>
                            <option value="ready_for_handover">✨ Ready for Handover</option>
                            <option value="active">● Active</option>
                            <option value="suspended">⛔ Suspended</option>
                        </select>
                    </div>

                    {shop.status !== 'ready_for_handover' && shop.status !== 'active' && (
                        <button
                            onClick={() => handleHandoverStatusChange('ready_for_handover')}
                            style={{
                                padding: '0.7rem 1.2rem', borderRadius: '10px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#fff', fontWeight: 700, fontSize: '0.875rem', border: 'none', cursor: 'pointer',
                            }}
                        >
                            ✨ Mark Ready for Handover
                        </button>
                    )}
                </div>
            </div>

            {/* Setup Progress & Checklist Banner */}
            <div style={{
                background: 'rgba(18,18,25,0.7)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '1.75rem',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>
                        Shop Provisioning Progress: <span style={{ color: progress === 100 ? '#10b981' : '#a5b4fc' }}>{progress}% Complete</span>
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{checklist.filter(c => c.completed).length}/{checklist.length} items configured</span>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{
                        width: `${progress}%`, height: '100%',
                        background: progress === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                        transition: 'width 0.4s ease',
                    }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem' }}>
                    {checklist.map(item => (
                        <div key={item.key} style={{
                            padding: '0.65rem 0.85rem', borderRadius: '8px',
                            background: item.completed ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${item.completed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem',
                        }}>
                            <span style={{ color: item.completed ? '#10b981' : '#6b7280', fontWeight: 700 }}>{item.completed ? '✓' : '○'}</span>
                            <span style={{ color: item.completed ? '#e5e7eb' : '#9ca3af', fontWeight: 500 }}>{item.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Action Navigation Tabs */}
            <div style={{
                display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
                marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem',
            }}>
                {[
                    { id: 'overview', label: '📌 Shop Info' },
                    { id: 'owner', label: '👤 Shop Owner' },
                    { id: 'employees', label: `👥 Employees (${hubData.counts?.employees || 0})` },
                    { id: 'roles', label: `🛡️ Roles & Permissions (${hubData.counts?.roles || 0})` },
                    { id: 'products', label: `📦 Products (${hubData.counts?.products || 0})` },
                    { id: 'logs', label: '📜 Audit Logs' },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        style={{
                            padding: '0.65rem 1.1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: activeTab === t.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                            color: activeTab === t.id ? '#a5b4fc' : '#6b7280',
                            fontWeight: activeTab === t.id ? 700 : 500, fontSize: '0.875rem',
                            whiteSpace: 'nowrap', transition: 'all 0.15s',
                            borderBottom: activeTab === t.id ? '2px solid #6366f1' : '2px solid transparent',
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT 1: Shop Overview & Info */}
            {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <SectionCard title="Basic Identity & Location Settings">
                        <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', fontSize: '0.875rem' }}>
                            <div><div style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Shop Name</div><div style={{ fontWeight: 600, color: '#fff' }}>{shop.name}</div></div>
                            <div><div style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Subdomain (Slug)</div><div style={{ fontWeight: 600, color: '#a5b4fc' }}>/{shop.slug}</div></div>
                            <div><div style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Custom Domain</div><div style={{ fontWeight: 600, color: '#fff' }}>{shop.domain || 'Not configured'}</div></div>
                            <div><div style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Contact Email</div><div style={{ fontWeight: 600, color: '#fff' }}>{shop.email || '—'}</div></div>
                            <div><div style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Phone</div><div style={{ fontWeight: 600, color: '#fff' }}>{shop.phone || '—'}</div></div>
                            <div><div style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Currency</div><div style={{ fontWeight: 600, color: '#34d399' }}>{shop.currency || 'USD'}</div></div>
                            <div><div style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Timezone</div><div style={{ fontWeight: 600, color: '#fff' }}>{shop.timezone || 'UTC'}</div></div>
                            <div><div style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Refund Window</div><div style={{ fontWeight: 600, color: '#fff' }}>{shop.refund_window_days || 30} Days</div></div>
                        </div>
                        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowEditInfo(true)} style={primaryBtnStyle}>Edit Shop Details</button>
                        </div>
                    </SectionCard>
                </div>
            )}

            {/* TAB CONTENT 2: Shop Owner */}
            {activeTab === 'owner' && (
                <SectionCard title="Assigned Shop Owner">
                    <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.3rem', fontWeight: 800, color: '#fff',
                            }}>
                                {shop.owner?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6' }}>{shop.owner?.name || 'No Owner Assigned'}</div>
                                <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{shop.owner?.email || 'Assign an owner to give access'}</div>
                            </div>
                        </div>
                        <button onClick={() => setShowAssignOwner(true)} style={primaryBtnStyle}>
                            {shop.owner ? 'Reassign / Change Owner' : '+ Assign Owner'}
                        </button>
                    </div>
                </SectionCard>
            )}

            {/* TAB CONTENT 3: Employees Management */}
            {activeTab === 'employees' && (
                <ShopEmployeesTab shop={shop} onRefresh={loadHubData} showToast={show} />
            )}

            {/* TAB CONTENT 4: Roles & Permissions */}
            {activeTab === 'roles' && (
                <ShopRolesTab shop={shop} onRefresh={loadHubData} showToast={show} />
            )}

            {/* TAB CONTENT 5: Products Catalog */}
            {activeTab === 'products' && (
                <ShopProductsTab shop={shop} onRefresh={loadHubData} showToast={show} />
            )}

            {/* TAB CONTENT 6: Audit Logs */}
            {activeTab === 'logs' && (
                <ShopLogsTab shop={shop} />
            )}

            {/* Edit Info Modal */}
            {showEditInfo && (
                <EditShopModal shop={shop} onClose={() => setShowEditInfo(false)} onSaved={() => { setShowEditInfo(false); loadHubData(); show('Shop details updated!'); }} />
            )}

            {/* Assign Owner Modal */}
            {showAssignOwner && (
                <AssignOwnerModal shop={shop} onClose={() => setShowAssignOwner(false)} onSaved={() => { setShowAssignOwner(false); loadHubData(); show('Shop owner updated!'); }} />
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Shop Hub Sub-Tab: Employees Management
───────────────────────────────────────────────────────────── */
function ShopEmployeesTab({ shop, onRefresh, showToast }) {
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editEmp, setEditEmp] = useState(null);
    const [removeEmpTarget, setRemoveEmpTarget] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [eRes, rRes] = await Promise.all([
            apiGet(`${API}/platform/shops/${shop.id}/employees`),
            apiGet(`${API}/platform/shops/${shop.id}/roles`),
        ]);
        if (eRes?.success) setEmployees(eRes.data || []);
        if (rRes?.success) setRoles(rRes.data || []);
        setLoading(false);
    }, [shop.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleRemove = async () => {
        if (!removeEmpTarget) return;
        const res = await apiDelete(`${API}/platform/shops/${shop.id}/employees/${removeEmpTarget.id}`);
        if (res?.success) {
            showToast('Employee removed from shop.');
            setRemoveEmpTarget(null);
            loadData();
            onRefresh();
        } else {
            showToast(res?.message || 'Failed to remove employee.', true);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>Staff & Employee Roster</h2>
                <button onClick={() => setShowAdd(true)} style={primaryBtnStyle}>+ Add Employee</button>
            </div>

            <SectionCard>
                <DataTable
                    columns={['Name', 'Email', 'Assigned Role', 'Status', 'Actions']}
                    rows={employees.map(emp => [
                        <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{emp.name}</span>,
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{emp.email}</span>,
                        <span style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.85rem' }}>{emp.role_name || 'Staff'}</span>,
                        emp.pivot_status === 'active'
                            ? <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.78rem' }}>● Active</span>
                            : <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.78rem' }}>Deactivated</span>,
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <ActionBtn label="Edit Role / Status" color="#6366f1" onClick={() => setEditEmp(emp)} />
                            <ActionBtn label="Remove" color="#ef4444" onClick={() => setRemoveEmpTarget(emp)} />
                        </div>,
                    ])}
                    emptyMsg="No employees added to this shop yet."
                />
            </SectionCard>

            {showAdd && (
                <AddEmployeeModal shop={shop} roles={roles} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadData(); onRefresh(); showToast('Employee added!'); }} />
            )}
            {editEmp && (
                <EditEmployeeModal shop={shop} roles={roles} employee={editEmp} onClose={() => setEditEmp(null)} onSaved={() => { setEditEmp(null); loadData(); showToast('Employee updated!'); }} />
            )}
            {removeEmpTarget && (
                <ConfirmModal
                    title={`Remove ${removeEmpTarget.name}?`}
                    message={`Are you sure you want to remove ${removeEmpTarget.name} (${removeEmpTarget.email}) from Shop "${shop.name}"?`}
                    confirmText="Yes, Remove"
                    onClose={() => setRemoveEmpTarget(null)}
                    onConfirm={handleRemove}
                />
            )}
        </div>
    );
}

function AddEmployeeModal({ shop, roles, onClose, onSaved }) {
    const [form, setForm] = useState({ name: '', email: '', password: 'password', role_id: roles[0]?.id || '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await apiPost(`${API}/platform/shops/${shop.id}/employees`, form);
        if (res?.success) onSaved();
        else setError(res?.message || 'Failed to add employee.');
        setSaving(false);
    };

    return (
        <Modal title="Add Staff Member to Shop" onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Full Name" id="emp-name" value={form.name} onChange={set('name')} required placeholder="Bob Manager" />
                <FormField label="Email Address" id="emp-email" type="email" value={form.email} onChange={set('email')} required placeholder="bob@alpha.com" />
                <FormField label="Initial Password" id="emp-pass" type="password" value={form.password} onChange={set('password')} required minLength={6} />
                <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Assign Role *</label>
                    <select value={form.role_id} onChange={set('role_id')} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                {error && <ErrorAlert msg={error} />}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Adding...' : 'Add Employee'}</button>
                </div>
            </form>
        </Modal>
    );
}

function EditEmployeeModal({ shop, roles, employee, onClose, onSaved }) {
    const [roleId, setRoleId] = useState(employee.role_id || roles[0]?.id || '');
    const [status, setStatus] = useState(employee.pivot_status || 'active');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const body = { role_id: roleId, status };
        if (password) body.password = password;

        const res = await apiPut(`${API}/platform/shops/${shop.id}/employees/${employee.id}`, body);
        if (res?.success) onSaved();
        setSaving(false);
    };

    return (
        <Modal title={`Edit ${employee.name}`} onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Shop Role</label>
                    <select value={roleId} onChange={e => setRoleId(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                        <option value="active">● Active</option>
                        <option value="deactivated">Deactivated</option>
                    </select>
                </div>
                <FormField label="Reset Password (optional)" id="emp-reset-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep unchanged" />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving...' : 'Save Employee'}</button>
                </div>
            </form>
        </Modal>
    );
}

/* ─────────────────────────────────────────────────────────────
   Shop Hub Sub-Tab: Roles & Page Permissions
───────────────────────────────────────────────────────────── */
function ShopRolesTab({ shop, onRefresh, showToast }) {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [permRole, setPermRole] = useState(null);
    const [deleteRoleTarget, setDeleteRoleTarget] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        const res = await apiGet(`${API}/platform/shops/${shop.id}/roles`);
        if (res?.success) setRoles(res.data || []);
        setLoading(false);
    }, [shop.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDeleteRole = async () => {
        if (!deleteRoleTarget) return;
        const res = await apiDelete(`${API}/platform/shops/${shop.id}/roles/${deleteRoleTarget.id}`);
        if (res?.success) {
            showToast(`Role "${deleteRoleTarget.name}" deleted.`);
            setDeleteRoleTarget(null);
            loadData();
            onRefresh();
        } else {
            showToast(res?.message || 'Failed to delete role.', true);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>Shop Employee Roles</h2>
                <button onClick={() => setShowAdd(true)} style={primaryBtnStyle}>+ Create Custom Role</button>
            </div>

            <SectionCard>
                <DataTable
                    columns={['Role Name', 'Permitted Pages', 'Type', 'Actions']}
                    rows={roles.map(r => [
                        <span style={{ fontWeight: 700, color: '#e5e7eb' }}>{r.name}</span>,
                        <span style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>{r.pages_count ?? 0} pages assigned</span>,
                        r.is_custom ? <span style={{ color: '#818cf8', fontSize: '0.78rem' }}>Custom</span> : <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>System Default</span>,
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <ActionBtn label="🔑 Edit Page Permissions" color="#6366f1" onClick={() => setPermRole(r)} />
                            {r.is_custom && <ActionBtn label="Delete" color="#ef4444" onClick={() => setDeleteRoleTarget(r)} />}
                        </div>,
                    ])}
                    emptyMsg="No roles found for this shop."
                />
            </SectionCard>

            {showAdd && (
                <AddRoleModal shop={shop} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadData(); onRefresh(); showToast('Role created!'); }} />
            )}
            {permRole && (
                <ShopRolePermissionModal shop={shop} role={permRole} onClose={() => setPermRole(null)} onSaved={() => { setPermRole(null); loadData(); showToast('Permissions synced!'); }} />
            )}
            {deleteRoleTarget && (
                <ConfirmModal
                    title={`Delete Role "${deleteRoleTarget.name}"?`}
                    message={`Are you sure you want to delete role "${deleteRoleTarget.name}"?`}
                    confirmText="Yes, Delete Role"
                    onClose={() => setDeleteRoleTarget(null)}
                    onConfirm={handleDeleteRole}
                />
            )}
        </div>
    );
}

function AddRoleModal({ shop, onClose, onSaved }) {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await apiPost(`${API}/platform/shops/${shop.id}/roles`, { name });
        if (res?.success) onSaved();
        setSaving(false);
    };

    return (
        <Modal title="Create Custom Shop Role" onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Role Name" id="role-name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. POS Cashier" />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Creating...' : 'Create Role'}</button>
                </div>
            </form>
        </Modal>
    );
}

/* ─────────────────────────────────────────────────────────────
   Page-Level Hierarchical Permission Matrix UI
───────────────────────────────────────────────────────────── */
function ShopRolePermissionModal({ shop, role, onClose, onSaved }) {
    const [selectedPages, setSelectedPages] = useState(new Set());
    const [modules, setModules] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchPerms() {
            setLoading(true);
            const res = await apiGet(`${API}/platform/shops/${shop.id}/roles/${role.id}/permissions`);
            if (res?.success) {
                setSelectedPages(new Set(res.data.pages || []));
                setModules(res.data.available_modules || {});
            }
            setLoading(false);
        }
        fetchPerms();
    }, [shop.id, role.id]);

    const togglePage = (pageKey) => {
        setSelectedPages(prev => {
            const next = new Set(prev);
            next.has(pageKey) ? next.delete(pageKey) : next.add(pageKey);
            return next;
        });
    };

    const toggleSubModule = (subModulePages, selectAll) => {
        setSelectedPages(prev => {
            const next = new Set(prev);
            Object.keys(subModulePages).forEach(pKey => {
                if (selectAll) next.add(pKey);
                else next.delete(pKey);
            });
            return next;
        });
    };

    const save = async () => {
        setSaving(true);
        const res = await apiPut(`${API}/platform/shops/${shop.id}/roles/${role.id}/permissions`, {
            pages: [...selectedPages],
        });
        if (res?.success) onSaved();
        setSaving(false);
    };

    if (loading) return <Modal title="Loading Permissions..." onClose={onClose}><PageLoader /></Modal>;

    return (
        <Modal title={`Page Permissions — Role: ${role.name}`} onClose={onClose} maxWidth="650px">
            <p style={{ color: '#9ca3af', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
                Select pages to grant to this role. Granted pages provide access to the page and all its available actions.
            </p>

            <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: '0.5rem' }}>
                {Object.entries(modules).map(([modKey, mod]) => (
                    <div key={modKey} style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px', padding: '1rem',
                    }}>
                        <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.95rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem' }}>
                            📦 {mod.label}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '0.5rem' }}>
                            {Object.entries(mod.sub_modules || {}).map(([subKey, sub]) => {
                                const pageEntries = Object.entries(sub.pages || {});
                                const allSubSelected = pageEntries.every(([pk]) => selectedPages.has(pk));

                                return (
                                    <div key={subKey}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, color: '#a5b4fc', fontSize: '0.85rem' }}>🔹 {sub.label}</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleSubModule(sub.pages, !allSubSelected)}
                                                style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                {allSubSelected ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingLeft: '0.75rem' }}>
                                            {pageEntries.map(([pageKey, pageLabel]) => (
                                                <label key={pageKey} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    fontSize: '0.825rem', color: selectedPages.has(pageKey) ? '#e5e7eb' : '#6b7280',
                                                    cursor: 'pointer', padding: '0.35rem 0.6rem', borderRadius: '6px',
                                                    background: selectedPages.has(pageKey) ? 'rgba(99,102,241,0.1)' : 'transparent',
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPages.has(pageKey)}
                                                        onChange={() => togglePage(pageKey)}
                                                        style={{ accentColor: '#6366f1' }}
                                                    />
                                                    <span>{pageLabel}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 600 }}>{selectedPages.size} pages selected</span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="button" onClick={save} disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving...' : 'Sync Permissions'}</button>
                </div>
            </div>
        </Modal>
    );
}

/* ─────────────────────────────────────────────────────────────
   Shop Hub Sub-Tab: Products Catalog Management
───────────────────────────────────────────────────────────── */
function ShopProductsTab({ shop, onRefresh, showToast }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editProd, setEditProd] = useState(null);
    const [deleteProdTarget, setDeleteProdTarget] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        const res = await apiGet(`${API}/platform/shops/${shop.id}/products`);
        if (res?.success) setProducts(res.data || []);
        setLoading(false);
    }, [shop.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDeleteProduct = async () => {
        if (!deleteProdTarget) return;
        const res = await apiDelete(`${API}/platform/shops/${shop.id}/products/${deleteProdTarget.id}`);
        if (res?.success) {
            showToast(`Product "${deleteProdTarget.name}" deleted.`);
            setDeleteProdTarget(null);
            loadData();
            onRefresh();
        } else {
            showToast(res?.message || 'Failed to delete product.', true);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>Products Catalog</h2>
                <button onClick={() => setShowAdd(true)} style={primaryBtnStyle}>+ Add Product</button>
            </div>

            <SectionCard>
                <DataTable
                    columns={['Product Name', 'Price', 'Stock Quantity', 'Category', 'Status', 'Actions']}
                    rows={products.map(p => [
                        <div>
                            <div style={{ fontWeight: 700, color: '#f3f4f6' }}>{p.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>/{p.slug}</div>
                        </div>,
                        <span style={{ color: '#34d399', fontWeight: 700 }}>${Number(p.price).toFixed(2)}</span>,
                        <span style={{ color: p.stock_quantity > 0 ? '#e5e7eb' : '#f87171', fontWeight: 600 }}>
                            {p.stock_quantity} {p.stock_unit || 'pcs'}
                        </span>,
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{p.category?.name || 'Uncategorized'}</span>,
                        p.status === 'active'
                            ? <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.78rem' }}>● Active</span>
                            : <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.78rem' }}>Draft</span>,
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <ActionBtn label="Edit" color="#6366f1" onClick={() => setEditProd(p)} />
                            <ActionBtn label="Delete" color="#ef4444" onClick={() => setDeleteProdTarget(p)} />
                        </div>,
                    ])}
                    emptyMsg="No products added to this shop yet."
                />
            </SectionCard>

            {showAdd && (
                <AddProductModal shop={shop} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadData(); onRefresh(); showToast('Product created!'); }} />
            )}
            {editProd && (
                <EditProductModal shop={shop} product={editProd} onClose={() => setEditProd(null)} onSaved={() => { setEditProd(null); loadData(); showToast('Product updated!'); }} />
            )}
            {deleteProdTarget && (
                <ConfirmModal
                    title={`Delete Product "${deleteProdTarget.name}"?`}
                    message={`Are you sure you want to delete product "${deleteProdTarget.name}"?`}
                    confirmText="Yes, Delete Product"
                    onClose={() => setDeleteProdTarget(null)}
                    onConfirm={handleDeleteProduct}
                />
            )}
        </div>
    );
}

function AddProductModal({ shop, onClose, onSaved }) {
    const [form, setForm] = useState({ name: '', price: '', cost_price: '', stock_quantity: '10', stock_unit: 'pcs', description: '' });
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await apiPost(`${API}/platform/shops/${shop.id}/products`, form);
        if (res?.success) onSaved();
        setSaving(false);
    };

    return (
        <Modal title="Add Initial Product to Shop" onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Product Name *" id="prod-name" value={form.name} onChange={set('name')} required placeholder="e.g. Wireless Mouse" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormField label="Selling Price ($) *" id="prod-price" type="number" step="0.01" value={form.price} onChange={set('price')} required />
                    <FormField label="Cost Price ($)" id="prod-cost" type="number" step="0.01" value={form.cost_price} onChange={set('cost_price')} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormField label="Stock Quantity *" id="prod-stock" type="number" value={form.stock_quantity} onChange={set('stock_quantity')} required />
                    <FormField label="Stock Unit" id="prod-unit" value={form.stock_unit} onChange={set('stock_unit')} placeholder="pcs" />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Adding...' : 'Add Product'}</button>
                </div>
            </form>
        </Modal>
    );
}

function EditProductModal({ shop, product, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: product.name,
        price: product.price,
        cost_price: product.cost_price || '',
        stock_quantity: product.stock_quantity,
        stock_unit: product.stock_unit || 'pcs',
        status: product.status || 'active',
    });
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await apiPut(`${API}/platform/shops/${shop.id}/products/${product.id}`, form);
        if (res?.success) onSaved();
        setSaving(false);
    };

    return (
        <Modal title={`Edit ${product.name}`} onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Product Name" id="eprod-name" value={form.name} onChange={set('name')} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormField label="Selling Price ($)" id="eprod-price" type="number" step="0.01" value={form.price} onChange={set('price')} required />
                    <FormField label="Stock Quantity" id="eprod-stock" type="number" value={form.stock_quantity} onChange={set('stock_quantity')} required />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving...' : 'Update Product'}</button>
                </div>
            </form>
        </Modal>
    );
}

/* ─────────────────────────────────────────────────────────────
   Shop Hub Sub-Tab: Shop Audit Logs
───────────────────────────────────────────────────────────── */
function ShopLogsTab({ shop }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await apiGet(`${API}/platform/shops/${shop.id}/logs`);
            if (res?.success) setLogs(res.data || []);
            setLoading(false);
        }
        load();
    }, [shop.id]);

    if (loading) return <PageLoader />;

    return (
        <SectionCard title={`Audit Logs for Shop "${shop.name}"`}>
            <DataTable
                columns={['Action', 'Description', 'User', 'Time']}
                rows={logs.map(l => [
                    <code style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>{l.action}</code>,
                    <span style={{ color: '#d1d5db', fontSize: '0.85rem' }}>{l.description}</span>,
                    <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{l.user_id ? `User #${l.user_id}` : 'System'}</span>,
                    <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{new Date(l.created_at).toLocaleString()}</span>,
                ])}
                emptyMsg="No audit log activity recorded for this shop."
            />
        </SectionCard>
    );
}

/* ─────────────────────────────────────────────────────────────
   Modal Component for Shop Hub & Provisioning
───────────────────────────────────────────────────────────── */
function AssignOwnerModal({ shop, onClose, onSaved }) {
    const [type, setType] = useState('select');
    const [users, setUsers] = useState([]);
    const [ownerId, setOwnerId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('password');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadUsers() {
            const res = await apiGet(`${API}/platform/users`);
            if (res?.success) setUsers(res.data || []);
        }
        loadUsers();
    }, []);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const body = type === 'select' ? { owner_id: ownerId } : { name, email, password };
        const res = await apiPost(`${API}/platform/shops/${shop.id}/owner`, body);
        if (res?.success) onSaved();
        else setError(res?.message || 'Failed to assign owner.');
        setSaving(false);
    };

    return (
        <Modal title="Assign Shop Owner" onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="own_type" checked={type === 'select'} onChange={() => setType('select')} style={{ accentColor: '#6366f1' }} />
                        <span>Select Existing User</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="own_type" checked={type === 'create'} onChange={() => setType('create')} style={{ accentColor: '#6366f1' }} />
                        <span>Create New Owner</span>
                    </label>
                </div>

                {type === 'select' ? (
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Select User</label>
                        <select value={ownerId} onChange={e => setOwnerId(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                            <option value="">Select a user...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                        </select>
                    </div>
                ) : (
                    <>
                        <FormField label="Full Name *" id="aown-name" value={name} onChange={e => setName(e.target.value)} required />
                        <FormField label="Email *" id="aown-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        <FormField label="Password *" id="aown-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                    </>
                )}

                {error && <ErrorAlert msg={error} />}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Assigning...' : 'Assign Owner'}</button>
                </div>
            </form>
        </Modal>
    );
}

function EditShopModal({ shop, onClose, onSaved }) {
    const [name, setName] = useState(shop.name);
    const [slug, setSlug] = useState(shop.slug);
    const [domain, setDomain] = useState(shop.domain || '');
    const [email, setEmail] = useState(shop.email || '');
    const [phone, setPhone] = useState(shop.phone || '');
    const [currency, setCurrency] = useState(shop.currency || 'USD');
    const [timezone, setTimezone] = useState(shop.timezone || 'UTC');
    const [refundDays, setRefundDays] = useState(shop.refund_window_days || 30);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const res = await apiPut(`${API}/platform/shops/${shop.id}`, {
            name, slug, domain, email, phone, currency, timezone, refund_window_days: parseInt(refundDays)
        });
        if (res?.success) onSaved();
        else setError(res?.message || 'Update failed.');
        setSaving(false);
    };

    return (
        <Modal title="Edit Shop Details" onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Shop Name" id="edit-shop-name" value={name} onChange={e => setName(e.target.value)} required />
                <FormField label="Subdomain / Slug" id="edit-shop-slug" value={slug} onChange={e => setSlug(e.target.value)} required />
                <FormField label="Custom Domain" id="edit-shop-domain" value={domain} onChange={e => setDomain(e.target.value)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormField label="Email" id="edit-shop-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    <FormField label="Phone" id="edit-shop-phone" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormField label="Currency" id="edit-shop-curr" value={currency} onChange={e => setCurrency(e.target.value)} />
                    <FormField label="Refund Window (Days)" id="edit-shop-ref" type="number" value={refundDays} onChange={e => setRefundDays(e.target.value)} />
                </div>
                {error && <ErrorAlert msg={error} />}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving...' : 'Update Shop'}</button>
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
    'admin.shops': 'Platform Shop Directory',
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
                        <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
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

function Modal({ title, onClose, children, maxWidth = '480px' }) {
    return (
        <>
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000,
                backdropFilter: 'blur(4px)',
            }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 1001, width: '100%', maxWidth: maxWidth,
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

function FormField({ label, id, type = 'text', value, onChange, required, min, step, minLength, placeholder }) {
    return (
        <div>
            <label htmlFor={id} style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {label}
            </label>
            <input
                id={id} type={type} value={value} onChange={onChange} required={required}
                min={min} step={step} minLength={minLength} placeholder={placeholder}
                style={{
                    width: '100%', padding: '0.75rem 0.875rem', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f3f4f6', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: "'Outfit', sans-serif",
                }}
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
   Protected Route Guard Wrapper
───────────────────────────────────────────────────────────── */
function RequireAdmin({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <PageLoader />;
    if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />;
    return children;
}

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
                        <Route path="/admin/login" element={<LoginPage />} />

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
                        <Route path="/admin/shops/:shopId/manage" element={
                            <RequireAdmin>
                                <AdminLayout><ShopHubPage /></AdminLayout>
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

                        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </>
    );
}
