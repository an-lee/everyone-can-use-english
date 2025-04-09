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
  syncedAt?: string;
  uploadedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  order?: "asc" | "desc";
  sort?: "created_at" | "updated_at" | "name" | "duration" | "size";
}

/**
 * Pagination result for audio items
 */
declare interface AudioPaginationResult {
  items: AudioEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
