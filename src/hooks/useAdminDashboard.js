import { useCallback, useEffect, useState } from 'react';
import { fetchAdminDashboard } from '../services/api';

export function useAdminDashboard(range = '30_DAYS') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    const result = await fetchAdminDashboard(range);
    if (result.ok) {
      setData(result.data);
      setError('');
    } else {
      setError(result.error || 'Could not load admin dashboard data.');
    }
    setLoading(false);
    setRefreshing(false);
  }, [range]);

  useEffect(() => {
    refresh(true);
    const timer = window.setInterval(() => refresh(false), 30000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh(false);
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refresh]);

  return { data, loading, refreshing, error, refresh: () => refresh(false) };
}
