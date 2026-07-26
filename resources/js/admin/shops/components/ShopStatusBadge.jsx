import React from 'react';

export function ShopStatusBadge({ status }) {
    const configs = {
        active: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)', label: '● Active' },
        ready_for_handover: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)', label: '✨ Ready for Handover' },
        setup_in_progress: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', label: '⚙️ Setup in Progress' },
        draft: { bg: 'rgba(156,163,175,0.12)', color: '#9ca3af', border: 'rgba(156,163,175,0.25)', label: '📝 Draft' },
        suspended: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)', label: '⛔ Suspended' },
        pending: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', label: '⏳ Pending' },
    };
    const c = configs[status] || configs.draft;
    return (
        <span style={{
            padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
            background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap',
        }}>{c.label}</span>
    );
}
