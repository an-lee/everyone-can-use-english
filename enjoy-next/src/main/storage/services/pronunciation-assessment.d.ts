declare interface PronunciationAssessmentEntity {
  id: string;
  language: string;
  targetId: string;
  targetType: string;
  referenceText: string;
  accuracyScore: number;
  completenessScore?: number;
  fluencyScore?: number;
  prosodyScore?: number;
  pronunciationScore?: number;
  grammarScore?: number;
  vocabularyScore?: number;
  topicScore?: number;
  result: Record<string, any>;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
  isUploaded: boolean;
}
