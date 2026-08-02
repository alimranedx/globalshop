import React, { useState, useRef, useEffect } from 'react';
import useTheme from '../hooks/useTheme';

export default function ProfileImageEditorModal({ imageSrc, onClose, onSave, uploading }) {
    const { colors, isDark } = useTheme();

    const canvasRef = useRef(null);

    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imgElement, setImgElement] = useState(null);

    const CROP_SIZE = 260; // Display viewport canvas size in modal (260x260 px)

    useEffect(() => {
        if (!imageSrc) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImgElement(img);
            setScale(1);
            setRotation(0);
            setPosition({ x: 0, y: 0 });
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Draw preview canvas whenever transformations change
    useEffect(() => {
        if (!imgElement || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = CROP_SIZE;
        const height = CROP_SIZE;

        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        ctx.save();

        // Translate to center of canvas
        ctx.translate(width / 2 + position.x, height / 2 + position.y);

        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);

        // Apply scale
        ctx.scale(scale, scale);

        // Draw image centered
        const imgAspect = imgElement.width / imgElement.height;
        let drawW = width;
        let drawH = height;

        if (imgAspect > 1) {
            drawH = height;
            drawW = height * imgAspect;
        } else {
            drawW = width;
            drawH = width / imgAspect;
        }

        ctx.drawImage(imgElement, -drawW / 2, -drawH / 2, drawW, drawH);

        ctx.restore();
    }, [imgElement, scale, rotation, position]);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.min(Math.max(1, prev + delta), 3));
    };

    const handleRotateLeft = () => {
        setRotation(prev => (prev - 90 + 360) % 360);
    };

    const handleRotateRight = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const handleReset = () => {
        setScale(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    };

    const handleExportAndSave = () => {
        if (!imgElement) return;

        // Create high-resolution export canvas (400x400 px)
        const exportCanvas = document.createElement('canvas');
        const OUTPUT_SIZE = 400;
        exportCanvas.width = OUTPUT_SIZE;
        exportCanvas.height = OUTPUT_SIZE;

        const ctx = exportCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        const ratio = OUTPUT_SIZE / CROP_SIZE;

        ctx.save();
        ctx.translate((OUTPUT_SIZE / 2) + (position.x * ratio), (OUTPUT_SIZE / 2) + (position.y * ratio));
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale * ratio, scale * ratio);

        const imgAspect = imgElement.width / imgElement.height;
        let drawW = CROP_SIZE;
        let drawH = CROP_SIZE;

        if (imgAspect > 1) {
            drawH = CROP_SIZE;
            drawW = CROP_SIZE * imgAspect;
        } else {
            drawW = CROP_SIZE;
            drawH = CROP_SIZE / imgAspect;
        }

        ctx.drawImage(imgElement, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        exportCanvas.toBlob((blob) => {
            if (blob) {
                onSave(blob);
            }
        }, 'image/jpeg', 0.92);
    };

    return (
        <div 
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.82)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                padding: '1rem',
                overflowY: 'auto'
            }}
        >
            <div 
                onClick={e => e.stopPropagation()}
                style={{
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    maxWidth: '440px',
                    width: '100%',
                    maxHeight: '94vh',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.85rem',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.text, margin: 0 }}>
                            Edit Profile Photo
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: colors.textMuted, margin: '0.2rem 0 0 0' }}>
                            Drag to reposition, use slider to zoom, or rotate.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={uploading}
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
                    >
                        ✕
                    </button>
                </div>

                {/* Viewport Crop Frame */}
                <div 
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    style={{
                        position: 'relative',
                        width: `${CROP_SIZE}px`,
                        height: `${CROP_SIZE}px`,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55), 0 0 20px rgba(99, 102, 241, 0.5)',
                        border: '3px solid #6366f1',
                        background: '#18181b',
                        userSelect: 'none',
                        touchAction: 'none'
                    }}
                >
                    <canvas 
                        ref={canvasRef} 
                        style={{ width: '100%', height: '100%', pointerEvents: 'none' }} 
                    />
                </div>

                {/* Controls Area */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Zoom Slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: '600', minWidth: '45px' }}>
                            Zoom
                        </span>
                        <span style={{ fontSize: '0.85rem' }}>🔍-</span>
                        <input 
                            type="range" 
                            min="1" 
                            max="3" 
                            step="0.05" 
                            value={scale} 
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            style={{ flexGrow: 1, accentColor: '#6366f1', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.85rem' }}>🔍+</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: '700', color: colors.text, minWidth: '35px', textAlign: 'right' }}>
                            {Math.round(scale * 100)}%
                        </span>
                    </div>

                    {/* Action Bar (Rotate, Reset) */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={handleRotateLeft}
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                border: `1px solid ${colors.border}`,
                                color: colors.text,
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                            }}
                        >
                            ⟲ Rotate -90°
                        </button>
                        <button
                            type="button"
                            onClick={handleRotateRight}
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                border: `1px solid ${colors.border}`,
                                color: colors.text,
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                            }}
                        >
                            ⟳ Rotate +90°
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            style={{
                                background: 'transparent',
                                border: `1px solid ${colors.border}`,
                                color: colors.textMuted,
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            ↺ Reset
                        </button>
                    </div>
                </div>

                {/* Footer Modal Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={uploading}
                        style={{
                            background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            padding: '0.65rem 1.35rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleExportAndSave}
                        disabled={uploading || !imgElement}
                        style={{
                            background: uploading ? '#4338ca' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: '#ffffff',
                            border: '1px solid #818cf8',
                            padding: '0.65rem 1.6rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            cursor: (uploading || !imgElement) ? 'not-allowed' : 'pointer',
                            opacity: (uploading || !imgElement) ? 0.6 : 1,
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.65)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                        }}
                    >
                        {uploading ? (
                            <>
                                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                                Applying & Saving...
                            </>
                        ) : (
                            <>✨ Save & Apply Photo</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
