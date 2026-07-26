import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import { useToast } from '../../shared/components/Toast';
import { PageHeader } from '../../shared/components/PageHeader';
import { PageLoader } from '../../shared/components/PageLoader';
import { SectionCard } from '../../shared/components/SectionCard';
import { DataTable } from '../../shared/components/DataTable';
import { ActionBtn } from '../../shared/components/ActionBtn';

export function TicketDirectoryPage() {
    const [tickets, setTickets] = useState([]);
    const [counts, setCounts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [userTypeFilter, setUserTypeFilter] = useState('');
    const { ToastComponent } = useToast();
    const navigate = useNavigate();

    const loadTickets = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (statusFilter) params.append('status', statusFilter);
        if (priorityFilter) params.append('priority', priorityFilter);
        if (categoryFilter) params.append('category', categoryFilter);
        if (userTypeFilter) params.append('user_type', userTypeFilter);

        const res = await ticketService.getTickets(params.toString());
        if (res?.success) {
            setTickets(res.data || []);
            setCounts(res.counts || null);
        }
        setLoading(false);
    }, [search, statusFilter, priorityFilter, categoryFilter, userTypeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => { loadTickets(); }, 250);
        return () => clearTimeout(timer);
    }, [loadTickets]);

    const getStatusBadge = (status) => {
        const badges = {
            open: { color: '#ef4444', label: '🔴 Open' },
            in_progress: { color: '#f59e0b', label: '⚙️ In Progress' },
            waiting_for_customer: { color: '#8b5cf6', label: '⏳ Waiting Customer' },
            resolved: { color: '#10b981', label: '✅ Resolved' },
            closed: { color: '#6b7280', label: '🔒 Closed' },
        };
        const b = badges[status] || badges.open;
        return <span style={{ color: b.color, fontWeight: 700, fontSize: '0.78rem' }}>{b.label}</span>;
    };

    const getPriorityBadge = (priority) => {
        const colors = { low: '#9ca3af', normal: '#60a5fa', high: '#f59e0b', urgent: '#ef4444' };
        return (
            <span style={{
                color: colors[priority] || '#9ca3af', fontWeight: 700, fontSize: '0.75rem',
                textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '4px',
                background: `${colors[priority]}15`, border: `1px solid ${colors[priority]}30`,
            }}>
                {priority}
            </span>
        );
    };

    if (loading && tickets.length === 0) return <PageLoader />;

    return (
        <div>
            {ToastComponent}

            <PageHeader
                title="Support Tickets Desk"
                sub="Manage platform login trouble, account recovery, and customer support tickets"
            />

            {/* Quick Stat Bar */}
            {counts && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'rgba(20,20,28,0.7)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>Total Tickets</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f3f4f6' }}>{counts.total}</div>
                    </div>
                    <div style={{ background: 'rgba(20,20,28,0.7)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>Open Requests</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>{counts.open}</div>
                    </div>
                    <div style={{ background: 'rgba(20,20,28,0.7)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>In Progress</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>{counts.in_progress}</div>
                    </div>
                    <div style={{ background: 'rgba(20,20,28,0.7)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>Resolved</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>{counts.resolved}</div>
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            <div style={{
                background: 'rgba(18,18,25,0.7)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem',
                display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center',
            }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                    <input
                        type="text"
                        placeholder="Search by ticket #, subject, user name, or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f3f4f6', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.65rem', borderRadius: '8px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}>
                    <option value="">All Statuses</option>
                    <option value="open">🔴 Open</option>
                    <option value="in_progress">⚙️ In Progress</option>
                    <option value="waiting_for_customer">⏳ Waiting Customer</option>
                    <option value="resolved">✅ Resolved</option>
                    <option value="closed">🔒 Closed</option>
                </select>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ padding: '0.65rem', borderRadius: '8px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}>
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
                <select value={userTypeFilter} onChange={e => setUserTypeFilter(e.target.value)} style={{ padding: '0.65rem', borderRadius: '8px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}>
                    <option value="">All Account Types</option>
                    <option value="customer">Customer</option>
                    <option value="shop_owner">Shop Owner</option>
                    <option value="shop_employee">Shop Employee</option>
                    <option value="guest">Guest</option>
                </select>
            </div>

            <SectionCard>
                <DataTable
                    columns={['Ticket #', 'Subject & Category', 'User / Account', 'Priority', 'Status', 'Created', 'Actions']}
                    rows={tickets.map(t => [
                        <span style={{ fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', fontSize: '0.85rem' }}>{t.ticket_number}</span>,
                        <div>
                            <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.875rem' }}>{t.subject}</div>
                            <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                                📁 {t.category.replace(/_/g, ' ')}
                            </div>
                        </div>,
                        <div>
                            <div style={{ color: '#e5e7eb', fontSize: '0.85rem', fontWeight: 600 }}>{t.name}</div>
                            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{t.email} ({t.user_type.replace('_', ' ')})</div>
                        </div>,
                        getPriorityBadge(t.priority),
                        getStatusBadge(t.status),
                        <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{new Date(t.created_at).toLocaleDateString()}</span>,
                        <ActionBtn label="💬 Open Ticket" color="#6366f1" onClick={() => navigate(`/admin/support-tickets/${t.id}`)} />,
                    ])}
                    emptyMsg="No support tickets found."
                />
            </SectionCard>
        </div>
    );
}
