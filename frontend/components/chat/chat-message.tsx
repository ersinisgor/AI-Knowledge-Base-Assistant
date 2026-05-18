import { Layers } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { ModelBadge } from './model-badge';
import { ConfidenceWarning } from './confidence-warning';

interface ChatMessageProps {
  message: ChatMessageType;
  onSourceClick?: (index: number) => void;
}

export function ChatMessage({ message, onSourceClick }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="mb-6 max-w-[75%] ml-auto">
        <div className="bg-secondary text-foreground px-4 py-3 rounded-lg text-base leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex gap-3">
      <div className="w-[26px] h-[26px] bg-primary rounded-md flex items-center justify-center shrink-0 mt-0.5">
        <Layers className="w-3 h-3 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <ConfidenceWarning
          confidence={message.retrieval_confidence}
          sourcesCount={message.sources?.length}
        />
        <div className="text-foreground text-base leading-relaxed">
          {message.content}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2.5 flex gap-1.5 flex-wrap items-center">
            {message.sources.map((source, i) => (
              <button
                key={i}
                onClick={() => onSourceClick?.(i)}
                className="bg-primary/10 border border-primary/20 text-primary px-2.5 py-[3px] rounded text-base hover:bg-primary/20 transition-colors"
              >
                [{i + 1}] {source.document_name}
              </button>
            ))}
            {(message.model || message.latency_ms || message.tokens_used) && (
              <>
                <span className="text-border text-base">|</span>
                <ModelBadge
                  model={message.model}
                  latencyMs={message.latency_ms}
                  tokensUsed={message.tokens_used}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
