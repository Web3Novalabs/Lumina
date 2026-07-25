'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export interface BackToTopButtonProps {
  /** Scroll distance (px) after which the button becomes visible. Defaults to 400. */
  threshold?: number;
  className?: string;
}

export function BackToTopButton({
  threshold = 400,
  className = '',
}: BackToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const checkThreshold = () => {
      setVisible(window.scrollY > threshold);
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(checkThreshold);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-40 flex size-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] shadow-lg transition-all duration-300 hover:text-brand-600 hover:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0'
      } ${className}`}
    >
      <ArrowUp className="size-5" strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}

export default BackToTopButton;
