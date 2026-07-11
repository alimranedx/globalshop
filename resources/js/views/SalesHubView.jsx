import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedReceipt } from '../store/uiSlice';
import useHasPermission from '../hooks/useHasPermission';
import POSTerminal from './POSTerminal';
import SalesLog from './SalesLog';
import Refunds from './Refunds';
import ReceiptModal from '../components/ReceiptModal';

export default function SalesHubView({ activeSubTab }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const hasPermission = useHasPermission();
    
    const selectedReceipt = useSelector(state => state.ui.selectedReceipt);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            {/* Sub Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: '1.5rem', paddingBottom: '0.5rem' }}>
                {hasPermission('sales.create') && (
                    <button 
                        onClick={() => navigate('/sales/pos')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeSubTab === 'pos' ? '2px solid #6366f1' : '2px solid transparent',
                            color: activeSubTab === 'pos' ? '#fff' : '#9ca3af',
                            fontWeight: '600',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        🛒 POS Terminal
                    </button>
                )}
                {hasPermission('sales.index') && (
                    <button 
                        onClick={() => navigate('/sales/history')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeSubTab === 'history' ? '2px solid #6366f1' : '2px solid transparent',
                            color: activeSubTab === 'history' ? '#fff' : '#9ca3af',
                            fontWeight: '600',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        📜 Sales Log
                    </button>
                )}
                {hasPermission('sales.index') && (
                    <button 
                        onClick={() => navigate('/sales/refunds')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeSubTab === 'refunds' ? '2px solid #6366f1' : '2px solid transparent',
                            color: activeSubTab === 'refunds' ? '#fff' : '#9ca3af',
                            fontWeight: '600',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        🔄 Refunds
                    </button>
                )}
            </div>

            {activeSubTab === 'pos' ? (
                <POSTerminal />
            ) : activeSubTab === 'refunds' ? (
                <Refunds />
            ) : (
                <SalesLog />
            )}

            {/* Receipt Popup Modal */}
            {selectedReceipt && (
                <ReceiptModal 
                    sale={selectedReceipt}
                    onClose={() => dispatch(setSelectedReceipt(null))}
                />
            )}
        </div>
    );
}
