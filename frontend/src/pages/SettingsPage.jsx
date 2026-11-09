import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  Check,
  CheckCircle2,
  Clock3,
  Flame,
  Globe2,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { Input, Select } from '../components/ui/Input';
import Toggle from '../components/ui/Toggle';
import FormAlert from '../components/auth/FormAlert';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
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

const WEIGHTS = [
  { label: 'Task completion', weight: 40, tone: 'bg-brand-500' },
  { label: 'High-priority tasks', weight: 20, tone: 'bg-warning-500' },
  { label: 'Habit completion', weight: 30, tone: 'bg-success-500' },
  { label: '7-day consistency', weight: 10, tone: 'bg-ink-400' },
];

function CardHeading({ icon: Icon, title, description }) {
  return (
    <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-500" />
        <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">{description}</p>
      ) : null}
    </div>
  );
}

export default function SettingsPage() {
  usePageTitle('Settings');
  const { user, updateProfile, logout } = useAuth();
  const { settings, loading: settingsLoading, update } = useSettings();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [timezoneSaving, setTimezoneSaving] = useState(false);
  const [timezoneError, setTimezoneError] = useState('');

  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    setTimezone(user?.timezone || 'UTC');
  }, [user?.timezone]);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const timezoneOptions = useMemo(() => getTimezoneOptions(timezone), [timezone]);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateGoal = (field, value) => {
    setDraft((current) => ({
      ...current,
      weeklyGoals: { ...current.weeklyGoals, [field]: value },
    }));
  };

  const updateNotification = (field, value) => {
    setDraft((current) => ({
      ...current,
      notifications: { ...current.notifications, [field]: value },
    }));
  };

  const handleTimezoneSave = async (event) => {
    event.preventDefault();
    setTimezoneError('');
    setTimezoneSaving(true);
    try {
      await updateProfile({ timezone });
      toast.success('Timezone updated.');
    } catch (requestError) {
      setTimezoneError(getErrorMessage(requestError, 'We could not update your timezone.'));
    } finally {
      setTimezoneSaving(false);
    }
  };

  const handleSettingsSave = async (event) => {
    event.preventDefault();
    setSettingsError('');
    setSaving(true);
    try {
      await update({
        dailyCompletionTarget: Number(draft.dailyCompletionTarget),
        weeklyGoals: {
          tasks: Number(draft.weeklyGoals.tasks),
          habits: Number(draft.weeklyGoals.habits),
          productivityScore: Number(draft.weeklyGoals.productivityScore),
        },
        notifications: {
          xpAlerts: draft.notifications.xpAlerts,
          achievementAlerts: draft.notifications.achievementAlerts,
          weeklySummary: draft.notifications.weeklySummary,
          dailyReminder: draft.notifications.dailyReminder,
          reminderTime: draft.notifications.reminderTime || '09:00',
        },
      });
      toast.success('Preferences saved.', {
        description: 'Your targets and notification choices are now active.',
      });
    } catch (requestError) {
      setSettingsError(getErrorMessage(requestError, 'We could not save your preferences.'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const target = Number(draft.dailyCompletionTarget) || 60;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Make it yours"
        title="Settings"
        description="Align Tracky with your goals: set your daily target, weekly ambitions, and how much encouragement you want to see."
      />

      <form onSubmit={handleSettingsSave}>
        <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)]">
          <div className="space-y-5">
            <Card>
              <CardHeading
                icon={Target}
                title="Daily target & consistency"
                description="A day counts toward your overall streak when its productivity score reaches this target."
              />
              <div className="space-y-5 px-5 py-5 sm:px-6">
                {settingsError ? <FormAlert>{settingsError}</FormAlert> : null}
                <div>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                        Daily completion target
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                        {target >= 85
                          ? 'Ambitious — only exceptional days count.'
                          : target >= 60
                            ? 'Balanced — a productive, sustainable day.'
                            : 'Gentle — a lighter day still counts.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={target}
                        onChange={(event) => updateDraft('dailyCompletionTarget', Number(event.target.value))}
                        className="h-1.5 w-36 cursor-pointer appearance-none rounded-full bg-ink-200 accent-brand-600 dark:bg-white/10"
                        aria-label="Daily completion target slider"
                      />
                      <div className="w-20">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={draft.dailyCompletionTarget}
                          onChange={(event) => updateDraft('dailyCompletionTarget', event.target.value)}
                          className="[&_input]:h-9 [&_input]:text-center"
                          aria-label="Daily completion target"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/[0.07]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-[width] duration-300"
                      style={{ width: `${target}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[0.65rem] text-ink-400 dark:text-ink-500">
                    Default is 60. Days with no scheduled tasks or habits are rest days and never break
                    your streak.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {WEIGHTS.map((item) => (
                    <div key={item.label} className="rounded-xl bg-ink-50/80 px-3 py-2.5 dark:bg-white/[0.03]">
                      <div className={cn('h-1.5 w-8 rounded-full', item.tone)} />
                      <p className="mt-2 text-sm font-bold text-ink-900 dark:text-white">
                        {item.weight}%
                      </p>
                      <p className="text-[0.57rem] font-semibold uppercase leading-3 tracking-[0.06em] text-ink-400">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[0.65rem] leading-4 text-ink-400 dark:text-ink-500">
                  Scores are calculated on the backend. If a category has no scheduled items, its
                  weight is removed and the remaining weights renormalize — so creating easy tasks
                  alone does not inflate your score.
                </p>
              </div>
            </Card>

            <Card>
              <CardHeading
                icon={Sparkles}
                title="Weekly goals"
                description="Optional targets to keep the week moving in the right direction."
              />
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:px-6">
                <Input
                  label="Tasks per week"
                  type="number"
                  min="0"
                  max="1000"
                  value={draft.weeklyGoals.tasks}
                  onChange={(event) => updateGoal('tasks', event.target.value)}
                  hint="Completed tasks"
                />
                <Input
                  label="Habits per week"
                  type="number"
                  min="0"
                  max="1000"
                  value={draft.weeklyGoals.habits}
                  onChange={(event) => updateGoal('habits', event.target.value)}
                  hint="Habit check-ins"
                />
                <Input
                  label="Average score"
                  type="number"
                  min="1"
                  max="100"
                  value={draft.weeklyGoals.productivityScore}
                  onChange={(event) => updateGoal('productivityScore', event.target.value)}
                  hint="Out of 100"
                />
              </div>
            </Card>

            <Card>
              <CardHeading
                icon={BellRing}
                title="Notifications & rewards"
                description="Choose which in-app moments you want Tracky to celebrate or remind you about."
              />
              <div className="divide-y divide-ink-100 dark:divide-white/[0.05]">
                <div className="px-5 py-4 sm:px-6">
                  <Toggle
                    id="xp-alerts"
                    checked={draft.notifications.xpAlerts}
                    onChange={(value) => updateNotification('xpAlerts', value)}
                    label="XP reward alerts"
                    description="Show a toast when tasks, habits, or bonuses earn XP."
                  />
                </div>
                <div className="px-5 py-4 sm:px-6">
                  <Toggle
                    id="achievement-alerts"
                    checked={draft.notifications.achievementAlerts}
                    onChange={(value) => updateNotification('achievementAlerts', value)}
                    label="Achievement unlock alerts"
                    description="Celebrate newly unlocked badges as they happen."
                  />
                </div>
                <div className="px-5 py-4 sm:px-6">
                  <Toggle
                    id="weekly-summary"
                    checked={draft.notifications.weeklySummary}
                    onChange={(value) => updateNotification('weeklySummary', value)}
                    label="Weekly summary"
                    description="Keep a weekly recap preference on file for your account."
                  />
                </div>
                <div className="px-5 py-4 sm:px-6">
                  <Toggle
                    id="daily-reminder"
                    checked={draft.notifications.dailyReminder}
                    onChange={(value) => updateNotification('dailyReminder', value)}
                    label="Daily reminder"
                    description="Save a preferred time for a gentle daily nudge."
                  />
                  {draft.notifications.dailyReminder ? (
                    <div className="mt-3 max-w-[180px]">
                      <Input
                        label="Reminder time"
                        type="time"
                        value={draft.notifications.reminderTime || '09:00'}
                        onChange={(event) => updateNotification('reminderTime', event.target.value)}
                        leftIcon={<Clock3 className="h-4 w-4" />}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-[0.65rem] text-ink-400 dark:text-ink-500">
                  {settingsLoading ? 'Loading saved preferences…' : 'Saved automatically to your account.'}
                </p>
                <Button
                  type="submit"
                  loading={saving}
                  leftIcon={<Check className="h-4 w-4" />}
                >
                  Save preferences
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeading
                icon={Palette}
                title="Appearance"
                description="Your choice is saved on this device and applied immediately."
              />
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
              <CardHeading
                icon={Globe2}
                title="Timezone"
                description="Tracky uses this to decide when “today” begins for your dashboard, streaks, and habits."
              />
              <div className="space-y-4 px-5 py-5 sm:px-6">
                {timezoneError ? <FormAlert>{timezoneError}</FormAlert> : null}
                <Select
                  label="Your timezone"
                  value={timezone}
                  onChange={(event) => {
                    setTimezone(event.target.value);
                    if (timezoneError) setTimezoneError('');
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
                  type="button"
                  onClick={handleTimezoneSave}
                  loading={timezoneSaving}
                  disabled={timezone === user?.timezone}
                  leftIcon={<Check className="h-4 w-4" />}
                >
                  Save timezone
                </Button>
              </div>
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
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-ink-100 pt-4 dark:border-white/[0.06]">
                <Button
                  as={Link}
                  to="/profile"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  leftIcon={<UserRound className="h-3.5 w-3.5" />}
                >
                  Edit profile
                </Button>
                <Button
                  as={Link}
                  to="/achievements"
                  variant="subtle"
                  size="sm"
                  className="w-full"
                  leftIcon={<Trophy className="h-3.5 w-3.5" />}
                >
                  Achievements
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500">
                  <Flame className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
                    Your current target
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
                    A score of {target}/100 counts as a successful day. Your overall consistency
                    streak ignores rest days and only breaks when a tracked day falls short.
                  </p>
                  <Link
                    to="/streaks"
                    className="focus-ring mt-2 inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    View streak calendar <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
                  <Repeat2 className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
                    How XP is earned
                  </h3>
                  <ul className="mt-1.5 space-y-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-success-500" /> Task completion: 10 XP
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-success-500" /> Habit completion: 15 XP
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-warning-500" /> All daily tasks: +20 XP
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Flame className="h-3 w-3 text-warning-500" /> 7 / 30-day habit streaks: +50 / +200 XP
                    </li>
                  </ul>
                </div>
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
                    hashes. XP and achievements are calculated on the server.
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
              Tracky AI · Part 2 streaks &amp; insights · v2.0
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
