import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Globe2,
  LogOut,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { Select } from '../components/ui/Input';
import FormAlert from '../components/auth/FormAlert';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { getTimezoneOptions, timezoneLabel } from '../utils/date';
import { getErrorMessage } from '../utils/errors';
import { cn } from '../utils/cn';

const THEMES = [
  {
    value: 'light',
    label: 'Light',
    description: 'Bright and airy',
    icon: Sun,
    preview: 'bg-white',
    line: 'bg-ink-200',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes',
    icon: Moon,
    preview: 'bg-[#12141b]',
    line: 'bg-white/15',
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follow your device',
    icon: Monitor,
    preview: 'bg-gradient-to-br from-white to-[#12141b]',
    line: 'bg-ink-300',
  },
];

export default function SettingsPage() {
  usePageTitle('Settings');
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTimezone(user?.timezone || 'UTC');
  }, [user?.timezone]);

  const timezoneOptions = useMemo(() => getTimezoneOptions(timezone), [timezone]);

  const handleTimezoneSave = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateProfile({ timezone });
      toast.success('Timezone updated.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not update your timezone.'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Make it yours"
        title="Settings"
        description="Choose how Tracky looks and make sure your daily rhythm is aligned with your timezone."
      />

      <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="space-y-5">
          <Card>
            <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-brand-500" />
                <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                  Appearance
                </h2>
              </div>
              <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                Your choice is saved on this device and applied immediately.
              </p>
            </div>

            <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
              {THEMES.map((option) => {
                const Icon = option.icon;
                const selected = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'focus-ring group rounded-2xl border p-3 text-left transition',
                      selected
                        ? 'border-brand-400 bg-brand-50/50 shadow-ring dark:border-brand-400/40 dark:bg-brand-400/[0.06]'
                        : 'border-ink-200 bg-white hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'
                    )}
                    aria-pressed={selected}
                  >
                    <div
                      className={cn(
                        'relative h-16 overflow-hidden rounded-xl border border-ink-200/60 p-2 dark:border-white/10',
                        option.preview
                      )}
                    >
                      <div className={cn('h-1.5 w-8 rounded-full', option.line)} />
                      <div className="mt-2 flex gap-1.5">
                        <div className={cn('h-7 w-7 rounded-md', option.line, 'opacity-60')} />
                        <div className="flex-1 space-y-1.5 py-0.5">
                          <div className={cn('h-1.5 w-3/4 rounded-full', option.line)} />
                          <div className={cn('h-1.5 w-1/2 rounded-full', option.line, 'opacity-60')} />
                        </div>
                      </div>
                      {selected ? (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-ink-400" />
                      <span className="text-xs font-semibold text-ink-800 dark:text-ink-100">
                        {option.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[0.66rem] text-ink-400 dark:text-ink-500">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-brand-500" />
                <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                  Timezone
                </h2>
              </div>
              <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                Tracky uses this to decide when “today” begins for your dashboard and habits.
              </p>
            </div>

            <form onSubmit={handleTimezoneSave}>
              <div className="space-y-4 px-5 py-5 sm:px-6">
                {error ? <FormAlert>{error}</FormAlert> : null}
                <Select
                  label="Your timezone"
                  value={timezone}
                  onChange={(event) => {
                    setTimezone(event.target.value);
                    if (error) setError('');
                  }}
                  hint={`Currently saved: ${timezoneLabel(user?.timezone || 'UTC')}`}
                >
                  {timezoneOptions.map((zone) => (
                    <option key={zone} value={zone}>
                      {timezoneLabel(zone)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex justify-end border-t border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
                <Button
                  type="submit"
                  loading={saving}
                  disabled={timezone === user?.timezone}
                  leftIcon={<Check className="h-4 w-4" />}
                >
                  Save timezone
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} src={user?.profileImage} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-ink-400 dark:text-ink-500">{user?.email}</p>
              </div>
            </div>
            <div className="mt-5 border-t border-ink-100 pt-4 dark:border-white/[0.06]">
              <Button
                as={Link}
                to="/profile"
                variant="outline"
                size="sm"
                className="w-full"
                leftIcon={<UserRound className="h-3.5 w-3.5" />}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Edit profile
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
                  Privacy by default
                </h3>
                <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
                  Your data is scoped to your account, and passwords are stored only as secure
                  hashes.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Session</h3>
            <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
              Sign out securely on this device. You can sign back in at any time.
            </p>
            <Button
              variant="danger-ghost"
              size="sm"
              className="mt-4 w-full justify-start"
              onClick={handleLogout}
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
            >
              Log out
            </Button>
          </Card>

          <div className="px-1 text-center text-[0.65rem] text-ink-400 dark:text-ink-600">
            Tracky AI · Part 1 foundation · v1.0
          </div>
        </div>
      </div>
    </div>
  );
}
