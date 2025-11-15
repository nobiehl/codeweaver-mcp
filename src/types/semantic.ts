export type CollectionType = 'code' | 'docs' | 'all';

export interface CodeChunk {
  id: string;
  file: string;
  startLine: number;
  endLine: number;
  content: string;
  language: string;
  collection: CollectionType; // NEW: Which collection this belongs to
  vector?: number[];
}

export interface SemanticSearchResult {
  file: string;
  startLine: number;
  endLine: number;
  content: string;
  similarity: number;
  _distance: number;
  collection: CollectionType; // NEW: Which collection this came from
}

export interface SemanticIndexStats {
  code?: {
    chunks: number;
    size: number;
  };
  docs?: {
    chunks: number;
    size: number;
  };
  total: {
    chunks: number;
    size: number;
  };
  modelName: string;
}

export interface SemanticSearchOptions {
  query: string;
  limit?: number;
  minSimilarity?: number;
  collection?: CollectionType; // NEW: Which collection(s) to search
}

export interface IndexOptions {
  extensions?: string[]; // File extensions to index
  collection?: CollectionType; // Target collection
}
