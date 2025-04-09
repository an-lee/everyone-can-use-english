declare interface RecordingEntity {
  id: string;
  language: string;
  targetId: string;
  targetType: "Audio" | "Video" | "ChatMessage" | "None";
  md5: string;
  filename: string;
  referenceId: number;
  referenceText: string;
  duration: number;
  syncedAt?: string;
  uploadedAt?: string;
  createdAt: string;
  updatedAt: string;
}
