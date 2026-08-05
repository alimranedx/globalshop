import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ProductImageMagnifier.css';

/**
 * ProductImageMagnifier
 * Reusable circular mirror image magnifier with GPU-accelerated requestAnimationFrame performance.
 *
 * @param {string} src - Main display image URL
 * @param {string} [zoomSrc] - High-resolution original image URL (defaults to src)
 * @param {string} [alt] - Accessibility alt text for image
 * @param {number} [zoomLevel=2.8] - Zoom multiplier ratio (between 2.5x and 3.0x)
 * @param {number} [lensSizeDesktop=200] - Lens diameter in pixels for desktop
 * @param {number} [lensSizeTablet=160] - Lens diameter in pixels for tablet
 * @param {function} [onImageChange] - Callback when image switches
 */
export default function ProductImageMagnifier({
    src,
    zoomSrc,
    alt = 'Product image',
    zoomLevel = 2.8,
    lensSizeDesktop = 200,
    lensSizeTablet = 160,
    style = {},
    className = ''
}) {
    const highResSrc = zoomSrc || src;

    // Component state
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileModalOpen, setMobileModalOpen] = useState(false);
    const [mobileZoomScale, setMobileZoomScale] = useState(1);
    const [keyboardActive, setKeyboardActive] = useState(false);

    // Refs for DOM nodes and rAF loop tracking
    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const lensRef = useRef(null);
    const mousePosRef = useRef({ x: 0, y: 0 });
    const rafIdRef = useRef(null);
    const isTouchDeviceRef = useRef(false);
    const lastTapRef = useRef(0);

    // ─────────────────────────────────────────────
    // 1. Device & Responsive Detection
    // ─────────────────────────────────────────────
    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            setIsMobile(width <= 768 || (hasTouch && width <= 1024));
        };

        checkDevice();
        window.addEventListener('resize', checkDevice, { passive: true });
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    // ─────────────────────────────────────────────
    // 2. High-Resolution Preloader & Image Reset
    // ─────────────────────────────────────────────
    useEffect(() => {
        setImageLoaded(false);
        setIsHovering(false);
        setKeyboardActive(false);

        if (!src) return;

        let isSubscribed = true;

        // Preload active display image
        const img = new Image();
        img.src = src;
        img.onload = () => {
            if (isSubscribed) setImageLoaded(true);
        };
        img.onerror = () => {
            if (isSubscribed) setImageLoaded(true); // Fallback so container displays
        };

        // Preload high-res image if different
        if (highResSrc && highResSrc !== src) {
            const highResImg = new Image();
            highResImg.src = highResSrc;
        }

        return () => {
            isSubscribed = false;
        };
    }, [src, highResSrc]);

    // ─────────────────────────────────────────────
    // 3. Mirror Zoom Calculation Engine (rAF)
    // ─────────────────────────────────────────────
    /**
     * Calculates and applies lens position and zoomed background offsets.
     * Uses transform3d to utilize GPU acceleration and avoid triggering React re-renders.
     */
    const updateMagnifierPosition = useCallback(() => {
        if (!containerRef.current || !lensRef.current || !imageRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const imgRect = imageRef.current.getBoundingClientRect();

        if (containerRect.width === 0 || containerRect.height === 0) return;

        // Current lens diameter & radius based on responsive screen width
        const currentLensSize = window.innerWidth <= 1024 ? lensSizeTablet : lensSizeDesktop;
        const lensRadius = currentLensSize / 2;

        // 1. Mouse coordinates relative to actual rendered image (imgRect)
        const imgWidth = imgRect.width || containerRect.width;
        const imgHeight = imgRect.height || containerRect.height;
        const rawImgX = mousePosRef.current.x - imgRect.left;
        const rawImgY = mousePosRef.current.y - imgRect.top;

        // 2. Normalized image coordinates ratio [0.0 to 1.0] across full image area
        const ratioX = Math.max(0, Math.min(1, rawImgX / imgWidth));
        const ratioY = Math.max(0, Math.min(1, rawImgY / imgHeight));

        // 3. Mouse coordinates relative to container for lens positioning
        const mouseContainerX = mousePosRef.current.x - containerRect.left;
        const mouseContainerY = mousePosRef.current.y - containerRect.top;

        // 4. Lens top-left position relative to container (centered directly under cursor)
        const lensLeft = mouseContainerX - lensRadius;
        const lensTop = mouseContainerY - lensRadius;

        // 5. Background image dimensions under zoom factor
        const bgWidth = imgWidth * zoomLevel;
        const bgHeight = imgHeight * zoomLevel;

        /*
         * 6. Mirror zoom background positioning:
         * Align the high-res image coordinate (ratioX * bgWidth, ratioY * bgHeight)
         * directly at the center of the circular lens (lensRadius, lensRadius).
         */
        const bgX = -(ratioX * bgWidth - lensRadius);
        const bgY = -(ratioY * bgHeight - lensRadius);

        // 7. Apply direct GPU transform & CSS property updates
        const lensEl = lensRef.current;
        lensEl.style.transform = `translate3d(${lensLeft}px, ${lensTop}px, 0)`;
        lensEl.style.backgroundImage = `url("${highResSrc}")`;
        lensEl.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;
        lensEl.style.backgroundPosition = `${bgX}px ${bgY}px`;
        lensEl.style.setProperty('--pim-lens-size', `${currentLensSize}px`);
    }, [highResSrc, zoomLevel, lensSizeDesktop, lensSizeTablet]);

    // Schedule rAF tick
    const scheduleUpdate = useCallback(() => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(updateMagnifierPosition);
    }, [updateMagnifierPosition]);

    // Clean up rAF on unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    // ─────────────────────────────────────────────
    // 4. Desktop Mouse Handlers
    // ─────────────────────────────────────────────
    const handleMouseEnter = (e) => {
        if (isMobile || isTouchDeviceRef.current) return;
        mousePosRef.current = { x: e.clientX, y: e.clientY };
        setIsHovering(true);
        scheduleUpdate();
    };

    const handleMouseMove = (e) => {
        if (isMobile || isTouchDeviceRef.current) return;
        mousePosRef.current = { x: e.clientX, y: e.clientY };
        scheduleUpdate();
    };

    const handleMouseLeave = () => {
        if (isMobile) return;
        setIsHovering(false);
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };

    // ─────────────────────────────────────────────
    // 5. Touch & Mobile Double-Tap Support
    // ─────────────────────────────────────────────
    const handleTouchStart = (e) => {
        isTouchDeviceRef.current = true;
        const now = Date.now();
        const doubleTapDelay = 300;

        if (now - lastTapRef.current < doubleTapDelay) {
            // Double-tap detected: open mobile pinch-zoom modal
            e.preventDefault();
            setMobileModalOpen(true);
            setMobileZoomScale(2.5);
        }
        lastTapRef.current = now;
    };

    // Toggle double tap zoom in mobile modal
    const handleMobileModalDoubleTap = () => {
        setMobileZoomScale((prev) => (prev > 1.5 ? 1 : 2.5));
    };

    // ─────────────────────────────────────────────
    // 6. Keyboard Accessibility & Shortcuts
    // ─────────────────────────────────────────────
    const handleKeyDown = (e) => {
        if (!containerRef.current) return;

        // Escape closes any active zoom
        if (e.key === 'Escape') {
            setIsHovering(false);
            setKeyboardActive(false);
            setMobileModalOpen(false);
            containerRef.current.blur();
            return;
        }

        // Enter or Space toggles magnifier at center
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const rect = containerRef.current.getBoundingClientRect();
            mousePosRef.current = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            setKeyboardActive((prev) => !prev);
            setIsHovering((prev) => !prev);
            scheduleUpdate();
            return;
        }

        // Arrow keys nudge focus point when keyboard active
        if (keyboardActive && isHovering) {
            const step = 25; // Pixel step per arrow press
            let { x, y } = mousePosRef.current;

            if (e.key === 'ArrowUp') { y -= step; e.preventDefault(); }
            if (e.key === 'ArrowDown') { y += step; e.preventDefault(); }
            if (e.key === 'ArrowLeft') { x -= step; e.preventDefault(); }
            if (e.key === 'ArrowRight') { x += step; e.preventDefault(); }

            mousePosRef.current = { x, y };
            scheduleUpdate();
        }
    };

    // ─────────────────────────────────────────────
    // 7. Component Render
    // ─────────────────────────────────────────────
    return (
        <>
            <div
                ref={containerRef}
                className={`pim-container ${isHovering && !isMobile ? 'pim-active-hover' : ''} ${className}`}
                style={style}
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="region"
                aria-label="Interactive Product Image Magnifier. Press Enter to toggle zoom, arrow keys to move, Escape to exit."
            >
                {/* Skeleton shimmer while image is loading */}
                {!imageLoaded && <div className="pim-skeleton" aria-hidden="true" />}

                {/* Display Image */}
                {src && (
                    <img
                        ref={imageRef}
                        src={src}
                        alt={alt}
                        className={`pim-image ${imageLoaded ? 'pim-loaded' : ''}`}
                        loading="eager"
                        decoding="async"
                    />
                )}

                {/* Circular Magnifier Glass Lens (Desktop & Tablet) */}
                {!isMobile && (
                    <div
                        ref={lensRef}
                        className={`pim-lens ${isHovering ? 'pim-lens-visible' : ''}`}
                        aria-hidden="true"
                    />
                )}
            </div>

            {/* Mobile Touch Zoom Overlay Modal */}
            {mobileModalOpen && (
                <div
                    className="pim-mobile-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Mobile Product Image Zoom"
                >
                    <button
                        className="pim-mobile-overlay-close"
                        onClick={() => setMobileModalOpen(false)}
                        aria-label="Close zoomed image view"
                    >
                        ✕
                    </button>

                    <div
                        className="pim-mobile-zoom-container"
                        onClick={handleMobileModalDoubleTap}
                    >
                        <img
                            src={highResSrc}
                            alt={alt}
                            className="pim-mobile-zoom-img"
                            style={{
                                transform: `scale(${mobileZoomScale})`,
                                maxWidth: mobileZoomScale > 1 ? 'none' : '90vw',
                                maxHeight: mobileZoomScale > 1 ? 'none' : '75vh',
                            }}
                        />
                    </div>

                    <p className="pim-mobile-hint">
                        Tap anywhere to toggle {mobileZoomScale > 1 ? '1x' : '2.5x'} zoom • Swipe to navigate
                    </p>
                </div>
            )}
        </>
    );
}
