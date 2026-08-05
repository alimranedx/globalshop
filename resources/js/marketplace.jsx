import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import ProductImageMagnifier from './components/ProductImageMagnifier';

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

async function downloadReceiptFile(orderId, invoiceNumber, setDownloadingId) {
    if (!orderId) return;
    if (setDownloadingId) setDownloadingId(orderId);
    try {
        const response = await fetch(`${API}/marketplace/orders/${orderId}/receipt`, {
            headers: { Accept: 'application/pdf', 'X-CSRF-TOKEN': getCsrf() }
        });
        if (!response.ok) {
            alert('Unable to download receipt. The order may be unauthorized or processing.');
            if (setDownloadingId) setDownloadingId(null);
            return;
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GlobalShop-Order-${invoiceNumber || orderId}-Receipt.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        alert('Failed to download receipt. Please try again.');
    }
    if (setDownloadingId) setDownloadingId(null);
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
   Public Marketplace Login Page (/login)
───────────────────────────────────────────── */
function LoginPage({ setCustomer }) {
    const navigate = useNavigate();
    const [phone, setPhone]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    const handleLogin = async (e) => {
        e?.preventDefault();
        if (!phone.trim()) { setError('Please enter your phone number.'); return; }
        if (!password) { setError('Please enter your password.'); return; }
        setError(''); setLoading(true);

        const res = await apiPost(`${API}/marketplace/login`, {
            phone: phone.trim(),
            password: password,
        });

        setLoading(false);
        if (!res || !res.success) {
            setError(res?.message || 'Login failed. Please check your credentials.');
            return;
        }

        setCustomer(res.customer);
        navigate('/');
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div className="fade-up" style={{ background: 'rgba(14,14,22,0.98)', border: `1px solid rgba(99,102,241,0.25)`, borderRadius: 20, padding: '2.5rem 2rem', width: '100%', maxWidth: 450, boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, background: `linear-gradient(135deg,${C.accent},${C.accentAlt})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GlobalShop</span>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.text, marginTop: '0.5rem' }}>Welcome Back</h2>
                    <p style={{ fontSize: '0.85rem', color: C.muted, marginTop: '0.25rem' }}>Sign in to your customer account using Phone & Password.</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>Phone Number</label>
                        <input id="login-phone" className="inp" type="tel" placeholder="+880 1X XX XX XX XX" value={phone} onChange={e => setPhone(e.target.value)} autoFocus required />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>Password</label>
                        <input id="login-password" className="inp" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    {error && <p style={{ fontSize: '0.82rem', color: C.danger }}>{error}</p>}

                    <button id="login-submit-btn" type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                        {loading ? <Spinner size={18} color="#fff" /> : '🔑 Sign In'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.88rem', color: C.muted }}>
                        Don't have an account?{' '}
                        <button type="button" onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                            Create an Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Public Marketplace Registration Page (/register)
───────────────────────────────────────────── */
function RegisterPage({ setCustomer }) {
    const navigate = useNavigate();
    const [name, setName]                       = useState('');
    const [phone, setPhone]                     = useState('');
    const [password, setPassword]               = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading]                 = useState(false);
    const [error, setError]                     = useState('');

    const handleRegister = async (e) => {
        e?.preventDefault();
        if (!name.trim()) { setError('Full Name is required.'); return; }
        if (!phone.trim()) { setError('Phone Number is required.'); return; }
        if (!password) { setError('Password is required.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        setError(''); setLoading(true);

        const res = await apiPost(`${API}/marketplace/register`, {
            name: name.trim(),
            phone: phone.trim(),
            password: password,
            confirm_password: confirmPassword,
        });

        setLoading(false);
        if (!res || !res.success) {
            setError(res?.message || 'Registration failed.');
            return;
        }

        setCustomer(res.customer);
        navigate('/');
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div className="fade-up" style={{ background: 'rgba(14,14,22,0.98)', border: `1px solid rgba(99,102,241,0.25)`, borderRadius: 20, padding: '2.5rem 2rem', width: '100%', maxWidth: 450, boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, background: `linear-gradient(135deg,${C.accent},${C.accentAlt})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GlobalShop</span>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.text, marginTop: '0.5rem' }}>Create Account</h2>
                    <p style={{ fontSize: '0.85rem', color: C.muted, marginTop: '0.25rem' }}>Join GlobalShop to track orders and save preferences.</p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Full Name *</label>
                        <input id="register-name" className="inp" type="text" placeholder="e.g. Rahim Hossain" value={name} onChange={e => setName(e.target.value)} autoFocus required />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Phone Number *</label>
                        <input id="register-phone" className="inp" type="tel" placeholder="+880 1X XX XX XX XX" value={phone} onChange={e => setPhone(e.target.value)} required />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Password *</label>
                        <input id="register-password" className="inp" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Confirm Password *</label>
                        <input id="register-confirm-password" className="inp" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </div>

                    {error && <p style={{ fontSize: '0.82rem', color: C.danger }}>{error}</p>}

                    <button id="register-submit-btn" type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                        {loading ? <Spinner size={18} color="#fff" /> : '🚀 Create Account'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.88rem', color: C.muted }}>
                        Already have an account?{' '}
                        <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                            Sign In
                        </button>
                    </div>
                </form>
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
    const [downloadingId, setDownloadingId] = useState(null);
    
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

                    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'left' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Invoices:</p>
                        {orderResults.map((ord, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifySpace: 'space-between', fontSize: '0.85rem', borderBottom: idx < orderResults.length - 1 ? `1px dashed ${C.border}` : 'none', paddingBottom: '0.6rem' }}>
                                <div>
                                    <p style={{ fontWeight: 600 }}>🏪 {ord.shop_name}</p>
                                    <p style={{ fontSize: '0.72rem', color: C.faint }}>{ord.invoice_number}</p>
                                    <p style={{ fontWeight: 700, color: C.accent, marginTop: '0.15rem' }}>{formatPrice(ord.total)}</p>
                                </div>
                                <button
                                    id={`cart-receipt-btn-${ord.id || idx}`}
                                    className="btn-ghost"
                                    disabled={downloadingId === ord.id}
                                    onClick={() => downloadReceiptFile(ord.id, ord.invoice_number, setDownloadingId)}
                                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    {downloadingId === ord.id ? <Spinner size={14} color={C.accent} /> : '📄 Download Receipt'}
                                </button>
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
   User Dropdown Menu
───────────────────────────────────────────── */
function UserDropdown({ customer, onNavigateProfile, onLogout }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                id="user-menu-btn"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    background: isOpen ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)',
                    border: `1px solid rgba(99,102,241,0.25)`,
                    borderRadius: 24,
                    padding: '0.35rem 0.85rem 0.35rem 0.4rem',
                    color: C.text,
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 12px rgba(99, 102, 241, 0.3)' : 'none',
                }}
            >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#fff', fontSize: '0.85rem', flexShrink: 0 }}>
                    {customer.avatar ? (
                        <img src={customer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        '👤'
                    )}
                </div>
                <span>{customer.name || customer.phone}</span>
                <span style={{ fontSize: '0.65rem', color: C.muted, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        width: 210,
                        background: 'rgba(14,14,22,0.96)',
                        border: `1px solid ${C.border}`,
                        borderRadius: 14,
                        padding: '0.4rem',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(16px)',
                        zIndex: 300,
                    }}
                    className="fade-up"
                >
                    <button
                        id="dropdown-profile-dashboard-btn"
                        onClick={() => { setIsOpen(false); onNavigateProfile(); }}
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: 8,
                            padding: '0.65rem 0.75rem',
                            color: C.text,
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.55rem',
                            transition: 'background 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                        👤 My Profile / Dashboard
                    </button>

                    <div style={{ borderTop: `1px solid ${C.border}`, margin: '0.35rem 0' }} />

                    <button
                        id="dropdown-logout-btn"
                        onClick={() => { setIsOpen(false); onLogout(); }}
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: 8,
                            padding: '0.65rem 0.75rem',
                            color: C.danger,
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.55rem',
                            transition: 'background 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                        🚪 Log Out
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Customer Dashboard (/profile)
───────────────────────────────────────────── */
function CustomerDashboard({ customer, setCustomer, onAuthRequest }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine sub-tab from path or default 'overview'
    const activeTab = (() => {
        const path = location.pathname.replace(/\/$/, '');
        if (path === '/profile/orders') return 'orders';
        if (path === '/profile/pending') return 'pending';
        if (path === '/profile/completed') return 'completed';
        if (path === '/profile/cancelled') return 'cancelled';
        if (path === '/profile/settings') return 'settings';
        return 'overview';
    })();

    const [orders, setOrders]               = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null); // for Order Details Modal

    // Profile Settings Form State
    const [name, setName]                   = useState(customer?.name || '');
    const [phone, setPhone]                 = useState(customer?.phone || '');
    const [avatar, setAvatar]               = useState(customer?.avatar || '');
    const [shippingAddress, setShippingAddress] = useState(customer?.shipping_address || '');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError]   = useState('');

    useEffect(() => {
        if (customer) {
            setName(customer.name || '');
            setPhone(customer.phone || '');
            setAvatar(customer.avatar || '');
            setShippingAddress(customer.shipping_address || '');
        }
    }, [customer]);

    // Fetch Orders from API
    const fetchOrders = useCallback(() => {
        if (!customer) return;
        setLoadingOrders(true);
        apiGet(`${API}/marketplace/orders`).then(res => {
            if (res && res.success && Array.isArray(res.orders)) {
                setOrders(res.orders);
            }
            setLoadingOrders(false);
        });
    }, [customer]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setProfileError(''); setProfileSuccess('');
        if (!name.trim()) { setProfileError('Full Name is required.'); return; }
        if (!phone.trim() || phone.trim().length < 10) { setProfileError('A valid Phone Number is required.'); return; }

        setSavingProfile(true);
        const res = await apiPost(`${API}/marketplace/profile`, {
            name: name.trim(),
            phone: phone.trim(),
            avatar: avatar.trim(),
            shipping_address: shippingAddress.trim(),
        });
        setSavingProfile(false);

        if (res && res.success) {
            setProfileSuccess('Profile updated successfully!');
            if (res.customer) setCustomer(res.customer);
            setTimeout(() => setProfileSuccess(''), 4000);
        } else {
            setProfileError(res?.message || 'Failed to update profile.');
        }
    };

    if (!customer) {
        return (
            <div style={{ maxWidth: 650, margin: '4rem auto', padding: '3rem 2rem', textAlign: 'center', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20 }} className="fade-up">
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.text }}>Sign in Required</h2>
                <p style={{ color: C.muted, marginTop: '0.5rem', fontSize: '0.92rem' }}>Please sign in to access your GlobalShop customer dashboard, order history, and profile settings.</p>
                <button className="btn-primary" onClick={onAuthRequest} style={{ marginTop: '1.5rem', padding: '0.8rem 1.8rem', fontSize: '0.95rem' }}>
                    Sign In / Register
                </button>
            </div>
        );
    }

    // Counts
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const completedOrders = orders.filter(o => o.status === 'completed');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');

    // Filter orders according to tab
    const filteredOrders = (() => {
        if (activeTab === 'pending') return pendingOrders;
        if (activeTab === 'completed') return completedOrders;
        if (activeTab === 'cancelled') return cancelledOrders;
        return orders;
    })();

    const recentOrders = orders.slice(0, 5);

    const avatarPresets = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    ];

    return (
        <div style={{ maxWidth: 1240, margin: '2rem auto', padding: '0 1.5rem' }} className="fade-up">
            {/* Header Banner */}
            <div style={{ background: `radial-gradient(ellipse at 70% top, rgba(99,102,241,0.18) 0%, transparent 60%), ${C.surface}`, border: `1px solid ${C.border}`, borderRadius: 20, padding: '1.8rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <div style={{ width: 68, height: 68, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `3px solid rgba(99,102,241,0.4)`, color: '#fff', fontSize: '2rem', flexShrink: 0 }}>
                        {customer.avatar ? <img src={customer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                    </div>
                    <div>
                        <span style={{ fontSize: '0.72rem', color: C.accent, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, background: 'rgba(99,102,241,0.1)', padding: '0.2rem 0.6rem', borderRadius: 20 }}>
                            Customer Dashboard
                        </span>
                        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: C.text, marginTop: '0.35rem' }}>
                            Welcome back, {customer.name || 'Shopper'} 👋
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: C.muted, marginTop: '0.15rem' }}>
                            📱 {customer.phone} {customer.shipping_address ? `• 📍 ${customer.shipping_address}` : ''}
                        </p>
                    </div>
                </div>
                <button className="btn-ghost" onClick={() => navigate('/shop')} style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem', borderRadius: 10 }}>
                    ← Back to Storefront
                </button>
            </div>

            {/* Layout Grid: Sidebar Tabs + Main View */}
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Sidebar Navigation */}
                <aside style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', position: 'sticky', top: 80 }}>
                    {[
                        { id: 'overview', path: '/profile', label: '📊 Overview' },
                        { id: 'orders', path: '/profile/orders', label: '📦 My Orders', badge: totalOrders },
                        { id: 'pending', path: '/profile/pending', label: '⏳ Pending', badge: pendingOrders.length },
                        { id: 'completed', path: '/profile/completed', label: '✅ Completed', badge: completedOrders.length },
                        { id: 'cancelled', path: '/profile/cancelled', label: '❌ Cancelled', badge: cancelledOrders.length },
                        { id: 'settings', path: '/profile/settings', label: '⚙️ Profile Settings' },
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                id={`profile-nav-${tab.id}`}
                                onClick={() => navigate(tab.path)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 10,
                                    background: isActive ? C.accent : 'transparent',
                                    border: `1px solid ${isActive ? C.accent : 'transparent'}`,
                                    color: isActive ? '#fff' : C.muted,
                                    fontSize: '0.88rem',
                                    fontWeight: isActive ? 700 : 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifySpace: 'space-between',
                                    transition: 'all 0.18s',
                                    fontFamily: 'Outfit, sans-serif'
                                }}
                            >
                                <span>{tab.label}</span>
                                {tab.badge !== undefined && (
                                    <span style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)', color: isActive ? '#fff' : C.faint, padding: '0.1rem 0.45rem', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </aside>

                {/* Main View Area */}
                <main style={{ minWidth: 0 }}>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }} className="fade-up">
                            {/* Summary Stat Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
                                <StatCard icon="📦" title="Total Orders" value={totalOrders} color={C.accent} onClick={() => navigate('/profile/orders')} />
                                <StatCard icon="⏳" title="Pending Orders" value={pendingOrders.length} color={C.warning} onClick={() => navigate('/profile/pending')} />
                                <StatCard icon="✅" title="Completed Orders" value={completedOrders.length} color={C.success} onClick={() => navigate('/profile/completed')} />
                                <StatCard icon="❌" title="Cancelled Orders" value={cancelledOrders.length} color={C.danger} onClick={() => navigate('/profile/cancelled')} />
                            </div>

                            {/* User Profile Overview Info */}
                            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>👤 User Information</span>
                                    <button onClick={() => navigate('/profile/settings')} className="btn-ghost" style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}>Edit Profile</button>
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.88rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase' }}>Full Name</p>
                                        <p style={{ fontWeight: 600, color: C.text, marginTop: '0.2rem' }}>{customer.name || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase' }}>Phone Number</p>
                                        <p style={{ fontWeight: 600, color: C.text, marginTop: '0.2rem' }}>{customer.phone}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase' }}>Default Shipping Address</p>
                                        <p style={{ fontWeight: 600, color: C.text, marginTop: '0.2rem' }}>{customer.shipping_address || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Orders */}
                            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: C.text }}>🕒 Recent Orders</h3>
                                    <button onClick={() => navigate('/profile/orders')} className="btn-ghost" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>View All Orders →</button>
                                </div>
                                <OrdersList orders={recentOrders} loading={loadingOrders} onSelectOrder={setSelectedOrder} />
                            </div>
                        </div>
                    )}

                    {/* Orders Tabs (Orders / Pending / Completed / Cancelled) */}
                    {(activeTab === 'orders' || activeTab === 'pending' || activeTab === 'completed' || activeTab === 'cancelled') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="fade-up">
                            {/* Filter Bar */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: C.text }}>
                                        {activeTab === 'orders' && '📦 All Orders'}
                                        {activeTab === 'pending' && '⏳ Pending Orders'}
                                        {activeTab === 'completed' && '✅ Completed Orders'}
                                        {activeTab === 'cancelled' && '❌ Cancelled Orders'}
                                    </h2>
                                    <p style={{ fontSize: '0.8rem', color: C.muted, marginTop: '0.2rem' }}>Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '0.25rem', gap: '0.25rem' }}>
                                    <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => navigate('/profile/orders')} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>All ({totalOrders})</button>
                                    <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => navigate('/profile/pending')} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>Pending ({pendingOrders.length})</button>
                                    <button className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => navigate('/profile/completed')} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>Completed ({completedOrders.length})</button>
                                    <button className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`} onClick={() => navigate('/profile/cancelled')} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>Cancelled ({cancelledOrders.length})</button>
                                </div>
                            </div>

                            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '1.5rem' }}>
                                <OrdersList orders={filteredOrders} loading={loadingOrders} onSelectOrder={setSelectedOrder} />
                            </div>
                        </div>
                    )}

                    {/* Profile Settings Tab */}
                    {activeTab === 'settings' && (
                        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '2rem' }} className="fade-up">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: C.text, marginBottom: '0.35rem' }}>⚙️ Profile Settings</h2>
                            <p style={{ fontSize: '0.85rem', color: C.muted, marginBottom: '1.5rem' }}>View and update your personal information and delivery address.</p>

                            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: 580 }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                                        Profile Avatar
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.accent, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', flexShrink: 0 }}>
                                            {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                                        </div>
                                        <input className="inp" type="url" placeholder="Paste custom avatar URL..." value={avatar} onChange={e => setAvatar(e.target.value)} style={{ flex: 1, fontSize: '0.85rem' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {avatarPresets.map((preset, idx) => (
                                            <button key={idx} type="button" onClick={() => setAvatar(preset)} style={{ width: 34, height: 34, borderRadius: '50%', border: avatar === preset ? `2px solid ${C.accent}` : `1px solid ${C.border}`, overflow: 'hidden', cursor: 'pointer', padding: 0 }}>
                                                <img src={preset} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Full Name *</label>
                                    <input id="settings-name" className="inp" type="text" value={name} onChange={e => setName(e.target.value)} required />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Phone Number *</label>
                                    <input id="settings-phone" className="inp" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Default Shipping Address</label>
                                    <textarea id="settings-address" className="inp" rows={3} placeholder="e.g. House 12, Road 4, Sector 3, Uttara, Dhaka" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} style={{ resize: 'none' }} />
                                </div>

                                {profileError && <p style={{ fontSize: '0.82rem', color: C.danger }}>{profileError}</p>}
                                {profileSuccess && <p style={{ fontSize: '0.82rem', color: C.success }}>{profileSuccess}</p>}

                                <button id="save-settings-btn" type="submit" className="btn-primary" disabled={savingProfile} style={{ padding: '0.85rem', fontSize: '0.92rem', width: 'fit-content', minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {savingProfile ? <Spinner size={18} color="#fff" /> : '💾 Save Profile Settings'}
                                </button>
                            </form>
                        </div>
                    )}
                </main>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            )}
        </div>
    );
}

function StatCard({ icon, title, value, color, onClick }) {
    return (
        <div onClick={onClick} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '1.2rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '1rem' }}
            onMouseOver={e => e.currentTarget.style.borderColor = color}
            onMouseOut={e => e.currentTarget.style.borderColor = C.border}
        >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `rgba(255,255,255,0.04)`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <p style={{ fontSize: '0.78rem', color: C.muted, fontWeight: 600 }}>{title}</p>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: C.text, marginTop: '0.1rem' }}>{value}</p>
            </div>
        </div>
    );
}

function OrdersList({ orders, loading, onSelectOrder }) {
    const [downloadingId, setDownloadingId] = useState(null);

    if (loading) {
        return (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                <Spinner size={22} /> Loading order history…
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: C.muted }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>📦</div>
                <p style={{ fontWeight: 600, fontSize: '0.98rem' }}>No orders found</p>
                <p style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>You haven't placed any orders in this category yet.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(order => {
                const isCompleted = order.status === 'completed';
                const isPending = order.status === 'pending';
                const isCancelled = order.status === 'cancelled';
                const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';

                return (
                    <div key={order.id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 14, padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: `1px solid ${C.border}`, paddingBottom: '0.75rem' }}>
                            <div>
                                <span style={{ fontWeight: 800, color: C.text, fontSize: '0.95rem' }}>📄 {order.invoice_number}</span>
                                <span style={{ fontSize: '0.78rem', color: C.muted, marginLeft: '0.75rem' }}>{dateStr}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '0.2rem 0.65rem',
                                    borderRadius: 20,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    background: isCompleted ? 'rgba(16,185,129,0.15)' : isPending ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: isCompleted ? C.success : isPending ? C.warning : C.danger,
                                    border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.3)' : isPending ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`
                                }}>
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <p style={{ fontSize: '0.82rem', color: C.muted }}>
                                    🏪 Seller Shop: <strong style={{ color: C.text }}>{order.shop?.name || 'Shop'}</strong>
                                </p>
                                <p style={{ fontSize: '0.82rem', color: C.muted, marginTop: '0.25rem' }}>
                                    🛍️ Items ({order.items?.length || 0}): <span style={{ color: C.text }}>{order.items?.map(i => `${i.product_name} (x${i.quantity})`).join(', ')}</span>
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ textAlign: 'right', marginRight: '0.2rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: C.muted }}>Order Total</p>
                                    <p style={{ fontSize: '1.15rem', fontWeight: 800, color: C.accent }}>{formatPrice(order.total)}</p>
                                </div>
                                <button
                                    id={`order-list-receipt-${order.id}`}
                                    className="btn-ghost"
                                    disabled={downloadingId === order.id}
                                    onClick={() => downloadReceiptFile(order.id, order.invoice_number, setDownloadingId)}
                                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                >
                                    {downloadingId === order.id ? <Spinner size={14} color={C.accent} /> : '📄 Download Receipt'}
                                </button>
                                <button className="btn-ghost" onClick={() => onSelectOrder(order)} style={{ padding: '0.5rem 0.95rem', fontSize: '0.82rem', borderRadius: 8 }}>
                                    View Details →
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function OrderDetailModal({ order, onClose }) {
    const [downloadingId, setDownloadingId] = useState(null);
    if (!order) return null;

    const isCompleted = order.status === 'completed';
    const isPending = order.status === 'pending';
    const dateStr = order.created_at ? new Date(order.created_at).toLocaleString() : 'Recent';

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ background: 'rgba(14,14,22,0.98)', border: `1px solid rgba(99,102,241,0.25)`, borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 560, position: 'relative', boxShadow: '0 40px 80px rgba(0,0,0,0.7)', maxHeight: '90vh', overflowY: 'auto' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: C.muted, fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }} className="fade-up">
                    <div>
                        <span style={{ fontSize: '0.72rem', color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, background: 'rgba(99,102,241,0.1)', padding: '0.2rem 0.6rem', borderRadius: 20 }}>
                            Order Details
                        </span>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: C.text, marginTop: '0.4rem' }}>
                            Invoice #{order.invoice_number}
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: C.muted, marginTop: '0.15rem' }}>Placed on {dateStr}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '1rem', fontSize: '0.85rem' }}>
                        <div>
                            <p style={{ fontSize: '0.72rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase' }}>Shop / Seller</p>
                            <p style={{ fontWeight: 600, color: C.text, marginTop: '0.2rem' }}>🏪 {order.shop?.name}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.72rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase' }}>Status</p>
                            <p style={{ fontWeight: 700, color: isCompleted ? C.success : isPending ? C.warning : C.danger, marginTop: '0.2rem', textTransform: 'uppercase' }}>
                                {order.status}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.72rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase' }}>Payment Method</p>
                            <p style={{ fontWeight: 600, color: C.text, marginTop: '0.2rem', textTransform: 'capitalize' }}>💳 {order.payment_method}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.72rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase' }}>Receiver Contact</p>
                            <p style={{ fontWeight: 600, color: C.text, marginTop: '0.2rem' }}>📱 {order.customer_phone}</p>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <p style={{ fontSize: '0.72rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase' }}>Shipping Address</p>
                            <p style={{ fontWeight: 500, color: C.muted, marginTop: '0.2rem' }}>📍 {order.shipping_address || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Order Items Table */}
                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>Purchased Items</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {order.items?.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifySpace: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {item.image ? <img src={item.image} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} /> : <span style={{ fontSize: '1.2rem' }}>🛍️</span>}
                                        <div>
                                            <p style={{ fontWeight: 600, color: C.text }}>{item.product_name}</p>
                                            <p style={{ fontSize: '0.75rem', color: C.muted }}>Qty: {item.quantity} x {formatPrice(item.price)}</p>
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: 700, color: C.accent }}>{formatPrice(item.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Summary */}
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '0.85rem', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '0.85rem', color: C.muted }}>
                            <span>Subtotal:</span>
                            <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem' }}>
                            <span>Order Total:</span>
                            <span style={{ color: C.accent }}>{formatPrice(order.total)}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button
                            id={`modal-download-receipt-${order.id}`}
                            className="btn-ghost"
                            disabled={downloadingId === order.id}
                            onClick={() => downloadReceiptFile(order.id, order.invoice_number, setDownloadingId)}
                            style={{ flex: 1, padding: '0.8rem', fontSize: '0.88rem', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                            {downloadingId === order.id ? <Spinner size={16} color={C.accent} /> : '📄 Download Receipt'}
                        </button>
                        <button className="btn-primary" onClick={onClose} style={{ flex: 1, padding: '0.8rem', fontSize: '0.88rem', borderRadius: 10 }}>
                            Close Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Navbar
───────────────────────────────────────────── */
function Navbar({ customer, cartCount, onCartClick, onAuthClick, onLogout, currentShopSlug }) {
    const navigate = useNavigate();
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
                        <UserDropdown customer={customer} onNavigateProfile={() => navigate('/profile')} onLogout={onLogout} />
                    ) : (
                        <button id="nav-signin-btn" className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '0.45rem 1.1rem', fontSize: '0.88rem', borderRadius: 8 }}>
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
                    <div style={{ width: '100%', height: 420, borderRadius: 20, background: 'rgba(12,12,20,0.8)', border: `1px solid ${C.border}`, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
                        {mainImage ? (
                            <ProductImageMagnifier
                                src={mainImage}
                                zoomSrc={images[activeImgIdx]?.original_url || mainImage}
                                alt={product.name}
                                zoomLevel={2.8}
                            />
                        ) : (
                            <div style={{ fontSize: '5rem', color: C.faint }}>🛍️</div>
                        )}
                        {product.status === 'published' && (
                            <span style={{ position: 'absolute', top: 15, right: 15, zIndex: 60, background: 'rgba(16,185,129,0.15)', color: C.success, border: '1px solid rgba(16,185,129,0.28)', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', pointerEvents: 'none' }}>
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
   Direct Buy / Direct Checkout Modal (Single Product)
───────────────────────────────────────────── */
function DirectCheckoutModal({ product, customer, onClose, onAuthRequest }) {
    const [quantity, setQuantity]           = useState(1);
    const [name, setName]                   = useState('');
    const [phone, setPhone]                 = useState('');
    const [address, setAddress]             = useState('');
    const [payment, setPayment]             = useState('cash'); // cash, mobile, card
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState('');
    const [step, setStep]                   = useState(1); // 1 = form, 2 = order success
    const [orderResults, setOrderResults]   = useState([]);
    const [downloadingId, setDownloadingId] = useState(null);

    const stock = product?.stock_quantity ?? 999;

    useEffect(() => {
        if (customer) {
            setName(customer.name || '');
            setPhone(customer.phone || '');
            setAddress(customer.shipping_address || '');
        }
    }, [customer]);

    const handleQtyChange = (delta) => {
        setQuantity(prev => {
            const next = prev + delta;
            if (next < 1) return 1;
            if (next > stock) return stock;
            return next;
        });
    };

    const subtotal = (product?.price || 0) * quantity;

    const handlePlaceOrder = async () => {
        if (!name.trim()) { setError('Receiver Name is mandatory.'); return; }
        if (!phone.trim() || phone.trim().length < 10) { setError('A valid Phone Number is mandatory.'); return; }
        if (!address.trim()) { setError('Shipping Address is mandatory.'); return; }
        if (quantity > stock) { setError(`Requested quantity exceeds available stock (${stock}).`); return; }

        setError('');
        setLoading(true);

        const payload = {
            customer_name: name.trim(),
            customer_phone: phone.trim(),
            shipping_address: address.trim(),
            payment_method: payment,
            items: [
                {
                    product_id: product.id,
                    quantity: quantity,
                }
            ]
        };

        const res = await apiPost(`${API}/marketplace/checkout`, payload);
        setLoading(false);

        if (res && res.success) {
            setOrderResults(res.orders || []);
            setStep(2);
        } else {
            setError(res?.message || 'Checkout failed. Please try again.');
        }
    };

    if (!product) return null;

    const img = product.images?.[0]?.image_url;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ background: 'rgba(14,14,22,0.98)', border: `1px solid rgba(99,102,241,0.25)`, borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 500, position: 'relative', boxShadow: '0 40px 80px rgba(0,0,0,0.7)', maxHeight: '90vh', overflowY: 'auto' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: C.muted, fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>

                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }} className="fade-up">
                        <div>
                            <span style={{ fontSize: '0.72rem', color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, background: 'rgba(99,102,241,0.1)', padding: '0.2rem 0.6rem', borderRadius: 20 }}>
                                ⚡ Direct Checkout
                            </span>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: C.text, marginTop: '0.4rem' }}>
                                Buy Product Now
                            </h2>
                            <p style={{ fontSize: '0.82rem', color: C.muted, marginTop: '0.15rem' }}>
                                Single product instant purchase without affecting your shopping cart.
                            </p>
                        </div>

                        {/* Product Summary Card */}
                        <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 14, padding: '0.85rem', alignItems: 'center' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 10, background: 'rgba(12,12,20,0.8)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.8rem' }}>🛍️</span>}
                            </div>
                            <div style={{ flexGrow: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '0.92rem', fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                                <p style={{ fontSize: '0.78rem', color: C.muted, marginTop: '0.15rem' }}>🏪 {product.shop?.name || 'Shop'}</p>
                                <p style={{ fontSize: '0.9rem', fontWeight: 800, color: C.accent, marginTop: '0.25rem' }}>{formatPrice(product.price)} / unit</p>
                            </div>
                        </div>

                        {/* Quantity Selector with + and - controls */}
                        <div style={{ background: 'rgba(99,102,241,0.06)', border: `1px solid rgba(99,102,241,0.18)`, borderRadius: 14, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: C.text, display: 'block' }}>Select Quantity</label>
                                <span style={{ fontSize: '0.75rem', color: C.muted }}>Available Stock: <strong style={{ color: stock > 0 ? C.text : C.danger }}>{stock}</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <button
                                    id="direct-qty-minus"
                                    type="button"
                                    onClick={() => handleQtyChange(-1)}
                                    disabled={quantity <= 1}
                                    style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '1.1rem', cursor: quantity <= 1 ? 'not-allowed' : 'pointer', opacity: quantity <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    −
                                </button>
                                <span id="direct-qty-value" style={{ fontSize: '1.1rem', fontWeight: 800, minWidth: 32, textAlign: 'center', color: C.accent }}>{quantity}</span>
                                <button
                                    id="direct-qty-plus"
                                    type="button"
                                    onClick={() => handleQtyChange(1)}
                                    disabled={quantity >= stock}
                                    style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '1.1rem', cursor: quantity >= stock ? 'not-allowed' : 'pointer', opacity: quantity >= stock ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Checkout Form Inputs */}
                        {!customer && (
                            <div style={{ background: 'rgba(99,102,241,0.08)', border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 10, padding: '0.65rem 0.9rem', fontSize: '0.8rem', color: C.muted }}>
                                💡 <button onClick={() => { onClose(); onAuthRequest(); }} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Sign in</button> to auto-fill details.
                            </div>
                        )}

                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Receiver Name *</label>
                            <input id="direct-checkout-name" className="inp" type="text" placeholder="e.g. Karim Ahmed" value={name} onChange={e => setName(e.target.value)} required />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Contact Phone *</label>
                            <input id="direct-checkout-phone" className="inp" type="tel" placeholder="e.g. +8801XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Shipping Address *</label>
                            <textarea id="direct-checkout-address" className="inp" placeholder="e.g. House 12, Road 4, Sector 3, Uttara, Dhaka" value={address} onChange={e => setAddress(e.target.value)} style={{ resize: 'none', height: 75 }} required />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>Payment Method</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[
                                    { id: 'cash', label: '💵 COD (Cash)' },
                                    { id: 'mobile', label: '📱 Mobile pay' },
                                    { id: 'card', label: '💳 Card' },
                                ].map(p => (
                                    <button key={p.id} type="button" className={`tab-btn ${payment === p.id ? 'active' : ''}`} onClick={() => setPayment(p.id)} style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', borderRadius: 8 }}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary Total */}
                        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '0.85rem', marginTop: '0.3rem' }}>
                            <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '0.88rem', color: C.muted, marginBottom: '0.4rem' }}>
                                <span>Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'}):</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.85rem' }}>
                                <span>Total Payable:</span>
                                <span style={{ color: C.accent }}>{formatPrice(subtotal)}</span>
                            </div>

                            {error && <p style={{ fontSize: '0.82rem', color: C.danger, marginBottom: '0.75rem' }}>{error}</p>}

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" className="btn-ghost" onClick={onClose} style={{ flex: 1, padding: '0.8rem' }}>Cancel</button>
                                <button id="direct-place-order-btn" type="button" className="btn-primary" onClick={handlePlaceOrder} disabled={loading || stock <= 0} style={{ flex: 2, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    {loading ? <Spinner size={18} color="#fff" /> : '⚡ Place Direct Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Success Screen */}
                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'center', padding: '1rem 0.5rem' }} className="fade-up">
                        <div style={{ fontSize: '3.5rem' }}>🎉</div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: C.success }}>Order Placed Successfully!</h3>
                            <p style={{ fontSize: '0.85rem', color: C.muted, marginTop: '0.35rem' }}>Your direct order has been received by {product.shop?.name || 'the seller'}.</p>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'left' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order Summary:</p>
                            {orderResults.map((ord, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifySpace: 'space-between', fontSize: '0.85rem', borderBottom: idx < orderResults.length - 1 ? `1px dashed ${C.border}` : 'none', paddingBottom: '0.6rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600 }}>🏪 {ord.shop_name}</p>
                                        <p style={{ fontSize: '0.72rem', color: C.faint }}>{ord.invoice_number}</p>
                                        <p style={{ fontSize: '0.75rem', color: C.muted, marginTop: '0.15rem' }}>Qty: {quantity} x {product.name}</p>
                                        <p style={{ fontWeight: 700, color: C.accent, marginTop: '0.15rem' }}>{formatPrice(ord.total)}</p>
                                    </div>
                                    <button
                                        id={`direct-receipt-btn-${ord.id || idx}`}
                                        className="btn-ghost"
                                        disabled={downloadingId === ord.id}
                                        onClick={() => downloadReceiptFile(ord.id, ord.invoice_number, setDownloadingId)}
                                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                        {downloadingId === ord.id ? <Spinner size={14} color={C.accent} /> : '📄 Download Receipt'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button className="btn-primary" onClick={onClose} style={{ padding: '0.75rem', width: '100%', fontSize: '0.88rem' }}>
                            Continue Shopping
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Root App — shared state + routing
───────────────────────────────────────────── */
function MarketplaceApp() {
    const [customer, setCustomer]                 = useState(null);       
    const [allShops, setAllShops]                 = useState([]);         
    const [bootDone, setBootDone]                 = useState(false);
    const [isCartOpen, setIsCartOpen]             = useState(false);
    const [showAuth, setShowAuth]                 = useState(false);
    const [showProfile, setShowProfile]           = useState(false);
    const [directBuyProduct, setDirectBuyProduct] = useState(null);
    const [cartInitialStep, setCartInitialStep]   = useState(1); // 1 = cart, 2 = checkout
    const [toastMessage, setToastMessage]         = useState('');

    // Shopping Cart state
    const [cart, setCart] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('mkt_cart') || '[]');
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('mkt_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

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
        setToastMessage(`Product "${product.name}" added to cart`);
    };

    const handleBuyNow = (product) => {
        // Direct Buy Now does NOT modify or touch the cart
        setDirectBuyProduct(product);
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

            {directBuyProduct && (
                <DirectCheckoutModal 
                    product={directBuyProduct} 
                    customer={customer} 
                    onClose={() => setDirectBuyProduct(null)} 
                    onAuthRequest={() => window.location.href = '/login'} 
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
                onAuthRequest={() => window.location.href = '/login'} 
                initialStep={cartInitialStep}
            />

            <Routes>
                <Route path="/login"            element={customer ? <Navigate to="/" replace /> : <LoginPage setCustomer={setCustomer} />} />
                <Route path="/register"         element={customer ? <Navigate to="/" replace /> : <RegisterPage setCustomer={setCustomer} />} />
                <Route path="/profile/*"        element={customer ? <CustomerDashboard customer={customer} setCustomer={setCustomer} onAuthRequest={() => window.location.href = '/login'} /> : <Navigate to="/login" replace />} />
                <Route path="/shop/product/:id" element={<ProductDetailPage customer={customer} addToCart={addToCart} onBuyNow={handleBuyNow} onCartClick={() => { setCartInitialStep(1); setIsCartOpen(true); }} />} />
                <Route path="/shop/:slug"       element={<ShopPage customer={customer} setCustomer={setCustomer} allShops={allShops} addToCart={addToCart} onBuyNow={handleBuyNow} onCartClick={() => { setCartInitialStep(1); setIsCartOpen(true); }} showAuth={false} setShowAuth={() => {}} />} />
                <Route path="/shop/*"           element={<MarketplacePage customer={customer} setCustomer={setCustomer} allShops={allShops} setAllShops={setAllShops} addToCart={addToCart} onBuyNow={handleBuyNow} onCartClick={() => { setCartInitialStep(1); setIsCartOpen(true); }} showAuth={false} setShowAuth={() => {}} />} />
                <Route path="*"                 element={<MarketplacePage customer={customer} setCustomer={setCustomer} allShops={allShops} setAllShops={setAllShops} addToCart={addToCart} onBuyNow={handleBuyNow} onCartClick={() => { setCartInitialStep(1); setIsCartOpen(true); }} showAuth={false} setShowAuth={() => {}} />} />
            </Routes>

            {toastMessage && (
                <div id="marketplace-toast" style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    zIndex: 9999,
                    background: 'rgba(15,15,23,0.95)',
                    border: `1px solid ${C.accent}`,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(99,102,241,0.2)',
                    borderRadius: 12,
                    padding: '0.85rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: C.text,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    animation: 'fadeUp 0.3s ease both',
                    backdropFilter: 'blur(12px)'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>🛒</span>
                    <span>{toastMessage}</span>
                    <button onClick={() => setToastMessage('')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', marginLeft: '0.5rem', fontSize: '0.9rem' }}>✕</button>
                </div>
            )}
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
