import { useEffect, useId, useState } from 'react';
import { CalendarDays, Check, Repeat2, Target } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Input';
import FormAlert from '../auth/FormAlert';
import { habitService } from '../../services/habitService';
import { useToast } from '../../context/ToastContext';
import { HABIT_CATEGORIES, TARGET_UNITS } from '../../utils/constants';
import { getWeekdayOptions } from '../../utils/date';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';

const WEEKDAYS = getWeekdayOptions();

function emptyForm() {
  return {
    name: '',
    description: '',
    category: 'Personal',
    frequency: 'daily',
    daysOfWeek: [],
    targetValue: '1',
    targetUnit: 'times',
  };
}

export default function HabitModal({ open, onClose, habit, onSaved }) {
  const { toast } = useToast();
  const formId = useId();
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(habit);

  useEffect(() => {
    if (!open) return;
    if (habit) {
      setForm({
        name: habit.name || '',
        description: habit.description || '',
        category: habit.category || 'Personal',
        frequency: habit.frequency || 'daily',
        daysOfWeek: Array.isArray(habit.daysOfWeek) ? habit.daysOfWeek : [],
        targetValue: String(habit.target?.value ?? 1),
        targetUnit: habit.target?.unit || 'times',
      });
    } else {
      setForm(emptyForm());
    }
    setFieldErrors({});
    setError('');
  }, [open, habit]);

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
    if (error) setError('');
  };

  const handleFrequency = (frequency) => {
    setForm((current) => ({
      ...current,
      frequency,
      daysOfWeek:
        frequency === 'weekly' && current.daysOfWeek.length === 0
          ? [1, 2, 3, 4, 5]
          : frequency === 'daily'
            ? []
            : current.daysOfWeek,
    }));
    setFieldErrors((current) => ({ ...current, daysOfWeek: '' }));
  };

  const toggleDay = (day) => {
    setForm((current) => ({
      ...current,
      daysOfWeek: current.daysOfWeek.includes(day)
        ? current.daysOfWeek.filter((value) => value !== day)
        : [...current.daysOfWeek, day],
    }));
    setFieldErrors((current) => ({ ...current, daysOfWeek: '' }));
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Give your habit a name.';
    if (form.frequency === 'weekly' && form.daysOfWeek.length === 0) {
      errors.daysOfWeek = 'Select at least one day.';
    }
    const target = Number(form.targetValue);
    if (!Number.isFinite(target) || target <= 0) {
      errors.targetValue = 'Enter a target greater than zero.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      frequency: form.frequency,
      daysOfWeek: form.frequency === 'weekly' ? form.daysOfWeek : [],
      target: {
        value: Number(form.targetValue),
        unit: form.targetUnit,
      },
    };

    setSaving(true);
    try {
      const saved = isEditing
        ? await habitService.update(habit._id, payload)
        : await habitService.create(payload);
      toast.success(isEditing ? 'Habit updated.' : 'Habit created.');
      onSaved?.(saved);
      onClose();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not save this habit. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Edit habit' : 'Create a habit'}
      description={
        isEditing
          ? 'Adjust the rhythm so it continues to fit your real life.'
          : 'Start small enough to repeat, and meaningful enough to keep.'
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {isEditing ? 'Save changes' : 'Create habit'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? <FormAlert>{error}</FormAlert> : null}

        <Input
          label="Habit name"
          placeholder="e.g. Read for 20 minutes"
          value={form.name}
          onChange={setField('name')}
          error={fieldErrors.name}
          autoFocus
          required
        />

        <Textarea
          label="Description"
          placeholder="Why does this habit matter to you?"
          value={form.description}
          onChange={setField('description')}
          rows={3}
          hint="Optional"
        />

        <Select label="Category" value={form.category} onChange={setField('category')}>
          {HABIT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>

        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-700 dark:text-ink-200">
            <Repeat2 className="h-3.5 w-3.5 text-ink-400" />
            Frequency
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'daily', label: 'Every day', icon: Repeat2 },
              { value: 'weekly', label: 'Selected days', icon: CalendarDays },
            ].map((option) => {
              const Icon = option.icon;
              const active = form.frequency === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFrequency(option.value)}
                  className={cn(
                    'focus-ring flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition',
                    active
                      ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-brand-300'
                      : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300 hover:bg-ink-50 dark:border-white/10 dark:bg-white/[0.025] dark:text-ink-400 dark:hover:bg-white/[0.05]'
                  )}
                  aria-pressed={active}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {form.frequency === 'weekly' ? (
          <div>
            <p className="mb-2 text-[0.8125rem] font-semibold text-ink-700 dark:text-ink-200">
              Days of the week
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((day) => {
                const active = form.daysOfWeek.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      'focus-ring flex h-9 items-center justify-center rounded-lg border text-[0.68rem] font-semibold transition',
                      active
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.025] dark:text-ink-400'
                    )}
                    aria-pressed={active}
                    aria-label={day.label}
                  >
                    {active ? <Check className="h-3.5 w-3.5" /> : day.short}
                  </button>
                );
              })}
            </div>
            {fieldErrors.daysOfWeek ? (
              <p className="mt-1.5 text-xs font-medium text-danger-600 dark:text-danger-500">
                {fieldErrors.daysOfWeek}
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-700 dark:text-ink-200">
            <Target className="h-3.5 w-3.5 text-ink-400" />
            Daily target
          </p>
          <div className="grid grid-cols-[1fr_1.25fr] gap-3">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={form.targetValue}
              onChange={setField('targetValue')}
              error={fieldErrors.targetValue}
              aria-label="Target amount"
            />
            <Select value={form.targetUnit} onChange={setField('targetUnit')} aria-label="Target unit">
              {TARGET_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </Select>
          </div>
          <p className="mt-1.5 text-xs text-ink-400 dark:text-ink-500">
            Completion history is recorded by date, ready for deeper insights later.
          </p>
        </div>
      </form>
    </Modal>
  );
}
