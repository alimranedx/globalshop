import React, { useState } from 'react';
import { Modal } from './Modal';
import { ghostBtnStyle } from './Styles';

export function ConfirmModal({ title, message, confirmText = 'Confirm', confirmColor = '#ef4444', onClose, onConfirm }) {
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        setSubmitting(true);
        await onConfirm();
        setSubmitting(false);
    };

    return (
        <Modal title={title || 'Confirm Action'} onClose={onClose}>
            <p style={{ color: '#d1d5db', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                {message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} style={ghostBtnStyle} disabled={submitting}>Cancel</button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={submitting}
                    style={{
                        padding: '0.65rem 1.25rem', borderRadius: '9px', background: confirmColor,
                        color: '#fff', fontWeight: 700, fontSize: '0.875rem', border: 'none', cursor: 'pointer',
                        fontFamily: "'Outfit', sans-serif", opacity: submitting ? 0.7 : 1,
                    }}
                >
                    {submitting ? 'Processing...' : confirmText}
                </button>
            </div>
        </Modal>
    );
}
