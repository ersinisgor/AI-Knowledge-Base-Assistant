import { X, Layers } from 'lucide-react';

interface StreamingIndicatorProps {
  content: string;
  onStop: () => void;
}

export function StreamingIndicator({ content, onStop }: StreamingIndicatorProps) {
  return (
    <div className="flex gap-3 mb-6">
      <div className="w-[26px] h-[26px] bg-primary rounded-md flex items-center justify-center shrink-0 mt-0.5">
        <Layers className="w-3 h-3 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <div className="text-foreground text-[13.5px] leading-relaxed">
          {content}
          <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-text-bottom animate-pulse" />
        </div>
        <div className="mt-2">
          <button
            onClick={onStop}
            className="bg-red-500/15 border border-red-500/30 text-red-400 px-2.5 py-1 rounded text-[11px] inline-flex items-center gap-1 hover:bg-red-500/25 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
            Stop generating
          </button>
        </div>
      </div>
    </div>
  );
}
