'use client';

import React, { FC } from 'react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { toast } from '@/components/Toast';
import { CopyIcon, CheckIcon } from '@/components/icons';

export interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  iconOnly?: boolean;
  'aria-label'?: string;
}

export const CopyButton: FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  copiedLabel = 'Copied!',
  className = '',
  iconOnly = false,
  'aria-label': ariaLabel,
}) => {
  const { copied, copy } = useCopyToClipboard();

  const handleCopy = async () => {
    await copy(text);
    if (copied) return;
    toast('Copied to clipboard');
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel ?? (copied ? 'Copied' : 'Copy to clipboard')}
      aria-live="polite"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
        iconOnly ? 'min-h-8 min-w-8 p-1.5' : 'px-2.5 py-1.5'
      } ${className}`}
    >
      {copied ? (
        <CheckIcon className="size-3.5 text-green-500" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
      {!iconOnly && <span>{copied ? copiedLabel : label}</span>}
    </button>
  );
};
