import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedReceipt, showToast } from '../store/uiSlice';
import { fetchState } from '../store/actions';
import { getHeaders } from '../utils/api';
import SearchableSelect from '../components/SearchableSelect';
import useTranslation from '../hooks/useTranslation';
import useCurrency from '../hooks/useCurrency';
import useTheme from '../hooks/useTheme';

export default function POSTerminal() {
    const dispatch = useDispatch();
    const t = useTranslation();
    const cur = useCurrency();
    const { colors, isDark } = useTheme();

    const products = useSelector(state => state.catalog.products);
    const categories = useSelector(state => state.catalog.categories);
    const brands = useSelector(state => state.catalog.brands);
    const currentUserEmail = useSelector(state => state.auth.currentUserEmail);
    const isSuspended = useSelector(state => state.shop.shop?.status === 'suspended');

    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');

    const [discountType, setDiscountType] = useState('percentage'); 
    const [discountVal, setDiscountVal] = useState('0'); 

    const [taxRate] = useState(0.05); // Fixed 5% tax
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Auto clear cart when user switcher resets context
    useEffect(() => {
        setCart([]);
    }, [currentUserEmail]);

    const addToCart = (product) => {
        const existing = cart.find(item => item.product_id === product.id);
        
        if (existing) {
            if (existing.quantity >= product.stock_quantity) {
                dispatch(showToast({ message: `${product.name} is out of stock!`, isError: true }));
                return;
            }
            setCart(cart.map(item => 
                item.product_id === product.id 
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            if (product.stock_quantity <= 0) {
                dispatch(showToast({ message: `${product.name} is out of stock!`, isError: true }));
                return;
            }
            setCart([...cart, {
                product_id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: 1,
                max_stock: product.stock_quantity
            }]);
        }
    };

    const handleSelectSearchableProduct = (product) => {
        if (product) {
            addToCart(product);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const updateQuantity = (productId, val) => {
        const qty = parseInt(val);
        if (isNaN(qty) || qty < 1) return;
        
        setCart(cart.map(item => {
            if (item.product_id === productId) {
                const targetQty = Math.min(qty, item.max_stock);
                return { ...item, quantity: targetQty };
            }
            return item;
        }));
    };

    const getCartSubtotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const getCartDiscount = () => {
        const subtotal = getCartSubtotal();
        const val = parseFloat(discountVal) || 0;
        if (discountType === 'percentage') {
            return (subtotal * val) / 100;
        }
        return Math.min(val, subtotal);
    };

    const getCartTax = () => {
        const subtotal = getCartSubtotal();
        const discount = getCartDiscount();
        return (subtotal - discount) * taxRate;
    };

    const getCartTotal = () => {
        const subtotal = getCartSubtotal();
        const discount = getCartDiscount();
        const tax = getCartTax();
        return (subtotal - discount) + tax;
    };

    const filteredProducts = products.filter(prod => {
        const matchesSearch = 
            prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (prod.sku && prod.sku.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === '' || String(prod.category_id) === String(selectedCategory);
        const matchesBrand = selectedBrand === '' || String(prod.brand_id) === String(selectedBrand);
        return matchesSearch && matchesCategory && matchesBrand;
    });

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cart.length === 0 || submitting) return;

        setSubmitting(true);
        const headers = getHeaders();
        const discount = getCartDiscount();
        const tax = getCartTax();
        const total = getCartTotal();

        try {
            const response = await fetch('/api/v1/tenant/sales', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: customerName,
                    customer_email: customerEmail,
                    payment_method: paymentMethod,
                    discount,
                    tax,
                    items: cart.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity
                    }))
                })
            });

            const res = await response.json();
            if (res.success) {
                dispatch(showToast({ message: 'Sale completed successfully!', isError: false }));
                setCart([]);
                setCustomerName('');
                setCustomerEmail('');
                setDiscountVal('0');
                dispatch(fetchState());
                // Open Receipt Modal
                dispatch(setSelectedReceipt(res.data));
            } else {
                dispatch(showToast({ message: res.message || 'Checkout failed.', isError: true }));
            }
        } catch (err) {
            dispatch(showToast({ message: 'Checkout connection error.', isError: true }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem', height: 'calc(100vh - 190px)', minHeight: '520px', alignItems: 'stretch' }}>
            
            {/* Left Column: Product Selection & Catalog Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '1.25rem', overflow: 'hidden', boxShadow: colors.shadow }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '160px' }}>
                        <input
                            type="text"
                            placeholder="🔍 Search name or SKU..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: '100%', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem' }}
                        />
                    </div>
                    <div style={{ width: '140px' }}>
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            style={{ width: '100%', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', outline: 'none', fontSize: '0.85rem' }}
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id} style={{ background: colors.surface, color: colors.text }}>{c.name}</option>)}
                        </select>
                    </div>
                    <div style={{ width: '140px' }}>
                        <select
                            value={selectedBrand}
                            onChange={e => setSelectedBrand(e.target.value)}
                            style={{ width: '100%', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', outline: 'none', fontSize: '0.85rem' }}
                        >
                            <option value="">All Brands</option>
                            {brands.map(b => <option key={b.id} value={b.id} style={{ background: colors.surface, color: colors.text }}>{b.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Catalog Grid */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.8rem', paddingRight: '0.2rem' }}>
                    {filteredProducts.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', color: colors.textMuted, textAlign: 'center', padding: '4rem' }}>No products found matching filters.</div>
                    ) : (
                        filteredProducts.map(prod => {
                            const inCartItem = cart.find(i => i.product_id === prod.id);
                            const cartQty = inCartItem ? inCartItem.quantity : 0;
                            const isOutOfStock = prod.stock_quantity <= 0;
                            const isMaxedOut = cartQty >= prod.stock_quantity;

                            return (
                                <div 
                                    key={prod.id}
                                    onClick={() => !isOutOfStock && !isMaxedOut && addToCart(prod)}
                                    style={{
                                        background: isOutOfStock ? (isDark ? 'rgba(0,0,0,0.3)' : '#f3f4f6') : colors.cardBg,
                                        border: isMaxedOut 
                                            ? '1px solid rgba(99, 102, 241, 0.4)' 
                                            : (isOutOfStock ? `1px dashed ${colors.border}` : `1px solid ${colors.border}`),
                                        borderRadius: '12px',
                                        padding: '0.8rem',
                                        cursor: (isOutOfStock || isMaxedOut) ? 'default' : 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.4rem',
                                        position: 'relative',
                                        transition: 'all 0.2s',
                                        opacity: isOutOfStock ? 0.5 : 1
                                    }}
                                >
                                    {cartQty > 0 && (
                                        <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#6366f1', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                            {cartQty}
                                        </div>
                                    )}

                                    <div style={{ fontWeight: '600', fontSize: '0.8rem', color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', height: '2.2rem', lineHeight: '1.1rem' }}>
                                        {prod.name}
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                        <span style={{ fontSize: '0.95rem', fontWeight: '700', color: isDark ? '#10b981' : '#059669' }}>
                                            {cur.format(prod.price)}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: isOutOfStock ? '#ef4444' : colors.textMuted }}>
                                            {isOutOfStock ? 'Out of stock' : `${prod.stock_quantity} left`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Column: Shopping Cart & Checkout Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '1.25rem', overflow: 'hidden', boxShadow: colors.shadow }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: `1px solid ${colors.border}`, paddingBottom: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: colors.text }}>
                    <span>🛒 {t('cart_items')}</span>
                    <span style={{ fontSize: '0.8rem', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: colors.text }}>{cart.length} items</span>
                </h3>

                {/* Cart Items List */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.2rem' }}>
                    {cart.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: colors.textMuted, fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                            Your cart is empty.<br/>Click products on the left to add.
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.product_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '0.6rem' }}>
                                <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: isDark ? '#10b981' : '#059669', marginTop: '0.1rem' }}>{cur.format(item.price)} / unit</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <input 
                                        type="number"
                                        min="1"
                                        max={item.max_stock}
                                        value={item.quantity}
                                        onChange={e => updateQuantity(item.product_id, e.target.value)}
                                        style={{ width: '45px', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.25rem', borderRadius: '4px', textAlign: 'center', outline: 'none', fontSize: '0.8rem' }}
                                    />
                                    <button 
                                        onClick={() => removeFromCart(item.product_id)}
                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem' }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Subtotal, discount calculations */}
                {cart.length > 0 && (
                    <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: colors.textMuted }}>Subtotal:</span>
                            <span style={{ color: colors.text, fontWeight: '500' }}>{cur.format(getCartSubtotal())}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ color: colors.textMuted }}>{t('discount')}:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <select 
                                    value={discountType}
                                    onChange={e => setDiscountType(e.target.value)}
                                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, fontSize: '0.75rem', padding: '0.2rem', borderRadius: '4px', outline: 'none' }}
                                >
                                    <option value="percentage">%</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                                <input 
                                    type="number"
                                    min="0"
                                    value={discountVal}
                                    onChange={e => setDiscountVal(e.target.value)}
                                    style={{ width: '55px', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.2rem', borderRadius: '4px', textAlign: 'center', outline: 'none', fontSize: '0.75rem' }}
                                />
                                <span style={{ color: '#ef4444', marginLeft: '0.2rem' }}>-{cur.format(getCartDiscount())}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: colors.textMuted }}>{t('tax')} (5%):</span>
                            <span style={{ color: colors.text }}>+{cur.format(getCartTax())}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '700', color: isDark ? '#10b981' : '#059669', borderTop: `1px solid ${colors.border}`, paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                            <span>{t('total_amount')}:</span>
                            <span>{cur.format(getCartTotal())}</span>
                        </div>
                    </div>
                )}

                {/* Customer Information & Payment Checkout Form */}
                <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: `1px solid ${colors.border}`, paddingTop: '0.8rem' }}>
                    <input
                        type="text"
                        placeholder="Customer Name (Optional)"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        style={{ width: '100%', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.5rem', borderRadius: '6px', outline: 'none', fontSize: '0.8rem' }}
                    />
                    <input
                        type="email"
                        placeholder="Customer Email (Optional)"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        style={{ width: '100%', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.5rem', borderRadius: '6px', outline: 'none', fontSize: '0.8rem' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted, flexShrink: 0 }}>Payment:</span>
                        <select
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                            style={{ flex: 1, background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.45rem', borderRadius: '6px', cursor: 'pointer', outline: 'none', fontSize: '0.8rem' }}
                        >
                            <option value="cash">💵 Cash</option>
                            <option value="card">💳 Card</option>
                            <option value="mobile">📱 Mobile payment</option>
                        </select>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={submitting || cart.length === 0 || isSuspended}
                        style={{
                            background: isSuspended ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: isSuspended ? '#ef4444' : '#fff',
                            border: 'none',
                            padding: '0.7rem',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: (submitting || cart.length === 0 || isSuspended) ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isDark ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 4px 12px rgba(16, 185, 129, 0.08)',
                            marginTop: '0.4rem',
                            fontSize: '0.9rem',
                            width: '100%',
                            textAlign: 'center'
                        }}
                    >
                        {isSuspended ? 'Shop Suspended' : (submitting ? 'Processing sale...' : `${cur.symbol} ${t('complete_pos_sale')}`)}
                    </button>
                </form>
            </div>
        </div>
    );
}
