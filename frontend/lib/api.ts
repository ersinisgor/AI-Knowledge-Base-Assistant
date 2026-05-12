import type {
  ChatResponse,
  Document,
  IngestResponse,
  ChatSession,
} from './types';

const API_BASE = '/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  chat: {
    send(message: string, sessionId?: string): Promise<ChatResponse> {
      return fetchAPI('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, session_id: sessionId }),
      });
    },
    getSessions(): Promise<ChatSession[]> {
      return fetchAPI('/sessions');
    },
  },

  documents: {
    list(): Promise<Document[]> {
      return fetchAPI('/documents');
    },
    create(data: { content: string; source_type: string; metadata?: Record<string, unknown> }): Promise<Document> {
      return fetchAPI('/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  ingestion: {
    process(data: { content: string; source_type: string; fileName?: string; metadata?: Record<string, unknown> }): Promise<IngestResponse> {
      return fetchAPI('/ingestion', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
};
