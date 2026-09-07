"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface DocsViewerImage {
  id: string;
  src: string;
  alt: string;
}

interface DocsImageViewerProps {
  images: DocsViewerImage[];
  /** Render function for the thumbnail grid — you control how thumbnails look */
  renderThumbnails: (images: DocsViewerImage[], openImage: (img: DocsViewerImage, event?: React.MouseEvent) => void) => React.ReactNode;
  /** If set, auto-open this image index on mount */
  defaultOpenIndex?: number;
  /** Callback when lightbox closes */
  onClose?: () => void;
}

/**
 * DocsImageViewer — incident.io style image viewer for the Ask AI panel.
 *
 * Features:
 * - Origin-point scale animation (zooms from thumbnail position)
 * - White backdrop (light) / dark backdrop (dark mode)
 * - Close via: click image, click backdrop, Escape, scroll
 * - Close (X) button in top-right
 * - Portaled to document.body so it escapes any parent transforms
 */
export function DocsImageViewer({ images, renderThumbnails, defaultOpenIndex, onClose }: DocsImageViewerProps) {
  const [selectedImage, setSelectedImage] = useState<DocsViewerImage | null>(null);
  const thumbnailRectRef = useRef<DOMRect | null>(null);
  const [zoom, setZoom] = useState(1);

  // Auto-open if defaultOpenIndex is provided
  useEffect(() => {
    if (defaultOpenIndex !== undefined && images[defaultOpenIndex]) {
      setSelectedImage(images[defaultOpenIndex]);
    }
  }, [defaultOpenIndex, images]);

  const openImage = useCallback((img: DocsViewerImage, event?: React.MouseEvent) => {
    if (event?.currentTarget) {
      thumbnailRectRef.current = (event.currentTarget as HTMLElement).getBoundingClientRect();
    }
    setSelectedImage(img);
  }, []);

  const closeImage = useCallback(() => {
    setSelectedImage(null);
    setZoom(1);
    onClose?.();
  }, [onClose]);

  // ── Lock body scroll when open ──
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedImage]);

  // ── Keyboard: Escape to close ──
  useEffect(() => {
    if (!selectedImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, closeImage]);

  // ── Zoom with mouse scroll ──
  useEffect(() => {
    if (!selectedImage) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(prev => {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        return Math.min(Math.max(0.5, prev + delta), 4);
      });
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [selectedImage]);

  // ── Compute origin-point offset for the scale animation ──
  const getOriginOffset = useCallback(() => {
    const rect = thumbnailRectRef.current;
    if (!rect || typeof window === "undefined") return { x: 0, y: 0 };
    return {
      x: (rect.left + rect.width / 2) - window.innerWidth / 2,
      y: (rect.top + rect.height / 2) - window.innerHeight / 2,
    };
  }, []);

  return (
    <>
      {/* ── Thumbnails (controlled by parent) ── */}
      {renderThumbnails(images, openImage)}

      {/* ── Fullscreen Lightbox (portaled to body) ── */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {selectedImage && (() => {
            const origin = getOriginOffset();
            return (
              <motion.div
                key="docs-lightbox-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 dark:bg-black/95 backdrop-blur-sm cursor-zoom-out"
                onClick={closeImage}
              >
                {/* ── Close button ── */}
                <button
                  className="absolute top-4 right-4 z-[10000] p-2.5 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black/60 dark:text-white/60 transition-all cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); closeImage(); }}
                  aria-label="Close viewer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* ── Image ── */}
                <div
                  className="w-full h-full flex items-center justify-center p-6 sm:p-12"
                  onClick={(e) => { e.stopPropagation(); closeImage(); }}
                >
                  <motion.img
                    key={selectedImage.id}
                    src={selectedImage.src}
                    alt={selectedImage.alt}
                    className="block max-w-full max-h-full w-auto object-contain rounded-lg shadow-2xl cursor-zoom-in"
                    style={{ touchAction: "pinch-zoom", transform: `scale(${zoom})`, transition: "transform 0.15s ease-out" }}
                    initial={{
                      opacity: 0,
                      scale: 0.12,
                      x: origin.x,
                      y: origin.y,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: 0,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.12,
                      x: origin.x,
                      y: origin.y,
                    }}
                    transition={{
                      duration: 0.28,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* ── Hint ── */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10000] text-black/25 dark:text-white/25 text-[10px] tracking-wide select-none pointer-events-none">
                  Click or press Esc to close
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
