import React, { useState, useEffect } from 'react';
import useTheme from '../hooks/useTheme';
import useCurrency from '../hooks/useCurrency';
import { getHeaders } from '../utils/api';
import useHasPermission from '../hooks/useHasPermission';
import CustomerEditModal from '../components/CustomerEditModal';
import StoreCreditModal from '../components/StoreCreditModal';

export default function CustomersView() {
    const { colors, isDark } = useTheme();
    const cur = useCurrency();
    const hasPermission = useHasPermission();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Pagination & Search
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const fetchCustomers = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            if (search) params.append('search', search);

            const response = await fetch(`/api/v1/tenant/customers?${params.toString()}`, {
                headers: getHeaders()
            });

            const data = await response.json();
            if (data.success) {
                setCustomers(data.data.data);
                setTotalPages(data.data.last_page);
            } else {
                setError(data.message || 'Failed to fetch customers.');
            }
        } catch (err) {
            console.error(err);
            setError('Network error loading customers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [page]);

    // Handle search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) {
                fetchCustomers();
            } else {
                setPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleAddCustomer = () => {
        setSelectedCustomer(null);
        setShowEditModal(true);
    };

    const handleEditCustomer = (customer) => {
        setSelectedCustomer(customer);
        setShowEditModal(true);
    };

    const handleAdjustCredit = (customer) => {
        setSelectedCustomer(customer);
        setShowCreditModal(true);
    };

    const handleModalSuccess = (msg) => {
        // Optionally show toast msg
        fetchCustomers();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Outfit' }}>
            
            {/* Header & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: colors.surface, padding: '1.5rem', borderRadius: '16px', boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: `1px solid ${colors.borderLight}` }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: colors.text, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        👥 Customer Directory
                    </h2>
                    <p style={{ color: colors.textMuted, fontSize: '0.9rem', margin: '0.3rem 0 0 0' }}>Manage registered customers and store credit balances</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }}>🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search by name, phone, email..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', width: '250px' }}
                        />
                    </div>
                    {hasPermission('customers.edit') && (
                        <button 
                            onClick={handleAddCustomer}
                            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', padding: '0.65rem 1.2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
                        >
                            ➕ Add Customer
                        </button>
                    )}
                </div>
            </div>

            {/* Error handling */}
            {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '1rem', borderRadius: '12px' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Customers Table */}
            <div style={{ background: colors.surface, borderRadius: '16px', overflow: 'hidden', boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: `1px solid ${colors.borderLight}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead style={{ background: colors.cardBg, borderBottom: `2px solid ${colors.borderLight}` }}>
                        <tr>
                            <th style={{ padding: '1rem', color: colors.tableHeaderColor, fontWeight: '700' }}>Customer</th>
                            <th style={{ padding: '1rem', color: colors.tableHeaderColor, fontWeight: '700' }}>Contact</th>
                            <th style={{ padding: '1rem', color: colors.tableHeaderColor, fontWeight: '700' }}>Membership</th>
                            <th style={{ padding: '1rem', color: colors.tableHeaderColor, fontWeight: '700', textAlign: 'center' }}>Total Orders</th>
                            <th style={{ padding: '1rem', color: colors.tableHeaderColor, fontWeight: '700', textAlign: 'right' }}>Store Credit</th>
                            <th style={{ padding: '1rem', color: colors.tableHeaderColor, fontWeight: '700', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: colors.textMuted }}>
                                    <div style={{ display: 'inline-block', width: '24px', height: '24px', border: `3px solid ${colors.border}`, borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    <div style={{ marginTop: '0.5rem' }}>Loading customers...</div>
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                </td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: colors.textMuted }}>
                                    No customers found. Try adjusting your search or add a new customer.
                                </td>
                            </tr>
                        ) : (
                            customers.map(customer => (
                                <tr key={customer.id} style={{ borderBottom: `1px solid ${colors.tableRowBorder}`, ':hover': { background: colors.hoverBg } }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '600', color: colors.text }}>{customer.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>Joined {formatDate(customer.created_at)}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ color: colors.text }}>📞 {customer.phone}</div>
                                        {customer.email && <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>✉️ {customer.email}</div>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', fontFamily: 'monospace' }}>
                                            {customer.membership_number}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', color: colors.text }}>
                                        {customer.sales_count}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <strong style={{ color: customer.store_credit_balance > 0 ? (isDark ? '#10b981' : '#059669') : colors.textMuted }}>
                                            {cur.format(customer.store_credit_balance)}
                                        </strong>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {hasPermission('customers.edit') ? (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button 
                                                    onClick={() => handleAdjustCredit(customer)}
                                                    title="Adjust Store Credit"
                                                    style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', color: '#10b981', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    💰
                                                </button>
                                                <button 
                                                    onClick={() => handleEditCustomer(customer)}
                                                    title="Edit Customer"
                                                    style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', color: '#6366f1', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    ✏️
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>View Only</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: `1px solid ${colors.borderLight}`, background: colors.cardBg }}>
                        <span style={{ fontSize: '0.85rem', color: colors.textMuted }}>
                            Page {page} of {totalPages}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showEditModal && (
                <CustomerEditModal 
                    customer={selectedCustomer}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={handleModalSuccess}
                />
            )}
            
            {showCreditModal && (
                <StoreCreditModal 
                    customer={selectedCustomer}
                    onClose={() => setShowCreditModal(false)}
                    onSuccess={handleModalSuccess}
                />
            )}

        </div>
    );
}
