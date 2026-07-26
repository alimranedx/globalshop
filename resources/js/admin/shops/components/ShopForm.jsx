import React from 'react';
import { FormField } from '../../shared/components/FormField';
import { FormSelect } from '../../shared/components/FormSelect';
import { CURRENCY_OPTIONS, TIMEZONE_OPTIONS } from '../../shared/constants/options';

export function ShopForm({
    mode = 'edit', // 'create' or 'edit'
    values,
    onChange,
    plans = [],
    onAutoSlug,
}) {
    const handleFieldChange = (key) => (e) => {
        onChange(key, e.target.value);
    };

    const handleNameChange = (e) => {
        const val = e.target.value;
        if (mode === 'create' && onAutoSlug) {
            onAutoSlug(val);
        } else {
            onChange('name', val);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <FormField
                label="Shop Name *"
                id="shop-name"
                value={values.name}
                onChange={handleNameChange}
                required
                placeholder="e.g. Apex Electronics"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField
                    label="Subdomain / URL Slug *"
                    id="shop-slug"
                    value={values.slug}
                    onChange={handleFieldChange('slug')}
                    required
                    placeholder="apex"
                />
                <FormField
                    label="Custom Domain"
                    id="shop-domain"
                    value={values.domain}
                    onChange={handleFieldChange('domain')}
                    placeholder="apex.com"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField
                    label="Shop Email"
                    id="shop-email"
                    type="email"
                    value={values.email}
                    onChange={handleFieldChange('email')}
                    placeholder="contact@apex.com"
                />
                <FormField
                    label="Shop Phone"
                    id="shop-phone"
                    value={values.phone}
                    onChange={handleFieldChange('phone')}
                    placeholder="+1 555-0192"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormSelect
                    label="Shop Currency *"
                    id="shop-currency"
                    value={values.currency}
                    onChange={handleFieldChange('currency')}
                    options={CURRENCY_OPTIONS}
                    required
                />
                <FormSelect
                    label="Shop Timezone *"
                    id="shop-timezone"
                    value={values.timezone}
                    onChange={handleFieldChange('timezone')}
                    options={TIMEZONE_OPTIONS}
                    required
                />
            </div>

            {mode === 'edit' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormSelect
                        label="Subscription Plan *"
                        id="shop-plan"
                        value={values.plan_id}
                        onChange={handleFieldChange('plan_id')}
                        options={plans.map(p => ({ value: p.id, label: `${p.name} ($${Number(p.price).toFixed(2)}/mo)` }))}
                        required
                    />
                    <FormSelect
                        label="Shop Handover Status *"
                        id="shop-status"
                        value={values.status}
                        onChange={handleFieldChange('status')}
                        options={[
                            { value: 'draft', label: '📝 Draft' },
                            { value: 'setup_in_progress', label: '⚙️ Setup in Progress' },
                            { value: 'ready_for_handover', label: '✨ Ready for Handover' },
                            { value: 'active', label: '● Active' },
                            { value: 'suspended', label: '⛔ Suspended' },
                            { value: 'pending', label: '⏳ Pending' },
                        ]}
                        required
                    />
                </div>
            )}
        </div>
    );
}
