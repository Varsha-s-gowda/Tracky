import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, SearchX } from 'lucide-react';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page not found');
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface-light px-5 dark:bg-surface-dark">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
          <SearchX className="h-6 w-6" />
        </span>
        <p className="mt-6 font-display text-[4.5rem] font-extrabold leading-none tracking-[-0.07em] text-ink-950 dark:text-white">
          404
        </p>
        <h1 className="mt-3 font-display text-xl font-bold text-ink-900 dark:text-white">
          This page wandered off.
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
          The page you are looking for does not exist or may have moved. Let&apos;s get you back to
          solid ground.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button
            as={Link}
            to={isAuthenticated ? '/dashboard' : '/'}
            leftIcon={isAuthenticated ? <LayoutDashboard className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          >
            {isAuthenticated ? 'Back to dashboard' : 'Back to home'}
          </Button>
          {isAuthenticated ? (
            <Button as={Link} to="/tasks" variant="outline">
              Go to tasks
            </Button>
          ) : (
            <Button as={Link} to="/login" variant="outline">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
