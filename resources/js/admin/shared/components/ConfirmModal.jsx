import React from 'react';
import { GlobalConfirmModal } from '../../../shared/components/GlobalConfirmModal';

export function ConfirmModal({ title, message, confirmText = 'Confirm', confirmColor = '#ef4444', onClose, onConfirm, variant }) {
    const modalVariant = variant || (confirmColor === '#ef4444' ? 'delete' : 'warning');
    
    return (
        <GlobalConfirmModal
            modalData={{
                title: title || 'Confirm Action',
                message,
                variant: modalVariant,
                confirmText,
                cancelText: 'Cancel',
                onConfirm,
            }}
            onClose={onClose}
        />
    );
}
