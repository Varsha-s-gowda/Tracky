import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import Logo from '../ui/Logo';
import Avatar from '../ui/Avatar';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatDate, todayKey } from '../../utils/date';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/tasks': 'My Tasks',
  '/habits': 'My Habits',
  '/calendar': 'Calendar',
  '/analytics': 'Analytics',
  '/coach': 'AI Coach',
  '/notifications': 'Notifications',
  '/achievements': 'Achievements',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const title = TITLES[location.pathname] || 'Tracky AI';

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-ink-200/70 bg-surface-light/85 px-4 backdrop-blur-xl dark:border-white/[0.06] dark:bg-surface-dark/85 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="focus-ring -ml-1 rounded-xl p-2 text-ink-500 hover:bg-white hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/[0.06] dark:hover:text-white lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="lg:hidden">
          <Logo to={null} showBadge={false} className="scale-95 origin-left" />
        </div>
        <div className="hidden min-w-0 lg:block">
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.15em] text-ink-400 dark:text-ink-500">
            Workspace
          </p>
          <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden text-xs font-medium text-ink-400 dark:text-ink-500 md:block">
          {formatDate(todayKey(user?.timezone), { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <span className="hidden h-5 w-px bg-ink-200 dark:bg-white/10 md:block" />
        <ThemeToggle />
        <Link
          to="/notifications"
          className="focus-ring relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-500 shadow-sm transition hover:border-ink-300 hover:text-ink-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-300 dark:hover:border-white/20 dark:hover:text-white"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
          title="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-500 px-1 text-[0.58rem] font-bold text-white ring-2 ring-white dark:ring-surface-dark">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Link>
        <Link
          to="/profile"
          className="focus-ring rounded-full transition hover:opacity-85"
          aria-label="Open profile"
        >
          <Avatar name={user?.name} src={user?.profileImage} size="md" />
        </Link>
      </div>
    </header>
  );
}
