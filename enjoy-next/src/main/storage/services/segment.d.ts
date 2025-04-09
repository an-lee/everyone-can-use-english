declare interface SegmentEntity {
  id: string;
  targetId: string;
  targetType: string;
  segmentIndex: number;
  md5: string;
  caption: Record<string, any>;
  startTime: number;
  endTime: number;
  syncedAt: string;
  uploadedAt: string;
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
}

declare interface SegmentSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
  recordingId?: string;
  start?: number;
  end?: number;
  text?: string;
  order?: "asc" | "desc";
  sort?: "created_at" | "updated_at" | "start" | "end" | "text";
}

declare interface SegmentPaginationResult {
  items: SegmentEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
