'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ChatSession } from '@/lib/types';
import { api } from '@/lib/api';

export function useSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api.chat.getSessions();
      setSessions(data);
    } catch {
      // Sessions are non-critical, silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, refetch: fetchSessions };
}
