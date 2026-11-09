import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import AuthHeading from '../components/auth/AuthHeading';
import PasswordInput from '../components/auth/PasswordInput';
import FormAlert from '../components/auth/FormAlert';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { getErrorMessage } from '../utils/errors';

export default function LoginPage() {
  usePageTitle('Sign in');
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setLoading(true);
    try {
      const user = await login({
        email: form.email.trim(),
        password: form.password,
        remember: form.remember,
      });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
      const from = location.state?.from;
      const destination = from
        ? `${from.pathname || '/dashboard'}${from.search || ''}`
        : '/dashboard';
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not sign you in. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AuthHeading
        eyebrow="Welcome back"
        title="Pick up where you left off."
        description="Sign in to see your plan, keep your habits moving, and make today count."
      />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? <FormAlert>{error}</FormAlert> : null}

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={updateField('email')}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />

        <div>
          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={form.password}
            onChange={updateField('password')}
            leftIcon={<Lock className="h-4 w-4" />}
            required
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <Checkbox
              checked={form.remember}
              onChange={updateField('remember')}
              label="Remember me"
            />
            <Link
              to="/forgot-password"
              className="focus-ring rounded text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-ink-500 dark:text-ink-400">
        New to Tracky AI?{' '}
        <Link
          to="/register"
          className="focus-ring rounded font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
