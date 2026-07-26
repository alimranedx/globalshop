import React, { useState } from 'react';
import { subscriptionService } from '../services/subscriptionService';
import { Modal } from '../../shared/components/Modal';
import { FormField } from '../../shared/components/FormField';
import { ErrorAlert } from '../../shared/components/ActionBtn';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function PlanFormModal({ plan, onClose, onSaved }) {
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
            ? await subscriptionService.updatePlan(plan.id, body)
            : await subscriptionService.createPlan(body);
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
