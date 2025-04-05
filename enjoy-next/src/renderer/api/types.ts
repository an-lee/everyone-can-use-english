export interface PagyResponseType {
  page: number;
  pages: number;
  items: number;
  count: number;
}

export interface UserType {
  id: string;
  name: string;
  email?: string;
  // Add other user properties
}

export interface PostType {
  id: string;
  content: string;
  metadata?: any;
  // Add other post properties
}

export interface AudioType {
  id: string;
  // Add audio properties
}

export interface VideoType {
  id: string;
  // Add video properties
}

export interface TranscriptionType {
  id: string;
  // Add transcription properties
}

export interface SegmentType {
  id: string;
  segmentIndex?: number;
  targetId?: string;
  targetType?: string;
  // Add other segment properties
}

export interface NoteType {
  id: string;
  // Add note properties
}

export interface RecordingType {
  id: string;
  // Add recording properties
}

export interface PronunciationAssessmentType {
  id: string;
  // Add pronunciation assessment properties
}

export interface LookupType {
  id: string;
  word: string;
  context: string;
  // Add other lookup properties
}

export interface MeaningType {
  id: string;
  // Add meaning properties
}

export interface CreateStoryParamsType {
  title: string;
  content: string;
  // Add other create story parameters
}

export interface StoryType {
  id: string;
  title: string;
  content: string;
  // Add other story properties
}

export interface PaymentType {
  id: string;
  amount: number;
  reconciledCurrency?: string;
  processor: string;
  paymentType: string;
  // Add other payment properties
}

export interface CourseType {
  id: string;
  // Add course properties
}

export interface ChapterType {
  id: string;
  // Add chapter properties
}

export interface EnrollmentType {
  id: string;
  courseId: string;
  currentChapterId?: string;
  // Add other enrollment properties
}

export interface LLmChatType {
  id: string;
  agentId: string;
  agentType: string;
  // Add other LLM chat properties
}

export interface LlmMessageType {
  id: string;
  query: string;
  // Add other LLM message properties
}

export interface DocumentEType {
  id: string;
  // Add document properties
}

export interface TranslationType {
  id: string;
  md5: string;
  content: string;
  translatedContent: string;
  language: string;
  translatedLanguage: string;
  engine: string;
  // Add other translation properties
}
