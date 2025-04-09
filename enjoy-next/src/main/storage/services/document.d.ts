declare interface DocumentEntity {
  id: string;
  language: string;
  md5: string;
  source: string;
  title: string;
  coverUrl: string;
  metadata: Record<string, any>;
  config: Record<string, any>;
  lastReadPosition: Record<string, any>;
  lastReadAt: string;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
  isUploaded: boolean;
}

declare interface DocumentSearchOptions {
  page?: number;
  limit?: number;
  sort?: "created_at" | "updated_at";
  order?: "asc" | "desc";
  search?: string;
}

declare interface DocumentPaginationResult {
  items: DocumentEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
