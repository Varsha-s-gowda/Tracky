import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import AuthHeading from '../components/auth/AuthHeading';
import PasswordInput from '../components/auth/PasswordInput';
import FormAlert from '../components/auth/FormAlert';
import Button from '../components/ui/Button';
import { authService } from '../services/authService';
import { usePageTitle } from '../hooks/usePageTitle';
import { getErrorMessage } from '../utils/errors';

export default function ResetPasswordPage() {
  usePageTitle('Reset password');
  const { token } = useParams();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const nextErrors = {};

    if (
      form.newPassword.length < 8 ||
      !/[A-Za-z]/.test(form.newPassword) ||
      !/\d/.test(form.newPassword)
    ) {
      nextErrors.newPassword = 'Use at least 8 characters, with a letter and a number.';
    }
    if (form.newPassword !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await authService.resetPassword(token, form);
      setSuccess(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not reset your password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <AuthHeading
          eyebrow="All set"
          title="Your password has been updated."
          description="You can now sign in with your new password and get back to your day."
        />
        <Button as={Link} to="/login" size="lg" className="w-full">
          Sign in to Tracky AI
        </Button>
      </div>
    );
  }

  return (
    <div>
      <AuthHeading
        eyebrow="Choose a new password"
        title="A fresh start."
        description="Create a strong password for your account. You'll be signed in with it next time."
      />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? <FormAlert>{error}</FormAlert> : null}

        <PasswordInput
          label="New password"
          placeholder="Create a new password"
          autoComplete="new-password"
          value={form.newPassword}
          onChange={updateField('newPassword')}
          error={fieldErrors.newPassword}
          hint="At least 8 characters, including a letter and a number."
          required
        />

        <PasswordInput
          label="Confirm new password"
          placeholder="Repeat your new password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={updateField('confirmPassword')}
          error={fieldErrors.confirmPassword}
          required
        />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Update password
        </Button>
      </form>

      <Button as={Link} to="/login" variant="ghost" size="sm" className="mt-5 w-full">
        Back to sign in
      </Button>
    </div>
  );
}
