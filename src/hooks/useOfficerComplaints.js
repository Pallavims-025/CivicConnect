import { useCallback, useEffect, useState } from 'react';
import { getOfficerComplaints } from '../services/api';
import { isMunicipalComplaintEligible } from '../lib/municipalComplaintEligibility';

export function useOfficerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const result = await getOfficerComplaints();
      const unique = new Map();
      for (const complaint of result?.complaints || []) {
        if (!isMunicipalComplaintEligible(complaint)) continue;
        const photos = [...new Set((complaint.photos || []).map((photo) => typeof photo === 'string' ? photo.trim() : '').filter(Boolean))];
        unique.set(complaint.databaseId || complaint.id, { ...complaint, photos });
      }
      setComplaints([...unique.values()]);
      setError('');
    } catch (fetchError) {
      setError(fetchError.message || 'Could not load complaints from the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh(true);
    const timer = window.setInterval(() => refresh(false), 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { complaints, setComplaints, loading, refreshing, error, refresh };
}
