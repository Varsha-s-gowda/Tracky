import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Globe2,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Menu,
  Repeat2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import DashboardPreview from '../components/marketing/DashboardPreview';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'One clear daily view',
    description:
      'See your tasks, habits, and progress together, so your day has a shape before it begins.',
    accent: 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300',
  },
  {
    icon: ListChecks,
    title: 'Tasks that keep up with you',
    description:
      'Set priorities, due times, categories, tags, and recurring schedules without adding mental overhead.',
    accent: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300',
  },
  {
    icon: Repeat2,
    title: 'Habits, not just checkboxes',
    description:
      'Choose daily or weekly rhythms, set a target, and build a completion history you can trust.',
    accent: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500',
  },
  {
    icon: CalendarDays,
    title: 'A calendar with context',
    description:
      'See scheduled and completed work alongside the habits you kept on any given day.',
    accent: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500',
  },
  {
    icon: LineChart,
    title: 'Progress that stays honest',
    description:
      'Every number comes from your real activity — no invented streaks, no vanity metrics.',
    accent: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300',
  },
  {
    icon: Globe2,
    title: 'Built around your timezone',
    description:
      "Today's plan is always your today. Tracky respects your local timezone for every daily reset.",
    accent: 'bg-ink-100 text-ink-600 dark:bg-white/[0.06] dark:text-ink-300',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Create your space',
    description:
      'Start with a free account. Your tasks, habits, and history stay private to you.',
  },
  {
    number: '02',
    title: 'Plan with intention',
    description:
      'Add what matters for today, set a few priorities, and give your attention a clear direction.',
  },
  {
    number: '03',
    title: 'Build your rhythm',
    description:
      'Check in on habits, close the loop on tasks, and let consistent action do the compounding.',
  },
];

const BENEFITS = [
  {
    title: 'Less mental overhead',
    description: 'A trusted place for the small things frees your attention for meaningful work.',
  },
  {
    title: 'Visible consistency',
    description: 'Seeing what you followed through on makes progress feel real — and repeatable.',
  },
  {
    title: 'Better daily choices',
    description: 'Clear priorities help you spend energy on what matters instead of what is loudest.',
  },
  {
    title: 'Sustainable momentum',
    description: 'Small, deliberate actions become a rhythm that survives busy weeks.',
  },
];

export default function LandingPage() {
  usePageTitle('Build better days');
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const primaryDestination = isAuthenticated ? '/dashboard' : '/register';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-ink-900 dark:bg-surface-dark dark:text-white">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-ink-200/60 bg-white/85 backdrop-blur-xl dark:border-white/[0.06] dark:bg-surface-dark/85'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Landing page">
            {[
              ['Features', '#features'],
              ['How it works', '#how-it-works'],
              ['Why habits', '#benefits'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="focus-ring rounded text-sm font-medium text-ink-500 transition hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="focus-ring hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/[0.06] dark:hover:text-white sm:block"
              >
                Log in
              </Link>
            ) : null}
            <Button
              as={isAuthenticated ? Link : undefined}
              to={isAuthenticated ? '/dashboard' : undefined}
              onClick={!isAuthenticated ? () => navigate('/register') : undefined}
              size="sm"
              className="hidden sm:inline-flex"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              {isAuthenticated ? 'Open dashboard' : 'Get started'}
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="focus-ring rounded-xl p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-white/[0.06] lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-ink-100 bg-white px-5 py-4 shadow-soft dark:border-white/[0.06] dark:bg-surface-dark lg:hidden">
            <nav className="space-y-1">
              {[
                ['Features', '#features'],
                ['How it works', '#how-it-works'],
                ['Why habits', '#benefits'],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-white/[0.05]"
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3 dark:border-white/[0.06]">
              <ThemeToggle size="sm" />
              {!isAuthenticated ? (
                <Button as={Link} to="/login" variant="outline" size="sm" className="flex-1" onClick={closeMenu}>
                  Log in
                </Button>
              ) : null}
              <Button
                as={Link}
                to={primaryDestination}
                size="sm"
                className="flex-1"
                onClick={closeMenu}
              >
                {isAuthenticated ? 'Dashboard' : 'Get started'}
              </Button>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative overflow-hidden pb-20 pt-32 sm:pb-24 sm:pt-36 lg:pb-32 lg:pt-44">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.55] dark:opacity-[0.25]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(103,70,223,0.18) 1px, transparent 0)',
              backgroundSize: '28px 28px',
              maskImage: 'linear-gradient(to bottom, black, transparent 68%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 68%)',
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-300/20 blur-[110px] dark:bg-brand-600/15"
            aria-hidden="true"
          />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-8">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink-200/80 bg-white/80 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.13em] text-ink-500 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-300">
                <Sparkles className="h-3 w-3 text-brand-500" />
                Your intentional productivity workspace
              </div>

              <h1 className="mt-6 font-display text-[2.75rem] font-extrabold leading-[1.03] tracking-[-0.055em] text-ink-950 dark:text-white sm:text-[3.6rem] lg:text-[4.35rem]">
                Turn good intentions into{' '}
                <span className="relative whitespace-nowrap text-brand-600 dark:text-brand-400">
                  better days.
                  <svg
                    className="absolute -bottom-2 left-0 w-full text-brand-300/70 dark:text-brand-500/40"
                    viewBox="0 0 300 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M3 9C68 3 198 1 297 6" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-[1.02rem] leading-7 text-ink-500 dark:text-ink-400 sm:text-[1.08rem]">
                Tracky AI brings your tasks, habits, and daily progress into one focused
                workspace. Spend less time managing your day — and more time living it.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  as={Link}
                  to={primaryDestination}
                  size="lg"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {isAuthenticated ? 'Go to your dashboard' : 'Start for free'}
                </Button>
                <Button
                  as="a"
                  href="#features"
                  variant="outline"
                  size="lg"
                  leftIcon={<CheckCircle2 className="h-4 w-4 text-brand-500" />}
                >
                  See how it works
                </Button>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-ink-400 dark:text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-success-600 dark:text-success-500" />
                  Private, user-specific data
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success-600 dark:text-success-500" />
                  Free to get started
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[590px] animate-slide-up lg:mx-0" style={{ animationDelay: '120ms' }}>
              <DashboardPreview />
            </div>
          </div>

          <div className="mx-auto mt-20 max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 border-y border-ink-100 py-5 dark:border-white/[0.06] sm:flex-row sm:items-center">
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-ink-400 dark:text-ink-500">
                Built for the way real focus works
              </p>
              <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm font-semibold text-ink-500 dark:text-ink-400">
                {['Students', 'Creators', 'Builders', 'Professionals'].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 bg-surface-light py-20 dark:bg-[#0a0b0f] sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
                Everything in one place
              </p>
              <h2 className="mt-3 font-display text-[2rem] font-extrabold tracking-[-0.045em] text-ink-950 dark:text-white sm:text-[2.6rem]">
                Less scattered. More intentional.
              </h2>
              <p className="mt-4 text-[0.95rem] leading-7 text-ink-500 dark:text-ink-400">
                Tracky is designed around the daily loop that actually matters: decide what
                counts, do the work, and keep showing up.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="group rounded-2xl border border-ink-200/70 bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card dark:border-white/[0.07] dark:bg-surface-darkCard dark:hover:border-brand-400/20"
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${feature.accent}`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <h3 className="mt-5 font-display text-[1.02rem] font-bold tracking-[-0.02em] text-ink-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-20">
              <div className="lg:sticky lg:top-28">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
                  How it works
                </p>
                <h2 className="mt-3 font-display text-[2rem] font-extrabold tracking-[-0.045em] text-ink-950 dark:text-white sm:text-[2.6rem]">
                  A simple loop you can keep.
                </h2>
                <p className="mt-4 text-[0.95rem] leading-7 text-ink-500 dark:text-ink-400">
                  No complicated systems to maintain. Just a clear place to plan, act, and
                  notice your progress.
                </p>
                <div className="mt-7 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 dark:border-brand-400/15 dark:bg-brand-400/[0.06]">
                  <p className="font-display text-sm font-bold text-brand-900 dark:text-brand-200">
                    “A good system beats a perfect intention.”
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-brand-800/65 dark:text-brand-200/55">
                    Tracky gives your intentions somewhere to live.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {STEPS.map((step, index) => (
                  <div
                    key={step.number}
                    className="relative flex gap-5 rounded-2xl border border-ink-200/70 bg-white p-6 shadow-soft dark:border-white/[0.07] dark:bg-surface-darkCard sm:p-7"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-900 font-display text-sm font-bold text-white dark:bg-white dark:text-ink-950">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-6 text-ink-500 dark:text-ink-400">
                        {step.description}
                      </p>
                    </div>
                    {index < STEPS.length - 1 ? (
                      <span className="absolute -bottom-2 left-[47px] h-4 w-px bg-ink-200 dark:bg-white/10" aria-hidden="true" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="benefits" className="scroll-mt-24 bg-[#101018] py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-300">
                  Why habit tracking works
                </p>
                <h2 className="mt-3 max-w-xl font-display text-[2rem] font-extrabold tracking-[-0.045em] sm:text-[2.65rem]">
                  The compound interest of showing up.
                </h2>
                <p className="mt-4 max-w-xl text-[0.95rem] leading-7 text-ink-300">
                  Big changes rarely arrive in a single burst. They come from small actions,
                  repeated often enough to become part of who you are. Tracky helps you see
                  those actions clearly.
                </p>

                <div className="mt-9 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  {BENEFITS.map((benefit) => (
                    <div key={benefit.title}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-400/15 text-brand-300">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <h3 className="text-sm font-semibold text-white">{benefit.title}</h3>
                      </div>
                      <p className="mt-1.5 pl-7 text-[0.82rem] leading-6 text-ink-400">
                        {benefit.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div
                  className="absolute inset-8 rounded-full bg-brand-500/20 blur-[80px]"
                  aria-hidden="true"
                />
                <div className="relative rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur sm:p-8">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-ink-400">
                    The daily loop
                  </p>
                  <div className="mt-6 space-y-5">
                    {[
                      { label: 'Plan', text: 'Choose what deserves your attention today.' },
                      { label: 'Act', text: 'Work through the plan, one clear step at a time.' },
                      { label: 'Notice', text: 'Mark progress and see consistency build.' },
                    ].map((item, index) => (
                      <div key={item.label} className="flex gap-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-bold text-brand-200">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          <p className="mt-0.5 text-[0.82rem] leading-6 text-ink-400">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
                        Today's rhythm
                      </span>
                      <span className="text-xs font-bold text-brand-300">Consistency over intensity</span>
                    </div>
                    <div className="mt-3 flex gap-1.5">
                      {[1, 1, 1, 0.7, 0.55, 0.35, 0.15].map((opacity, index) => (
                        <span
                          key={index}
                          className="h-1.5 flex-1 rounded-full bg-brand-400"
                          style={{ opacity }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-brand-600 px-6 py-14 text-center shadow-[0_30px_80px_-40px_rgba(103,70,223,0.9)] sm:px-12 sm:py-16">
              <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 25% 10%, white 1px, transparent 0)`,
                  backgroundSize: '22px 22px',
                }}
                aria-hidden="true"
              />
              <div className="relative">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-100">
                  Your next good day starts here
                </p>
                <h2 className="mx-auto mt-3 max-w-2xl font-display text-[2rem] font-extrabold tracking-[-0.045em] text-white sm:text-[2.7rem]">
                  Give your intentions a place to grow.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-7 text-brand-100/85">
                  Join Tracky AI and bring a little more clarity, consistency, and calm to your
                  everyday.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    as={Link}
                    to={primaryDestination}
                    variant="inverse"
                    size="lg"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    {isAuthenticated ? 'Open your dashboard' : 'Create your free account'}
                  </Button>
                  {!isAuthenticated ? (
                    <Button
                      as={Link}
                      to="/login"
                      variant="outline"
                      size="lg"
                      className="border-white/25 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 dark:border-white/25 dark:bg-white/5 dark:text-white"
                    >
                      Sign in
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-100 py-10 dark:border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Logo />
            <p className="text-xs text-ink-400 dark:text-ink-500">
              A calmer way to build better days.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-ink-400 dark:text-ink-500">
            <a href="#features" className="transition hover:text-ink-800 dark:hover:text-ink-200">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-ink-800 dark:hover:text-ink-200">
              How it works
            </a>
            <a href="#benefits" className="transition hover:text-ink-800 dark:hover:text-ink-200">
              Why habits
            </a>
            <span>© {new Date().getFullYear()} Tracky AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
