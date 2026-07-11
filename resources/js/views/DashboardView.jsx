import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getHeaders } from '../utils/api';
import useTranslation from '../hooks/useTranslation';
import useCurrency from '../hooks/useCurrency';
import useTheme from '../hooks/useTheme';

export default function DashboardView() {
    const t = useTranslation();
    const cur = useCurrency();
    const { colors, isDark } = useTheme();

    const products = useSelector(state => state.catalog.products);
    const categories = useSelector(state => state.catalog.categories);
    const brands = useSelector(state => state.catalog.brands);
    const limits = useSelector(state => state.shop.limits);
    const shop = useSelector(state => state.shop.shop);
    const shopId = shop ? shop.id : null;

    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        if (!shopId) return;
        let cancelled = false;
        setLoadingStats(true);
        const headers = getHeaders(shopId);

        fetch('/api/v1/tenant/dashboard-stats', { headers })
            .then(r => r.json())
            .then(d => { 
                if (!cancelled && d.success) {
                    setStats(d.data);
                } 
            })
            .catch(() => {})
            .finally(() => { 
                if (!cancelled) setLoadingStats(false); 
            });
        return () => { cancelled = true; };
    }, [shopId]);

    const cardStyle = (gradient) => ({
        background: gradient,
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        minWidth: 0,
        boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.05)',
    });

    const periodLabel = { 
        today: t('today_sales'), 
        month: t('month_sales'), 
        year: t('year_sales') 
    };
    const periodProfitLabel = { 
        today: t('today_profit'), 
        month: t('month_profit'), 
        year: t('year_profit') 
    };

    const periodGradients = {
        today: isDark 
            ? 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.05) 100%)' 
            : 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)',
        month: isDark 
            ? 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.05) 100%)' 
            : 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)',
        year: isDark 
            ? 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.05) 100%)' 
            : 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 100%)',
    };
    const periodBorders = {
        today: isDark ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(99,102,241,0.15)',
        month: isDark ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(16,185,129,0.15)',
        year: isDark ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(139,92,246,0.15)',
    };
    const accentColors = {
        today: isDark ? '#818cf8' : '#4f46e5',
        month: isDark ? '#34d399' : '#059669',
        year: isDark ? '#a78bfa' : '#7c3aed',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* ─── Sales Analytics Section ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.text }}>
                    <span style={{ fontSize: '1.3rem' }}>📊</span> {t('quick_summary')}
                </h3>

                {loadingStats ? (
                    <div style={{ textAlign: 'center', color: colors.textMuted, padding: '2rem' }}>{t('loading_analytics')}</div>
                ) : !stats ? (
                    <div style={{ textAlign: 'center', color: colors.textMuted, padding: '2rem', background: colors.cardBg, borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                        {t('no_sales_data')}
                    </div>
                ) : (
                    ['today', 'month', 'year'].map(period => {
                        const d = stats[period] || {};
                        return (
                            <div key={period} style={{ background: colors.surface, border: periodBorders[period], borderRadius: '16px', padding: '1.25rem 1.5rem', boxShadow: colors.shadow }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: accentColors[period], marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                    {t(`${period}_performance`)}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                                    <div style={{ ...cardStyle(periodGradients[period]), border: `1px solid ${colors.borderLight}` }}>
                                        <span style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>{t('total_orders')}</span>
                                        <span style={{ fontSize: '1.6rem', fontWeight: '700', color: colors.text }}>{d.orders || 0}</span>
                                    </div>
                                    <div style={{ ...cardStyle(periodGradients[period]), border: `1px solid ${colors.borderLight}` }}>
                                        <span style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>{periodLabel[period]}</span>
                                        <span style={{ fontSize: '1.6rem', fontWeight: '700', color: accentColors[period] }}>{cur.format(d.revenue)}</span>
                                    </div>
                                    <div style={{ ...cardStyle(periodGradients[period]), border: `1px solid ${colors.borderLight}` }}>
                                        <span style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>{periodProfitLabel[period]}</span>
                                        <span style={{ fontSize: '1.6rem', fontWeight: '700', color: (d.profit || 0) >= 0 ? (isDark ? '#34d399' : '#059669') : '#ef4444' }}>{cur.format(d.profit)}</span>
                                    </div>
                                    <div style={{ ...cardStyle(periodGradients[period]), border: `1px solid ${colors.borderLight}` }}>
                                        <span style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>{t('discount')}</span>
                                        <span style={{ fontSize: '1.6rem', fontWeight: '700', color: '#d97706' }}>{cur.format(d.discount)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ─── Catalog Counters ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '1.5rem', boxShadow: colors.shadow }}>
                    <div style={{ fontSize: '0.85rem', color: colors.textMuted, textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>{t('products')}</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: colors.text }}>{products.length}</div>
                </div>
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '1.5rem', boxShadow: colors.shadow }}>
                    <div style={{ fontSize: '0.85rem', color: colors.textMuted, textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>{t('categories')}</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: colors.text }}>{categories.length}</div>
                </div>
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '1.5rem', boxShadow: colors.shadow }}>
                    <div style={{ fontSize: '0.85rem', color: colors.textMuted, textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>{t('brands')}</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: colors.text }}>{brands.length}</div>
                </div>
            </div>

            {/* ─── Subscription Limits ─── */}
            {limits && (
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: '2rem', borderRadius: '16px', boxShadow: colors.shadow }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem', color: colors.text }}>Subscription Limits Progress</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem', color: colors.textMuted }}>
                                <span>Products Added ({products.length} / {limits.max_products || 100})</span>
                                <span style={{ color: colors.text, fontWeight: '600' }}>{Math.min(100, Math.round((products.length / (limits.max_products || 100)) * 100))}%</span>
                            </div>
                            <div style={{ height: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, (products.length / (limits.max_products || 100)) * 100)}%`, background: products.length >= (limits.max_products || 100) ? '#ef4444' : '#6366f1', borderRadius: '4px' }}></div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem', color: colors.textMuted }}>
                                <span>Categories Added ({categories.length} / {limits.max_categories || 25})</span>
                                <span style={{ color: colors.text, fontWeight: '600' }}>{Math.min(100, Math.round((categories.length / (limits.max_categories || 25)) * 100))}%</span>
                            </div>
                            <div style={{ height: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, (categories.length / (limits.max_categories || 25)) * 100)}%`, background: categories.length >= (limits.max_categories || 25) ? '#ef4444' : '#10b981', borderRadius: '4px' }}></div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem', color: colors.textMuted }}>
                                <span>Brands Added ({brands.length} / {limits.max_brands || 50})</span>
                                <span style={{ color: colors.text, fontWeight: '600' }}>{Math.min(100, Math.round((brands.length / (limits.max_brands || 50)) * 100))}%</span>
                            </div>
                            <div style={{ height: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, (brands.length / (limits.max_brands || 50)) * 100)}%`, background: brands.length >= (limits.max_brands || 50) ? '#ef4444' : '#8b5cf6', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
