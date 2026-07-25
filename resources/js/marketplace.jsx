import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';

/* ─────────────────────────────────────────────
   API Helpers
───────────────────────────────────────────── */
const API = '/api/v1';

const getCsrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

async function apiGet(url) {
    try {
        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        return await r.json();
    } catch { return null; }
}

async function apiPost(url, body = {}) {
    try {
        const r = await fetch(url, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
            body: JSON.stringify(body),
        });
        return await r.json();
    } catch { return null; }
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price ?? 0);
}

/* ─────────────────────────────────────────────
   Design Tokens
───────────────────────────────────────────── */
const C = {
    bg:        '#08080d',
    surface:   'rgba(15,15,23,0.9)',
    card:      'rgba(20,20,32,0.75)',
    border:    'rgba(255,255,255,0.07)',
    accent:    '#6366f1',
    accentAlt: '#8b5cf6',
    success:   '#10b981',
    warning:   '#f59e0b',
    danger:    '#ef4444',
    text:      '#f1f5f9',
    muted:     '#94a3b8',
    faint:     '#475569',
};

/* ─────────────────────────────────────────────
   Global Styles
───────────────────────────────────────────── */
const globalCss = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Outfit', sans-serif; background: ${C.bg}; color: ${C.text}; min-height: 100vh; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 3px; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes shimmer  { 0% { background-position:-600px 0; } 100% { background-position:600px 0; } }
  @keyframes spin     { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes gradShift{ 0%,100%{ background-position:0% 50%; } 50%{ background-position:100% 50%; } }
  @keyframes modalIn  { from { opacity:0; transform:scale(0.94) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .fade-up { animation: fadeUp 0.4s ease both; }
  .skeleton { background: linear-gradient(90deg,rgba(28,28,45,0.7) 25%,rgba(45,45,70,0.7) 50%,rgba(28,28,45,0.7) 75%); background-size:600px 100%; animation:shimmer 1.3s infinite; border-radius:8px; }
  .product-card { transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; }
  .product-card:hover { transform:translateY(-5px); box-shadow:0 24px 48px rgba(0,0,0,0.55),0 0 0 1px rgba(99,102,241,0.28); border-color:rgba(99,102,241,0.28)!important; }
  .shop-chip-btn { transition: all 0.18s ease; }
  .shop-chip-btn:hover { border-color:${C.accent}!important; color:${C.text}!important; }
  .inp { background:${C.card}; border:1px solid ${C.border}; color:${C.text}; font-family:'Outfit',sans-serif; border-radius:10px; padding:0.75rem 1rem; font-size:0.95rem; width:100%; transition:border-color 0.2s,box-shadow 0.2s; }
  .inp:focus { outline:none; border-color:${C.accent}; box-shadow:0 0 0 3px rgba(99,102,241,0.15); }
  .btn-primary { background:linear-gradient(135deg,${C.accent},${C.accentAlt}); color:#fff; border:none; border-radius:10px; cursor:pointer; font-family:'Outfit',sans-serif; font-weight:700; transition:opacity 0.18s,transform 0.18s; }
  .btn-primary:hover:not(:disabled) { opacity:0.85; transform:translateY(-1px); }
  .btn-primary:disabled { opacity:0.45; cursor:not-allowed; }
  .btn-ghost { background:transparent; border:1px solid ${C.border}; color:${C.muted}; border-radius:8px; cursor:pointer; font-family:'Outfit',sans-serif; font-weight:500; transition:all 0.18s; }
  .btn-ghost:hover { border-color:${C.accent}; color:${C.text}; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:500; animation:fadeIn 0.2s ease; padding:1rem; }
  .modal-box { animation:modalIn 0.25s ease; }
  .drawer-box { animation:drawerIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .tab-btn { background:transparent; border:none; cursor:pointer; font-family:'Outfit',sans-serif; font-weight:600; font-size:0.9rem; padding:0.5rem 1.2rem; border-radius:8px; transition:all 0.18s; }
  .tab-btn.active { background:${C.accent}; color:#fff; }
  .tab-btn:not(.active) { color:${C.muted}; }
  .tab-btn:not(.active):hover { color:${C.text}; background:rgba(255,255,255,0.05); }
  .shop-pick-item { display:flex; align-items:center; justify-content:space-between; padding:0.6rem 0.8rem; border-radius:8px; border:1px solid ${C.border}; cursor:pointer; transition:all 0.18s; background:transparent; width:100%; font-family:'Outfit',sans-serif; color:${C.text}; font-size:0.88rem; }
  .shop-pick-item:hover { border-color:${C.accent}; background:rgba(99,102,241,0.07); }
  .shop-pick-item.selected { border-color:${C.accent}; background:rgba(99,102,241,0.12); }
  .cart-item-row { display:flex; gap:0.75rem; padding:0.85rem 0; border-bottom:1px solid ${C.border}; align-items:center; }
  .cart-qty-btn { width:24px; height:24px; border-radius:6px; border:1px solid ${C.border}; background:rgba(255,255,255,0.03); color:${C.text}; cursor:pointer; font-size:0.9rem; display:flex; align-items:center; justify-content:center; transition:all 0.18s; }
  .cart-qty-btn:hover { border-color:${C.accent}; color:${C.accent}; }
`;

/* ─────────────────────────────────────────────
   Reusable Components
───────────────────────────────────────────── */
function Spinner({ size = 24, color = C.accent }) {
    return <div style={{ width: size, height: size, borderRadius: '50%', border: `2.5px solid rgba(99,102,241,0.2)`, borderTopColor: color, animation: 'spin 0.75s linear infinite', flexShrink: 0 }} />;
}

function SkeletonCard() {
    return (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <div className="skeleton" style={{ height: 195 }} />
            <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div className="skeleton" style={{ height: 15, width: '70%' }} />
                <div className="skeleton" style={{ height: 12, width: '45%' }} />
                <div className="skeleton" style={{ height: 20, width: '30%', marginTop: 4 }} />
            </div>
        </div>
    );
}

function ProductCard({ product, onShopClick, onAddToCart, onBuyNow, onViewProduct }) {
    const [imgErr, setImgErr] = useState(false);
    const img = product.images?.[0]?.image_url;

    return (
        <div className="product-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div onClick={() => onViewProduct?.(product.id)} style={{ cursor: 'pointer', height: 195, background: 'rgba(12,12,20,0.8)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                {img && !imgErr
                    ? <img src={img} alt={product.name} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', color: C.faint }}>🛍️</div>
                }
                {product.status === 'published' && (
                    <span style={{ position: 'absolute', top: 9, right: 9, background: 'rgba(16,185,129,0.15)', color: C.success, border: '1px solid rgba(16,185,129,0.28)', fontSize: '0.6rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        In Stock
                    </span>
                )}
            </div>
            <div style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flexGrow: 1 }}>
                <p onClick={() => onViewProduct?.(product.id)} style={{ cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600, color: C.text, lineHeight: 1.35 }}
                    onMouseOver={e => e.currentTarget.style.color = C.accent}
                    onMouseOut={e => e.currentTarget.style.color = C.text}
                >
                    {product.name}
                </p>
                {product.category?.name && <p style={{ fontSize: '0.7rem', color: C.faint, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{product.category.name}</p>}
                
                {/* Shop Badge */}
                {product.shop?.slug && (
                    <button onClick={() => onShopClick?.(product.shop.slug)} style={{ margin: '0.3rem 0 0.6rem 0', padding: '0.25rem 0.55rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 20, color: C.accent, fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', width: 'fit-content', fontFamily: 'Outfit, sans-serif' }}>
                        🏪 {product.shop.name}
                    </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.4rem' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: C.accent }}>{formatPrice(product.price)}</span>
                    {product.stock_quantity > 0 && <span style={{ fontSize: '0.7rem', color: C.muted }}>{product.stock_quantity} left</span>}
                </div>

                {/* Add to Cart & Buy Now Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button 
                        onClick={() => onAddToCart?.(product)}
                        className="btn-ghost"
                        style={{ flex: 1, padding: '0.55rem 0.4rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
                    >
                        🛒 +Cart
                    </button>
                    <button 
                        onClick={() => onBuyNow?.(product)}
                        className="btn-primary"
                        style={{ flex: 1.2, padding: '0.55rem 0.4rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
                    >
                        ⚡ Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
}

function ProductGrid({ products, loading, onShopClick, onAddToCart, onBuyNow, onViewProduct }) {
    if (loading) return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '1.4rem' }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
    );
    if (!products?.length) return (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: C.muted }}>
            <div style={{ fontSize: '2.8rem', marginBottom: '0.8rem' }}>🔍</div>
            <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>No products found</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>Try a different search or browse all shops.</p>
        </div>
    );
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '1.4rem' }} className="fade-up">
            {products.map((p, i) => <ProductCard key={p.id || i} product={p} onShopClick={onShopClick} onAddToCart={onAddToCart} onBuyNow={onBuyNow} onViewProduct={onViewProduct} />)}
        </div>
    );
}

/* ─────────────────────────────────────────────
   OTP Registration / Login Modal
───────────────────────────────────────────── */
function AuthModal({ onClose, onSuccess, allShops }) {
    const [step, setStep]           = useState(1); 
    const [phone, setPhone]         = useState('');
    const [otp, setOtp]             = useState('');
    const [name, setName]           = useState('');
    const [devOtp, setDevOtp]       = useState('');
    const [isNew, setIsNew]         = useState(false);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [shopSearch, setShopSearch] = useState('');
    const [selectedShops, setSelectedShops] = useState([]); 

    const MAX_SHOPS = 5;

    const filteredShops = allShops.filter(s =>
        !shopSearch || s.name?.toLowerCase().includes(shopSearch.toLowerCase()) || s.slug?.toLowerCase().includes(shopSearch.toLowerCase())
    );

    const toggleShop = (shop) => {
        setSelectedShops(prev => {
            const exists = prev.find(s => s.id === shop.id);
            if (exists) return prev.filter(s => s.id !== shop.id);
            if (prev.length >= MAX_SHOPS) return prev; 
            return [...prev, shop];
        });
    };

    const handleSendOtp = async () => {
        if (!phone.trim()) { setError('Please enter your phone number.'); return; }
        setError(''); setLoading(true);
        const res = await apiPost(`${API}/marketplace/send-otp`, { phone: phone.trim() });
        setLoading(false);
        if (!res || !res.success) { setError(res?.message || 'Failed to send OTP.'); return; }
        setDevOtp(res.dev_otp || '');
        setIsNew(res.is_new !== false);
        setStep(2);
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
        setError(''); setLoading(true);
        const res = await apiPost(`${API}/marketplace/verify-otp`, {
            phone: phone.trim(),
            otp,
            name: name || undefined,
            shop_ids: [],
        });
        setLoading(false);
        if (!res || !res.success) { setError(res?.message || 'Invalid OTP.'); return; }
        if (!isNew && res.customer?.name && res.customer?.preferred_shops?.length > 0) {
            onSuccess(res.customer);
            return;
        }
        if (res.customer?.name) setName(res.customer.name);
        if (res.customer?.preferred_shops) setSelectedShops(res.customer.preferred_shops);
        setStep(3);
    };

    const handleFinish = async () => {
        setError(''); setLoading(true);
        const shopIds = selectedShops.map(s => s.id);
        if (shopIds.length > 0) {
            await apiPost(`${API}/marketplace/shops`, { shop_ids: shopIds });
        }
        const meRes = await apiGet(`${API}/marketplace/me`);
        setLoading(false);
        if (meRes?.success && meRes.customer) {
            onSuccess({ ...meRes.customer, name: name || meRes.customer.name || phone });
        } else {
            onSuccess({ name: name || phone, phone, preferred_shops: selectedShops });
        }
    };

    const handleOtpKeydown = (e) => { if (e.key === 'Enter') handleVerifyOtp(); };
    const handlePhoneKeydown = (e) => { if (e.key === 'Enter') handleSendOtp(); };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ background: 'rgba(14,14,22,0.98)', border: `1px solid rgba(99,102,241,0.25)`, borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 480, position: 'relative', boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: C.muted, fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>

                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    {[1, 2, 3].map(s => (
                        <div key={s} style={{ width: s === step ? 28 : 8, height: 8, borderRadius: 4, background: s <= step ? C.accent : C.border, transition: 'all 0.3s ease' }} />
                    ))}
                </div>

                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }} className="fade-up">
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.text, marginBottom: '0.3rem' }}>Welcome to GlobalShop</h2>
                            <p style={{ fontSize: '0.88rem', color: C.muted }}>Enter your phone number to sign in or create an account.</p>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
                            <input id="auth-phone" className="inp" type="tel" placeholder="+880 1X XX XX XX XX" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={handlePhoneKeydown} autoFocus />
                        </div>
                        {error && <p style={{ fontSize: '0.82rem', color: C.danger }}>{error}</p>}
                        <button id="send-otp-btn" className="btn-primary" onClick={handleSendOtp} disabled={loading} style={{ padding: '0.85rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            {loading ? <Spinner size={18} color="#fff" /> : '📱 Send OTP'}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }} className="fade-up">
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.text, marginBottom: '0.3rem' }}>Enter OTP</h2>
                            <p style={{ fontSize: '0.88rem', color: C.muted }}>Sent to <strong style={{ color: C.text }}>{phone}</strong></p>
                        </div>
                        {devOtp && (
                            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '0.7rem 1rem', fontSize: '0.82rem', color: C.warning }}>
                                🛠️ <strong>DEV MODE:</strong> OTP is <strong style={{ fontSize: '1rem', letterSpacing: '0.15em' }}>{devOtp}</strong>
                            </div>
                        )}
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>6-Digit OTP</label>
                            <input id="auth-otp" className="inp" type="text" inputMode="numeric" maxLength={6} placeholder="1 2 3 4 5 6" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={handleOtpKeydown} autoFocus style={{ fontSize: '1.4rem', letterSpacing: '0.3em', textAlign: 'center' }} />
                        </div>
                        {error && <p style={{ fontSize: '0.82rem', color: C.danger }}>{error}</p>}
                        <button id="verify-otp-btn" className="btn-primary" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} style={{ padding: '0.85rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            {loading ? <Spinner size={18} color="#fff" /> : '✅ Verify OTP'}
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }} className="fade-up">
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: C.text, marginBottom: '0.25rem' }}>
                                {isNew ? '🎉 Almost there!' : 'Your Preferences'}
                            </h2>
                            <p style={{ fontSize: '0.85rem', color: C.muted }}>
                                {isNew ? 'Set your name and pick up to 5 shops to follow.' : 'Update your name and preferred shops.'}
                            </p>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>Your Name</label>
                            <input id="auth-name" className="inp" type="text" placeholder="e.g. Rahim Hossain" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifySpace: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preferred Shops (optional)</label>
                                <span style={{ fontSize: '0.78rem', color: selectedShops.length >= MAX_SHOPS ? C.warning : C.muted, fontWeight: 700 }}>{selectedShops.length}/{MAX_SHOPS}</span>
                            </div>
                            <input id="shop-picker-search" className="inp" type="text" placeholder="Search shops…" value={shopSearch} onChange={e => setShopSearch(e.target.value)} style={{ marginBottom: '0.5rem', padding: '0.55rem 0.9rem', fontSize: '0.88rem' }} />
                            <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                {filteredShops.map(shop => {
                                    const isSelected = !!selectedShops.find(s => s.id === shop.id);
                                    const isDisabled = !isSelected && selectedShops.length >= MAX_SHOPS;
                                    return (
                                        <button key={shop.id} id={`shop-pick-${shop.slug}`} className={`shop-pick-item ${isSelected ? 'selected' : ''}`} onClick={() => !isDisabled && toggleShop(shop)} disabled={isDisabled} style={{ opacity: isDisabled ? 0.4 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
                                            <span>🏪 {shop.name}</span>
                                            {isSelected ? <span style={{ color: C.success, fontSize: '0.85rem' }}>✓ Selected</span> : <span style={{ color: C.faint, fontSize: '0.78rem' }}>+ Follow</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {error && <p style={{ fontSize: '0.82rem', color: C.danger }}>{error}</p>}
                        <button id="finish-register-btn" className="btn-primary" onClick={handleFinish} disabled={loading} style={{ padding: '0.85rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            {loading ? <Spinner size={18} color="#fff" /> : '🚀 Start Shopping'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Cart Drawer / Checkout Modal (No overlay, click outside closed)
───────────────────────────────────────────── */
function CartDrawer({ isOpen, onClose, cart, updateQty, removeItem, clearCart, customer, onAuthRequest, initialStep = 1 }) {
    const [step, setStep] = useState(1); 
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [payment, setPayment] = useState('cash'); // cash, card, mobile
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orderResults, setOrderResults] = useState([]);
    
    const drawerRef = useRef(null);

    // Sync initial step when drawer is opened
    useEffect(() => {
        if (isOpen) {
            setStep(initialStep);
        }
    }, [isOpen, initialStep]);

    // Click outside handler
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target)) {
                // If the user clicked on any action buttons to add or buy products, prevent drawer closing
                if (event.target.closest('.btn-primary') || event.target.closest('.btn-ghost') || event.target.closest('#nav-cart-btn') || event.target.closest('.shop-chip-btn')) {
                    return;
                }
                onClose();
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Populate profile data if logged in
    useEffect(() => {
        if (customer) {
            setName(customer.name || '');
            setPhone(customer.phone || '');
            setAddress(customer.shipping_address || '');
        }
    }, [customer, isOpen]);

    if (!isOpen) return null;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const handleCheckoutSubmit = async () => {
        if (!name.trim()) { setError('Name is mandatory.'); return; }
        if (!phone.trim() || phone.trim().length < 10) { setError('A valid Phone Number is mandatory.'); return; }
        if (!address.trim()) { setError('Shipping Address is mandatory.'); return; }
        setError('');
        setLoading(true);

        const payload = {
            customer_name: name.trim(),
            customer_phone: phone.trim(),
            shipping_address: address.trim(),
            payment_method: payment,
            items: cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
            }))
        };

        const res = await apiPost(`${API}/marketplace/checkout`, payload);
        setLoading(false);

        if (res && res.success) {
            setOrderResults(res.orders || []);
            clearCart();
            setStep(3);
        } else {
            setError(res?.message || 'Checkout failed. Please try again.');
        }
    };

    return (
        <div ref={drawerRef} className="drawer-box" style={{ 
            position: 'fixed', 
            top: 0, 
            right: 0, 
            width: '100%', 
            maxWidth: 440, 
            background: 'rgba(10,10,15,0.96)', 
            height: '100vh', 
            borderLeft: `1px solid ${C.border}`, 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '1.5rem', 
            boxShadow: '-15px 0 45px rgba(0,0,0,0.8)', 
            zIndex: 600,
            backdropFilter: 'blur(16px)'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    {step === 1 && `🛒 Your Cart (${totalItems})`}
                    {step === 2 && '📋 Checkout Details'}
                    {step === 3 && '🎉 Order Confirmed!'}
                </h2>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* ── Step 1: Cart Items List ── */}
            {step === 1 && (
                <>
                    <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                        {cart.length === 0 ? (
                            <div style={{ textAlign: 'center', color: C.muted, padding: '3rem 1rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                                <p style={{ fontWeight: 600 }}>Your cart is empty</p>
                                <p style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>Browse the shop to add some premium products.</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.product.id} className="cart-item-row">
                                    <div style={{ flexGrow: 1 }}>
                                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: C.text }}>{item.product.name}</p>
                                        <p style={{ fontSize: '0.78rem', color: C.muted, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                                            🏪 {item.product.shop?.name}
                                        </p>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: C.accent, marginTop: '0.25rem' }}>
                                            {formatPrice(item.product.price)}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button className="cart-qty-btn" onClick={() => updateQty(item.product.id, item.quantity - 1)}>-</button>
                                        <span style={{ fontSize: '0.88rem', fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                                        <button className="cart-qty-btn" onClick={() => updateQty(item.product.id, item.quantity + 1)}>+</button>
                                    </div>
                                    <button onClick={() => removeItem(item.product.id)} style={{ background: 'transparent', border: 'none', color: C.faint, cursor: 'pointer', fontSize: '1.1rem', transition: 'color 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.color = C.danger}
                                        onMouseOut={e => e.currentTarget.style.color = C.faint}
                                    >✕</button>
                                </div>
                            ))
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '1rem', fontWeight: 700 }}>
                                <span>Subtotal:</span>
                                <span style={{ color: C.accent }}>{formatPrice(subtotal)}</span>
                            </div>
                            <button className="btn-primary" onClick={() => setStep(2)} style={{ padding: '0.85rem', fontSize: '0.95rem' }}>
                                Proceed to Checkout
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ── Step 2: Checkout details ── */}
            {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1, overflowY: 'auto' }} className="fade-up">
                    {!customer && (
                        <div style={{ background: 'rgba(99,102,241,0.08)', border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem', color: C.muted }}>
                            💡 <strong>Pro-Tip:</strong> <button onClick={() => { onClose(); onAuthRequest(); }} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Sign in</button> with your phone number to automatically save shipping details and follow shops.
                        </div>
                    )}

                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Receiver Name *</label>
                        <input id="checkout-name" className="inp" type="text" placeholder="e.g. Karim Ahmed" value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Contact Phone *</label>
                        <input id="checkout-phone" className="inp" type="tel" placeholder="e.g. +8801XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Shipping Address *</label>
                        <textarea id="checkout-address" className="inp" placeholder="e.g. House 12, Road 4, Sector 3, Uttara, Dhaka" value={address} onChange={e => setAddress(e.target.value)} style={{ resize: 'none', height: 80 }} />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>Payment Method</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[
                                { id: 'cash', label: '💵 COD (Cash)' },
                                { id: 'mobile', label: '📱 Mobile pay' },
                                { id: 'card', label: '💳 Card' },
                            ].map(p => (
                                <button key={p.id} className={`tab-btn ${payment === p.id ? 'active' : ''}`} onClick={() => setPayment(p.id)} style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', borderRadius: 8 }}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '0.85rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            <span>Order Total:</span>
                            <span style={{ color: C.accent, fontSize: '1rem' }}>{formatPrice(subtotal)}</span>
                        </div>

                        {error && <p style={{ fontSize: '0.82rem', color: C.danger, marginBottom: '0.75rem' }}>{error}</p>}

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-ghost" onClick={() => setStep(1)} style={{ flex: 1, padding: '0.8rem' }}>Back</button>
                            <button id="place-order-btn" className="btn-primary" onClick={handleCheckoutSubmit} disabled={loading} style={{ flex: 2, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {loading ? <Spinner size={18} color="#fff" /> : '🚀 Place Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step 3: Success Screen ── */}
            {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'center', padding: '2rem 1rem' }} className="fade-up">
                    <div style={{ fontSize: '4rem' }}>🎉</div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: C.success }}>Order Placed Successfully!</h3>
                        <p style={{ fontSize: '0.85rem', color: C.muted, marginTop: '0.35rem' }}>Your order splits have been received by the shops.</p>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Invoices:</p>
                        {orderResults.map((ord, idx) => (
                            <div key={idx} style={{ display: 'flex', justifySpace: 'space-between', fontSize: '0.85rem', borderBottom: idx < orderResults.length - 1 ? `1px dashed ${C.border}` : 'none', paddingBottom: '0.4rem' }}>
                                <div>
                                    <p style={{ fontWeight: 600 }}>🏪 {ord.shop_name}</p>
                                    <p style={{ fontSize: '0.72rem', color: C.faint }}>{ord.invoice_number}</p>
                                </div>
                                <span style={{ fontWeight: 700, color: C.accent }}>{formatPrice(ord.total)}</span>
                            </div>
                        ))}
                    </div>

                    <button className="btn-primary" onClick={() => { setStep(1); onClose(); }} style={{ padding: '0.75rem', width: '100%', fontSize: '0.88rem' }}>
                        Continue Shopping
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Navbar
───────────────────────────────────────────── */
function Navbar({ customer, cartCount, onCartClick, onAuthClick, onLogout, currentShopSlug }) {
    return (
        <header style={{ position: 'sticky', top: 0, zIndex: 200, background: 'rgba(8,8,13,0.88)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 2rem', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Logo */}
                <a href="/shop" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.03em', background: `linear-gradient(135deg,${C.accent},${C.accentAlt})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GlobalShop</span>
                    <span style={{ fontSize: '0.65rem', color: C.faint, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', paddingTop: 2 }}>Marketplace</span>
                </a>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {currentShopSlug && <span style={{ fontSize: '0.8rem', color: C.muted }}>📍 <strong style={{ color: C.text }}>{currentShopSlug}</strong></span>}

                    {/* Cart Trigger */}
                    <button id="nav-cart-btn" onClick={onCartClick} className="btn-ghost" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative' }}>
                        🛒 Cart
                        {cartCount > 0 && (
                            <span id="nav-cart-count" style={{ background: C.accent, color: '#fff', borderRadius: 10, padding: '0.1rem 0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {customer ? (
                        <>
                            <span style={{ fontSize: '0.82rem', background: 'rgba(99,102,241,0.12)', border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 20, padding: '0.3rem 0.8rem', color: C.accent, fontWeight: 600 }}>
                                👤 {customer.name || customer.phone}
                                {customer.preferred_shops?.length > 0 && (
                                    <span style={{ marginLeft: '0.4rem', background: C.accent, color: '#fff', borderRadius: 10, padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>
                                        ⭐ {customer.preferred_shops.length}
                                    </span>
                                )}
                            </span>
                            <button id="nav-logout-btn" className="btn-ghost" onClick={onLogout} style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>Log Out</button>
                        </>
                    ) : (
                        <button id="nav-signin-btn" className="btn-primary" onClick={onAuthClick} style={{ padding: '0.45rem 1.1rem', fontSize: '0.88rem', borderRadius: 8 }}>
                            Sign In / Register
                        </button>
                    )}

                    <a href="/shop" style={{ padding: '0.42rem 0.9rem', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: `1px solid rgba(99,102,241,0.2)`, color: C.accent, fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.18s', whiteSpace: 'nowrap' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                    >⚙️ Manage Shop</a>
                </div>
            </div>
        </header>
    );
}

/* ─────────────────────────────────────────────
   Sidebar
───────────────────────────────────────────── */
function Sidebar({ allShops, activeShop, setActiveShop, allProducts, customer, preferredShopIds, onAddShop, onRemoveShop, navigate }) {
    const [shopSearch, setShopSearch] = useState('');
    const [tab, setTab] = useState('all'); 

    const filteredShops = allShops.filter(s =>
        !shopSearch || s.name?.toLowerCase().includes(shopSearch.toLowerCase()) || s.slug?.toLowerCase().includes(shopSearch.toLowerCase())
    );

    const shopsToShow = (tab === 'preferred' && customer)
        ? filteredShops.filter(s => preferredShopIds.includes(s.id))
        : filteredShops;

    return (
        <aside style={{ position: 'sticky', top: 78 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '1.3rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted }}>🏪 Browse by Shop</p>

                {customer && (
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.2rem', gap: '0.2rem' }}>
                        <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')} style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}>All</button>
                        <button className={`tab-btn ${tab === 'preferred' ? 'active' : ''}`} onClick={() => setTab('preferred')} style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}>⭐ Mine</button>
                    </div>
                )}

                <input id="sidebar-shop-search" className="inp" type="text" placeholder="Find a shop…" value={shopSearch} onChange={e => setShopSearch(e.target.value)} style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 420, overflowY: 'auto' }}>
                    <button id="sidebar-all-shops" className="shop-chip-btn" onClick={() => { setActiveShop(null); navigate('/shop'); }}
                        style={{ padding: '0.55rem 0.85rem', borderRadius: 8, textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, width: '100%', background: !activeShop ? C.accent : 'transparent', border: `1px solid ${!activeShop ? C.accent : C.border}`, color: !activeShop ? '#fff' : C.muted, fontFamily: 'Outfit, sans-serif' }}>
                        🌐 All Shops <span style={{ float: 'right', opacity: 0.7, fontSize: '0.72rem' }}>{allProducts.length}</span>
                    </button>

                    {shopsToShow.map(shop => {
                        const count = allProducts.filter(p => p.shop?.slug === shop.slug).length;
                        const isActive = activeShop === shop.slug;
                        const isPreferred = preferredShopIds.includes(shop.id);
                        const canAdd = customer && !isPreferred && preferredShopIds.length < 5;
                        const canRemove = customer && isPreferred;

                        return (
                            <div key={shop.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <button id={`sidebar-shop-${shop.slug}`} className="shop-chip-btn" onClick={() => { setActiveShop(shop.slug); navigate(`/shop/${shop.slug}`); }}
                                    style={{ flex: 1, padding: '0.55rem 0.85rem', borderRadius: 8, textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, background: isActive ? C.accent : 'transparent', border: `1px solid ${isActive ? C.accent : C.border}`, color: isActive ? '#fff' : C.muted, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    {isPreferred && <span title="Preferred shop" style={{ fontSize: '0.75rem' }}>⭐</span>}
                                    🏪 {shop.name}
                                    <span style={{ marginLeft: 'auto', opacity: 0.65, fontSize: '0.72rem' }}>{count}</span>
                                </button>
                                {canAdd && (
                                    <button title="Add to My Shops" onClick={() => onAddShop(shop)}
                                        style={{ padding: '0.4rem 0.5rem', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.18s', flexShrink: 0 }}
                                        onMouseOver={e => { e.currentTarget.style.borderColor = C.success; e.currentTarget.style.color = C.success; }}
                                        onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
                                        +⭐
                                    </button>
                                )}
                                {canRemove && (
                                    <button title="Remove from My Shops" onClick={() => onRemoveShop(shop)}
                                        style={{ padding: '0.4rem 0.5rem', background: 'transparent', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 6, color: 'rgba(239,68,68,0.6)', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.18s', flexShrink: 0 }}
                                        onMouseOver={e => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = C.danger; }}
                                        onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; }}>
                                        ✕
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}

/* ─────────────────────────────────────────────
   Marketplace Landing  /shop
───────────────────────────────────────────── */
function MarketplacePage({ customer, setCustomer, allShops, setAllShops, addToCart, onBuyNow, onCartClick, showAuth, setShowAuth }) {
    const navigate = useNavigate();
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [activeShop, setActiveShop]   = useState(null);
    const [feedTab, setFeedTab]         = useState('my');   
    const debounceRef = useRef(null);

    const preferredShopIds = customer?.preferred_shops?.map(s => s.id) || [];
    const preferredShopSlugs = customer?.preferred_shops?.map(s => s.slug) || [];

    useEffect(() => {
        setLoading(true);
        apiGet(`${API}/products`).then(data => {
            const products = data?.data || data || [];
            setAllProducts(products);
            const shopMap = {};
            products.forEach(p => { if (p.shop && !shopMap[p.shop.id]) shopMap[p.shop.id] = p.shop; });
            setAllShops(Object.values(shopMap));
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (customer && preferredShopIds.length > 0) setFeedTab('my');
        else setFeedTab('all');
    }, [customer]);

    const filtered = (() => {
        let result = allProducts;
        if (feedTab === 'my' && customer && preferredShopSlugs.length > 0) {
            result = result.filter(p => preferredShopSlugs.includes(p.shop?.slug));
        }
        if (activeShop) {
            result = result.filter(p => p.shop?.slug === activeShop);
        }
        clearTimeout(debounceRef.current);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.category?.name?.toLowerCase().includes(q) ||
                p.shop?.name?.toLowerCase().includes(q)
            );
        }
        return result;
    })();

    const handleAddShop = async (shop) => {
        if (!customer) { setShowAuth(true); return; }
        const newIds = [...new Set([...preferredShopIds, shop.id])].slice(0, 5);
        const res = await apiPost(`${API}/marketplace/shops`, { shop_ids: newIds });
        if (res?.success) setCustomer(prev => ({ ...prev, preferred_shops: res.preferred_shops }));
    };

    const handleRemoveShop = async (shop) => {
        if (!customer) return;
        const newIds = preferredShopIds.filter(id => id !== shop.id);
        const res = await apiPost(`${API}/marketplace/shops`, { shop_ids: newIds });
        if (res?.success) setCustomer(prev => ({ ...prev, preferred_shops: res.preferred_shops }));
    };

    return (
        <>
            {/* Hero */}
            <section style={{ background: `radial-gradient(ellipse at 65% -30%,rgba(99,102,241,0.16) 0%,transparent 55%), radial-gradient(ellipse at 5% 90%,rgba(139,92,246,0.09) 0%,transparent 45%)`, borderBottom: `1px solid ${C.border}`, padding: '3.5rem 2rem 2.5rem', textAlign: 'center' }}>
                <div style={{ maxWidth: 680, margin: '0 auto' }} className="fade-up">
                    {customer && preferredShopIds.length > 0 ? (
                        <>
                            <p style={{ fontSize: '0.75rem', color: C.accent, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.7rem' }}>✦ Your Personalized Feed</p>
                            <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.025em', color: C.text, marginBottom: '0.6rem' }}>
                                Welcome back, {customer.name || 'Shopper'} 👋
                            </h1>
                            <p style={{ fontSize: '1rem', color: C.muted }}>Showing products from your {preferredShopIds.length} preferred shop{preferredShopIds.length > 1 ? 's' : ''}.</p>
                        </>
                    ) : (
                        <>
                            <p style={{ fontSize: '0.75rem', color: C.accent, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.7rem' }}>✦ Multi-Tenant Marketplace</p>
                            <h1 style={{ fontSize: 'clamp(1.9rem,4.5vw,3.2rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, background: `linear-gradient(135deg,${C.text} 0%,${C.accent} 55%,${C.accentAlt} 100%)`, backgroundSize: '200% 200%', animation: 'gradShift 5s ease infinite', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.75rem' }}>
                                Discover Products from Every Shop
                            </h1>
                            <p style={{ fontSize: '1rem', color: C.muted, lineHeight: 1.6 }}>Browse, search, and explore products from all our sellers in one place.</p>
                        </>
                    )}

                    {/* Search */}
                    <div style={{ position: 'relative', maxWidth: 500, margin: '1.5rem auto 0' }}>
                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '1rem' }}>🔍</span>
                        <input id="marketplace-search" className="inp" type="text" placeholder="Search products, shops, categories…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.8rem', fontSize: '0.95rem', borderRadius: 12 }} />
                    </div>
                </div>
            </section>

            {/* Body */}
            <div style={{ maxWidth: 1320, margin: '0 auto', padding: '2rem 2rem', display: 'grid', gridTemplateColumns: '255px 1fr', gap: '2rem', alignItems: 'start' }}>
                <Sidebar allShops={allShops} activeShop={activeShop} setActiveShop={setActiveShop} allProducts={allProducts} customer={customer} preferredShopIds={preferredShopIds} onAddShop={handleAddShop} onRemoveShop={handleRemoveShop} navigate={navigate} />

                <main>
                    {customer && preferredShopIds.length > 0 && !activeShop && (
                        <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '0.25rem', marginBottom: '1.5rem', width: 'fit-content' }}>
                            <button id="feed-tab-my" className={`tab-btn ${feedTab === 'my' ? 'active' : ''}`} onClick={() => setFeedTab('my')}>⭐ My Shops</button>
                            <button id="feed-tab-all" className={`tab-btn ${feedTab === 'all' ? 'active' : ''}`} onClick={() => setFeedTab('all')}>🌐 All Shops</button>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifySpace: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: C.text }}>
                                {activeShop
                                    ? `${allShops.find(s => s.slug === activeShop)?.name || activeShop}'s Products`
                                    : feedTab === 'my' ? "My Shops' Products" : search ? `Results for "${search}"` : 'All Products'
                                }
                            </h2>
                            {!loading && <p style={{ fontSize: '0.78rem', color: C.muted, marginTop: '0.2rem' }}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>}
                        </div>
                        {activeShop && (
                            <button onClick={() => { setActiveShop(null); navigate('/shop'); }} className="btn-ghost" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>✕ Clear filter</button>
                        )}
                    </div>

                    <ProductGrid products={filtered} loading={loading} onShopClick={slug => { setActiveShop(slug); navigate(`/shop/${slug}`); }} onAddToCart={addToCart} onBuyNow={onBuyNow} onViewProduct={id => navigate(`/shop/product/${id}`)} />
                </main>
            </div>
        </>
    );
}

/* ─────────────────────────────────────────────
   Shop Page  /shop/:slug
───────────────────────────────────────────── */
function ShopPage({ customer, setCustomer, allShops, addToCart, onBuyNow, onCartClick, showAuth, setShowAuth }) {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [shopInfo, setShopInfo] = useState(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);
    const [search, setSearch]     = useState('');

    const preferredShopIds = customer?.preferred_shops?.map(s => s.id) || [];
    const isPreferred = shopInfo && preferredShopIds.includes(shopInfo.id);

    useEffect(() => {
        if (!slug) return;
        setLoading(true); setError(null);
        apiGet(`${API}/shops/${slug}/products`).then(data => {
            if (!data) { setError('Shop not found or has no products.'); }
            else {
                const prods = data?.data || data || [];
                setProducts(prods);
                if (prods.length > 0 && prods[0].shop) setShopInfo(prods[0].shop);
                else setShopInfo({ name: slug, slug });
            }
            setLoading(false);
        });
    }, [slug]);

    const filtered = search.trim()
        ? products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.name?.toLowerCase().includes(search.toLowerCase()))
        : products;

    const handleTogglePreferred = async () => {
        if (!customer) { setShowAuth(true); return; }
        let newIds;
        if (isPreferred) {
            newIds = preferredShopIds.filter(id => id !== shopInfo.id);
        } else {
            if (preferredShopIds.length >= 5) return; 
            newIds = [...preferredShopIds, shopInfo.id];
        }
        const res = await apiPost(`${API}/marketplace/shops`, { shop_ids: newIds });
        if (res?.success) setCustomer(prev => ({ ...prev, preferred_shops: res.preferred_shops }));
    };

    return (
        <>
            <section style={{ background: `linear-gradient(135deg,rgba(99,102,241,0.11) 0%,rgba(139,92,246,0.06) 100%)`, borderBottom: `1px solid ${C.border}`, padding: '2.5rem 2rem' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <button id="back-to-marketplace" onClick={() => navigate('/shop')} className="btn-ghost" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}>← All Shops</button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexGrow: 1, minWidth: 0 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${C.accent},${C.accentAlt})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🏪</div>
                        <div style={{ minWidth: 0 }}>
                            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: C.text }}>
                                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 180, height: 26 }} /> : (shopInfo?.name || slug)}
                            </h1>
                            {!loading && <p style={{ fontSize: '0.8rem', color: C.muted, marginTop: '0.2rem' }}>{products.length} product{products.length !== 1 ? 's' : ''}</p>}
                        </div>
                    </div>

                    {shopInfo && (
                        <button id="toggle-preferred-btn" onClick={handleTogglePreferred} className={isPreferred ? 'btn-primary' : 'btn-ghost'}
                            style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: !isPreferred && preferredShopIds.length >= 5 ? 0.4 : 1, cursor: !isPreferred && preferredShopIds.length >= 5 ? 'not-allowed' : 'pointer' }}>
                            {isPreferred ? '⭐ Following' : '+ Follow Shop'}
                        </button>
                    )}

                    <div style={{ position: 'relative', minWidth: 260 }}>
                        <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.9rem' }}>🔍</span>
                        <input id="shop-product-search" className="inp" type="text" placeholder="Search this shop…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.4rem', fontSize: '0.88rem', borderRadius: 10 }} />
                    </div>
                </div>
            </section>

            <div style={{ maxWidth: 1320, margin: '0 auto', padding: '2rem 2rem' }}>
                {error ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 16, color: C.danger }}>
                        <div style={{ fontSize: '2.2rem', marginBottom: '0.8rem' }}>⚠️</div>
                        <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>{error}</p>
                        <button onClick={() => navigate('/shop')} className="btn-primary" style={{ marginTop: '1.2rem', padding: '0.65rem 1.4rem', borderRadius: 8, fontSize: '0.9rem' }}>Browse All Shops</button>
                    </div>
                ) : (
                    <>
                        {!loading && search && <p style={{ fontSize: '0.82rem', color: C.muted, marginBottom: '1.2rem' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"</p>}
                        <ProductGrid products={filtered} loading={loading} onShopClick={s => navigate(`/shop/${s}`)} onAddToCart={addToCart} onBuyNow={onBuyNow} onViewProduct={id => navigate(`/shop/product/${id}`)} />
                    </>
                )}
            </div>
        </>
    );
}

/* ─────────────────────────────────────────────
   Product Detail Page  /shop/product/:id
───────────────────────────────────────────── */
function ProductDetailPage({ customer, addToCart, onBuyNow, onCartClick }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]       = useState(null);
    const [activeImgIdx, setActiveImgIdx] = useState(0);

    useEffect(() => {
        if (!id) return;
        setLoading(true); setError(null);
        apiGet(`${API}/products/${id}`).then(res => {
            if (res?.success && res.data) {
                setProduct(res.data);
            } else {
                setError('Product not found.');
            }
            setLoading(false);
        });
    }, [id]);

    if (loading) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', color: C.muted }}>
                <Spinner size={28} /> <span style={{ fontSize: '1rem' }}>Loading product details…</span>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div style={{ maxWidth: 800, margin: '4rem auto', padding: '2rem', textAlign: 'center', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 16, color: C.danger }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{error || 'Product not found'}</p>
                <button onClick={() => navigate('/shop')} className="btn-primary" style={{ marginTop: '1.5rem', padding: '0.7rem 1.5rem' }}>
                    Back to Marketplace
                </button>
            </div>
        );
    }

    const images = product.images || [];
    const mainImage = images[activeImgIdx]?.image_url;

    return (
        <div style={{ maxWidth: 1100, margin: '2.5rem auto', padding: '0 2rem' }} className="fade-up">
            <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem' }}>
                ← Go Back
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'start' }}>
                {/* Left Side: Images Gallery */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ width: '100%', height: 420, borderRadius: 20, background: 'rgba(12,12,20,0.8)', border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {mainImage ? (
                            <img src={mainImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            <div style={{ fontSize: '5rem', color: C.faint }}>🛍️</div>
                        )}
                        {product.status === 'published' && (
                            <span style={{ position: 'absolute', top: 15, right: 15, background: 'rgba(16,185,129,0.15)', color: C.success, border: '1px solid rgba(16,185,129,0.28)', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                In Stock
                            </span>
                        )}
                    </div>

                    {/* Thumbnails list (circular mirror view) */}
                    {images.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                            {images.map((img, idx) => {
                                const isActive = idx === activeImgIdx;
                                return (
                                    <button
                                        key={img.id}
                                        onClick={() => setActiveImgIdx(idx)}
                                        style={{
                                            width: 62,
                                            height: 62,
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            border: isActive ? `2.5px solid ${C.accent}` : `1.5px solid ${C.border}`,
                                            background: 'rgba(12,12,20,0.6)',
                                            cursor: 'pointer',
                                            padding: 0,
                                            boxShadow: isActive ? `0 0 15px rgba(99, 102, 241, 0.5)` : '0 4px 10px rgba(0,0,0,0.3)',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        onMouseEnter={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.borderColor = C.accentAlt;
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.borderColor = C.border;
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }
                                        }}
                                    >
                                        <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Side: Details Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        {product.category?.name && (
                            <span style={{ fontSize: '0.72rem', color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, background: 'rgba(99,102,241,0.08)', padding: '0.25rem 0.65rem', borderRadius: 20 }}>
                                {product.category.name}
                            </span>
                        )}
                        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginTop: '0.75rem', lineHeight: 1.2 }}>
                            {product.name}
                        </h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', borderBottom: `1px solid ${C.border}`, paddingBottom: '1rem' }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: C.accent }}>
                            {formatPrice(product.price)}
                        </span>
                        {product.stock_quantity > 0 ? (
                            <span style={{ fontSize: '0.85rem', color: C.muted }}>
                                Available Stock: <strong style={{ color: C.text }}>{product.stock_quantity} {product.stock_unit || 'pcs'}</strong>
                            </span>
                        ) : (
                            <span style={{ fontSize: '0.85rem', color: C.danger, fontWeight: 600 }}>Out of Stock</span>
                        )}
                    </div>

                    <div>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                            Product Description
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: C.muted, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                            {product.description || 'No description available for this product.'}
                        </p>
                    </div>

                    {/* Shop card */}
                    {product.shop && (
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifySpace: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                            <div>
                                <p style={{ fontSize: '0.72rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Seller Information</p>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.text, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    🏪 {product.shop.name}
                                </h4>
                            </div>
                            <button
                                onClick={() => navigate(`/shop/${product.shop.slug}`)}
                                className="btn-ghost"
                                style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', borderRadius: 8 }}
                            >
                                Visit Storefront →
                            </button>
                        </div>
                    )}

                    {/* Buy Actions */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            onClick={() => addToCart(product)}
                            className="btn-ghost"
                            disabled={product.stock_quantity <= 0}
                            style={{ flex: 1, padding: '0.9rem', fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                            🛒 Add to Cart
                        </button>
                        <button
                            onClick={() => onBuyNow?.(product)}
                            className="btn-primary"
                            disabled={product.stock_quantity <= 0}
                            style={{ flex: 1.5, padding: '0.9rem', fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                            ⚡ Direct Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Root App — shared state + routing
───────────────────────────────────────────── */
function MarketplaceApp() {
    const [customer, setCustomer] = useState(null);       
    const [allShops, setAllShops] = useState([]);         
    const [bootDone, setBootDone] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [cartInitialStep, setCartInitialStep] = useState(1); // 1 = cart, 2 = checkout

    // Shopping Cart state
    const [cart, setCart] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('mkt_cart') || '[]');
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('mkt_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        setCartInitialStep(1); // Reset to regular cart view on add
        setIsCartOpen(true); 
    };

    const handleBuyNow = (product) => {
        // Set cart to contain ONLY this product with quantity 1 for direct/express checkout
        setCart([{ product, quantity: 1 }]);
        setCartInitialStep(2); // Go directly to Checkout details form!
        setIsCartOpen(true);
    };

    const updateCartQty = (productId, qty) => {
        if (qty <= 0) {
            setCart(prev => prev.filter(item => item.product.id !== productId));
            return;
        }
        setCart(prev => prev.map(item =>
            item.product.id === productId ? { ...item, quantity: qty } : item
        ));
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const clearCart = () => setCart([]);

    // On mount: check session status
    useEffect(() => {
        apiGet(`${API}/marketplace/me`).then(res => {
            if (res?.success && res.customer) setCustomer(res.customer);
            setBootDone(true);
        });
    }, []);

    const handleLogout = async () => { 
        await apiPost(`${API}/marketplace/logout`); 
        setCustomer(null); 
    };

    if (!bootDone) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', color: C.muted }}>
                <Spinner size={28} /> <span style={{ fontSize: '1rem' }}>Loading marketplace…</span>
            </div>
        );
    }

    const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <BrowserRouter>
            <Navbar 
                customer={customer} 
                cartCount={totalCartItems} 
                onCartClick={() => { setCartInitialStep(1); setIsCartOpen(true); }} 
                onAuthClick={() => setShowAuth(true)} 
                onLogout={handleLogout} 
            />

            {showAuth && (
                <AuthModal 
                    onClose={() => setShowAuth(false)} 
                    onSuccess={c => { setCustomer(c); setShowAuth(false); }} 
                    allShops={allShops} 
                />
            )}

            <CartDrawer 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                cart={cart} 
                updateQty={updateCartQty} 
                removeItem={removeFromCart} 
                clearCart={clearCart} 
                customer={customer} 
                onAuthRequest={() => setShowAuth(true)} 
                initialStep={cartInitialStep}
            />

            <Routes>
                <Route path="/shop/product/:id" element={<ProductDetailPage customer={customer} addToCart={addToCart} onBuyNow={handleBuyNow} onCartClick={() => { setCartInitialStep(1); setIsCartOpen(true); }} />} />
                <Route path="/shop/:slug"       element={<ShopPage customer={customer} setCustomer={setCustomer} allShops={allShops} addToCart={addToCart} onBuyNow={handleBuyNow} onCartClick={() => { setCartInitialStep(1); setIsCartOpen(true); }} showAuth={showAuth} setShowAuth={setShowAuth} />} />
                <Route path="/shop/*"           element={<MarketplacePage customer={customer} setCustomer={setCustomer} allShops={allShops} setAllShops={setAllShops} addToCart={addToCart} onBuyNow={handleBuyNow} onCartClick={() => { setCartInitialStep(1); setIsCartOpen(true); }} showAuth={showAuth} setShowAuth={setShowAuth} />} />
                <Route path="*"                 element={<MarketplacePage customer={customer} setCustomer={setCustomer} allShops={allShops} setAllShops={setAllShops} addToCart={addToCart} onBuyNow={handleBuyNow} onCartClick={() => { setCartInitialStep(1); setIsCartOpen(true); }} showAuth={showAuth} setShowAuth={setShowAuth} />} />
            </Routes>
        </BrowserRouter>
    );
}

/* ─────────────────────────────────────────────
   Mount
───────────────────────────────────────────── */
const styleEl = document.createElement('style');
styleEl.textContent = globalCss;
document.head.appendChild(styleEl);

const rootEl = document.getElementById('marketplace-root');
if (rootEl) {
    if (!window.__marketplaceRoot) window.__marketplaceRoot = createRoot(rootEl);
    window.__marketplaceRoot.render(<MarketplaceApp />);
}
