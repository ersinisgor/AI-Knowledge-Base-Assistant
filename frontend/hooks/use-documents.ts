'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Document } from '@/lib/types';
import { api } from '@/lib/api';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await api.documents.list();
      setDocuments(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = useCallback(
    async (content: string, fileName: string) => {
      const ext = fileName.split('.').pop()?.toLowerCase();
      const sourceType = ext === 'pdf' ? 'pdf' : 'markdown';

      const result = await api.ingestion.process({
        content,
        source_type: sourceType,
        fileName,
        metadata: { fileName },
      });

      await fetchDocuments();
      return result;
    },
    [fetchDocuments]
  );

  return { documents, loading, uploadDocument, refetch: fetchDocuments };
}
