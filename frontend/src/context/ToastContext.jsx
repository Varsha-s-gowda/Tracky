import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-success-600 dark:text-success-500',
    barClass: 'bg-success-500',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-danger-600 dark:text-danger-500',
    barClass: 'bg-danger-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-brand-600 dark:text-brand-400',
    barClass: 'bg-brand-500',
  },
};

let toastCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message, type = 'success', options = {}) => {
      const id = `toast-${Date.now()}-${(toastCounter += 1)}`;
      const toast = {
        id,
        message,
        description: options.description,
        type: TOAST_STYLES[type] ? type : 'info',
      };

      setToasts((current) => [...current.slice(-3), toast]);

      const timer = setTimeout(() => dismissToast(id), options.duration || 4200);
      timers.current.set(id, timer);
      return id;
    },
    [dismissToast]
  );

  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  const toast = useMemo(
    () => ({
      success: (message, options) => showToast(message, 'success', options),
      error: (message, options) => showToast(message, 'error', options),
      info: (message, options) => showToast(message, 'info', options),
    }),
    [showToast]
  );

  const value = useMemo(() => ({ toast, showToast, dismissToast }), [toast, showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:top-[84px] sm:bottom-auto"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((item) => {
          const style = TOAST_STYLES[item.type];
          const Icon = style.icon;
          return (
            <div
              key={item.id}
              role={item.type === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-ink-200/80 bg-white p-4 pl-5 shadow-card animate-slide-in-right dark:border-white/10 dark:bg-[#191b23] sm:w-96"
            >
              <span className={cn('absolute inset-y-0 left-0 w-1', style.barClass)} />
              <div className="flex items-start gap-3">
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.iconClass)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{item.message}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm leading-5 text-ink-500 dark:text-ink-400">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(item.id)}
                  className="focus-ring rounded-lg p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider.');
  }
  return context;
}
