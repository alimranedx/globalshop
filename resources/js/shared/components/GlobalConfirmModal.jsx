import React, { useState, useEffect, useRef } from 'react';
import { registerConfirmSubscriber } from '../services/confirmService';

/* ─────────────────────────────────────────────
   Variant Theme Definitions & Icons
───────────────────────────────────────────── */
const VARIANTS = {
    delete: {
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.28)',
        defaultTitle: 'Delete Confirmation',
        defaultConfirmText: 'Delete',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        ),
    },
    permanent_delete: {
        color: '#dc2626',
        bg: 'rgba(220, 38, 38, 0.14)',
        border: 'rgba(220, 38, 38, 0.35)',
        defaultTitle: 'Permanently Delete?',
        defaultConfirmText: 'Permanently Delete',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        ),
    },
    warning: {
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.28)',
        defaultTitle: 'Warning',
        defaultConfirmText: 'Proceed',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        ),
    },
    logout: {
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.12)',
        border: 'rgba(139, 92, 246, 0.28)',
        defaultTitle: 'Sign Out Confirmation',
        defaultConfirmText: 'Sign Out',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
        ),
    },
    archive: {
        color: '#d97706',
        bg: 'rgba(217, 119, 6, 0.12)',
        border: 'rgba(217, 119, 6, 0.28)',
        defaultTitle: 'Archive Item',
        defaultConfirmText: 'Archive',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
                <line x1="10" y1="12" x2="14" y2="12"></line>
            </svg>
        ),
    },
    restore: {
        color: '#14b8a6',
        bg: 'rgba(20, 184, 166, 0.12)',
        border: 'rgba(20, 184, 166, 0.28)',
        defaultTitle: 'Restore Item',
        defaultConfirmText: 'Restore',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
        ),
    },
    publish: {
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.28)',
        defaultTitle: 'Publish Confirmation',
        defaultConfirmText: 'Publish Now',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        ),
    },
    unpublish: {
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.12)',
        border: 'rgba(249, 115, 22, 0.28)',
        defaultTitle: 'Unpublish Item',
        defaultConfirmText: 'Unpublish',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="10" y1="15" x2="10" y2="9"></line>
                <line x1="14" y1="15" x2="14" y2="9"></line>
            </svg>
        ),
    },
    info: {
        color: '#6366f1',
        bg: 'rgba(99, 102, 241, 0.12)',
        border: 'rgba(99, 102, 241, 0.28)',
        defaultTitle: 'Information',
        defaultConfirmText: 'OK',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        ),
    },
    error: {
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.28)',
        defaultTitle: 'Action Required',
        defaultConfirmText: 'OK',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        ),
    },
    success: {
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.28)',
        defaultTitle: 'Success',
        defaultConfirmText: 'OK',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        ),
    },
};

/**
 * GlobalConfirmModal UI Component
 */
export function GlobalConfirmModal({ modalData, onClose }) {
    if (!modalData) return null;

    const {
        title,
        message,
        variant = 'delete',
        confirmText,
        cancelText = 'Cancel',
        onConfirm,
        resolve,
    } = modalData;

    const config = VARIANTS[variant] || VARIANTS.warning;
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const confirmBtnRef = useRef(null);

    // Auto-focus confirm button
    useEffect(() => {
        if (confirmBtnRef.current) {
            confirmBtnRef.current.focus();
        }
    }, []);

    // Handle ESC and Enter keyboard accessibility
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !submitting) {
                handleCancel();
            }
            if (e.key === 'Enter' && !submitting) {
                handleConfirm();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [submitting, modalData]);

    const handleCancel = () => {
        if (submitting) return;
        if (resolve) resolve(false);
        onClose();
    };

    const handleConfirm = async () => {
        if (submitting) return;
        setErrorMsg(null);

        if (typeof onConfirm === 'function') {
            try {
                setSubmitting(true);
                await onConfirm();
                setSubmitting(false);
                if (resolve) resolve(true);
                onClose();
            } catch (err) {
                setSubmitting(false);
                setErrorMsg(err?.message || 'An unexpected error occurred while processing your request.');
            }
        } else {
            if (resolve) resolve(true);
            onClose();
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(5, 5, 12, 0.75)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.25rem',
                animation: 'globalModalFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && !submitting) {
                    handleCancel();
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
        >
            <style>{`
                @keyframes globalModalFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes globalModalSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div
                style={{
                    width: '100%',
                    maxWidth: 440,
                    background: 'rgba(15, 15, 24, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 20,
                    padding: '1.75rem',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    color: '#f1f5f9',
                    fontFamily: "'Outfit', sans-serif",
                    position: 'relative',
                }}
            >
                {/* Header Icon & Title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.2rem' }}>
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            background: config.bg,
                            border: `1px solid ${config.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {config.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                        <h3
                            id="confirm-modal-title"
                            style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                color: '#f8fafc',
                                margin: 0,
                                lineHeight: 1.3,
                            }}
                        >
                            {title || config.defaultTitle}
                        </h3>
                    </div>

                    {/* Close X Button */}
                    <button
                        onClick={handleCancel}
                        disabled={submitting}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            fontSize: '1.25rem',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            padding: '0.2rem',
                            lineHeight: 1,
                            borderRadius: '50%',
                            transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Contextual Message */}
                <div
                    style={{
                        fontSize: '0.95rem',
                        color: '#94a3b8',
                        lineHeight: 1.55,
                        marginBottom: '1.5rem',
                        whiteSpace: 'pre-line',
                    }}
                >
                    {message || 'Are you sure you want to proceed with this action?'}
                </div>

                {/* Inline Error Alert if async action fails */}
                {errorMsg && (
                    <div
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: 12,
                            padding: '0.75rem 1rem',
                            fontSize: '0.85rem',
                            color: '#f87171',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <span>⚠️</span>
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    {cancelText && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={submitting}
                            style={{
                                padding: '0.65rem 1.25rem',
                                borderRadius: 12,
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#cbd5e1',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                opacity: submitting ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!submitting) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                    e.currentTarget.style.color = '#ffffff';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!submitting) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#cbd5e1';
                                }
                            }}
                        >
                            {cancelText}
                        </button>
                    )}

                    <button
                        ref={confirmBtnRef}
                        type="button"
                        onClick={handleConfirm}
                        disabled={submitting}
                        style={{
                            padding: '0.65rem 1.35rem',
                            borderRadius: 12,
                            background: config.color,
                            border: 'none',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: `0 4px 14px ${config.bg}`,
                            transition: 'all 0.15s ease',
                            opacity: submitting ? 0.8 : 1,
                        }}
                    >
                        {submitting && (
                            <span
                                style={{
                                    width: 14,
                                    height: 14,
                                    border: '2px solid rgba(255, 255, 255, 0.4)',
                                    borderTopColor: '#ffffff',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'globalModalSpin 0.7s linear infinite',
                                }}
                            />
                        )}
                        <span>{submitting ? 'Processing...' : confirmText || config.defaultConfirmText}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Root Container subscriber component mounted at top of App roots.
 */
export function GlobalConfirmContainer() {
    const [currentModal, setCurrentModal] = useState(null);

    useEffect(() => {
        const unsubscribe = registerConfirmSubscriber((options) => {
            setCurrentModal(options);
        });
        return unsubscribe;
    }, []);

    const handleClose = () => {
        setCurrentModal(null);
    };

    return <GlobalConfirmModal modalData={currentModal} onClose={handleClose} />;
}
