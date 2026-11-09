import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  hideHeader = false,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.requestAnimationFrame(() => {
      panelRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null
      );

      if (!focusable.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink-950/45 backdrop-blur-[3px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hideHeader ? undefined : titleId}
        aria-describedby={hideHeader ? undefined : description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-ink-200/80 bg-white shadow-[0_28px_90px_-24px_rgba(16,24,40,0.4)] animate-scale-in dark:border-white/10 dark:bg-[#15171f] sm:max-h-[88vh] sm:rounded-3xl',
          SIZES[size] || SIZES.md,
          className
        )}
      >
        {!hideHeader ? (
          <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-5 dark:border-white/[0.07] sm:px-6">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="font-display text-lg font-bold tracking-[-0.02em] text-ink-900 dark:text-white"
              >
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm leading-5 text-ink-500 dark:text-ink-400">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="focus-ring -mr-1 -mt-1 shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/[0.07] dark:hover:text-white"
              aria-label="Close dialog"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-ink-100 bg-ink-50/50 px-5 py-4 dark:border-white/[0.07] dark:bg-white/[0.02] sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
