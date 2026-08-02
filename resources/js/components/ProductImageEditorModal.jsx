import React, { useState, useRef, useEffect } from 'react';
import useTheme from '../hooks/useTheme';

export default function ProductImageEditorModal({ imageSrc, onClose, onSave }) {
    const { colors, isDark } = useTheme();

    const canvasRef = useRef(null);

    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [aspectRatio, setAspectRatio] = useState('1:1'); // '1:1' or '4:3'
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imgElement, setImgElement] = useState(null);

    // Compute display size based on aspect ratio
    const CROP_WIDTH = 280;
    const CROP_HEIGHT = aspectRatio === '4:3' ? 210 : 280;

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
        const width = CROP_WIDTH;
        const height = CROP_HEIGHT;

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

        if (imgAspect > (width / height)) {
            drawH = height;
            drawW = height * imgAspect;
        } else {
            drawW = width;
            drawH = width / imgAspect;
        }

        ctx.drawImage(imgElement, -drawW / 2, -drawH / 2, drawW, drawH);

        ctx.restore();
    }, [imgElement, scale, rotation, position, aspectRatio]);

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

        // High-res output dimensions
        const OUTPUT_WIDTH = 600;
        const OUTPUT_HEIGHT = aspectRatio === '4:3' ? 450 : 600;

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = OUTPUT_WIDTH;
        exportCanvas.height = OUTPUT_HEIGHT;

        const ctx = exportCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

        const ratioX = OUTPUT_WIDTH / CROP_WIDTH;
        const ratioY = OUTPUT_HEIGHT / CROP_HEIGHT;

        ctx.save();
        ctx.translate((OUTPUT_WIDTH / 2) + (position.x * ratioX), (OUTPUT_HEIGHT / 2) + (position.y * ratioY));
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale * ratioX, scale * ratioY);

        const imgAspect = imgElement.width / imgElement.height;
        let drawW = CROP_WIDTH;
        let drawH = CROP_HEIGHT;

        if (imgAspect > (CROP_WIDTH / CROP_HEIGHT)) {
            drawH = CROP_HEIGHT;
            drawW = CROP_HEIGHT * imgAspect;
        } else {
            drawW = CROP_WIDTH;
            drawH = CROP_WIDTH / imgAspect;
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
                background: 'rgba(0, 0, 0, 0.85)',
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
                    maxWidth: '460px',
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
                            Product Image Editor
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: colors.textMuted, margin: '0.2rem 0 0 0' }}>
                            Drag to align, use slider to zoom, or rotate.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
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

                {/* Aspect Ratio Switcher */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', alignSelf: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: '600' }}>Format:</span>
                    <button
                        type="button"
                        onClick={() => setAspectRatio('1:1')}
                        style={{
                            background: aspectRatio === '1:1' ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                            color: aspectRatio === '1:1' ? '#fff' : colors.text,
                            border: `1px solid ${aspectRatio === '1:1' ? '#6366f1' : colors.border}`,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        1:1 Square
                    </button>
                    <button
                        type="button"
                        onClick={() => setAspectRatio('4:3')}
                        style={{
                            background: aspectRatio === '4:3' ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                            color: aspectRatio === '4:3' ? '#fff' : colors.text,
                            border: `1px solid ${aspectRatio === '4:3' ? '#6366f1' : colors.border}`,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        4:3 Landscape
                    </button>
                </div>

                {/* Rectangular Product Viewport Crop Frame */}
                <div 
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    style={{
                        position: 'relative',
                        width: `${CROP_WIDTH}px`,
                        height: `${CROP_HEIGHT}px`,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        border: '3px solid #6366f1',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55), 0 0 20px rgba(99, 102, 241, 0.5)',
                        background: '#121215',
                        userSelect: 'none',
                        touchAction: 'none',
                        transition: 'height 0.2s ease'
                    }}
                >
                    <canvas 
                        ref={canvasRef} 
                        style={{ width: '100%', height: '100%', pointerEvents: 'none' }} 
                    />

                    {/* Rule of Thirds Grid Overlay */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', opacity: 0.35 }}>
                        <div style={{ borderRight: '1px dashed #ffffff', borderBottom: '1px dashed #ffffff' }} />
                        <div style={{ borderRight: '1px dashed #ffffff', borderBottom: '1px dashed #ffffff' }} />
                        <div style={{ borderBottom: '1px dashed #ffffff' }} />
                        <div style={{ borderRight: '1px dashed #ffffff', borderBottom: '1px dashed #ffffff' }} />
                        <div style={{ borderRight: '1px dashed #ffffff', borderBottom: '1px dashed #ffffff' }} />
                        <div style={{ borderBottom: '1px dashed #ffffff' }} />
                        <div style={{ borderRight: '1px dashed #ffffff' }} />
                        <div style={{ borderRight: '1px dashed #ffffff' }} />
                        <div />
                    </div>
                </div>

                {/* Controls Area */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
                                fontSize: '0.82rem',
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
                                fontSize: '0.82rem',
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
                                fontSize: '0.82rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            ↺ Reset
                        </button>
                    </div>
                </div>

                {/* Footer Modal Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%', marginTop: '0.25rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            padding: '0.65rem 1.35rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleExportAndSave}
                        disabled={!imgElement}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: '#ffffff',
                            border: '1px solid #818cf8',
                            padding: '0.65rem 1.6rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            cursor: !imgElement ? 'not-allowed' : 'pointer',
                            opacity: !imgElement ? 0.6 : 1,
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.65)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                        }}
                    >
                        ✨ Save & Apply Image
                    </button>
                </div>
            </div>
        </div>
    );
}
