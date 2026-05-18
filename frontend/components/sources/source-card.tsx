import { FileText } from 'lucide-react';
import type { SourceCitation } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SourceCardProps {
  source: SourceCitation;
  index: number;
  selected?: boolean;
  onClick: () => void;
}

function getSourceTypeColor(sourceType: string) {
  switch (sourceType) {
    case 'pdf': return 'text-amber-400';
    case 'markdown': return 'text-primary';
    default: return 'text-muted-foreground';
  }
}

function getSimilarityColor(similarity: number) {
  if (similarity >= 0.85) return 'bg-emerald-900 text-emerald-400';
  if (similarity >= 0.7) return 'bg-amber-900 text-amber-400';
  return 'bg-red-900 text-red-400';
}

export function SourceCard({ source, index, selected, onClick }: SourceCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-background border rounded-md p-2.5 mb-2 cursor-pointer transition-colors',
        selected ? 'border-primary/50' : 'border-border hover:border-border/80'
      )}
    >
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-1.5">
          <FileText className={cn('w-3 h-3', getSourceTypeColor(source.source_type))} />
          <span className={cn('text-base font-medium', getSourceTypeColor(source.source_type))}>
            {source.document_name}
          </span>
        </div>
        <span className={cn('px-1.5 py-0.5 rounded text-base font-semibold', getSimilarityColor(source.similarity))}>
          {Math.round(source.similarity * 100)}%
        </span>
      </div>
      {source.chunk_content && (
        <div className="text-muted-foreground text-base leading-relaxed mb-1.5 line-clamp-2">
          {source.chunk_content.substring(0, 150)}...
        </div>
      )}
      <div className="flex gap-2 items-center text-muted-foreground text-base">
        <span>chunk {source.chunk_index}</span>
        <span className="text-border">·</span>
        <span>{source.source_type}</span>
      </div>
    </div>
  );
}
