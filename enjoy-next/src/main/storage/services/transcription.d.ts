declare interface TranscriptionEntity {
  id: string;
  language?: string;
  targetId?: string;
  targetType?: string;
  targetMd5: string;
  state: "pending" | "processing" | "finished";
  engine?: string;
  model?: string;
  result: TranscriptionResult;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
  target?: AudioEntity | VideoEntity;
}

// Defined in echogarden
declare interface TranscriptionResult {
  timeline: Timeline;
}

declare type TimelineEntryType =
  | "segment"
  | "paragraph"
  | "sentence"
  | "clause"
  | "phrase"
  | "word"
  | "token"
  | "letter"
  | "phone"
  | "subphone";
declare interface TimelineEntry {
  type: TimelineEntryType;
  text: string;
  startTime: number;
  endTime: number;
  startOffsetUtf16?: number;
  endOffsetUtf16?: number;
  startOffsetUtf32?: number;
  endOffsetUtf32?: number;
  confidence?: number;
  id?: number;
  timeline?: Timeline;
}
declare type Timeline = TimelineEntry[];
