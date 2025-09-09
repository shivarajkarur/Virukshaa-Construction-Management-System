import React from 'react';
import Image from 'next/image';
import { getInitials, getAvatarBackground } from '@/lib/avatarUtils';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, name = '', size = 40, className = '' }: AvatarProps) {
  const initials = getInitials(name);
  const backgroundColor = getAvatarBackground(name || 'default');

  if (src) {
    return (
      <div 
        className={`relative rounded-full overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={`${name}'s avatar`}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full text-white font-medium ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor,
        fontSize: `${Math.max(size * 0.4, 12)}px`,
      }}
    >
      {initials}
    </div>
  );
}