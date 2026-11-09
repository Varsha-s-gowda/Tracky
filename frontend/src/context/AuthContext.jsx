import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { clearStoredToken, getStoredToken, storeToken } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;
    const token = getStoredToken();

    if (!token) {
      setInitializing(false);
      return undefined;
    }

    authService
      .me()
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        clearStoredToken();
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredToken();
      setUser(null);
    };

    window.addEventListener('tracky:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('tracky:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async ({ email, password, remember }) => {
    const data = await authService.login({ email, password, remember });
    storeToken(data.token, Boolean(remember));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    storeToken(data.token, true);
    setUser(data.user);
    return data.user;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const data = await authService.updateProfile(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await authService.me();
    setUser(data.user);
    return data.user;
  }, []);

  const changePassword = useCallback(async (payload) => {
    return authService.changePassword(payload);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
      changePassword,
    }),
    [user, initializing, login, register, logout, updateProfile, refreshUser, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return context;
}
