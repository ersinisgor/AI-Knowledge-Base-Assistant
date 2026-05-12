import type { RetrievalMetadata } from '@/lib/types';

export function RetrievalConfig({ metadata }: { metadata?: RetrievalMetadata }) {
  const configEntries = [
    { label: 'Strategy', value: 'Hybrid (BM25 + Vector)' },
    { label: 'Embedding', value: 'text-embedding-3-small' },
    { label: 'Vector DB', value: 'pgvector (HNSW)' },
    { label: 'Reranker', value: 'Cohere Rerank v3' },
  ];

  return (
    <div className="px-3.5 py-2.5 border-b border-border">
      <div className="text-muted-foreground text-[9px] uppercase tracking-wider mb-2">
        Retrieval Configuration
      </div>
      <div className="flex flex-col gap-1.5">
        {configEntries.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-muted-foreground text-[10px]">{label}</span>
            <span className="text-foreground text-[10px] font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
