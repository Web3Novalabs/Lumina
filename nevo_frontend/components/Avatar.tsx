import React, { FC } from 'react';
import Image from 'next/image';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const cssSizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

const avatarDimensions = { sm: 32, md: 40, lg: 56 };

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar: FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  className = '',
}) => {
  const dim = avatarDimensions[size];
  const base = `inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${cssSizes[size]} ${className}`;

  if (src) {
    return (
      <span className={base}>
        <Image
          src={src}
          alt={name ?? 'User avatar'}
          width={dim}
          height={dim}
          className="h-full w-full object-cover"
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={`${base} bg-blue-600 text-white font-medium select-none`}
      role="img"
      aria-label={name ? `Avatar for ${name}` : 'User avatar'}
    >
      {getInitials(name)}
    </span>
  );
};
