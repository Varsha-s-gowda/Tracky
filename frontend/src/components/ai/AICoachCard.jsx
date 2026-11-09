import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import { Skeleton } from '../ui/Loaders';
import { aiService } from '../../services/aiService';
import { getErrorMessage } from '../../utils/errors';

export default function AICoachCard() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await aiService.insights();
      setInsights(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Insights are unavailable right now.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recommendation = insights?.recommendations?.[0];
  const primaryStrength = insights?.strengths?.[0];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4 dark:border-white/[0.06] sm:px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
              AI Coach
            </h2>
            <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
              Based on your real activity
            </p>
          </div>
        </div>
        <Link
          to="/coach"
          className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"
        >
          Open
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="px-4 py-4 sm:px-5">
        {loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-4 h-14 w-full rounded-xl" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-ink-50 px-3.5 py-3 text-xs leading-5 text-ink-500 dark:bg-white/[0.03] dark:text-ink-400">
            {error}
            <button
              type="button"
              onClick={load}
              className="focus-ring mt-2 flex items-center gap-1.5 rounded-lg font-semibold text-brand-600 dark:text-brand-400"
            >
              <RefreshCw className="h-3 w-3" /> Try again
            </button>
          </div>
        ) : !insights?.hasData ? (
          <div className="rounded-xl bg-ink-50 px-3.5 py-3.5 text-xs leading-5 text-ink-500 dark:bg-white/[0.03] dark:text-ink-400">
            Add a task or check in a habit to unlock insights based on your own activity.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 rounded-xl bg-brand-50/70 px-3 py-3 dark:bg-brand-400/[0.07]">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" />
              <p className="text-xs leading-5 text-brand-900/80 dark:text-brand-100/75">
                {insights.summary}
              </p>
            </div>

            {recommendation ? (
              <Link
                to={recommendation.link || '/coach'}
                className="focus-ring group flex items-start gap-2.5 rounded-xl border border-ink-200/70 px-3 py-3 transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-white/10 dark:hover:border-brand-400/40 dark:hover:bg-brand-400/[0.05]"
              >
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning-500" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-ink-800 dark:text-ink-100">
                    {recommendation.title}
                  </span>
                  <span className="mt-0.5 block text-[0.68rem] leading-5 text-ink-500 dark:text-ink-400">
                    {recommendation.detail}
                  </span>
                </span>
                <ArrowRight className="mt-1 h-3 w-3 shrink-0 text-ink-300 transition group-hover:text-brand-500" />
              </Link>
            ) : primaryStrength ? (
              <p className="flex items-start gap-2 text-xs leading-5 text-ink-500 dark:text-ink-400">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-500" />
                {primaryStrength}
              </p>
            ) : null}

            <Link
              to="/coach?tab=chat"
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Ask your coach <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}
