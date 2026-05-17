'use client';

import { FileText, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { SourceCitation } from '@/lib/types';

interface SourcePreviewProps {
  source: SourceCitation | null;
  open: boolean;
  onClose: () => void;
}

export function SourcePreview({ source, open, onClose }: SourcePreviewProps) {
  if (!source) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[420px] bg-card border-border p-0">
        <SheetHeader className="px-4 py-3 border-b border-border flex flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <SheetTitle className="text-foreground text-base font-semibold">
              {source.document_name}
            </SheetTitle>
          </div>
        </SheetHeader>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex gap-2 mb-3.5 flex-wrap">
            <span className="bg-background border border-border px-2.5 py-[3px] rounded text-base text-muted-foreground">
              {source.source_type}
            </span>
            <span className="bg-background border border-border px-2.5 py-[3px] rounded text-base text-muted-foreground">
              Chunk {source.chunk_index}
            </span>
            <span className="bg-emerald-900 border border-emerald-900 px-2.5 py-[3px] rounded text-base text-emerald-400">
              {Math.round(source.similarity * 100)}% similar
            </span>
          </div>
          <div className="text-foreground/80 text-base leading-relaxed bg-background rounded-md p-3 border border-border">
            {source.chunk_content || 'No content available'}
          </div>
          <button className="mt-2.5 text-primary text-base flex items-center gap-1 hover:underline">
            <ChevronDown className="w-3 h-3" />
            Show surrounding context
          </button>
        </div>
        <div className="px-4 py-2.5 border-t border-border flex justify-between items-center">
          <span className="text-muted-foreground text-base">Source document</span>
          <span className="text-primary text-base cursor-pointer hover:underline">
            View full document →
          </span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
