import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopService } from '../services/shopService';
import { subscriptionService } from '../../subscriptions/services/subscriptionService';
import { ShopStatusBadge } from '../components/ShopStatusBadge';
import { useToast } from '../../shared/components/Toast';
import { SectionCard } from '../../shared/components/SectionCard';
import { DataTable } from '../../shared/components/DataTable';
import { ActionBtn } from '../../shared/components/ActionBtn';
import { PageLoader } from '../../shared/components/PageLoader';
import { ConfirmModal } from '../../shared/components/ConfirmModal';

export function ShopDirectoryPage() {
    const [shops, setShops] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
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
            shopService.getShops(params.toString()),
            subscriptionService.getPlans(),
        ]);
        if (sRes?.success) setShops(sRes.data || []);
        if (pRes?.success) setPlans(pRes.data || []);
        setLoading(false);
    }, [search, statusFilter, planFilter]);

    useEffect(() => {
        const timer = setTimeout(() => { loadShops(); }, 250);
        return () => clearTimeout(timer);
    }, [loadShops]);

    const handleApproveShop = async (shop) => {
        const res = await shopService.approveShop(shop.id);
        if (res?.success) {
            show(`Shop "${shop.name}" approved successfully! Owner can now access the shop.`, 'success');
            loadShops();
        } else {
            show(res?.message || 'Failed to approve shop.', 'error');
        }
    };

    const toggleSuspend = async (shop) => {
        const res = await shopService.toggleSuspend(shop.id);
        if (res?.success) {
            show(`Shop "${shop.name}" status updated to ${res.status}.`, 'success');
            loadShops();
        } else {
            show(res?.message || 'Action failed.', 'error');
        }
    };

    const handleDeleteShop = async () => {
        if (!deleteShopTarget) return;
        const res = await shopService.deleteShop(deleteShopTarget.id);
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
                    onClick={() => navigate('/admin/shops/create')}
                    style={{
                        padding: '0.75rem 1.4rem', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                        border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                        boxShadow: '0 4px 18px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                >
                    <span>✨</span>
                    <span>Add Shop</span>
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

            {/* Pending Approvals Alert Banner */}
            {shops.some(s => s.status === 'pending') && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.08))',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>⏳</span>
                        <div>
                            <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem' }}>
                                Pending Shop Applications ({shops.filter(s => s.status === 'pending').length})
                            </div>
                            <div style={{ color: '#d1d5db', fontSize: '0.8rem' }}>
                                Prospective shop owners have submitted registrations awaiting your review and approval.
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '8px',
                            background: '#f59e0b', color: '#111827', fontWeight: 700,
                            fontSize: '0.825rem', border: 'none', cursor: 'pointer',
                        }}
                    >
                        Filter Pending Shops
                    </button>
                </div>
            )}

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
                                {shop.status === 'pending' && (
                                    <ActionBtn
                                        label="✅ Approve"
                                        color="#10b981"
                                        onClick={() => handleApproveShop(shop)}
                                    />
                                )}
                                <ActionBtn label="⚙️ Manage Hub" color="#6366f1" onClick={() => navigate(`/admin/shops/${shop.id}/manage`)} />
                                <ActionBtn label="Edit" color="#a5b4fc" onClick={() => navigate(`/admin/shops/${shop.id}/edit`)} />
                                {shop.status !== 'pending' && (
                                    <ActionBtn
                                        label={shop.status === 'suspended' ? 'Activate' : 'Suspend'}
                                        color={shop.status === 'suspended' ? '#10b981' : '#f59e0b'}
                                        onClick={() => toggleSuspend(shop)}
                                    />
                                )}
                                <ActionBtn label="Delete" color="#ef4444" onClick={() => setDeleteShopTarget(shop)} />
                            </div>,
                        ])}
                        emptyMsg="No matching shops found."
                    />
                )}
            </SectionCard>

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
