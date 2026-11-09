import { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bot,
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Repeat2,
  Settings,
  Trophy,
  X,
} from 'lucide-react';
import Logo from '../ui/Logo';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/tasks', label: 'My Tasks', icon: ListTodo },
      { to: '/habits', label: 'My Habits', icon: Repeat2 },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Growth',
    items: [
      { to: '/analytics', label: 'Analytics', icon: BarChart3, soon: true },
      { to: '/coach', label: 'AI Coach', icon: Bot, soon: true },
      { to: '/achievements', label: 'Achievements', icon: Trophy, soon: true },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    onClose(false);
    // Close the mobile drawer whenever the route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => onClose(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col border-r border-ink-200/70 bg-white transition-transform duration-300 ease-out dark:border-white/[0.06] dark:bg-[#0e0f15] lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-[74px] shrink-0 items-center justify-between px-5">
          <Logo />
          <button
            type="button"
            onClick={() => onClose(false)}
            className="focus-ring rounded-lg p-2 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/[0.06] lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="mb-2 px-3 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink-400 dark:text-ink-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/dashboard'}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.84rem] font-medium transition-all duration-150',
                          isActive
                            ? 'bg-brand-50 text-brand-700 shadow-[inset_0_0_0_1px_rgba(103,70,223,0.08)] dark:bg-brand-400/[0.09] dark:text-brand-300 dark:shadow-[inset_0_0_0_1px_rgba(150,136,244,0.09)]'
                            : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/[0.04] dark:hover:text-white'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'h-[18px] w-[18px] shrink-0 transition-colors',
                              isActive
                                ? 'text-brand-600 dark:text-brand-400'
                                : 'text-ink-400 group-hover:text-ink-600 dark:text-ink-500 dark:group-hover:text-ink-300'
                            )}
                            strokeWidth={isActive ? 2.2 : 1.9}
                          />
                          <span className="flex-1">{item.label}</span>
                          {item.soon ? (
                            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.08em] text-ink-400 dark:bg-white/[0.06] dark:text-ink-500">
                              Soon
                            </span>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-ink-100 p-3 dark:border-white/[0.06]">
          <NavLink
            to="/profile"
            className="focus-ring mb-2 flex items-center gap-3 rounded-xl p-2 transition hover:bg-ink-50 dark:hover:bg-white/[0.04]"
          >
            <Avatar name={user?.name} src={user?.profileImage} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.82rem] font-semibold text-ink-800 dark:text-ink-100">
                {user?.name || 'Your account'}
              </span>
              <span className="block truncate text-[0.7rem] text-ink-400 dark:text-ink-500">
                {user?.email}
              </span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.82rem] font-medium text-ink-500 transition hover:bg-danger-50 hover:text-danger-600 dark:text-ink-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-500"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
