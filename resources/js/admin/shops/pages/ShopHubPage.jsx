import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopService } from '../services/shopService';
import { ShopStatusBadge } from '../components/ShopStatusBadge';
import { AssignOwnerModal } from '../components/AssignOwnerModal';
import { ShopEmployeesTab } from '../components/ShopEmployeesTab';
import { ShopRolesTab } from '../components/ShopRolesTab';
import { ShopProductsTab } from '../components/ShopProductsTab';
import { ShopLogsTab } from '../components/ShopLogsTab';
import { useToast } from '../../shared/components/Toast';
import { PageLoader } from '../../shared/components/PageLoader';
import { SectionCard } from '../../shared/components/SectionCard';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function ShopHubPage() {
    const { shopId } = useParams();
    const navigate = useNavigate();
    const [hubData, setHubData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const { show, ToastComponent } = useToast();

    // Modals in Hub
    const [showAssignOwner, setShowAssignOwner] = useState(false);

    const loadHubData = useCallback(async () => {
        setLoading(true);
        const res = await shopService.getShop(shopId);
        if (res?.success) setHubData(res.data);
        setLoading(false);
    }, [shopId]);

    useEffect(() => { loadHubData(); }, [loadHubData]);

    const handleHandoverStatusChange = async (newStatus) => {
        const res = await shopService.updateHandoverStatus(shopId, newStatus);
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
                            <button onClick={() => navigate(`/admin/shops/${shop.id}/edit`)} style={primaryBtnStyle}>Edit Shop Details</button>
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

            {/* Assign Owner Modal */}
            {showAssignOwner && (
                <AssignOwnerModal shop={shop} onClose={() => setShowAssignOwner(false)} onSaved={() => { setShowAssignOwner(false); loadHubData(); show('Shop owner updated!'); }} />
            )}
        </div>
    );
}
