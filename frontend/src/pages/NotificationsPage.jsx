import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  BellRing,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  FileText,
  Flame,
  ListTodo,
  RefreshCw,
  Repeat2,
  Settings,
  Target,
  Trash2,
  Trophy,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Loaders';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { getErrorMessage } from '../utils/errors';
import { cn } from '../utils/cn';

const TYPE_CONFIG = {
  task_reminder: { icon: ListTodo, accent: 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300' },
  pending_priority: { icon: AlertTriangle, accent: 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500' },
  habit_reminder: { icon: Repeat2, accent: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500' },
  streak_milestone: { icon: Flame, accent: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500' },
  achievement: { icon: Trophy, accent: 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300' },
  daily_goal: { icon: Target, accent: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500' },
  daily_report: { icon: FileText, accent: 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300' },
  weekly_report: { icon: CalendarDays, accent: 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300' },
  system: { icon: Bell, accent: 'bg-ink-100 text-ink-600 dark:bg-white/[0.06] dark:text-ink-300' },
};

function relativeTime(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const FILTERS = [
  { value: 'all', label: 'All', icon: Bell },
  { value: 'unread', label: 'Unread', icon: BellRing },
];

export default function NotificationsPage() {
  usePageTitle('Notifications');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, update } = useSettings();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
    remove,
    clearAll,
    requestBrowserPermission,
    browserEnabled,
  } = useNotifications();

  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [actionError, setActionError] = useState('');
  const [enabling, setEnabling] = useState(false);

  // Refresh when the centre is opened so newly earned reminders and reports
  // appear immediately instead of waiting for the next background poll.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(
    () => (filter === 'unread' ? notifications.filter((item) => !item.readAt) : notifications),
    [filter, notifications]
  );

  const handleOpen = async (notification) => {
    setActionError('');
    try {
      if (!notification.readAt) {
        setBusyId(notification._id);
        await markRead(notification._id);
      }
      if (notification.link) navigate(notification.link);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, 'This notification could not be opened.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkRead = async (notification) => {
    if (notification.readAt) return;
    setBusyId(notification._id);
    setActionError('');
    try {
      await markRead(notification._id);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, 'This notification could not be updated.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (notification) => {
    setBusyId(notification._id);
    setActionError('');
    try {
      await remove(notification._id);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, 'This notification could not be removed.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAll = async () => {
    setActionError('');
    try {
      await markAllRead();
      toast.success('All notifications marked as read.');
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, 'Notifications could not be updated.'));
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    setActionError('');
    try {
      await clearAll();
      setConfirmClear(false);
      toast.success('Notification centre cleared.');
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, 'Notifications could not be cleared.'));
    } finally {
      setClearing(false);
    }
  };

  const handleEnableBrowser = async () => {
    setEnabling(true);
    setActionError('');
    try {
      const result = await requestBrowserPermission();
      if (!result.supported) {
        toast.error('This browser does not support notifications.');
        return;
      }
      if (result.permission !== 'granted') {
        toast.error('Browser notifications were not allowed. You can enable them in your browser settings.');
        return;
      }
      await update({ notifications: { browserNotifications: true } });
      toast.success('Browser notifications enabled.');
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, 'Browser notifications could not be enabled.'));
    } finally {
      setEnabling(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Stay in the loop"
        title="Notifications"
        description="Reminders, streak milestones, reports, and achievements generated from your own activity."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
              leftIcon={<CheckCheck className="h-3.5 w-3.5" />}
            >
              Mark all read
            </Button>
            <Button
              variant="danger-ghost"
              size="sm"
              onClick={() => setConfirmClear(true)}
              disabled={!notifications.length}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Clear all
            </Button>
          </div>
        }
      />

      {!browserEnabled ? (
        <Card className="mt-5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
                <BellRing className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink-900 dark:text-white">
                  Get gentle reminders in your browser
                </h2>
                <p className="mt-0.5 text-xs leading-5 text-ink-500 dark:text-ink-400">
                  Tracky only asks once. You can turn this off any time in Settings.
                </p>
              </div>
            </div>
            <Button size="sm" variant="subtle" onClick={handleEnableBrowser} loading={enabling} className="shrink-0">
              Enable browser notifications
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={FILTERS} value={filter} onChange={setFilter} ariaLabel="Notification filters" />
        <div className="flex items-center gap-3">
          <Badge variant={unreadCount ? 'brand' : 'neutral'} dot>
            {unreadCount} unread
          </Badge>
          <Link
            to="/settings"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            <Settings className="h-3.5 w-3.5" /> Preferences
          </Link>
        </div>
      </div>

      {actionError ? (
        <div className="mt-4 rounded-xl border border-danger-200/70 bg-danger-50/70 px-4 py-3 text-xs text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/[0.07] dark:text-danger-500">
          {actionError}
        </div>
      ) : null}

      <Card className="mt-5 overflow-hidden">
        {loading && !notifications.length ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-5">
            <ErrorState title="Notifications unavailable" message={error} onRetry={() => refresh()} />
          </div>
        ) : !filtered.length ? (
          <EmptyState
            icon={filter === 'unread' ? CheckCircle2 : Bell}
            title={filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}
            description={
              filter === 'unread'
                ? 'Every notification has been read.'
                : 'Tracky will create reminders as your tasks, habits, streaks, and reports progress.'
            }
          />
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-white/[0.06]">
            {filtered.map((notification) => {
              const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
              const Icon = config.icon;
              const unread = !notification.readAt;
              return (
                <div
                  key={notification._id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3.5 transition sm:px-5',
                    unread ? 'bg-brand-50/30 dark:bg-brand-400/[0.035]' : ''
                  )}
                >
                  <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', config.accent)}>
                    <Icon className="h-4 w-4" />
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpen(notification)}
                    className="focus-ring min-w-0 flex-1 rounded-lg text-left"
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn('text-sm', unread ? 'font-semibold text-ink-900 dark:text-white' : 'font-medium text-ink-700 dark:text-ink-200')}>
                        {notification.title}
                      </span>
                      {unread ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" /> : null}
                    </span>
                    {notification.body ? (
                      <span className="mt-0.5 block text-xs leading-5 text-ink-500 dark:text-ink-400">
                        {notification.body}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-[0.6rem] text-ink-400 dark:text-ink-500">
                      {relativeTime(notification.createdAt)}
                      {notification.link ? ' · Open' : ''}
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center gap-0.5">
                    {unread ? (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(notification)}
                        disabled={busyId === notification._id}
                        className="focus-ring rounded-lg p-2 text-ink-400 transition hover:bg-success-50 hover:text-success-600 disabled:opacity-50 dark:hover:bg-success-500/10 dark:hover:text-success-500"
                        aria-label="Mark as read"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleRemove(notification)}
                      disabled={busyId === notification._id}
                      className="focus-ring rounded-lg p-2 text-ink-400 transition hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50 dark:hover:bg-danger-500/10 dark:hover:text-danger-500"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {notifications.length ? (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.62rem] text-ink-400 dark:text-ink-500">
          <RefreshCw className="h-3 w-3" /> Notifications refresh automatically every minute.
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearAll}
        loading={clearing}
        title="Clear all notifications?"
        description="All notifications will be permanently removed from your account. Your tasks, habits, and reports are not affected."
        confirmLabel="Clear all"
      />
    </div>
  );
}
