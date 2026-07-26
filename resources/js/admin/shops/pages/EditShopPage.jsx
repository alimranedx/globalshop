import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopService } from '../services/shopService';
import { subscriptionService } from '../../subscriptions/services/subscriptionService';
import { ShopForm } from '../components/ShopForm';
import { useToast } from '../../shared/components/Toast';
import { SectionCard } from '../../shared/components/SectionCard';
import { PageLoader } from '../../shared/components/PageLoader';
import { FormField } from '../../shared/components/FormField';
import { ErrorAlert } from '../../shared/components/ActionBtn';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function EditShopPage() {
    const { shopId } = useParams();
    const navigate = useNavigate();
    const { show, ToastComponent } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [shop, setShop] = useState(null);
    const [plans, setPlans] = useState([]);

    const [form, setForm] = useState({
        name: '',
        slug: '',
        domain: '',
        email: '',
        phone: '',
        currency: 'USD',
        timezone: 'UTC',
        plan_id: '',
        status: 'draft',
        refund_window_days: 30,
    });

    useEffect(() => {
        async function fetchShopData() {
            setLoading(true);
            const [sRes, pRes] = await Promise.all([
                shopService.getShop(shopId),
                subscriptionService.getPlans(),
            ]);

            if (pRes?.success) {
                setPlans(pRes.data || []);
            }

            if (sRes?.success && sRes.data?.shop) {
                const s = sRes.data.shop;
                setShop(s);
                const currentPlanId = s.active_subscription?.plan_id || s.active_subscription?.plan?.id || (pRes?.data?.[0]?.id ?? '');

                setForm({
                    name: s.name || '',
                    slug: s.slug || '',
                    domain: s.domain || '',
                    email: s.email || '',
                    phone: s.phone || '',
                    currency: s.currency || 'USD',
                    timezone: s.timezone || 'UTC',
                    status: s.status || 'draft',
                    plan_id: currentPlanId,
                    refund_window_days: s.refund_window_days || 30,
                });
            }
            setLoading(false);
        }
        fetchShopData();
    }, [shopId]);

    const updateForm = (key, value) => {
        setForm(f => ({ ...f, [key]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const res = await shopService.updateShop(shopId, {
            ...form,
            refund_window_days: parseInt(form.refund_window_days),
        });

        if (res?.success) {
            show(`Shop "${form.name}" details updated successfully!`, 'success');
            setTimeout(() => navigate('/admin/shops'), 600);
        } else {
            setError(res?.message || 'Failed to update shop details.');
        }
        setSaving(false);
    };

    if (loading) return <PageLoader />;
    if (!shop) return <div style={{ color: '#ef4444' }}>Shop not found.</div>;

    return (
        <div>
            {ToastComponent}

            <div style={{ marginBottom: '1.25rem' }}>
                <button onClick={() => navigate('/admin/shops')} style={ghostBtnStyle}>
                    ← Back to Shop Directory
                </button>
            </div>

            <SectionCard title={`Edit Shop Details: ${shop.name}`}>
                <form onSubmit={handleSave} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '750px' }}>
                    <ShopForm
                        mode="edit"
                        values={form}
                        onChange={updateForm}
                        plans={plans}
                    />

                    <div style={{ maxWidth: '300px' }}>
                        <FormField
                            label="Refund Window (Days)"
                            id="edit-shop-ref"
                            type="number"
                            value={form.refund_window_days}
                            onChange={e => updateForm('refund_window_days', e.target.value)}
                        />
                    </div>

                    {error && <ErrorAlert msg={error} />}

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={() => navigate('/admin/shops')} style={ghostBtnStyle}>Cancel</button>
                        <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving Changes...' : 'Save Changes'}</button>
                    </div>
                </form>
            </SectionCard>
        </div>
    );
}
