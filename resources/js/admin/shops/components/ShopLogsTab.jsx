import React, { useState, useEffect } from 'react';
import { shopService } from '../services/shopService';
import { PageLoader } from '../../shared/components/PageLoader';
import { SectionCard } from '../../shared/components/SectionCard';
import { DataTable } from '../../shared/components/DataTable';

export function ShopLogsTab({ shop }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await shopService.getShopLogs(shop.id);
            if (res?.success) setLogs(res.data || []);
            setLoading(false);
        }
        load();
    }, [shop.id]);

    if (loading) return <PageLoader />;

    return (
        <SectionCard title={`Audit Logs for Shop "${shop.name}"`}>
            <DataTable
                columns={['Action', 'Description', 'User', 'Time']}
                rows={logs.map(l => [
                    <code style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>{l.action}</code>,
                    <span style={{ color: '#d1d5db', fontSize: '0.85rem' }}>{l.description}</span>,
                    <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{l.user_id ? `User #${l.user_id}` : 'System'}</span>,
                    <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{new Date(l.created_at).toLocaleString()}</span>,
                ])}
                emptyMsg="No audit log activity recorded for this shop."
            />
        </SectionCard>
    );
}
