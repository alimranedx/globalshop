import React, { useState, useEffect, useCallback } from 'react';
import { shopService } from '../services/shopService';
import { STOCK_UNITS, getStockUnitLabel } from '../../../constants/stockUnits';
import { PageLoader } from '../../shared/components/PageLoader';
import { SectionCard } from '../../shared/components/SectionCard';
import { DataTable } from '../../shared/components/DataTable';
import { ActionBtn } from '../../shared/components/ActionBtn';
import { Modal } from '../../shared/components/Modal';
import { FormField } from '../../shared/components/FormField';
import { ConfirmModal } from '../../shared/components/ConfirmModal';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function ShopProductsTab({ shop, onRefresh, showToast }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editProd, setEditProd] = useState(null);
    const [deleteProdTarget, setDeleteProdTarget] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        const res = await shopService.getProducts(shop.id);
        if (res?.success) setProducts(res.data || []);
        setLoading(false);
    }, [shop.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDeleteProduct = async () => {
        if (!deleteProdTarget) return;
        const res = await shopService.deleteProduct(shop.id, deleteProdTarget.id);
        if (res?.success) {
            showToast(`Product "${deleteProdTarget.name}" deleted.`);
            setDeleteProdTarget(null);
            loadData();
            onRefresh();
        } else {
            showToast(res?.message || 'Failed to delete product.', true);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>Products Catalog</h2>
                <button onClick={() => setShowAdd(true)} style={primaryBtnStyle}>+ Add Product</button>
            </div>

            <SectionCard>
                <DataTable
                    columns={['Product Name', 'Price', 'Stock Quantity', 'Category', 'Status', 'Actions']}
                    rows={products.map(p => [
                        <div>
                            <div style={{ fontWeight: 700, color: '#f3f4f6' }}>{p.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>/{p.slug}</div>
                        </div>,
                        <span style={{ color: '#34d399', fontWeight: 700 }}>${Number(p.price).toFixed(2)}</span>,
                        <span style={{ color: p.stock_quantity > 0 ? '#e5e7eb' : '#f87171', fontWeight: 600 }}>
                            {p.stock_quantity} {getStockUnitLabel(p.stock_unit)}
                        </span>,
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{p.category?.name || 'Uncategorized'}</span>,
                        p.status === 'active'
                            ? <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.78rem' }}>● Active</span>
                            : <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.78rem' }}>Draft</span>,
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <ActionBtn label="Edit" color="#6366f1" onClick={() => setEditProd(p)} />
                            <ActionBtn label="Delete" color="#ef4444" onClick={() => setDeleteProdTarget(p)} />
                        </div>,
                    ])}
                    emptyMsg="No products added to this shop yet."
                />
            </SectionCard>

            {showAdd && (
                <AddProductModal shop={shop} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadData(); onRefresh(); showToast('Product created!'); }} />
            )}
            {editProd && (
                <EditProductModal shop={shop} product={editProd} onClose={() => setEditProd(null)} onSaved={() => { setEditProd(null); loadData(); showToast('Product updated!'); }} />
            )}
            {deleteProdTarget && (
                <ConfirmModal
                    title={`Delete Product "${deleteProdTarget.name}"?`}
                    message={`Are you sure you want to delete product "${deleteProdTarget.name}"?`}
                    confirmText="Yes, Delete Product"
                    onClose={() => setDeleteProdTarget(null)}
                    onConfirm={handleDeleteProduct}
                />
            )}
        </div>
    );
}

function AddProductModal({ shop, onClose, onSaved }) {
    const [form, setForm] = useState({ name: '', price: '', cost_price: '', stock_quantity: '10', stock_unit: 'pcs', description: '' });
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await shopService.addProduct(shop.id, form);
        if (res?.success) onSaved();
        setSaving(false);
    };

    return (
        <Modal title="Add Initial Product to Shop" onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Product Name *" id="prod-name" value={form.name} onChange={set('name')} required placeholder="e.g. Wireless Mouse" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormField label="Selling Price ($) *" id="prod-price" type="number" step="0.01" value={form.price} onChange={set('price')} required />
                    <FormField label="Cost Price ($)" id="prod-cost" type="number" step="0.01" value={form.cost_price} onChange={set('cost_price')} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormField label="Stock Quantity *" id="prod-stock" type="number" value={form.stock_quantity} onChange={set('stock_quantity')} required />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Stock Unit *</label>
                        <select
                            id="prod-unit"
                            value={form.stock_unit}
                            onChange={set('stock_unit')}
                            required
                            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', fontSize: '0.875rem' }}
                        >
                            {STOCK_UNITS.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Adding...' : 'Add Product'}</button>
                </div>
            </form>
        </Modal>
    );
}

function EditProductModal({ shop, product, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: product.name,
        price: product.price,
        cost_price: product.cost_price || '',
        stock_quantity: product.stock_quantity,
        stock_unit: product.stock_unit || 'pcs',
        status: product.status || 'active',
    });
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await shopService.updateProduct(shop.id, product.id, form);
        if (res?.success) onSaved();
        setSaving(false);
    };

    return (
        <Modal title={`Edit ${product.name}`} onClose={onClose}>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField label="Product Name" id="eprod-name" value={form.name} onChange={set('name')} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <FormField label="Selling Price ($)" id="eprod-price" type="number" step="0.01" value={form.price} onChange={set('price')} required />
                    <FormField label="Stock Quantity" id="eprod-stock" type="number" value={form.stock_quantity} onChange={set('stock_quantity')} required />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Stock Unit *</label>
                        <select
                            id="eprod-unit"
                            value={form.stock_unit}
                            onChange={set('stock_unit')}
                            required
                            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', fontSize: '0.875rem' }}
                        >
                            {STOCK_UNITS.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving...' : 'Update Product'}</button>
                </div>
            </form>
        </Modal>
    );
}
