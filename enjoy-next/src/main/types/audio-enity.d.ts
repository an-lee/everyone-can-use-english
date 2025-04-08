/**
 * Audio item interface that maps to our entity
 */
declare interface AudioEntity {
  id: string;
  name?: string;
  description?: string;
  language?: string;
  source?: string;
  md5: string;
  metadata: Record<string, any>;
  coverUrl?: string;
  recordingsCount: number;
  recordingsDuration: number;
  syncedAt?: Date;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Audio search options
 */
declare interface AudioSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
  language?: string;
  source?: string;
}

/**
 * Pagination result for audio items
 */
declare interface AudioPaginationResult {
  items: AudioItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
