'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (file: File) => Promise<unknown>;
}

export function UploadZone({ onUpload }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        await onUpload(file);
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-[10px] p-5 text-center mb-4 cursor-pointer transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <Upload className="w-5 h-5 text-primary mx-auto mb-1.5" />
      <div className="text-primary text-base font-medium">
        {isUploading ? 'Uploading...' : 'Drop files here or click to upload'}
      </div>
      <div className="text-muted-foreground text-base">PDF, Markdown, Text — max 10MB</div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.md,.txt,.markdown"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
