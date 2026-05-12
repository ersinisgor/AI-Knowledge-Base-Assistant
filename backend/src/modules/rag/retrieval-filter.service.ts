import { Injectable } from '@nestjs/common';
import { RetrievalFilters } from './strategies/retriever.interface';

export interface RetrievalFilterInput {
  source_type?: string;
}

@Injectable()
export class RetrievalFilterService {
  buildFilters(input: RetrievalFilterInput): RetrievalFilters {
    const filters: RetrievalFilters = {};

    if (input.source_type) {
      filters.source_type = input.source_type;
    }

    return filters;
  }
}
