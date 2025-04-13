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
  src?: string;
  filePath?: string;
  compressedFilePath?: string;
  originalFilePath?: string;
}
