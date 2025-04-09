declare interface VideoEntity {
  id: string;
  language: string;
  source: string;
  md5: string;
  name: string;
  description: string;
  metadata: any;
  coverUrl: string;
  recordingsCount: number;
  recordingsDuration: number;
  syncedAt?: string;
  uploadedAt?: string;
  createdAt: string;
  updatedAt: string;
}
