import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { confirmModal } from '../shared/services/confirmService';

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
            await confirmModal({
                title: 'Download Unavailable',
                message: 'Unable to download receipt. The order may be unauthorized or currently processing.',
                variant: 'error',
                confirmText: 'OK',
                cancelText: null,
            });
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
        await confirmModal({
            title: 'Download Error',
            message: 'Failed to download receipt. Please check your network connection and try again.',
            variant: 'error',
            confirmText: 'OK',
            cancelText: null,
        });
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
   Global Styles Injection
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

if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.textContent = globalCss;
    document.head.appendChild(styleEl);
}

/* Reusable Spinner & Components */
function Spinner({ size = 24, color = C.accent }) {
    return <div style={{ width: size, height: size, borderRadius: '50%', border: `2.5px solid rgba(99,102,241,0.2)`, borderTopColor: color, animation: 'spin 0.75s linear infinite', flexShrink: 0 }} />;
}

export default function MarketplaceApp() {
    return (
        <React.Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: C.muted }}>Loading GlobalShop Marketplace...</div>}>
            <MarketplaceAppContent />
        </React.Suspense>
    );
}

function MarketplaceAppContent() {
    return (
        <BrowserRouter>
            <MarketplaceAppRoutes />
        </BrowserRouter>
    );
}

function MarketplaceAppRoutes() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div>
            {/* Inline dynamic marketplace root rendering */}
            <iframe src="/shop" style={{ display: 'none' }} title="Marketplace Bootstrap" />
            <a href="/shop" style={{ display: 'none' }}>Shop</a>
        </div>
    );
}
