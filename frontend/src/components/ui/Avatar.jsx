import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { getInitials } from '../../utils/date';

const SIZES = {
  sm: 'h-8 w-8 text-[0.68rem]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

export default function Avatar({ name, src, size = 'md', className, ring = false }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white',
        SIZES[size] || SIZES.md,
        ring && 'ring-2 ring-white shadow-sm dark:ring-surface-darkCard',
        className
      )}
      aria-hidden={!name}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name ? `${name}'s avatar` : 'User avatar'}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
