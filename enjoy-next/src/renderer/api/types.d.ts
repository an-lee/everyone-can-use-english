declare interface PagyResponseType {
  page: number;
  next: number;
  last: number;
}

declare interface UserType {
  id: string;
  name: string;
  email?: string;
  balance?: number;
  avatarUrl?: string;
  accessToken?: string;
  recordingsCount?: number;
  recordingsDuration?: number;
  hasMixin?: boolean;
  following?: boolean;
  createdAt?: string;
}

declare interface PostType {
  id: string;
  metadata: {
    type: "text" | "prompt" | "gpt" | "note";
    content: string | { [key: string]: any };
  };
  user: UserType;
  targetType?: string;
  targetId?: string;
  target?: MediumType | StoryType | RecordingType | NoteType;
  liked?: boolean;
  likesCount?: number;
  likeByUsers?: UserType[];
  createdAt: Date;
  updatedAt: Date;
}

declare interface MediumType {
  id: string;
  md5: string;
  mediumType: string;
  coverUrl?: string;
  sourceUrl?: string;
  extname?: string;
  createdAt: string;
  updatedAt: string;
}

declare interface AudioType {
  mediaType: string;
  id: string;
  source: string;
  name: string;
  filename: string;
  language?: string;
  description?: string;
  src?: string;
  coverUrl?: string;
  md5: string;
  metadata?: Record<string, any>;
  duration?: number;
  transcribed?: boolean;
  transcribing?: boolean;
  recordingsCount?: number;
  recordingsDuration?: number;
  isUploaded?: boolean;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

declare interface VideoType {
  mediaType: string;
  id: string;
  source: string;
  name: string;
  filename: string;
  language?: string;
  description?: string;
  src?: string;
  coverUrl?: string;
  md5: string;
  metadata?: Record<string, any>;
  duration?: number;
  transcribed?: boolean;
  transcribing?: boolean;
  recordingsCount?: number;
  recordingsDuration?: number;
  isUploaded?: boolean;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

declare interface TranscriptionType {
  id: string;
  targetId: string;
  targetType: string;
  targetMd5?: string;
  state: "pending" | "processing" | "finished";
  engine: string;
  model: string;
  language?: string;
  result: Record<string, any>;
  md5?: string;
  downloadsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

declare interface SegmentType {
  id: string;
  targetId: string;
  targetType: string;
  target: AudioType | VideoType;
  caption: Record<string, any>;
  audio?: AudioType;
  video?: VideoType;
  segmentIndex: number;
  md5: string;
  startTime: number;
  endTime: number;
  src: string;
  isSynced?: boolean;
  isUploaded?: boolean;
  syncedAt?: Date;
  uploadedAt?: Date;
  updatedAt: Date;
  createdAt: Date;
}

declare interface NoteType {
  id: string;
  targetId: string;
  targetType: string;
  content: string;
  parameters: Record<string, any>;
  syncedAt: Date;
  uploadedAt: Date;
  updatedAt: Date;
  createdAt: Date;
}

declare interface RecordingType {
  id: string;
  filename?: string;
  target?: AudioType | (MessageType & any);
  targetId: string;
  targetType: string;
  language?: string;
  pronunciationAssessment?: PronunciationAssessmentType & any;
  referenceId: number;
  referenceText?: string;
  duration?: number;
  src?: string;
  md5: string;
  isDeleted?: boolean;
  isSynced?: boolean;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

enum MessageRoleEnum {
  SYSTEM = "system",
  ASSISTANT = "assistant",
  USER = "user",
}

declare interface MessageType {
  id: string;
  role: MessageRoleEnum;
  content: string;
  conversationId: string;
  conversation?: ConversationType;
  createdAt?: Date;
  updatedAt?: Date;
  status?: "pending" | "success" | "error";
  speeches?: Partial<SpeechType>[];
  recording?: RecordingType;
}

declare interface SpeechType {
  id: string;
  sourceId: string;
  sourceType: string;
  source?: MessageType;
  text: string;
  section: number;
  segment: number;
  engine: string;
  model: string;
  voice: string;
  md5: string;
  filename: string;
  filePath: string;
  configuration: { [key: string]: any };
  src?: string;
  createdAt: Date;
  updatedAt: Date;
}

declare interface ConversationType {
  id: string;
  type: "gpt" | "tts";
  engine: "enjoyai" | "openai" | "ollama";
  name: string;
  configuration: { [key: string]: any };
  model: string;
  language?: string;
  messages?: MessageType[];
  createdAt?: string;
}

declare interface PronunciationAssessmentType {
  id: string;
  language?: string;
  targetId: string;
  targetType: string;
  referenceText: string;
  accuracyScore: number;
  completenessScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  prosodyScore?: number;
  grammarScore?: number;
  vocabularyScore?: number;
  topicScore?: number;
  result: {
    confidence: number;
    display: string;
    itn: string;
    lexical: string;
    markedItn: string;
    pronunciationAssessment: {
      accuracyScore: number;
      completenessScore: number;
      fluencyScore: number;
      pronScore: number;
    };
    words: PronunciationAssessmentWordResultType[];
  };
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isSynced: boolean;
  recording?: RecordingType;
  target?: any;
}

declare interface PronunciationAssessmentWordResultType {
  duration: number;
  offset: number;
  word: string;
  pronunciationAssessment: {
    accuracyScore: number;
    errorType?:
      | "None"
      | "Omission"
      | "Insertion"
      | "Mispronunciation"
      | "UnexpectedBreak"
      | "MissingBreak"
      | "Monotone";
  };
  phonemes: {
    duration: number;
    offset: number;
    phoneme: string;
    pronunciationAssessment: {
      accuracyScore: number;
    };
  }[];
  syllables: {
    duration: number;
    offset: number;
    syllable: string;
    pronunciationAssessment: {
      accuracyScore: number;
    };
  };
}

declare interface SpeechRecognitionResultType {
  Id: string;
  RecognitionStatus: string;
  Offset: number;
  Duration: number;
  Channel: number;
  DisplayText: string;
  NBest: {
    Confidence: number;
    Lexical: string;
    ITN: string;
    MaskedITN: string;
    Display: string;
    Words: {
      Word: string;
      Offset: number;
      Duration: number;
    }[];
  }[];
}

declare interface LookupType {
  id: string;
  word: string;
  context: string;
  contextTranslation: string;
  status?: "pending" | "completed" | "failed";
  meaning?: MeaningType;
  meaningOptions?: MeaningType[];
  createdAt: string;
  updatedAt: string;
}

declare interface MeaningType {
  id: string;
  word: string;
  lemma?: string;
  pronunciation?: string;
  pos?: string;
  definition: string;
  translation: string;
  lookups: LookupType[];
}

declare interface CreateStoryParamsType {
  title: string;
  content: string;
}

declare interface StoryType {
  id: string;
  title: string;
  content: string;
}

declare interface PaymentType {
  id: string;
  amount: number;
  reconciledCurrency?: string;
  processor: string;
  paymentType: string;
}

declare interface CourseType {
  id: string;
  title: string;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

declare interface ChapterType {
  id: string;
  title: string;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

declare interface EnrollmentType {
  id: string;
  courseId: string;
  currentChapterId?: string;
}

declare interface LLmChatType {
  id: string;
  agentId: string;
  agentType: string;
}

declare interface LlmMessageType {
  id: string;
  query: string;
}

declare interface DocumentEType {
  id: string;
  language: string;
  md5: string;
  title: string;
  metadata: Record<string, any>;
  config: Record<string, any>;
  layout: "horizontal" | "vertical";
  autoTranslate: boolean;
  autoNextSpeech: boolean;
  ttsConfig: Record<string, any>;
  lastReadPosition: Record<string, any>;
  lastReadAt: Date;
  syncedAt: Date;
  uploadedAt: Date;
  updatedAt: Date;
  createdAt: Date;
  src?: string;
  filePath?: string;
  isSynced?: boolean;
}

declare interface TranslationType {
  id: string;
  md5: string;
  content: string;
  translatedContent: string;
  language: string;
  translatedLanguage: string;
  engine: string;
}
