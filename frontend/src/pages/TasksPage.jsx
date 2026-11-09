import { useCallback, useEffect, useRef, useState } from 'react';
import { ListTodo, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Loaders';
import TaskItem from '../components/tasks/TaskItem';
import TaskModal from '../components/tasks/TaskModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Input, Select } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useDebounce } from '../hooks/useDebounce';
import { useRewardToast } from '../hooks/useRewardToast';
import { taskService } from '../services/taskService';
import { PRIORITIES, TASK_SORT_OPTIONS } from '../utils/constants';
import { relativeDateLabel, todayKey } from '../utils/date';
import { getErrorMessage } from '../utils/errors';
import { cn } from '../utils/cn';

const STATUS_TABS = [
  { value: 'all', label: 'All tasks' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

function TasksSkeleton() {
  return (
    <div className="page-container">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-11 w-28" />
      </div>
      <Card className="mt-7 p-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
        </div>
      </Card>
      <Card className="mt-5 p-5">
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function TasksPage() {
  usePageTitle('My Tasks');
  const { user } = useAuth();
  const { toast } = useToast();
  const { showRewards } = useRewardToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    sort: 'dueDate',
    search: '',
  });
  const debouncedSearch = useDebounce(filters.search, 320);
  const requestId = useRef(0);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadTasks = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setLoading(true);
    setError('');
    try {
      const results = await taskService.list({
        status: filters.status,
        priority: filters.priority,
        sort: filters.sort,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      });
      if (requestId.current === currentRequest) setTasks(results);
    } catch (requestError) {
      if (requestId.current === currentRequest) {
        setError(getErrorMessage(requestError, 'We could not load your tasks.'));
      }
    } finally {
      if (requestId.current === currentRequest) {
        setLoading(false);
        setHasLoaded(true);
      }
    }
  }, [filters.status, filters.priority, filters.sort, debouncedSearch]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const setFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.sort !== 'dueDate' ||
    Boolean(filters.search.trim());

  const clearFilters = () => {
    setFilters({ status: 'all', priority: 'all', sort: 'dueDate', search: '' });
  };

  const openNewTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleToggle = async (task) => {
    setBusyTaskId(task._id);
    try {
      const completed = task.status !== 'completed';
      const result = await taskService.setCompleted(task._id, completed);
      if (completed && result.nextTask) {
        toast.success('Task completed.', {
          description: `The next occurrence is scheduled for ${relativeDateLabel(
            result.nextTask.dueDate
          )}.`,
        });
      } else {
        toast.success(completed ? 'Task completed.' : 'Task marked as pending.');
      }
      if (completed) showRewards(result.rewards);
      await loadTasks();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'We could not update that task.'));
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await taskService.remove(deleteTarget._id);
      toast.success('Task deleted.');
      setDeleteTarget(null);
      await loadTasks();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'We could not delete that task.'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !hasLoaded) return <TasksSkeleton />;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Plan with intention"
        title="My Tasks"
        description="A clear place for everything that needs your attention — organized by when it matters, not how loud it feels."
        actions={
          <Button onClick={openNewTask} leftIcon={<Plus className="h-4 w-4" />}>
            New task
          </Button>
        }
      />

      <Card className="mt-7 p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="inline-flex rounded-xl bg-ink-100/80 p-1 dark:bg-white/[0.04]">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter('status', tab.value)}
                className={cn(
                  'focus-ring flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  filters.status === tab.value
                    ? 'bg-white text-ink-900 shadow-sm dark:bg-white/[0.09] dark:text-white'
                    : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white'
                )}
                aria-pressed={filters.status === tab.value}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <Input
              value={filters.search}
              onChange={(event) => setFilter('search', event.target.value)}
              placeholder="Search titles, categories, or tags…"
              leftIcon={<Search className="h-4 w-4" />}
              rightElement={
                filters.search ? (
                  <button
                    type="button"
                    onClick={() => setFilter('search', '')}
                    className="focus-ring rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/[0.06]"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null
              }
              aria-label="Search tasks"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 xl:flex">
            <Select
              value={filters.priority}
              onChange={(event) => setFilter('priority', event.target.value)}
              className="min-w-0 xl:w-36"
              aria-label="Filter by priority"
            >
              <option value="all">All priorities</option>
              {PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label} priority
                </option>
              ))}
            </Select>

            <Select
              value={filters.sort}
              onChange={(event) => setFilter('sort', event.target.value)}
              className="min-w-0 xl:w-40"
              aria-label="Sort tasks"
            >
              {TASK_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <div className="mt-5 flex items-center justify-between gap-3 px-0.5">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-400 dark:text-ink-500">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {loading ? (
            'Updating list…'
          ) : (
            <>
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              {filters.status !== 'all' ? ` · ${filters.status}` : ''}
            </>
          )}
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="focus-ring rounded-lg text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-2">
        {error ? (
          <ErrorState message={error} onRetry={loadTasks} />
        ) : tasks.length ? (
          <Card className={cn('transition-opacity', loading && 'opacity-60')}>
            {tasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                onToggle={handleToggle}
                onEdit={openEditTask}
                onDelete={setDeleteTarget}
                busy={busyTaskId === task._id}
              />
            ))}
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={ListTodo}
              title={hasActiveFilters ? 'No tasks match these filters' : 'Your task list is ready'}
              description={
                hasActiveFilters
                  ? 'Try a different search or reset the filters to see everything.'
                  : 'Add your first task and give the day a little more direction.'
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" onClick={openNewTask} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                    Create a task
                  </Button>
                )
              }
            />
          </Card>
        )}
      </div>

      <TaskModal
        open={taskModalOpen}
        task={editingTask}
        defaultDate={todayKey(user?.timezone)}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSaved={loadTasks}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this task?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” will be removed permanently. This cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
