import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { API } from '../constants/options';
import { getCsrf, apiPost } from '../api/client';
import { PageLoader } from '../components/PageLoader';

const AuthContext = createContext(null);

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
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

export function RequireAdmin({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <PageLoader />;
    if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />;
    return children;
}
