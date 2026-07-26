import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopService } from '../services/shopService';
import { subscriptionService } from '../../subscriptions/services/subscriptionService';
import { ShopForm } from '../components/ShopForm';
import { useToast } from '../../shared/components/Toast';
import { SectionCard } from '../../shared/components/SectionCard';
import { PageLoader } from '../../shared/components/PageLoader';
import { FormField } from '../../shared/components/FormField';
import { ErrorAlert } from '../../shared/components/ActionBtn';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function CreateShopPage() {
    const navigate = useNavigate();
    const { show, ToastComponent } = useToast();
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [userOptions, setUserOptions] = useState([]);

    const [form, setForm] = useState({
        name: '', slug: '', domain: '', logo_url: '', email: '', phone: '', address: '', city: '', country: '', currency: 'USD', timezone: 'UTC',
        owner_type: 'create',
        owner_id: '', owner_name: '', owner_email: '', owner_password: 'password',
        plan_id: '',
        status: 'draft',
    });

    useEffect(() => {
        async function fetchInitial() {
            setLoadingPlans(true);
            const [pRes, uRes] = await Promise.all([
                subscriptionService.getPlans(),
                shopService.getUsers(),
            ]);
            if (pRes?.success) {
                setPlans(pRes.data || []);
                if (pRes.data?.length > 0) {
                    setForm(f => ({ ...f, plan_id: pRes.data[0].id }));
                }
            }
            if (uRes?.success) setUserOptions(uRes.data || []);
            setLoadingPlans(false);
        }
        fetchInitial();
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

        const res = await shopService.createShop(payload);
        if (res?.success) {
            show(`Shop "${res.data.name}" created successfully!`, 'success');
            navigate(`/admin/shops/${res.data.id}/manage`);
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

    if (loadingPlans) return <PageLoader />;

    return (
        <div>
            {ToastComponent}
            
            <div style={{ marginBottom: '1.25rem' }}>
                <button onClick={() => navigate('/admin/shops')} style={ghostBtnStyle}>
                    ← Back to Shop Directory
                </button>
            </div>

            <SectionCard title="✨ Create & Provision New Shop Wizard">
                <div style={{ padding: '1.75rem' }}>
                    {/* Step Indicator Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1.25rem' }}>
                        {WIZARD_STEPS.map(s => (
                            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: step === s.num ? '#6366f1' : step > s.num ? '#10b981' : 'rgba(255,255,255,0.1)',
                                    color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {step > s.num ? '✓' : s.num}
                                </div>
                                <span style={{ fontSize: '0.9rem', fontWeight: step === s.num ? 700 : 500, color: step === s.num ? '#f3f4f6' : '#6b7280' }}>
                                    {s.title}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* STEP 1: Shop Information */}
                    {step === 1 && (
                        <div style={{ maxWidth: '700px' }}>
                            <ShopForm
                                mode="create"
                                values={form}
                                onChange={updateForm}
                                onAutoSlug={handleAutoSlug}
                            />
                        </div>
                    )}

                    {/* STEP 2: Shop Owner */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '700px' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '700px' }}>
                            <label style={{ color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>Select Active Subscription Plan</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {plans.map(p => (
                                    <label key={p.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '1.1rem 1.25rem', borderRadius: '12px', cursor: 'pointer',
                                        background: form.plan_id == p.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${form.plan_id == p.id ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                            <input type="radio" name="plan_id" value={p.id} checked={form.plan_id == p.id} onChange={e => updateForm('plan_id', e.target.value)} style={{ accentColor: '#6366f1' }} />
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.95rem' }}>{p.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.2rem' }}>Max {p.limits?.max_products} Products | Max {p.limits?.max_employees} Staff</div>
                                            </div>
                                        </div>
                                        <span style={{ fontWeight: 700, color: '#34d399', fontSize: '1rem' }}>${Number(p.price).toFixed(2)}/mo</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Review & Create */}
                    {step === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '700px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
                                <div><strong style={{ color: '#6366f1' }}>Shop Name:</strong> {form.name || '—'}</div>
                                <div><strong style={{ color: '#6366f1' }}>Slug URL:</strong> /{form.slug || '—'}</div>
                                <div><strong style={{ color: '#6366f1' }}>Owner:</strong> {form.owner_type === 'create' ? form.owner_email : userOptions.find(u => u.id == form.owner_id)?.email || '—'}</div>
                                <div><strong style={{ color: '#6366f1' }}>Subscription Plan:</strong> {plans.find(p => p.id == form.plan_id)?.name || 'Default'}</div>
                                <div><strong style={{ color: '#6366f1' }}>Currency & Timezone:</strong> {form.currency} ({form.timezone})</div>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                                    Set Initial Handover Status
                                </label>
                                <select
                                    value={form.status}
                                    onChange={e => updateForm('status', e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.85rem', borderRadius: '8px',
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', maxWidth: '700px' }}>
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
                </div>
            </SectionCard>
        </div>
    );
}
