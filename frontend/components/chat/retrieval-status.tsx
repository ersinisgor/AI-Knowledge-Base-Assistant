import { Loader2, Check } from 'lucide-react';
import type { RetrievalMetadata } from '@/lib/types';

interface RetrievalStatusProps {
  isLoading: boolean;
  metadata?: RetrievalMetadata;
}

export function RetrievalStatus({ isLoading, metadata }: RetrievalStatusProps) {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      {isLoading && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          <span className="text-primary text-xs">Searching indexed knowledge base...</span>
        </div>
      )}
      {metadata && (
        <>
          <div className="flex items-center gap-2 pl-1">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-muted-foreground text-xs">
              Retrieved {metadata.sources_found} relevant sources
            </span>
          </div>
          <div className="flex items-center gap-2 pl-1">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-muted-foreground text-xs">
              {metadata.confidence === 'high' ? 'High' : metadata.confidence === 'medium' ? 'Medium' : 'Low'} confidence retrieval ({metadata.sources_found} sources)
            </span>
          </div>
        </>
      )}
    </div>
  );
}
