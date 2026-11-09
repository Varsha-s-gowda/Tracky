import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import AuthHeading from '../components/auth/AuthHeading';
import FormAlert from '../components/auth/FormAlert';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/authService';
import { usePageTitle } from '../hooks/usePageTitle';
import { getErrorMessage } from '../utils/errors';

export default function ForgotPasswordPage() {
  usePageTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Enter the email address for your account.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.forgotPassword({ email: email.trim() });
      setResult(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not process your request. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500">
          <MailCheck className="h-5 w-5" />
        </div>
        <AuthHeading
          eyebrow="Check your inbox"
          title="Reset instructions are on the way."
          description={result.message}
        />

        {result.devResetToken ? (
          <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-400/20 dark:bg-brand-400/10">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-700 dark:text-brand-300">
              Local development shortcut
            </p>
            <p className="mt-1.5 text-sm leading-6 text-brand-800/80 dark:text-brand-200/75">
              Email delivery is not configured in this build. Use the secure, time-limited link
              below to complete the reset.
            </p>
            <Button
              as={Link}
              to={`/reset-password/${result.devResetToken}`}
              size="sm"
              className="mt-3"
            >
              Continue to reset password
            </Button>
          </div>
        ) : null}

        <div className="space-y-3">
          <Button as={Link} to="/login" variant="outline" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to sign in
          </Button>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setEmail('');
            }}
            className="focus-ring w-full rounded-lg py-2 text-xs font-semibold text-ink-500 transition hover:text-ink-800 dark:text-ink-400 dark:hover:text-white"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthHeading
        eyebrow="Password help"
        title="Let's get you back in."
        description="Enter the email linked to your Tracky AI account and we'll create a secure reset link."
      />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? <FormAlert>{error}</FormAlert> : null}

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError('');
          }}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Send reset link
        </Button>
      </form>

      <Button
        as={Link}
        to="/login"
        variant="ghost"
        size="sm"
        className="mt-5 w-full"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
      >
        Back to sign in
      </Button>
    </div>
  );
}
