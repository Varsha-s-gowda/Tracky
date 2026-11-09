import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';
import Logo from '../components/ui/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';
import ProgressRing from '../components/ui/ProgressRing';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-surface-dark lg:grid lg:grid-cols-[1.02fr_0.98fr]">
      <aside className="relative hidden overflow-hidden bg-[#0d0e14] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          className="pointer-events-none absolute -left-28 top-1/3 h-[520px] w-[520px] rounded-full bg-brand-600/20 blur-[130px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-brand-400/10 blur-[100px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <Logo to="/" onDark />
        </div>

        <div className="relative z-10 max-w-[520px] py-14">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-brand-200">
            <Sparkles className="h-3 w-3" />
            A calmer way to get things done
          </p>
          <h1 className="font-display text-[2.65rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-white xl:text-[3.15rem]">
            Build better days,
            <br />
            one intentional
            <br />
            step at a time.
          </h1>
          <p className="mt-6 max-w-md text-[0.95rem] leading-7 text-ink-300">
            Tasks, habits, and daily progress in one focused workspace. Less noise, more
            clarity, and a rhythm you can actually keep.
          </p>

          <div className="mt-9 space-y-4">
            {[
              { icon: CheckCircle2, text: 'Plan your day with focused task management' },
              { icon: TrendingUp, text: 'Build consistency through daily habits' },
              { icon: Sparkles, text: 'See your progress in one calm dashboard' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-3 text-sm text-ink-300">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-brand-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.text}
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
            <ProgressRing
              value={78}
              size={72}
              stroke={7}
              label={undefined}
              trackClassName="text-white/10"
              indicatorClassName="text-brand-300"
            />
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">
                Today's rhythm
              </p>
              <p className="mt-1 font-display text-sm font-semibold text-white">
                A little progress, compounded.
              </p>
              <p className="mt-0.5 text-xs text-ink-400">Tasks and habits, together.</p>
            </div>
          </div>
          <p className="mt-5 text-xs text-ink-600">
            © {new Date().getFullYear()} Tracky AI. Built for intentional people.
          </p>
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-col bg-white dark:bg-surface-dark">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:absolute lg:inset-x-0 lg:top-0 lg:px-10">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="focus-ring hidden rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/[0.06] dark:hover:text-white sm:inline-flex"
              aria-label="Back to homepage"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="lg:hidden">
              <Logo to="/" />
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-8 lg:px-10 lg:py-24">
          <div className="w-full max-w-[420px] animate-slide-up">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
