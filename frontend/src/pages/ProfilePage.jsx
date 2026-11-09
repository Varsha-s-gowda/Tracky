import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Globe2,
  KeyRound,
  Mail,
  Plus,
  Settings,
  ShieldCheck,
  Target,
  Trash2,
  UserRound,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Input, Select, Textarea } from '../components/ui/Input';
import PasswordInput from '../components/auth/PasswordInput';
import FormAlert from '../components/auth/FormAlert';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { accountService } from '../services/accountService';
import {
  formatDate,
  getTimezoneOptions,
  timezoneLabel,
} from '../utils/date';
import { getErrorMessage } from '../utils/errors';

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const EMPTY_GOAL = { title: '', description: '', targetDate: '' };

export default function ProfilePage() {
  usePageTitle('Profile');
  const { user, updateProfile, changePassword, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    profileImage: user?.profileImage || '',
    timezone: user?.timezone || 'UTC',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [goalDraft, setGoalDraft] = useState(EMPTY_GOAL);
  const [goalErrors, setGoalErrors] = useState({});
  const [goalError, setGoalError] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalBusyId, setGoalBusyId] = useState(null);
  const [goalDeleteTarget, setGoalDeleteTarget] = useState(null);

  const [hours, setHours] = useState({ start: '09:00', end: '17:00', daysOfWeek: [1, 2, 3, 4, 5] });
  const [hoursError, setHoursError] = useState('');
  const [savingHours, setSavingHours] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ password: '', confirm: '' });
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      profileImage: user.profileImage || '',
      timezone: user.timezone || 'UTC',
    });
  }, [user]);

  useEffect(() => {
    if (!user?.workingHours) return;
    setHours({
      start: user.workingHours.start || '09:00',
      end: user.workingHours.end || '17:00',
      daysOfWeek:
        Array.isArray(user.workingHours.daysOfWeek) && user.workingHours.daysOfWeek.length
          ? user.workingHours.daysOfWeek
          : [1, 2, 3, 4, 5],
    });
  }, [user?.workingHours]);

  const goals = user?.goals || [];

  const timezoneOptions = useMemo(
    () => getTimezoneOptions(form.timezone || user?.timezone),
    [form.timezone, user?.timezone]
  );

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError('');
    const errors = {};
    if (form.name.trim().length < 2) errors.name = 'Enter your full name.';
    if (!form.timezone) errors.timezone = 'Choose a timezone.';
    if (form.profileImage && !/^https?:\/\//i.test(form.profileImage.trim())) {
      errors.profileImage = 'Use a full image URL starting with http:// or https://.';
    }
    setProfileErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingProfile(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        profileImage: form.profileImage.trim(),
        timezone: form.timezone,
      });
      toast.success('Profile updated.');
    } catch (requestError) {
      setProfileError(getErrorMessage(requestError, 'We could not update your profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Enter your current password.';
    if (
      passwordForm.newPassword.length < 8 ||
      !/[A-Za-z]/.test(passwordForm.newPassword) ||
      !/\d/.test(passwordForm.newPassword)
    ) {
      errors.newPassword = 'Use at least 8 characters, with a letter and a number.';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingPassword(true);
    try {
      await changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully.');
    } catch (requestError) {
      setPasswordError(getErrorMessage(requestError, 'We could not update your password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAddGoal = async (event) => {
    event.preventDefault();
    setGoalError('');
    const errors = {};
    if (goalDraft.title.trim().length < 2) errors.title = 'Give your goal a short title.';
    setGoalErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingGoal(true);
    try {
      await accountService.addGoal({
        title: goalDraft.title.trim(),
        description: goalDraft.description.trim(),
        targetDate: goalDraft.targetDate || null,
      });
      await refreshUser();
      setGoalDraft(EMPTY_GOAL);
      toast.success('Goal added.');
    } catch (requestError) {
      setGoalError(getErrorMessage(requestError, 'This goal could not be added.'));
    } finally {
      setSavingGoal(false);
    }
  };

  const handleGoalStatus = async (goal) => {
    setGoalError('');
    setGoalBusyId(goal._id);
    try {
      await accountService.updateGoal(goal._id, {
        status: goal.status === 'completed' ? 'active' : 'completed',
      });
      await refreshUser();
      toast.success(goal.status === 'completed' ? 'Goal reopened.' : 'Goal marked complete.');
    } catch (requestError) {
      setGoalError(getErrorMessage(requestError, 'This goal could not be updated.'));
    } finally {
      setGoalBusyId(null);
    }
  };

  const handleGoalDelete = async () => {
    if (!goalDeleteTarget) return;
    setGoalError('');
    setGoalBusyId(goalDeleteTarget._id);
    try {
      await accountService.removeGoal(goalDeleteTarget._id);
      await refreshUser();
      setGoalDeleteTarget(null);
      toast.success('Goal removed.');
    } catch (requestError) {
      setGoalError(getErrorMessage(requestError, 'This goal could not be removed.'));
    } finally {
      setGoalBusyId(null);
    }
  };

  const toggleDay = (day) => {
    setHours((current) => {
      const has = current.daysOfWeek.includes(day);
      return {
        ...current,
        daysOfWeek: has
          ? current.daysOfWeek.filter((item) => item !== day)
          : [...current.daysOfWeek, day].sort((a, b) => a - b),
      };
    });
  };

  const handleHoursSave = async (event) => {
    event.preventDefault();
    setHoursError('');
    if (hours.start >= hours.end) {
      setHoursError('Working end time must be after the start time.');
      return;
    }
    if (!hours.daysOfWeek.length) {
      setHoursError('Select at least one working day.');
      return;
    }

    setSavingHours(true);
    try {
      await accountService.updateWorkingHours(hours);
      await refreshUser();
      toast.success('Working hours saved.');
    } catch (requestError) {
      setHoursError(getErrorMessage(requestError, 'Working hours could not be saved.'));
    } finally {
      setSavingHours(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await accountService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tracky-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Your data export has been downloaded.');
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Your data could not be exported.'));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    setDeleteError('');
    if (!deleteForm.password) {
      setDeleteError('Enter your password to continue.');
      return;
    }
    if (deleteForm.confirm !== 'DELETE') {
      setDeleteError('Type DELETE exactly to confirm.');
      return;
    }

    setDeletingAccount(true);
    try {
      await accountService.deleteAccount({
        password: deleteForm.password,
        confirm: deleteForm.confirm,
      });
      toast.success('Your account and data have been deleted.');
      logout();
      navigate('/login', { replace: true });
    } catch (requestError) {
      setDeleteError(getErrorMessage(requestError, 'Your account could not be deleted.'));
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Your account"
        title="Profile"
        description="Keep your details, goals, and working rhythm up to date so Tracky can meet you where you are."
        actions={
          <Button
            as={Link}
            to="/settings"
            variant="outline"
            leftIcon={<Settings className="h-4 w-4" />}
          >
            Settings
          </Button>
        }
      />

      <div className="mt-7 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit p-6 xl:sticky xl:top-[92px]">
          <div className="flex flex-col items-center text-center">
            <Avatar
              name={form.name || user?.name}
              src={form.profileImage}
              size="xl"
              className="ring-4 ring-white shadow-soft dark:ring-white/[0.06]"
            />
            <h2 className="mt-4 font-display text-lg font-bold tracking-[-0.025em] text-ink-900 dark:text-white">
              {user?.name}
            </h2>
            <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">{user?.email}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-[0.65rem] font-semibold text-success-700 ring-1 ring-inset ring-success-500/15 dark:bg-success-500/10 dark:text-success-500">
              <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
              Active account
            </span>
          </div>

          <div className="mt-6 space-y-3.5 border-t border-ink-100 pt-5 dark:border-white/[0.06]">
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <div className="min-w-0">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink-400">
                  Email
                </p>
                <p className="mt-0.5 break-all text-xs text-ink-700 dark:text-ink-200">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <div className="min-w-0">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink-400">
                  Timezone
                </p>
                <p className="mt-0.5 break-words text-xs text-ink-700 dark:text-ink-200">
                  {timezoneLabel(user?.timezone || 'UTC')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink-400">
                  Active goals
                </p>
                <p className="mt-0.5 text-xs text-ink-700 dark:text-ink-200">
                  {goals.filter((goal) => goal.status !== 'completed').length}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink-400">
                  Member since
                </p>
                <p className="mt-0.5 text-xs text-ink-700 dark:text-ink-200">
                  {formatDate(user?.createdAt, { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-brand-50/70 p-3.5 dark:bg-brand-400/[0.06]">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-300" />
              <p className="text-[0.68rem] leading-5 text-brand-800/75 dark:text-brand-200/65">
                Your tasks and habits are private to your account. Passwords are hashed and never
                returned by the API.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-brand-500" />
                <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                  Personal information
                </h2>
              </div>
              <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                Your name and timezone appear across your workspace.
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} noValidate>
              <div className="space-y-4 px-5 py-5 sm:px-6">
                {profileError ? <FormAlert>{profileError}</FormAlert> : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Full name"
                    value={form.name}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, name: event.target.value }));
                      setProfileErrors((current) => ({ ...current, name: '' }));
                    }}
                    error={profileErrors.name}
                    autoComplete="name"
                    required
                  />
                  <Input
                    label="Email address"
                    value={user?.email || ''}
                    disabled
                    hint="Email is used for sign-in and cannot be changed here."
                    leftIcon={<Mail className="h-4 w-4" />}
                  />
                </div>

                <Input
                  label="Profile image URL"
                  placeholder="https://example.com/avatar.jpg"
                  value={form.profileImage}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, profileImage: event.target.value }));
                    setProfileErrors((current) => ({ ...current, profileImage: '' }));
                  }}
                  error={profileErrors.profileImage}
                  hint="Optional. Leave empty to use your initials."
                />

                <Select
                  label="Timezone"
                  value={form.timezone}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, timezone: event.target.value }));
                    setProfileErrors((current) => ({ ...current, timezone: '' }));
                  }}
                  error={profileErrors.timezone}
                  hint="This controls when your day, tasks, and habit resets happen."
                  required
                >
                  {timezoneOptions.map((zone) => (
                    <option key={zone} value={zone}>
                      {timezoneLabel(zone)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex justify-end border-t border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
                <Button type="submit" loading={savingProfile}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-brand-500" />
                <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                  Personal goals
                </h2>
              </div>
              <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                Your coach uses these real goals when planning and recommending next steps.
              </p>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6">
              {goalError ? <FormAlert>{goalError}</FormAlert> : null}

              {goals.length ? (
                <div className="space-y-2.5">
                  {goals.map((goal) => {
                    const completed = goal.status === 'completed';
                    return (
                      <div
                        key={goal._id}
                        className="flex flex-col gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/[0.06] sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={`text-sm font-semibold ${
                                completed
                                  ? 'text-ink-400 line-through dark:text-ink-500'
                                  : 'text-ink-900 dark:text-white'
                              }`}
                            >
                              {goal.title}
                            </p>
                            <Badge variant={completed ? 'success' : 'neutral'}>
                              {completed ? 'Completed' : 'Active'}
                            </Badge>
                          </div>
                          {goal.description ? (
                            <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
                              {goal.description}
                            </p>
                          ) : null}
                          {goal.targetDate ? (
                            <p className="mt-1 text-[0.65rem] text-ink-400 dark:text-ink-500">
                              Target {formatDate(goal.targetDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleGoalStatus(goal)}
                            loading={goalBusyId === goal._id}
                            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          >
                            {completed ? 'Reopen' : 'Complete'}
                          </Button>
                          <Button
                            variant="danger-ghost"
                            size="xs"
                            onClick={() => setGoalDeleteTarget(goal)}
                            disabled={goalBusyId === goal._id}
                            aria-label={`Delete goal ${goal.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-ink-50/70 px-3.5 py-3 text-xs leading-5 text-ink-500 dark:bg-white/[0.03] dark:text-ink-400">
                  No goals yet. Add one below so your coach has a real destination to plan toward.
                </p>
              )}

              <form onSubmit={handleAddGoal} className="space-y-3 rounded-xl border border-dashed border-ink-200 p-4 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-400 dark:text-ink-500">
                  Add a goal
                </p>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                  <Input
                    label="Goal title"
                    value={goalDraft.title}
                    onChange={(event) => {
                      setGoalDraft((current) => ({ ...current, title: event.target.value }));
                      setGoalErrors((current) => ({ ...current, title: '' }));
                    }}
                    error={goalErrors.title}
                    placeholder="e.g. Ship my portfolio by December"
                    required
                  />
                  <Input
                    label="Target date"
                    type="date"
                    value={goalDraft.targetDate}
                    onChange={(event) =>
                      setGoalDraft((current) => ({ ...current, targetDate: event.target.value }))
                    }
                    hint="Optional"
                  />
                </div>
                <Textarea
                  label="Why it matters"
                  rows={2}
                  value={goalDraft.description}
                  onChange={(event) =>
                    setGoalDraft((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Optional context for your coach."
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    loading={savingGoal}
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                  >
                    Add goal
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          <Card>
            <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-brand-500" />
                <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                  Working hours
                </h2>
              </div>
              <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                Used by the AI planner to suggest realistic schedules inside the time you actually work.
              </p>
            </div>
            <form onSubmit={handleHoursSave}>
              <div className="space-y-4 px-5 py-5 sm:px-6">
                {hoursError ? <FormAlert>{hoursError}</FormAlert> : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Start time"
                    type="time"
                    value={hours.start}
                    onChange={(event) => setHours((current) => ({ ...current, start: event.target.value }))}
                    required
                  />
                  <Input
                    label="End time"
                    type="time"
                    value={hours.end}
                    onChange={(event) => setHours((current) => ({ ...current, end: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <p className="mb-2 text-[0.8125rem] font-semibold text-ink-700 dark:text-ink-200">
                    Working days
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => {
                      const selected = hours.daysOfWeek.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          aria-pressed={selected}
                          className={`focus-ring h-9 w-12 rounded-xl border text-xs font-semibold transition ${
                            selected
                              ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-400/40 dark:bg-brand-400/10 dark:text-brand-300'
                              : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-400'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-end border-t border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
                <Button type="submit" variant="outline" loading={savingHours}>
                  Save working hours
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-brand-500" />
                <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                  Password & security
                </h2>
              </div>
              <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                Use a strong, unique password you do not use elsewhere.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} noValidate>
              <div className="space-y-4 px-5 py-5 sm:px-6">
                {passwordError ? <FormAlert>{passwordError}</FormAlert> : null}

                <PasswordInput
                  label="Current password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => {
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }));
                    setPasswordErrors((current) => ({ ...current, currentPassword: '' }));
                  }}
                  error={passwordErrors.currentPassword}
                  required
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <PasswordInput
                    label="New password"
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={(event) => {
                      setPasswordForm((current) => ({ ...current, newPassword: event.target.value }));
                      setPasswordErrors((current) => ({ ...current, newPassword: '' }));
                    }}
                    error={passwordErrors.newPassword}
                    hint="At least 8 characters with a letter and number."
                    required
                  />
                  <PasswordInput
                    label="Confirm new password"
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => {
                      setPasswordForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }));
                      setPasswordErrors((current) => ({ ...current, confirmPassword: '' }));
                    }}
                    error={passwordErrors.confirmPassword}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end border-t border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
                <Button type="submit" variant="outline" loading={savingPassword}>
                  Update password
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-brand-500" />
                <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                  Your data
                </h2>
              </div>
              <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                Download everything Tracky stores for your account as a JSON file.
              </p>
            </div>
            <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs leading-5 text-ink-500 dark:text-ink-400">
                Includes your profile, settings, tasks, habits, habit logs, XP, reports, conversations,
                notifications, and achievements. Nothing about other users is included.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                loading={exporting}
                leftIcon={<Download className="h-3.5 w-3.5" />}
                className="shrink-0"
              >
                Export data
              </Button>
            </div>
          </Card>

          <Card className="border-danger-200/80 dark:border-danger-500/20">
            <div className="border-b border-danger-100 px-5 py-4 dark:border-danger-500/15 sm:px-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-danger-600 dark:text-danger-500" />
                <h2 className="font-display text-[0.98rem] font-bold text-danger-700 dark:text-danger-500">
                  Danger zone
                </h2>
              </div>
              <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                Deleting your account is permanent and removes every record associated with it.
              </p>
            </div>
            <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs leading-5 text-ink-500 dark:text-ink-400">
                You will be asked for your password and to type <strong>DELETE</strong>. This cannot be
                undone.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setDeleteError('');
                  setDeleteForm({ password: '', confirm: '' });
                  setDeleteOpen(true);
                }}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                className="shrink-0"
              >
                Delete account
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(goalDeleteTarget)}
        onClose={() => setGoalDeleteTarget(null)}
        onConfirm={handleGoalDelete}
        loading={Boolean(goalBusyId)}
        title="Remove this goal?"
        description={
          goalDeleteTarget
            ? `“${goalDeleteTarget.title}” will be removed from your coach's context. Your tasks are not affected.`
            : ''
        }
        confirmLabel="Remove goal"
      />

      <Modal
        open={deleteOpen}
        onClose={deletingAccount ? () => {} : () => setDeleteOpen(false)}
        title="Delete your account?"
        description="Every task, habit, report, conversation, and notification tied to your account will be permanently deleted."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deletingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              loading={deletingAccount}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Permanently delete
            </Button>
          </>
        }
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          {deleteError ? <FormAlert>{deleteError}</FormAlert> : null}
          <PasswordInput
            label="Current password"
            autoComplete="current-password"
            value={deleteForm.password}
            onChange={(event) => {
              setDeleteForm((current) => ({ ...current, password: event.target.value }));
              setDeleteError('');
            }}
            required
          />
          <Input
            label="Type DELETE to confirm"
            value={deleteForm.confirm}
            onChange={(event) => {
              setDeleteForm((current) => ({ ...current, confirm: event.target.value }));
              setDeleteError('');
            }}
            placeholder="DELETE"
            autoComplete="off"
            required
          />
        </form>
      </Modal>
    </div>
  );
}
