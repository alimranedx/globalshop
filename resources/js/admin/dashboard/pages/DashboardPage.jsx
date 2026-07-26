import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { API } from '../../shared/constants/options';
import { apiGet } from '../../shared/api/client';
import { PageLoader } from '../../shared/components/PageLoader';
import { StatCard } from '../../shared/components/StatCard';
import { SectionCard } from '../../shared/components/SectionCard';
import { DataTable } from '../../shared/components/DataTable';

export function DashboardPage() {
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
