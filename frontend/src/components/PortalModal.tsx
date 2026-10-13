import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

export const PortalModal: React.FC<PortalModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
  className = '',
  closeOnBackdrop = true,
  closeOnEscape = true,
}) => {
  const modalCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Prevent body background scroll while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto select-none animate-fadeIn"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalCardRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} bg-[#0b1222] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100 flex flex-col my-auto max-h-[90vh] ${className}`}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

