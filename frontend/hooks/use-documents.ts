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
    async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'pdf') {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload-pdf', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'PDF upload failed');
        }
        await fetchDocuments();
        return res.json();
      } else {
        const content = await file.text();
        const result = await api.ingestion.process({
          content,
          source_type: 'markdown',
          metadata: { fileName: file.name },
        });
        await fetchDocuments();
        return result;
      }
    },
    [fetchDocuments]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      await fetchDocuments();
    },
    [fetchDocuments]
  );

  return { documents, loading, uploadDocument, deleteDocument, refetch: fetchDocuments };
}
