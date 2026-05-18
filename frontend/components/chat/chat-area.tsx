'use client';

import { useState } from 'react';
import { useChat } from '@/hooks/use-chat';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { RetrievalStatus } from './retrieval-status';
import { QueryTransformation } from './query-transformation';
import { StreamingIndicator } from './streaming-indicator';
import { SourcesPanel } from '@/components/sources/sources-panel';

interface ChatAreaProps {
  sessionId?: string;
}

export function ChatArea({ sessionId }: ChatAreaProps) {
  const {
    messages,
    isLoading,
    sessionLoadError,
    streamingContent,
    lastResponse,
    sendMessage,
    stopGeneration,
  } = useChat(sessionId);

  const [showSources, setShowSources] = useState(true);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState<number | null>(null);

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="h-full flex">
      {/* Chat Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="px-5 py-3 border-b border-border flex justify-between items-center">
          <span className="text-foreground font-medium text-base">
            {messages.length > 0 ? 'Conversation' : 'New Chat'}
          </span>
          <button
            onClick={() => setShowSources(!showSources)}
            className="px-2.5 py-1 bg-card border border-border rounded-md text-muted-foreground text-base flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
            </svg>
            Sources
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
              onSourceClick={(idx) => setSelectedSourceIndex(idx)}
            />
          ))}

          {/* Retrieval status */}
          {isLoading && !streamingContent && (
            <RetrievalStatus isLoading={true} metadata={undefined} />
          )}

          {/* Query transformation */}
          {lastResponse?.retrieval_metadata?.rewritten_query && lastUserMessage && (
            <QueryTransformation
              original={lastUserMessage.content}
              rewritten={lastResponse.retrieval_metadata.rewritten_query}
            />
          )}

          {/* Streaming indicator */}
          {streamingContent && (
            <StreamingIndicator content={streamingContent} onStop={stopGeneration} />
          )}

          {/* Session load error */}
          {sessionLoadError && messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium text-base">Could not load conversation</p>
                <p className="text-muted-foreground text-base mt-1">{sessionLoadError}</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {messages.length === 0 && !isLoading && !sessionLoadError && (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium text-base">Ask a question</p>
                <p className="text-muted-foreground text-base mt-1">Query your knowledge base for accurate, cited answers</p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>

      {/* Sources Panel */}
      {showSources && (
        <SourcesPanel
          sources={lastResponse?.sources || lastAssistantMessage?.sources || []}
          metadata={lastResponse?.retrieval_metadata}
          selectedIndex={selectedSourceIndex}
          onSelect={(idx) => setSelectedSourceIndex(idx)}
        />
      )}
    </div>
  );
}
