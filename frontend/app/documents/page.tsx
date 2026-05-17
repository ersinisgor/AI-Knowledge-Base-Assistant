'use client';

import { UploadZone } from '@/components/documents/upload-zone';
import { DocumentList } from '@/components/documents/document-list';
import { useDocuments } from '@/hooks/use-documents';

export default function DocumentsPage() {
  const { documents, loading, uploadDocument } = useDocuments();

  return (
    <div className="h-full overflow-y-auto p-5">
      <h1 className="text-foreground font-semibold text-lg mb-4">Documents</h1>
      <UploadZone onUpload={uploadDocument} />
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-base">Loading documents...</div>
      ) : (
        <DocumentList documents={documents} />
      )}
    </div>
  );
}
