declare interface TranscriptionEntity {
  id: string;
  language?: string;
  targetId?: string;
  targetType?: string;
  targetMd5: string;
  state: "pending" | "processing" | "finished";
  engine?: string;
  model?: string;
  result: Record<string, any>;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
  target?: AudioEntity | VideoEntity;
}
