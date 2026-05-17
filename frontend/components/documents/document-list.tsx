'use client';

import { useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import type { Document } from '@/lib/types';
import { IngestionProgress } from './ingestion-progress';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  indexed: 'bg-emerald-900 text-emerald-400',
  embedding: 'bg-amber-900 text-amber-400',
  chunking: 'bg-amber-900 text-amber-400',
  parsing: 'bg-amber-900 text-amber-400',
  uploaded: 'bg-muted text-muted-foreground',
  failed: 'bg-red-900 text-red-400',
};

function getSourceTypeColor(sourceType: string) {
  return sourceType === 'pdf' ? 'text-amber-400' : 'text-primary';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface DocumentListProps {
  documents: Document[];
  onDelete?: (id: string) => Promise<void>;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-base">
        No documents yet. Upload your first file above.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.8fr_2rem] px-3.5 py-2 border-b border-border text-muted-foreground text-base uppercase tracking-wider">
        <span>Document</span>
        <span>Ingestion Progress</span>
        <span>Status</span>
        <span>Chunks</span>
        <span>Uploaded</span>
        <span />
      </div>

      {documents.map((doc) => (
        <div
          key={doc.id}
          className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.8fr_2rem] px-3.5 py-2.5 border-b border-border last:border-b-0 items-center"
        >
          <div className="flex items-center gap-2">
            <FileText className={cn('w-3.5 h-3.5', getSourceTypeColor(doc.source_type))} />
            <span className="text-foreground text-base truncate">{doc.metadata?.fileName as string || `document-${doc.id.slice(0, 8)}`}</span>
          </div>
          <IngestionProgress status={doc.status} />
          <span className={cn('px-2 py-0.5 rounded text-base font-medium w-fit', statusStyles[doc.status] || statusStyles.uploaded)}>
            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
          </span>
          <span className="text-foreground text-base">{doc.chunk_count ?? '—'}</span>
          <span className="text-muted-foreground text-base">{timeAgo(doc.created_at)}</span>
          <button
            onClick={() => handleDelete(doc.id)}
            disabled={deletingId === doc.id}
            className="text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
            aria-label="Delete document"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <div className="px-3.5 py-2 flex gap-3">
        {['Uploaded', 'Parsing', 'Chunking', 'Embedding', 'Indexed'].map((stage) => (
          <span key={stage} className="text-muted-foreground text-base flex items-center gap-1">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full',
              stage === 'Embedding' ? 'bg-amber-400' : 'bg-emerald-400'
            )} />
            {stage}
          </span>
        ))}
      </div>
    </div>
  );
}
