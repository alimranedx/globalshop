import React, { useState, useEffect, useCallback } from 'react';
import { subscriptionService } from '../services/subscriptionService';
import { PlanFormModal } from '../components/PlanFormModal';
import { useToast } from '../../shared/components/Toast';
import { PageHeader } from '../../shared/components/PageHeader';
import { PageLoader } from '../../shared/components/PageLoader';
import { SectionCard } from '../../shared/components/SectionCard';
import { DataTable } from '../../shared/components/DataTable';
import { ActionBtn } from '../../shared/components/ActionBtn';
import { primaryBtnStyle } from '../../shared/components/Styles';

export function PlansPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editPlan, setEditPlan] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const { show, ToastComponent } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        const res = await subscriptionService.getPlans();
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
