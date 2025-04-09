declare interface SpeechEntity {
  id: string;
  sourceId: string;
  sourceType: string;
  text: string;
  section?: number;
  segment?: number;
  configuration: Record<string, any>;
  md5: string;
  extname: string;
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
  isUploaded: boolean;
}
