import { Link } from 'react-router-dom';
import { ArrowRight, Check, Construction, LayoutDashboard } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { cn } from '../../utils/cn';

export default function ComingSoonPage({
  icon: Icon,
  part,
  title,
  description,
  features = [],
  accent = 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300',
}) {
  return (
    <div className="page-container">
      <Card className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-100/70 blur-3xl dark:bg-brand-600/10"
          aria-hidden="true"
        />
        <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-200/70 bg-white px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.13em] text-ink-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-400">
              <Construction className="h-3 w-3 text-brand-500" />
              In development · {part}
            </span>
            <span
              className={cn(
                'mt-7 flex h-14 w-14 items-center justify-center rounded-2xl',
                accent
              )}
            >
              <Icon className="h-6 w-6" />
            </span>
            <h1 className="mt-5 font-display text-[2rem] font-extrabold tracking-[-0.045em] text-ink-950 dark:text-white sm:text-[2.5rem]">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-ink-500 dark:text-ink-400">
              {description}
            </p>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Button
                as={Link}
                to="/dashboard"
                leftIcon={<LayoutDashboard className="h-4 w-4" />}
              >
                Back to dashboard
              </Button>
              <Button
                as={Link}
                to="/tasks"
                variant="outline"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Manage tasks
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-200/70 bg-ink-50/50 p-5 dark:border-white/[0.07] dark:bg-white/[0.025] sm:p-6">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-ink-400 dark:text-ink-500">
              What is coming
            </p>
            <ul className="mt-4 space-y-3.5">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-6 text-ink-600 dark:text-ink-300">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-dashed border-ink-300/70 px-4 py-3 text-xs leading-5 text-ink-400 dark:border-white/10 dark:text-ink-500">
              The foundation is already live. Your tasks, habits, and history are being stored
              securely and will power these views.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
