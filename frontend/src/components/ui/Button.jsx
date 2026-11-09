import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-[0_10px_22px_-12px_rgba(103,70,223,0.9)] hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-600',
  secondary:
    'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100',
  inverse:
    'bg-white text-brand-700 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.55)] hover:bg-brand-50 active:bg-brand-100',
  outline:
    'border border-ink-200 bg-white text-ink-800 hover:border-ink-300 hover:bg-ink-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-100 dark:hover:border-white/20 dark:hover:bg-white/[0.06]',
  ghost:
    'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/[0.07] dark:hover:text-white',
  subtle:
    'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-400/10 dark:text-brand-300 dark:hover:bg-brand-400/15',
  danger:
    'bg-danger-600 text-white shadow-[0_10px_22px_-12px_rgba(220,38,38,0.85)] hover:bg-danger-700 active:bg-danger-700',
  'danger-ghost':
    'text-danger-600 hover:bg-danger-50 dark:text-danger-500 dark:hover:bg-danger-500/10',
};

const SIZES = {
  xs: 'h-8 gap-1.5 rounded-lg px-2.5 text-xs',
  sm: 'h-9 gap-1.5 rounded-xl px-3 text-[0.8125rem]',
  md: 'h-11 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-[0.9375rem]',
  icon: 'h-10 w-10 rounded-xl',
};

export function buttonClasses({ variant = 'primary', size = 'md', className } = {}) {
  return cn(
    'focus-ring inline-flex select-none items-center justify-center font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className
  );
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  as: Component = 'button',
  type = 'button',
  ...props
}) {
  const isNativeButton = Component === 'button' || Component === undefined;
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : leftIcon}
      {children}
      {!loading ? rightIcon : null}
    </>
  );

  return (
    <Component
      className={buttonClasses({ variant, size, className })}
      {...(isNativeButton ? { type, disabled: disabled || loading } : {})}
      {...(!isNativeButton && (disabled || loading) ? { 'aria-disabled': true } : {})}
      {...props}
    >
      {content}
    </Component>
  );
}
