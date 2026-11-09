import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { settingsService } from '../services/settingsService';

export const DEFAULT_SETTINGS = {
  dailyCompletionTarget: 60,
  weeklyGoals: {
    tasks: 20,
    habits: 25,
    productivityScore: 75,
  },
  notifications: {
    xpAlerts: true,
    achievementAlerts: true,
    weeklySummary: true,
    dailyReminder: false,
    reminderTime: '09:00',
    taskReminders: true,
    habitReminders: true,
    streakMilestones: true,
    dailyGoal: true,
    dailyReports: true,
    weeklyReports: true,
    browserNotifications: false,
  },
  coachTone: 'supportive',
  coachDetail: 'concise',
};

const SettingsContext = createContext(null);

function mergeSettings(value) {
  if (!value) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    weeklyGoals: { ...DEFAULT_SETTINGS.weeklyGoals, ...(value.weeklyGoals || {}) },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(value.notifications || {}),
    },
  };
}

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!user) {
      setSettings(null);
      return null;
    }
    setLoading(true);
    setError('');
    try {
      const result = await settingsService.get();
      setSettings(mergeSettings(result));
      return result;
    } catch (requestError) {
      setError(requestError?.message || 'Unable to load settings.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!user) {
      setSettings(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError('');
    settingsService
      .get()
      .then((result) => {
        if (active) setSettings(mergeSettings(result));
      })
      .catch(() => {
        if (active) setSettings(mergeSettings(null));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback(async (payload) => {
    const result = await settingsService.update(payload);
    setSettings(mergeSettings(result));
    return result;
  }, []);

  const resolved = useMemo(() => mergeSettings(settings), [settings]);
  const value = useMemo(
    () => ({
      settings: resolved,
      loading,
      error,
      refresh,
      update,
      xpAlertsEnabled: resolved.notifications.xpAlerts !== false,
      achievementAlertsEnabled: resolved.notifications.achievementAlerts !== false,
    }),
    [resolved, loading, error, refresh, update]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used inside a SettingsProvider.');
  }
  return context;
}
