import { useEffect, useId, useState } from 'react';
import { Flag, Folder, Tags } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Input';
import FormAlert from '../auth/FormAlert';
import { taskService } from '../../services/taskService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PRIORITIES, TASK_CATEGORIES, RECURRENCES } from '../../utils/constants';
import { dateKeyFromValue, todayKey } from '../../utils/date';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';

function emptyForm(date) {
  return {
    title: '',
    description: '',
    priority: 'medium',
    category: 'Personal',
    tags: '',
    dueDate: date || todayKey(),
    dueTime: '',
    recurrence: 'none',
  };
}

export default function TaskModal({ open, onClose, task, onSaved, defaultDate }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const formId = useId();
  const categoryListId = useId();
  const [form, setForm] = useState(() => emptyForm(defaultDate));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(task);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        category: task.category || 'Personal',
        tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
        dueDate: dateKeyFromValue(task.dueDate) || todayKey(user?.timezone),
        dueTime: task.dueTime || '',
        recurrence: task.recurrence || 'none',
      });
    } else {
      setForm(emptyForm(defaultDate || todayKey(user?.timezone)));
    }
    setFieldErrors({});
    setError('');
  }, [open, task, defaultDate, user?.timezone]);

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
    if (error) setError('');
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  const validate = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Give your task a title.';
    if (!form.dueDate) errors.dueDate = 'Choose a due date.';
    if (!form.category.trim()) errors.category = 'Add a category.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      category: form.category.trim(),
      tags: form.tags,
      dueDate: form.dueDate,
      dueTime: form.dueTime,
      recurrence: form.recurrence,
    };

    setSaving(true);
    try {
      const saved = isEditing
        ? await taskService.update(task._id, payload)
        : await taskService.create(payload);
      toast.success(isEditing ? 'Task updated.' : 'Task created.');
      onSaved?.(saved);
      onClose();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not save this task. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Edit task' : 'Create a task'}
      description={
        isEditing
          ? 'Refine the details without losing the work you have already done.'
          : 'Give the next important thing a clear place in your day.'
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {isEditing ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? <FormAlert>{error}</FormAlert> : null}

        <Input
          label="Task title"
          placeholder="e.g. Review the project proposal"
          value={form.title}
          onChange={setField('title')}
          error={fieldErrors.title}
          autoFocus
          required
        />

        <Textarea
          label="Description"
          placeholder="Add context, a checklist, or anything future-you should know."
          value={form.description}
          onChange={setField('description')}
          rows={3}
          hint="Optional · up to 2,000 characters"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Due date"
            type="date"
            value={form.dueDate}
            onChange={setField('dueDate')}
            error={fieldErrors.dueDate}
            required
          />
          <Input
            label="Due time"
            type="time"
            value={form.dueTime}
            onChange={setField('dueTime')}
            hint="Leave empty for an all-day task."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Category"
            placeholder="e.g. Work"
            value={form.category}
            onChange={setField('category')}
            error={fieldErrors.category}
            leftIcon={<Folder className="h-4 w-4" />}
            list={categoryListId}
            required
          />

          <Input
            label="Tags"
            placeholder="design, focus, client"
            value={form.tags}
            onChange={setField('tags')}
            leftIcon={<Tags className="h-4 w-4" />}
            hint="Separate tags with commas."
          />
        </div>
        <datalist id={categoryListId}>
          {TASK_CATEGORIES.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>

        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-700 dark:text-ink-200">
            <Flag className="h-3.5 w-3.5 text-ink-400" />
            Priority
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((priority) => {
              const active = form.priority === priority.value;
              return (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, priority: priority.value }))}
                  className={cn(
                    'focus-ring flex h-10 items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition',
                    active
                      ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-[inset_0_0_0_1px_rgba(103,70,223,0.08)] dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-brand-300'
                      : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300 hover:bg-ink-50 dark:border-white/10 dark:bg-white/[0.025] dark:text-ink-400 dark:hover:bg-white/[0.05]'
                  )}
                  aria-pressed={active}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} />
                  {priority.label}
                </button>
              );
            })}
          </div>
        </div>

        <Select
          label="Repeat"
          value={form.recurrence}
          onChange={setField('recurrence')}
          hint={
            form.recurrence !== 'none'
              ? 'Completing this task schedules the next occurrence automatically.'
              : 'Choose a rhythm if this task needs to come back.'
          }
        >
          {RECURRENCES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}
