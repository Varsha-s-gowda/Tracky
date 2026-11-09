import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, FileText, MessageCircle, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Tabs from '../components/ui/Tabs';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Loaders';
import InsightOverview from '../components/ai/InsightOverview';
import ReportsPanel from '../components/ai/ReportsPanel';
import PlannerPanel from '../components/ai/PlannerPanel';
import ChatPanel from '../components/ai/ChatPanel';
import { usePageTitle } from '../hooks/usePageTitle';
import { aiService } from '../services/aiService';
import { getErrorMessage } from '../utils/errors';

const TABS = [
  { value: 'overview', label: 'Overview', icon: Sparkles },
  { value: 'reports', label: 'Reports', icon: FileText },
  { value: 'planner', label: 'Planner', icon: Wand2 },
  { value: 'chat', label: 'Chat', icon: MessageCircle },
];

const VALID_TABS = new Set(TABS.map((tab) => tab.value));

function StatusPill({ status, loading }) {
  if (loading) return <Skeleton className="h-7 w-32 rounded-full" />;
  if (!status) return <Badge variant="outline">AI status unavailable</Badge>;
  if (status.configured) {
    return (
      <Badge variant="success" dot>
        AI connected · {status.provider}
        {status.model ? ` · ${status.model}` : ''}
      </Badge>
    );
  }
  return (
    <Badge variant="warning" dot>
      Rules-only mode
    </Badge>
  );
}

function OverviewSkeleton() {
  return (
    <div className="mt-5 space-y-5">
      <div className="surface-card p-5">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
    </div>
  );
}

export default function AICoachPage() {
  usePageTitle('AI Coach');
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = VALID_TABS.has(requestedTab) ? requestedTab : 'overview';

  const [status, setStatus] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [statusResult, insightsResult] = await Promise.allSettled([
      aiService.status(),
      aiService.insights(),
    ]);

    if (statusResult.status === 'fulfilled') {
      setStatus(statusResult.value);
    }

    if (insightsResult.status === 'fulfilled') {
      setInsights(insightsResult.value);
    } else {
      setError(
        getErrorMessage(insightsResult.reason, 'Your coach insights could not be loaded right now.')
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeTab = (tab) => {
    if (!VALID_TABS.has(tab)) return;
    setSearchParams(tab === 'overview' ? {} : { tab }, { replace: true });
  };

  const configured = Boolean(status?.configured);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Part 3 · AI coach"
        title="A coach that knows your rhythm."
        description="Insights, reports, planning, and conversation built only from your real tasks, habits, streaks, and scores. Nothing here is fabricated."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={status} loading={loading && !status} />
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              loading={loading}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {status && !status.configured ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-warning-200/70 bg-warning-50/70 px-4 py-3 text-xs leading-5 text-warning-900/80 dark:border-warning-500/20 dark:bg-warning-500/[0.07] dark:text-warning-200/80">
          <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Chat and task planning require a live AI provider. Reports and insights still work because
            they are calculated from your saved records. Add <code className="rounded bg-warning-100/70 px-1 py-0.5 dark:bg-warning-500/10">GEMINI_API_KEY</code> or{' '}
            <code className="rounded bg-warning-100/70 px-1 py-0.5 dark:bg-warning-500/10">OPENAI_API_KEY</code> to the backend environment to enable every coach feature.
          </span>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} value={activeTab} onChange={changeTab} ariaLabel="AI coach sections" />
        <span className="text-[0.65rem] text-ink-400 dark:text-ink-500">
          User-specific data · never shared across accounts
        </span>
      </div>

      {loading && !insights && activeTab === 'overview' ? (
        <OverviewSkeleton />
      ) : activeTab === 'overview' ? (
        error ? (
          <div className="mt-5">
            <ErrorState title="Insights unavailable" message={error} onRetry={load} />
          </div>
        ) : (
          <InsightOverview insights={insights} configured={configured} onAction={changeTab} />
        )
      ) : null}

      {activeTab === 'reports' ? <ReportsPanel /> : null}
      {activeTab === 'planner' ? <PlannerPanel configured={configured} /> : null}
      {activeTab === 'chat' ? <ChatPanel configured={configured} /> : null}
    </div>
  );
}
