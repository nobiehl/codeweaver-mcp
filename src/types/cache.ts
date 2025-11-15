export type CacheType = 'index' | 'report' | 'snippet' | 'vcs' | 'pipeline';

export interface CacheKey {
  type: CacheType;
  scope?: string;
  hash: string;
}

export interface CacheEntry {
  key: CacheKey;
  data: any;
  metadata: CacheMetadata;
}

export interface CacheMetadata {
  createdAt: Date;
  accessedAt: Date;
  expiresAt?: Date;
  sizeBytes: number;
  version: string;
  dependencies?: string[];
}

export interface CacheStats {
  totalSize: number;
  entries: number;
  hitRate: number;
  lastCleanup: Date;
}
