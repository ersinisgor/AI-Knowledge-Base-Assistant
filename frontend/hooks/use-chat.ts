'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ChatResponse } from '@/lib/types';
import { api } from '@/lib/api';

export function useChat(initialSessionId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | undefined>(initialSessionId);

  useEffect(() => {
    sessionIdRef.current = initialSessionId;
    setMessages([]);
    setStreamingContent('');
    setLastResponse(null);

    if (!initialSessionId) return;

    setIsLoading(true);
    fetch(`/api/sessions/${initialSessionId}`)
      .then((res) => res.json())
      .then((data: ChatMessage[]) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [initialSessionId]);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');
    setLastResponse(null);

    try {
      const isNewSession = !sessionIdRef.current;
      const response = await api.chat.send(content, sessionIdRef.current);
      sessionIdRef.current = response.session_id;
      setLastResponse(response);

      if (isNewSession) {
        window.dispatchEvent(new CustomEvent('chat:session-created'));
      }

      const fullText = response.answer;
      let revealed = '';
      for (let i = 0; i < fullText.length; i++) {
        if (abortRef.current?.signal.aborted) break;
        revealed += fullText[i];
        setStreamingContent(revealed);
        await new Promise((r) => setTimeout(r, 15));
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: fullText,
        sources: response.sources,
        retrieval_metadata: response.retrieval_metadata,
        model: response.model,
        latency_ms: response.latency_ms,
        tokens_used: response.tokens_used,
        retrieval_confidence: response.retrieval_confidence,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, an error occurred. Please try again.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setLastResponse(null);
    sessionIdRef.current = undefined;
  }, []);

  return {
    messages,
    isLoading,
    streamingContent,
    lastResponse,
    sessionId: sessionIdRef.current,
    sendMessage,
    stopGeneration,
    clearChat,
  };
}
