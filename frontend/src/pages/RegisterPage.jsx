import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User } from 'lucide-react';
import AuthHeading from '../components/auth/AuthHeading';
import PasswordInput from '../components/auth/PasswordInput';
import FormAlert from '../components/auth/FormAlert';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { getErrorMessage } from '../utils/errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  usePageTitle('Create account');
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
    if (error) setError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name.';
    if (!EMAIL_PATTERN.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      nextErrors.password = 'Use at least 8 characters, with a letter and a number.';
    }
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      toast.success(`Welcome to Tracky AI, ${user.name.split(' ')[0]}.`);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AuthHeading
        eyebrow="Get started"
        title="Make room for a better day."
        description="Create your free account and start bringing intention to your tasks and habits."
      />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? <FormAlert>{error}</FormAlert> : null}

        <Input
          label="Full name"
          type="text"
          placeholder="Your name"
          autoComplete="name"
          value={form.name}
          onChange={updateField('name')}
          leftIcon={<User className="h-4 w-4" />}
          error={fieldErrors.name}
          required
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={updateField('email')}
          leftIcon={<Mail className="h-4 w-4" />}
          error={fieldErrors.email}
          required
        />

        <PasswordInput
          label="Password"
          placeholder="Create a password"
          autoComplete="new-password"
          value={form.password}
          onChange={updateField('password')}
          error={fieldErrors.password}
          hint="At least 8 characters, including a letter and a number."
          required
        />

        <PasswordInput
          label="Confirm password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={updateField('confirmPassword')}
          error={fieldErrors.confirmPassword}
          required
        />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create my account
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-ink-500 dark:text-ink-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="focus-ring rounded font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
