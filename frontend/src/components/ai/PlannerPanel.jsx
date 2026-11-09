import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Lightbulb,
  ListChecks,
  ListTodo,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Checkbox from '../ui/Checkbox';
import EmptyState from '../ui/EmptyState';
import { Input, Select, Textarea } from '../ui/Input';
import FormAlert from '../../components/auth/FormAlert';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { aiService } from '../../services/aiService';
import {
  addDays,
  formatDate,
  isoDateFromDate,
  parseDateKey,
  todayKey,
} from '../../utils/date';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High priority' },
  { value: 'medium', label: 'Medium priority' },
  { value: 'low', label: 'Low priority' },
];

const MINUTE_OPTIONS = [30, 45, 60, 90, 120, 180];

function NotConfiguredNotice() {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500">
          <Wand2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-ink-900 dark:text-white">
            The AI planner is not configured
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-500 dark:text-ink-400">
            Task planning needs a live language model. Add <code className="rounded bg-ink-100 px-1 py-0.5 text-[0.72rem] dark:bg-white/[0.06]">GEMINI_API_KEY</code> or{' '}
            <code className="rounded bg-ink-100 px-1 py-0.5 text-[0.72rem] dark:bg-white/[0.06]">OPENAI_API_KEY</code> to the backend environment and restart the API. Tracky will never generate a fake plan in the meantime.
          </p>
          <p className="mt-2 text-xs text-ink-400 dark:text-ink-500">
            You can still create tasks manually from the Tasks page.
          </p>
          <Link
            to="/tasks"
            className="focus-ring mt-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400"
          >
            Go to tasks <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

function SuggestedTask({ task, index, onChange, onRemove }) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3.5 transition',
        task.selected
          ? 'border-ink-200 bg-white dark:border-white/10 dark:bg-white/[0.02]'
          : 'border-ink-100 bg-ink-50/60 opacity-70 dark:border-white/[0.05] dark:bg-white/[0.01]'
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.selected}
          onChange={(event) => onChange(index, { selected: event.target.checked })}
          aria-label={`Include ${task.title}`}
          className="mt-1.5"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <input
              value={task.title}
              onChange={(event) => onChange(index, { title: event.target.value })}
              aria-label="Suggested task title"
              className="focus-ring h-9 w-full rounded-lg border border-ink-200 bg-white px-2.5 text-sm font-medium text-ink-900 dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="focus-ring mt-0.5 rounded-lg p-2 text-ink-400 transition hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/10 dark:hover:text-danger-500"
              aria-label="Remove suggested task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={task.dueDate}
              onChange={(event) => onChange(index, { dueDate: event.target.value })}
              aria-label="Suggested task due date"
              className="focus-ring h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-xs text-ink-900 dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
            />
            <select
              value={task.priority}
              onChange={(event) => onChange(index, { priority: event.target.value })}
              aria-label="Suggested task priority"
              className="focus-ring h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-xs text-ink-900 dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="rounded-lg bg-ink-100 px-2 py-1 text-[0.62rem] font-semibold text-ink-500 dark:bg-white/[0.06] dark:text-ink-400">
              {task.category}
            </span>
            {task.estimatedMinutes ? (
              <span className="rounded-lg bg-ink-100 px-2 py-1 text-[0.62rem] font-semibold text-ink-500 dark:bg-white/[0.06] dark:text-ink-400">
                {task.estimatedMinutes} min
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlannerPanel({ configured }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const today = todayKey(user?.timezone);
  const tomorrow = isoDateFromDate(addDays(parseDateKey(today), 1));

  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState(isoDateFromDate(addDays(parseDateKey(today), 30)));
  const [dailyMinutes, setDailyMinutes] = useState('60');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);
  const [draftTasks, setDraftTasks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const selectedCount = draftTasks.filter((task) => task.selected).length;

  const handleGenerate = async (event) => {
    event.preventDefault();
    setError('');
    const nextErrors = {};
    if (goal.trim().length < 3) nextErrors.goal = 'Describe the goal in at least 3 characters.';
    if (deadline && deadline <= today) nextErrors.deadline = 'Choose a deadline in the future.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const result = await aiService.plan({
        goal: goal.trim(),
        deadline: deadline || undefined,
        dailyMinutes: Number(dailyMinutes) || 60,
      });
      setPlan(result);
      setDraftTasks(
        (result.tasks || []).map((task) => ({
          ...task,
          selected: true,
          category: task.category || 'AI Plan',
        }))
      );
      setSavedCount(0);
      toast.success('Plan generated.', {
        description: 'Review every task and edit anything before saving.',
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'The plan could not be generated.'));
    } finally {
      setLoading(false);
    }
  };

  const updateTask = (index, patch) => {
    setDraftTasks((current) =>
      current.map((task, taskIndex) => (taskIndex === index ? { ...task, ...patch } : task))
    );
  };

  const removeTask = (index) => {
    setDraftTasks((current) => current.filter((_, taskIndex) => taskIndex !== index));
  };

  const toggleAll = () => {
    const allSelected = draftTasks.length > 0 && draftTasks.every((task) => task.selected);
    setDraftTasks((current) => current.map((task) => ({ ...task, selected: !allSelected })));
  };

  const handleSave = async () => {
    const selected = draftTasks.filter((task) => task.selected);
    if (!selected.length) {
      toast.error('Select at least one task to save.');
      return;
    }
    const invalid = selected.find((task) => !task.title.trim());
    if (invalid) {
      toast.error('Every selected task needs a title.');
      return;
    }

    setSaving(true);
    try {
      const result = await aiService.savePlan({
        goalTitle: plan?.title || goal.trim(),
        tasks: selected.map(({ selected: _selected, estimatedMinutes: _estimated, ...task }) => ({
          ...task,
          title: task.title.trim(),
        })),
      });
      setSavedCount(result.count || selected.length);
      toast.success(`${result.count || selected.length} tasks added to your workspace.`);
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'The selected tasks could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  if (!configured) {
    return (
      <div className="mt-5 space-y-5">
        <NotConfiguredNotice />
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Manual planning still works</h3>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-ink-500 dark:text-ink-400">
            Create tasks with real dates and priorities from the Tasks page. Your AI coach will analyse
            them as soon as the provider is configured.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-5">
      <Card className="overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-brand-500" />
            <div>
              <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                Turn a goal into a plan
              </h2>
              <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                The planner uses your real workload, working hours, and habits. Nothing is saved until
                you approve it.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerate}>
          <div className="space-y-4 px-5 py-5 sm:px-6">
            {error ? <FormAlert>{error}</FormAlert> : null}
            <Textarea
              label="What do you want to achieve?"
              rows={3}
              value={goal}
              onChange={(event) => {
                setGoal(event.target.value);
                setErrors((current) => ({ ...current, goal: '' }));
              }}
              error={errors.goal}
              placeholder="e.g. Prepare for software engineering interviews in 30 days"
              hint="Include the outcome and any constraints you care about."
              required
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Deadline"
                type="date"
                min={tomorrow}
                value={deadline}
                onChange={(event) => {
                  setDeadline(event.target.value);
                  setErrors((current) => ({ ...current, deadline: '' }));
                }}
                error={errors.deadline}
                hint="Leave empty for a 90-day window."
              />
              <Select
                label="Daily planning time"
                value={dailyMinutes}
                onChange={(event) => setDailyMinutes(event.target.value)}
                hint="Used to keep the schedule realistic."
              >
                {MINUTE_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </Select>
              <div className="flex items-end">
                <Button
                  type="submit"
                  loading={loading}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                  className="w-full"
                >
                  Generate plan
                </Button>
              </div>
            </div>
            <p className="text-[0.65rem] leading-4 text-ink-400 dark:text-ink-500">
              AI plans are suggestions. Review dates and priorities before saving — only your approved
              tasks are written to MongoDB.
            </p>
          </div>
        </form>
      </Card>

      {!plan ? (
        <Card>
          <EmptyState
            icon={Lightbulb}
            title="Your next plan will appear here"
            description="Describe one meaningful goal. Tracky AI will break it into tasks and a realistic daily schedule for you to review."
          />
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand" dot>
                    AI suggestion
                  </Badge>
                  {plan.model ? <Badge variant="outline">{plan.model}</Badge> : null}
                </div>
                <h2 className="mt-2 font-display text-lg font-bold tracking-[-0.025em] text-ink-900 dark:text-white">
                  {plan.title}
                </h2>
                {plan.deadline ? (
                  <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                    Target deadline {formatDate(plan.deadline, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                ) : null}
                {plan.summary ? (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600 dark:text-ink-300">
                    {plan.summary}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="neutral">{selectedCount} of {draftTasks.length} selected</Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-3 dark:border-white/[0.06] sm:px-6">
              <button
                type="button"
                onClick={toggleAll}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400"
              >
                <ListChecks className="h-3.5 w-3.5" />
                {draftTasks.length > 0 && draftTasks.every((task) => task.selected)
                  ? 'Deselect all'
                  : 'Select all'}
              </button>
              <span className="text-[0.68rem] text-ink-400 dark:text-ink-500">
                Edit any title, date, or priority before saving.
              </span>
            </div>

            {draftTasks.length ? (
              <div className="space-y-2.5 px-5 py-5 sm:px-6">
                {draftTasks.map((task, index) => (
                  <SuggestedTask
                    key={`${task.title}-${index}`}
                    task={task}
                    index={index}
                    onChange={updateTask}
                    onRemove={removeTask}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={ListChecks}
                title="No suggested tasks left"
                description="Generate a new plan or add tasks manually."
              />
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-[0.65rem] text-ink-400 dark:text-ink-500">
                {savedCount
                  ? `${savedCount} tasks were saved. You can still save more.`
                  : 'Only approved tasks are saved to MongoDB.'}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  as={Link}
                  to="/coach?tab=chat"
                  leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                >
                  Discuss with coach
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  loading={saving}
                  disabled={!draftTasks.length}
                  leftIcon={<Check className="h-4 w-4" />}
                >
                  Save approved tasks
                </Button>
              </div>
            </div>
            {savedCount ? (
              <div className="flex items-center justify-between gap-3 border-t border-ink-100 bg-success-50/60 px-5 py-3 dark:border-white/[0.06] dark:bg-success-500/[0.07] sm:px-6">
                <p className="flex items-center gap-2 text-xs font-medium text-success-700 dark:text-success-500">
                  <CheckCircle2 className="h-4 w-4" />
                  Your approved tasks now have real due dates in your workspace.
                </p>
                <Link
                  to="/tasks"
                  className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-lg text-xs font-semibold text-success-700 dark:text-success-500"
                >
                  View tasks <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : null}
          </Card>

          {plan.schedule?.length ? (
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-500" />
                <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Suggested schedule</h3>
              </div>
              <div className="mt-4 space-y-3">
                {plan.schedule.map((entry) => (
                  <div key={`${entry.date}-${entry.focus}`} className="flex gap-3">
                    <div className="w-24 shrink-0 text-[0.68rem] font-semibold text-ink-500 dark:text-ink-400">
                      {formatDate(entry.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="min-w-0 flex-1 rounded-xl bg-ink-50/70 px-3 py-2 dark:bg-white/[0.03]">
                      {entry.focus ? (
                        <p className="text-xs font-semibold text-ink-800 dark:text-ink-100">{entry.focus}</p>
                      ) : null}
                      {entry.tasks?.length ? (
                        <p className="mt-0.5 text-[0.68rem] leading-5 text-ink-500 dark:text-ink-400">
                          {entry.tasks.join(' · ')}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {plan.tips?.length ? (
            <Card className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-white">
                <Lightbulb className="h-4 w-4 text-warning-500" />
                Planning tips
              </h3>
              <ul className="mt-3 space-y-2">
                {plan.tips.map((tip, index) => (
                  <li key={`${tip}-${index}`} className="flex items-start gap-2 text-xs leading-5 text-ink-600 dark:text-ink-300">
                    <Plus className="mt-0.5 h-3 w-3 shrink-0 text-brand-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
