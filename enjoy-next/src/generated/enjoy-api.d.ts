// Auto-generated type declarations for Electron IPC
// DO NOT EDIT DIRECTLY - Generated on 2025-04-10T06:18:31.989Z

declare interface EnjoyAPI {
  appConfig: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    file: () => Promise<string>;
    libraryPath: () => Promise<string>;
    currentUser: () => Promise<any>;
    logout: () => Promise<void>;
    userDataPath: (subPath?: string) => Promise<string | null>;
    dbPath: () => Promise<string | null>;
    cachePath: () => Promise<string>;
  };
  appInitializer: {
    status: () => Promise<any>;
  };
  db: {
    connect: () => Promise<DbState>;
    disconnect: () => Promise<{ state: 'disconnected' }>;
    backup: () => Promise<{ state: 'backup-completed' }>;
    status: () => Promise<DbState>;
    migrate: () => Promise<object>;
    audio: {
      findAll: (options?: PaginationOptions) => Promise<PaginationResult<AudioEntity>>;
      findById: (id: string) => Promise<AudioEntity | null>;
      findByMd5: (md5: string) => Promise<AudioEntity | null>;
      create: (data: Partial<AudioEntity>) => Promise<AudioEntity>;
      update: (id: string, data: Partial<AudioEntity>) => Promise<AudioEntity | null>;
      delete: (id: string) => Promise<boolean>;
      count: () => Promise<number>;
    };
    cacheObject: {
      get: (key: string) => Promise<CacheObjectEntity['value'] | null>;
      set: (key: string, value: any, ttl?: number) => Promise<void>;
      delete: (key: string) => Promise<boolean>;
    };
    conversation: {
      findAll: (options?: PaginationOptions) => Promise<PaginationResult<ConversationEntity>>;
      findById: (id: string) => Promise<ConversationEntity | null>;
      create: (data: Partial<ConversationEntity>) => Promise<ConversationEntity>;
      update: (id: string, data: Partial<ConversationEntity>) => Promise<ConversationEntity | null>;
      delete: (id: string) => Promise<boolean>;
      count: () => Promise<number>;
    };
    document: {
      findAll: (options?: PaginationOptions) => Promise<PaginationResult<DocumentEntity>>;
      findById: (id: string) => Promise<DocumentEntity | null>;
      create: (data: Partial<DocumentEntity>) => Promise<DocumentEntity>;
      update: (id: string, data: Partial<DocumentEntity>) => Promise<DocumentEntity | null>;
      delete: (id: string) => Promise<boolean>;
    };
    pronunciationAssessment: {
      create: (data: Partial<PronunciationAssessmentEntity>) => Promise<PronunciationAssessmentEntity>;
      update: (id: string, data: Partial<PronunciationAssessmentEntity>) => Promise<PronunciationAssessmentEntity | null>;
      delete: (id: string) => Promise<boolean>;
    };
    recording: {
      findAll: (options?: PaginationOptions) => Promise<PaginationResult<RecordingEntity>>;
      findById: (id: string) => Promise<RecordingEntity | null>;
      findByTarget: (targetId: string, targetType: string) => Promise<RecordingEntity | null>;
      create: (data: Partial<RecordingEntity>) => Promise<RecordingEntity>;
      update: (id: string, data: Partial<RecordingEntity>) => Promise<RecordingEntity | null>;
      delete: (id: string) => Promise<boolean>;
    };
    segment: {
      findAll: (options?: PaginationOptions) => Promise<PaginationResult<SegmentEntity>>;
      findByTarget: (targetId: string, targetType: string, segmentIndex: number) => Promise<SegmentEntity | null>;
      create: (data: Partial<SegmentEntity>) => Promise<SegmentEntity>;
      update: (id: string, data: Partial<SegmentEntity>) => Promise<SegmentEntity | null>;
      delete: (id: string) => Promise<boolean>;
    };
    speech: {
      findBySource: (sourceId: string, sourceType: string) => Promise<SpeechEntity | null>;
      create: (data: Partial<SpeechEntity>) => Promise<SpeechEntity>;
      update: (id: string, data: Partial<SpeechEntity>) => Promise<SpeechEntity | null>;
      delete: (id: string) => Promise<boolean>;
    };
    transcription: {
      findByTarget: (targetId: string, targetType: string) => Promise<TranscriptionEntity | null>;
      findByMd5: (targetMd5: string) => Promise<TranscriptionEntity | null>;
      create: (data: Partial<TranscriptionEntity>) => Promise<TranscriptionEntity>;
      update: (id: string, data: Partial<TranscriptionEntity>) => Promise<TranscriptionEntity | null>;
      delete: (id: string) => Promise<boolean>;
      count: () => Promise<number>;
    };
    userSetting: {
      get: (key: string) => Promise<UserSettingEntity['value'] | null>;
      set: (key: string, value: string) => Promise<UserSettingEntity | null>;
      delete: (key: string) => Promise<boolean>;
    };
    video: {
      findAll: (options?: PaginationOptions) => Promise<PaginationResult<VideoEntity>>;
      findById: (id: string) => Promise<VideoEntity | null>;
      findByMd5: (md5: string) => Promise<VideoEntity | null>;
      create: (data: Partial<VideoEntity>) => Promise<VideoEntity>;
      update: (id: string, data: Partial<VideoEntity>) => Promise<VideoEntity | null>;
      delete: (id: string) => Promise<boolean>;
    };
  };
  plugin: {
    getAll: () => Promise<any[]>;
    get: (pluginId: string) => Promise<any>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
    openPath: (path: string) => Promise<string>;
  };
}

declare const AppconfigAPI: EnjoyAPI['appConfig'];
declare const AppinitializerAPI: EnjoyAPI['appInitializer'];
declare const DbAPI: EnjoyAPI['db'];
declare const PluginAPI: EnjoyAPI['plugin'];
declare const WindowAPI: EnjoyAPI['window'];
declare const ShellAPI: EnjoyAPI['shell'];
