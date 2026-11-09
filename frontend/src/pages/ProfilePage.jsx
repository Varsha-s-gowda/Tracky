import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Globe2, KeyRound, Mail, Settings, ShieldCheck, UserRound } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { Input, Select } from '../components/ui/Input';
import PasswordInput from '../components/auth/PasswordInput';
import FormAlert from '../components/auth/FormAlert';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  formatDate,
  getTimezoneOptions,
  timezoneLabel,
} from '../utils/date';
import { getErrorMessage } from '../utils/errors';

export default function ProfilePage() {
  usePageTitle('Profile');
  const { user, updateProfile, changePassword } = useAuth();
  const { toast } = useToast();
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

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      profileImage: user.profileImage || '',
      timezone: user.timezone || 'UTC',
    });
  }, [user]);

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

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Your account"
        title="Profile"
        description="Keep your personal details and timezone up to date so Tracky can meet you where you are."
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
        </div>
      </div>
    </div>
  );
}
