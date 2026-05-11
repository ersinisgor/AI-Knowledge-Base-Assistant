import { Injectable } from '@nestjs/common';
import { RetrievedChunk } from './strategies/retriever.interface';
import { SourceCitation } from './dto/rag-response.dto';

@Injectable()
export class CitationService {
  formatCitations(chunks: RetrievedChunk[]): SourceCitation[] {
    if (chunks.length === 0) return [];

    const seen = new Set<string>();
    const citations: SourceCitation[] = [];

    for (const chunk of chunks) {
      const docName = (chunk.metadata.source as string) || (chunk.metadata.fileName as string) || 'Unknown';
      if (seen.has(docName)) continue;
      seen.add(docName);

      citations.push({
        document_name: docName,
        source_type: (chunk.metadata.type as string) || 'unknown',
        similarity: chunk.similarity,
        chunk_index: (chunk.metadata.chunkIndex as number) ?? 0,
      });
    }

    return citations;
  }
}
