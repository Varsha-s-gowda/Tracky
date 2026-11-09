import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { notificationService } from '../services/notificationService';

const POLL_INTERVAL = 60 * 1000;
const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const seenRef = useRef(new Set());
  const baselineRef = useRef(false);
  const browserEnabled =
    Boolean(user) &&
    settings?.notifications?.browserNotifications === true &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    window.Notification.permission === 'granted';

  const showBrowserNotification = useCallback((notification) => {
    if (!browserEnabled || !notification) return;
    try {
      const native = new window.Notification(notification.title, {
        body: notification.body || '',
        tag: notification._id,
      });
      native.onclick = () => {
        window.focus();
        if (notification.link) window.location.assign(notification.link);
      };
    } catch {
      // Browsers can reject notifications at any time; the in-app centre stays authoritative.
    }
  }, [browserEnabled]);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!user) return null;
      if (!silent) setLoading(true);
      setError('');
      try {
        const result = await notificationService.list({ limit: 50 });
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
        setTotal(result.total);

        if (!baselineRef.current) {
          result.notifications.forEach((item) => seenRef.current.add(item._id));
          baselineRef.current = true;
        } else {
          const unseen = result.notifications.filter(
            (item) => !item.readAt && !seenRef.current.has(item._id)
          );
          if (unseen.length) {
            showBrowserNotification(unseen[0]);
          }
          result.notifications.forEach((item) => seenRef.current.add(item._id));
        }

        return result;
      } catch (requestError) {
        if (!silent) {
          setError(requestError?.response?.data?.message || 'Notifications could not be loaded.');
        }
        return null;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [user, showBrowserNotification]
  );

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
      setError('');
      seenRef.current = new Set();
      baselineRef.current = false;
      return undefined;
    }

    let active = true;
    setLoading(true);
    notificationService
      .list({ limit: 50 })
      .then((result) => {
        if (!active) return;
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
        setTotal(result.total);
        result.notifications.forEach((item) => seenRef.current.add(item._id));
        baselineRef.current = true;
      })
      .catch(() => {
        if (active) setError('Notifications could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load({ silent: true });
    }, POLL_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, load]);

  const markRead = useCallback(async (id) => {
    const target = notifications.find((item) => item._id === id);
    const updated = await notificationService.markRead(id);
    setNotifications((current) =>
      current.map((item) => (item._id === id ? { ...item, readAt: updated.readAt } : item))
    );
    if (target && !target.readAt) {
      setUnreadCount((current) => Math.max(0, current - 1));
    }
    return updated;
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
    const now = new Date().toISOString();
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || now })));
    setUnreadCount(0);
  }, []);

  const remove = useCallback(async (id) => {
    const target = notifications.find((item) => item._id === id);
    await notificationService.remove(id);
    setNotifications((current) => current.filter((item) => item._id !== id));
    if (target && !target.readAt) {
      setUnreadCount((current) => Math.max(0, current - 1));
    }
    setTotal((current) => Math.max(0, current - 1));
  }, [notifications]);

  const clearAll = useCallback(async () => {
    await notificationService.clearAll();
    setNotifications([]);
    setUnreadCount(0);
    setTotal(0);
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { supported: false, permission: 'unsupported' };
    }
    if (window.Notification.permission === 'granted') {
      return { supported: true, permission: 'granted' };
    }
    if (window.Notification.permission === 'denied') {
      return { supported: true, permission: 'denied' };
    }
    const permission = await window.Notification.requestPermission();
    return { supported: true, permission };
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      total,
      loading,
      error,
      refresh: load,
      markRead,
      markAllRead,
      remove,
      clearAll,
      requestBrowserPermission,
      browserEnabled,
    }),
    [
      notifications,
      unreadCount,
      total,
      loading,
      error,
      load,
      markRead,
      markAllRead,
      remove,
      clearAll,
      requestBrowserPermission,
      browserEnabled,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used inside a NotificationProvider.');
  }
  return context;
}
