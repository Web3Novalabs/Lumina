'use client';

import React, { useEffect, useRef } from 'react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { CopyIcon, CheckIcon } from '@/components/icons';

export interface WalletAddressProps {
  /** The full Stellar wallet address to display */
  address: string;
  /** Whether to truncate the address on mobile. Defaults to true */
  truncate?: boolean;
  /** Number of leading chars to show when truncated. Defaults to 6 */
  leadChars?: number;
  /** Number of trailing chars to show when truncated. Defaults to 6 */
  trailChars?: number;
  /** Additional class names for the root element */
  className?: string;
}

function truncateAddress(address: string, lead: number, trail: number): string {
  if (address.length <= lead + trail + 3) return address;
  return `${address.slice(0, lead)}…${address.slice(-trail)}`;
}

export function WalletAddress({
  address,
  truncate = true,
  leadChars = 6,
  trailChars = 6,
  className = '',
}: WalletAddressProps) {
  const { copied, copy } = useCopyToClipboard();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    await copy(address);
  };

  const truncated = truncateAddress(address, leadChars, trailChars);

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="group"
      aria-label="Wallet address"
    >
      {truncate ? (
        <>
          {/* Full address — desktop */}
          <span
            className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 hidden md:inline"
            title={address}
            aria-label={`Full wallet address: ${address}`}
          >
            {address}
          </span>

          {/* Truncated address — mobile */}
          <span
            className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 md:hidden"
            title={address}
            aria-label={`Wallet address: ${truncated}`}
          >
            {truncated}
          </span>
        </>
      ) : (
        /* Full address always visible */
        <span
          className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 break-all"
          title={address}
          aria-label={`Full wallet address: ${address}`}
        >
          {address}
        </span>
      )}

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Address copied' : 'Copy wallet address'}
        aria-live="polite"
        className="flex-shrink-0 flex items-center justify-center min-h-11 min-w-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>

      {/* Toast notification */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[var(--color-text)] text-[var(--color-surface)] px-4 py-2 text-sm font-medium shadow-lg transition-all duration-300 ${copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        <CheckIcon className="size-4 text-success" />
        Address copied to clipboard
      </span>
    </div>
  );
}
