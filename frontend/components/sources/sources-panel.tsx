'use client';

import { useState } from 'react';
import type { SourceCitation, RetrievalMetadata } from '@/lib/types';
import { RetrievalConfig } from './retrieval-config';
import { SourceCard } from './source-card';
import { SourcePreview } from './source-preview';

interface SourcesPanelProps {
  sources: SourceCitation[];
  metadata?: RetrievalMetadata;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function SourcesPanel({ sources, metadata, selectedIndex, onSelect }: SourcesPanelProps) {
  const [previewSource, setPreviewSource] = useState<SourceCitation | null>(null);

  if (sources.length === 0 && !metadata) {
    return (
      <div className="w-[290px] bg-card border-l border-border flex items-center justify-center shrink-0">
        <p className="text-muted-foreground text-base">No sources yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-[290px] bg-card border-l border-border flex flex-col shrink-0">
        <div className="px-3.5 py-3 border-b border-border flex justify-between items-center">
          <span className="text-foreground text-base font-semibold">Sources</span>
          {sources.length > 0 && (
            <span className="bg-primary/15 text-primary px-2 py-0.5 rounded text-base">
              {sources.length} found
            </span>
          )}
        </div>
        <RetrievalConfig metadata={metadata} />
        <div className="flex-1 overflow-y-auto p-2.5">
          {sources.map((source, i) => (
            <SourceCard
              key={i}
              source={source}
              index={i}
              selected={selectedIndex === i}
              onClick={() => {
                onSelect(i);
                setPreviewSource(source);
              }}
            />
          ))}
        </div>
      </div>
      <SourcePreview
        source={previewSource}
        open={!!previewSource}
        onClose={() => setPreviewSource(null)}
      />
    </>
  );
}
