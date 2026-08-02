import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../store/uiSlice';
import { fetchState } from '../store/actions';
import { getHeaders, getCsrfToken } from '../utils/api';
import useTheme from '../hooks/useTheme';
import ProfileImageEditorModal from '../components/ProfileImageEditorModal';

export default function ProfileView() {
    const dispatch = useDispatch();
    const { colors, isDark } = useTheme();
    const user = useSelector(state => state.auth.user);
    const shop = useSelector(state => state.shop.shop);

    const [profile, setProfile] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        role: user?.role || 'User',
        avatar_url: user?.avatar_url || null,
        created_at: user?.created_at || '',
        last_login_at: user?.last_login_at || '',
    });

    const [nameInput, setNameInput] = useState(user?.name || '');
    const [phoneInput, setPhoneInput] = useState(user?.phone || '');
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [editingImageSrc, setEditingImageSrc] = useState(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const headers = getHeaders();
            const res = await fetch('/api/v1/profile', { headers });
            const data = await res.json();
            if (data.success && data.data) {
                const p = data.data;
                setProfile(p);
                setNameInput(p.name || '');
                setPhoneInput(p.phone || '');
            }
        } catch (err) {
            console.error('Failed to load profile', err);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const headers = getHeaders();
            const res = await fetch('/api/v1/profile', {
                method: 'PUT',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    name: nameInput,
                    phone: phoneInput,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                dispatch(showToast({ message: 'Profile updated successfully!', isError: false }));
                dispatch(fetchState());
            } else {
                dispatch(showToast({ message: data.message || 'Failed to update profile.', isError: true }));
            }
        } catch (err) {
            dispatch(showToast({ message: 'An error occurred while saving profile.', isError: true }));
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            dispatch(showToast({ message: 'Please select a valid image file (JPEG, PNG, WebP).', isError: true }));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            dispatch(showToast({ message: 'Profile photo size must be less than 5MB.', isError: true }));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setEditingImageSrc(reader.result);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleSaveEditedAvatar = async (blob) => {
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');

        try {
            const headers = getHeaders();
            const res = await fetch('/api/v1/profile/avatar', {
                method: 'POST',
                headers,
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                dispatch(showToast({ message: 'Profile photo updated successfully!', isError: false }));
                dispatch(fetchState());
                setEditingImageSrc(null);
            } else {
                dispatch(showToast({ message: data.message || 'Failed to upload photo.', isError: true }));
            }
        } catch (err) {
            dispatch(showToast({ message: 'Error uploading profile photo.', isError: true }));
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!window.confirm('Are you sure you want to remove your profile photo?')) return;

        setUploadingAvatar(true);
        try {
            const headers = getHeaders();
            const res = await fetch('/api/v1/profile/avatar', {
                method: 'DELETE',
                headers: {
                    ...headers,
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                dispatch(showToast({ message: 'Profile photo removed.', isError: false }));
                dispatch(fetchState());
            } else {
                dispatch(showToast({ message: data.message || 'Failed to remove photo.', isError: true }));
            }
        } catch (err) {
            dispatch(showToast({ message: 'Error removing photo.', isError: true }));
        } finally {
            setUploadingAvatar(false);
        }
    };

    // Helper for initials fallback badge
    const getInitials = (nameStr) => {
        if (!nameStr) return 'U';
        const parts = nameStr.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return nameStr.slice(0, 2).toUpperCase();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '900px' }}>
            {/* Header Title */}
            <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.text, margin: 0 }}>
                    My Profile
                </h2>
                <p style={{ color: colors.textMuted, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    View and update your personal user information and profile picture.
                </p>
            </div>

            {/* Profile Header & Avatar Card */}
            <div style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                flexWrap: 'wrap',
                boxShadow: colors.shadow,
            }}>
                {/* Avatar Display */}
                <div 
                    onClick={() => profile.avatar_url && setShowImageModal(true)}
                    style={{ 
                        position: 'relative', 
                        width: '100px', 
                        height: '100px', 
                        flexShrink: 0, 
                        cursor: profile.avatar_url ? 'pointer' : 'default',
                    }}
                    title={profile.avatar_url ? 'Click to view photo in medium size' : ''}
                >
                    {profile.avatar_url ? (
                        <img 
                            src={profile.avatar_url} 
                            alt={profile.name}
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1', transition: 'transform 0.2s' }} 
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: '#fff',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '2.2rem',
                            fontWeight: '700',
                            letterSpacing: '1px',
                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                        }}>
                            {getInitials(profile.name)}
                        </div>
                    )}
                </div>

                {/* Profile Meta & Upload Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: colors.text, margin: 0 }}>
                            {profile.name}
                        </h3>
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '700', textTransform: 'uppercase', background: '#6366f1', color: '#fff' }}>
                            {profile.role}
                        </span>
                        {shop && (
                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '600', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: colors.text }}>
                                🏢 {shop.name}
                            </span>
                        )}
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '600', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            ● Active
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        {profile.avatar_url && (
                            <button
                                type="button"
                                onClick={() => setShowImageModal(true)}
                                style={{
                                    background: 'rgba(99, 102, 241, 0.12)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    color: '#6366f1',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                }}
                            >
                                👁️ View Photo
                            </button>
                        )}

                        <label style={{
                            background: '#6366f1',
                            color: '#fff',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'opacity 0.2s',
                            opacity: uploadingAvatar ? 0.7 : 1
                        }}>
                            📸 {uploadingAvatar ? 'Uploading...' : (profile.avatar_url ? 'Change Photo' : 'Upload Photo')}
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleAvatarFileChange} 
                                disabled={uploadingAvatar}
                                style={{ display: 'none' }} 
                            />
                        </label>

                        {profile.avatar_url && (
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                disabled={uploadingAvatar}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                🗑️ Remove Photo
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Personal Information Form Card */}
            <div style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                boxShadow: colors.shadow,
            }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.text, margin: 0 }}>
                        Personal Details
                    </h3>
                    <p style={{ color: colors.textMuted, fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        Update your full display name and contact phone number.
                    </p>
                </div>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textMuted }}>Full Name *</label>
                            <input 
                                type="text" 
                                value={nameInput} 
                                onChange={e => setNameInput(e.target.value)} 
                                required 
                                style={{ 
                                    background: colors.inputBg, 
                                    border: `1px solid ${colors.inputBorder}`, 
                                    color: colors.text, 
                                    padding: '0.7rem 0.9rem', 
                                    borderRadius: '8px', 
                                    outline: 'none',
                                    fontSize: '0.95rem',
                                }} 
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textMuted }}>Phone Number</label>
                            <input 
                                type="text" 
                                value={phoneInput} 
                                onChange={e => setPhoneInput(e.target.value)} 
                                placeholder="+1 (555) 000-0000"
                                style={{ 
                                    background: colors.inputBg, 
                                    border: `1px solid ${colors.inputBorder}`, 
                                    color: colors.text, 
                                    padding: '0.7rem 0.9rem', 
                                    borderRadius: '8px', 
                                    outline: 'none',
                                    fontSize: '0.95rem',
                                }} 
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                background: '#6366f1',
                                color: '#fff',
                                border: 'none',
                                padding: '0.7rem 1.75rem',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.7 : 1,
                                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
                                transition: 'all 0.2s',
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Read-Only System Information Card */}
            <div style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                boxShadow: colors.shadow,
            }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.text, margin: 0 }}>
                        Account & Authorization Details
                    </h3>
                    <p style={{ color: colors.textMuted, fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        System-controlled parameters and workspace assignment.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Email Address (Authentication ID)</span>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.text, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>🔒 {profile.email}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Assigned Role</span>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.text }}>
                            <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#6366f1', color: '#fff', textTransform: 'uppercase' }}>
                                {profile.role}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Assigned Shop Workspace</span>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.text }}>
                            {shop ? shop.name : 'Platform Admin (Global)'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Account Status</span>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#10b981' }}>
                            ● {profile.status ? profile.status.toUpperCase() : 'ACTIVE'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Medium Size Image View Modal */}
            {showImageModal && profile.avatar_url && (
                <div 
                    onClick={() => setShowImageModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                        padding: '1.5rem',
                    }}
                >
                    <div 
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '16px',
                            padding: '1.5rem',
                            maxWidth: '420px',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.25rem',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: colors.text }}>
                                Profile Photo Preview
                            </div>
                            <button
                                onClick={() => setShowImageModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: colors.textMuted,
                                    fontSize: '1.4rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px',
                                    lineHeight: 1
                                }}
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Medium size image frame */}
                        <div style={{
                            width: '100%',
                            maxWidth: '360px',
                            aspectRatio: '1/1',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '3px solid #6366f1',
                            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)',
                            background: '#000',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <img 
                                src={profile.avatar_url} 
                                alt={profile.name} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: colors.text }}>
                                {profile.name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: colors.textMuted, marginTop: '0.2rem' }}>
                                {profile.role} {shop ? `• ${shop.name}` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Image Editor Modal */}
            {editingImageSrc && (
                <ProfileImageEditorModal
                    imageSrc={editingImageSrc}
                    onClose={() => setEditingImageSrc(null)}
                    onSave={handleSaveEditedAvatar}
                    uploading={uploadingAvatar}
                />
            )}
        </div>
    );
}
