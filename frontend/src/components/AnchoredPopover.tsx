import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface AnchoredPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  className?: string;
  placement?: 'bottom-start' | 'bottom-end' | 'bottom' | 'top-start' | 'top-end' | 'top';
  offset?: number;
  minWidth?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const AnchoredPopover: React.FC<AnchoredPopoverProps> = ({
  isOpen,
  onClose,
  triggerRef,
  children,
  className = '',
  placement = 'bottom-start',
  offset = 6,
  minWidth = 320,
  maxWidth = 480,
  maxHeight = 520,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; maxHeight: number } | null>(null);

  const updatePosition = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (!triggerRef.current) {
      const targetWidth = Math.min(maxWidth, viewportWidth - 24);
      setCoords({
        top: 54,
        left: Math.max(12, viewportWidth - targetWidth - 12),
        maxHeight: Math.min(maxHeight, viewportHeight - 70),
      });
      return;
    }
    const triggerRect = triggerRef.current.getBoundingClientRect();

    // Estimate or measure popover dimensions
    const popoverEl = popoverRef.current;
    const measuredWidth = popoverEl ? popoverEl.offsetWidth : minWidth;
    const targetWidth = Math.min(Math.max(measuredWidth, minWidth), maxWidth, viewportWidth - 24);

    // Calculate horizontal position
    let left: number;
    if (placement === 'bottom-end' || placement === 'top-end') {
      left = triggerRect.right - targetWidth;
    } else if (placement === 'bottom' || placement === 'top') {
      left = triggerRect.left + (triggerRect.width - targetWidth) / 2;
    } else {
      left = triggerRect.left;
    }

    // Clamp horizontally to stay within viewport
    const safeLeft = Math.max(12, Math.min(left, viewportWidth - targetWidth - 12));

    // Calculate vertical position and handle flipping
    const spaceBelow = viewportHeight - triggerRect.bottom - offset - 12;
    const spaceAbove = triggerRect.top - offset - 12;

    let top: number;
    let availableHeight: number;

    const wantsTop = placement.startsWith('top');

    if (wantsTop) {
      if (spaceAbove >= 200 || spaceAbove >= spaceBelow) {
        availableHeight = Math.min(spaceAbove, maxHeight);
        top = triggerRect.top - offset - availableHeight;
      } else {
        // Fallback to bottom
        availableHeight = Math.min(spaceBelow, maxHeight);
        top = triggerRect.bottom + offset;
      }
    } else {
      // Prefers bottom
      if (spaceBelow >= 220 || spaceBelow >= spaceAbove) {
        availableHeight = Math.min(spaceBelow, maxHeight);
        top = triggerRect.bottom + offset;
      } else {
        // Flip to top
        availableHeight = Math.min(spaceAbove, maxHeight);
        const popoverHeight = popoverEl ? Math.min(popoverEl.offsetHeight, availableHeight) : availableHeight;
        top = triggerRect.top - offset - popoverHeight;
      }
    }

    // Clamp top position
    top = Math.max(12, Math.min(top, viewportHeight - 100));

    setCoords({
      top: Math.round(top),
      left: Math.round(safeLeft),
      maxHeight: Math.max(160, Math.round(availableHeight)),
    });
  }, [triggerRef, placement, offset, minWidth, maxWidth, maxHeight]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  // Window resize & scroll listeners to maintain sticky anchoring
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowChange = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isOpen, updatePosition]);

  // Keyboard navigation & outside click handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // If clicked inside popover or inside trigger button, ignore
      if (popoverRef.current && popoverRef.current.contains(target)) return;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const content = (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: coords ? `${coords.top}px` : '0px',
        left: coords ? `${coords.left}px` : '0px',
        maxHeight: coords ? `${coords.maxHeight}px` : `${maxHeight}px`,
        visibility: coords ? 'visible' : 'hidden',
        zIndex: 2100,
      }}
      className={`bg-[#080e1c]/92 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-2xl flex flex-col font-sans select-none text-slate-100 overflow-hidden animate-fadeIn ${className}`}
      role="dialog"
      aria-modal="false"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );

  return createPortal(content, document.body);
};
