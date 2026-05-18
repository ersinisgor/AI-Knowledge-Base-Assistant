'use client';

import { useState } from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { SourceCitation } from '@/lib/types';

interface SourcePreviewProps {
  source: SourceCitation | null;
  open: boolean;
  onClose: () => void;
}

export function SourcePreview({ source, open, onClose }: SourcePreviewProps) {
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);

  const handleClose = () => {
    setFullContent(null);
    onClose();
  };

  const handleViewFullDocument = async () => {
    if (!source) return;
    setLoadingFull(true);
    try {
      const res = await fetch(`/api/documents/${source.document_id}`);
      const doc = await res.json();
      setFullContent(doc.content ?? 'No content available');
    } catch {
      setFullContent('Failed to load document.');
    } finally {
      setLoadingFull(false);
    }
  };

  if (!source) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="right" className="w-[420px] bg-card border-border p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border flex flex-row justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            {fullContent && (
              <button onClick={() => setFullContent(null)} className="text-muted-foreground hover:text-foreground mr-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <FileText className="w-3.5 h-3.5 text-primary" />
            <SheetTitle className="text-foreground text-base font-semibold">
              {source.document_name}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="p-4 flex-1 overflow-y-auto">
          {fullContent ? (
            <div className="text-foreground/80 text-base leading-relaxed whitespace-pre-wrap">
              {fullContent}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {!fullContent && (
          <div className="px-4 py-2.5 border-t border-border flex justify-between items-center shrink-0">
            <span className="text-muted-foreground text-base">Source document</span>
            <button
              onClick={handleViewFullDocument}
              disabled={loadingFull}
              className="text-primary text-base hover:underline disabled:opacity-50"
            >
              {loadingFull ? 'Loading...' : 'View full document →'}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
