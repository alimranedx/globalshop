import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import { customerService } from '../../customers/services/customerService';
import { shopOwnerService } from '../../shop-owners/services/shopOwnerService';
import { useToast } from '../../shared/components/Toast';
import { PageLoader } from '../../shared/components/PageLoader';
import { SectionCard } from '../../shared/components/SectionCard';
import { ActionBtn, ErrorAlert } from '../../shared/components/ActionBtn';
import { primaryBtnStyle, ghostBtnStyle } from '../../shared/components/Styles';

export function TicketDetailsPage() {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { show, ToastComponent } = useToast();

    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState(null);
    const [investigation, setInvestigation] = useState(null);

    // Reply Form State
    const [replyText, setReplyText] = useState('');
    const [messageType, setMessageType] = useState('public_reply'); // 'public_reply' or 'internal_note'
    const [status, setStatus] = useState('open');
    const [priority, setPriority] = useState('normal');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        const res = await ticketService.getTicket(ticketId);
        if (res?.success && res.data) {
            setTicket(res.data.ticket);
            setInvestigation(res.data.investigation);
            setStatus(res.data.ticket.status);
            setPriority(res.data.ticket.priority);
        }
        setLoading(false);
    }, [ticketId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return setError('Reply message cannot be empty.');
        setSubmitting(true);
        setError('');

        const res = await ticketService.replyTicket(ticket.id, {
            message: replyText,
            message_type: messageType,
            status: status,
        });

        if (res?.success) {
            show(messageType === 'public_reply' ? 'Public reply sent to user!' : 'Internal note saved.', 'success');
            setReplyText('');
            loadData();
        } else {
            setError(res?.message || 'Failed to post reply.');
        }
        setSubmitting(false);
    };

    const handleStatusChange = async (newStatus) => {
        const res = await ticketService.updateTicketStatus(ticket.id, { status: newStatus });
        if (res?.success) {
            show(`Ticket status updated to ${newStatus}.`, 'success');
            loadData();
        }
    };

    const handleQuickAccountReset = async () => {
        if (!investigation) return;
        let res = null;
        if (investigation.model === 'MarketplaceCustomer') {
            res = await customerService.resetPassword(investigation.id, 'send_link');
        } else {
            res = await shopOwnerService.resetPassword(investigation.id, 'send_link');
        }
        if (res?.success) {
            show(res.message, 'success');
        } else {
            show('Failed to send reset link.', 'error');
        }
    };

    const handleQuickAccountStatusToggle = async () => {
        if (!investigation) return;
        const newStatus = investigation.status === 'suspended' ? 'active' : 'suspended';
        let res = null;
        if (investigation.model === 'MarketplaceCustomer') {
            res = await customerService.updateStatus(investigation.id, newStatus);
        } else {
            res = await shopOwnerService.updateStatus(investigation.id, newStatus);
        }
        if (res?.success) {
            show(`Account status updated to ${newStatus}.`, 'success');
            loadData();
        }
    };

    if (loading) return <PageLoader />;
    if (!ticket) return <div style={{ color: '#ef4444' }}>Ticket not found.</div>;

    return (
        <div>
            {ToastComponent}

            <div style={{ marginBottom: '1.25rem' }}>
                <button onClick={() => navigate('/admin/support-tickets')} style={ghostBtnStyle}>
                    ← Back to Support Tickets Desk
                </button>
            </div>

            {/* Header Details */}
            <div style={{
                background: 'rgba(20,20,28,0.85)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '16px', padding: '1.75rem', marginBottom: '1.75rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem',
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 800, color: '#6366f1', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                            {ticket.ticket_number}
                        </span>
                        <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                            background: ticket.status === 'resolved' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: ticket.status === 'resolved' ? '#34d399' : '#f87171',
                        }}>
                            {ticket.status.toUpperCase().replace(/_/g, ' ')}
                        </span>
                    </div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6', margin: '0 0 0.5rem' }}>
                        {ticket.subject}
                    </h1>
                    <div style={{ display: 'flex', gap: '1.25rem', color: '#9ca3af', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                        <span>Submitted By: <strong style={{ color: '#e5e7eb' }}>{ticket.name} ({ticket.email})</strong></span>
                        <span>Category: <strong style={{ color: '#a5b4fc' }}>{ticket.category.replace(/_/g, ' ')}</strong></span>
                        <span>Account Type: <strong style={{ color: '#fbbf24', textTransform: 'capitalize' }}>{ticket.user_type.replace('_', ' ')}</strong></span>
                        <span>Created: <strong style={{ color: '#d1d5db' }}>{new Date(ticket.created_at).toLocaleString()}</strong></span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {ticket.status !== 'resolved' && (
                        <button onClick={() => handleStatusChange('resolved')} style={{ ...primaryBtnStyle, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            ✓ Resolve Ticket
                        </button>
                    )}
                    {ticket.status === 'resolved' && (
                        <button onClick={() => handleStatusChange('open')} style={ghostBtnStyle}>
                            🔄 Reopen Ticket
                        </button>
                    )}
                </div>
            </div>

            {/* Account Investigation Box */}
            {investigation && (
                <div style={{
                    background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '14px', padding: '1.25rem', marginBottom: '1.75rem',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ fontWeight: 700, color: '#a5b4fc', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🔍 Admin Account Investigation</span>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>({investigation.model})</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <ActionBtn
                                label={investigation.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
                                color={investigation.status === 'suspended' ? '#10b981' : '#f59e0b'}
                                onClick={handleQuickAccountStatusToggle}
                            />
                            <ActionBtn label="🔑 Send Password Reset" color="#6366f1" onClick={handleQuickAccountReset} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                        <div><span style={{ color: '#6b7280' }}>Account Status:</span> <strong style={{ color: investigation.status === 'active' ? '#34d399' : '#f87171' }}>{investigation.status.toUpperCase()}</strong></div>
                        <div><span style={{ color: '#6b7280' }}>Last Login:</span> <strong style={{ color: '#e5e7eb' }}>{investigation.last_login_at ? new Date(investigation.last_login_at).toLocaleString() : 'Never'}</strong></div>
                        <div><span style={{ color: '#6b7280' }}>Registered Phone:</span> <strong style={{ color: '#e5e7eb' }}>{investigation.phone || '—'}</strong></div>
                        {investigation.owned_shops?.length > 0 && (
                            <div><span style={{ color: '#6b7280' }}>Owned Shops:</span> <strong style={{ color: '#a5b4fc' }}>{investigation.owned_shops.map(s => s.name).join(', ')}</strong></div>
                        )}
                    </div>
                </div>
            )}

            {/* Conversation Thread */}
            <SectionCard title="💬 Ticket Conversation Thread">
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {ticket.messages?.map((msg, i) => {
                        const isAdmin = msg.sender_type === 'admin';
                        const isInternal = msg.message_type === 'internal_note';

                        return (
                            <div key={i} style={{
                                padding: '1.25rem', borderRadius: '12px',
                                background: isInternal
                                    ? 'rgba(245,158,11,0.08)'
                                    : isAdmin ? 'rgba(16,185,129,0.08)' : 'rgba(99,102,241,0.08)',
                                border: `1px solid ${isInternal ? 'rgba(245,158,11,0.3)' : isAdmin ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`,
                                marginLeft: isAdmin && !isInternal ? '2rem' : '0',
                                marginRight: !isAdmin && !isInternal ? '2rem' : '0',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <strong style={{ color: isInternal ? '#fbbf24' : isAdmin ? '#34d399' : '#a5b4fc' }}>
                                            {isInternal ? '🔒 Internal Admin Note' : isAdmin ? '🛡️ GlobalShop Support Admin' : `👤 ${ticket.name}`}
                                        </strong>
                                        {isInternal && (
                                            <span style={{ background: '#f59e0b', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                                                PRIVATE
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ color: '#6b7280' }}>{new Date(msg.created_at).toLocaleString()}</span>
                                </div>
                                <div style={{ color: '#f3f4f6', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Reply Form */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                    <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d1d5db', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                                <input type="radio" name="msg_type" checked={messageType === 'public_reply'} onChange={() => setMessageType('public_reply')} style={{ accentColor: '#10b981' }} />
                                <span>✉️ Public Reply to User (Email notification via noreply@globalshop.com)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                                <input type="radio" name="msg_type" checked={messageType === 'internal_note'} onChange={() => setMessageType('internal_note')} style={{ accentColor: '#f59e0b' }} />
                                <span>🔒 Internal Admin Note (Visible ONLY to admins)</span>
                            </label>
                        </div>

                        <textarea
                            rows={4}
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder={messageType === 'public_reply' ? 'Type your response to the user...' : 'Add a private internal note for admin team...'}
                            style={{
                                width: '100%', padding: '0.875rem', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)', border: `1px solid ${messageType === 'internal_note' ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                color: '#f3f4f6', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                                fontFamily: "'Outfit', sans-serif",
                            }}
                        />

                        {error && <ErrorAlert msg={error} />}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Update Status:</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', background: '#141419', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}>
                                    <option value="open">🔴 Open</option>
                                    <option value="in_progress">⚙️ In Progress</option>
                                    <option value="waiting_for_customer">⏳ Waiting for Customer</option>
                                    <option value="resolved">✅ Resolved</option>
                                    <option value="closed">🔒 Closed</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    ...primaryBtnStyle,
                                    background: messageType === 'internal_note' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)',
                                }}
                            >
                                {submitting ? 'Posting...' : messageType === 'internal_note' ? '🔒 Save Internal Note' : '🚀 Send Public Reply'}
                            </button>
                        </div>
                    </form>
                </div>
            </SectionCard>
        </div>
    );
}
