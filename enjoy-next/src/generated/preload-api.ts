// Auto-generated preload API for Electron IPC
// DO NOT EDIT DIRECTLY - Generated on 2025-04-16T04:57:43.402Z

import { ipcRenderer } from 'electron';

// AppConfig API
export const AppconfigAPI = {
  get: (key: string) => ipcRenderer.invoke('appConfig:get', key),
  set: (key: string, value: any) => ipcRenderer.invoke('appConfig:set', key, value),
  file: () => ipcRenderer.invoke('appConfig:file'),
  libraryPath: () => ipcRenderer.invoke('appConfig:libraryPath'),
  currentUser: () => ipcRenderer.invoke('appConfig:currentUser'),
  logout: () => ipcRenderer.invoke('appConfig:logout'),
  userDataPath: (subPath?: string) => ipcRenderer.invoke('appConfig:userDataPath', subPath),
  dbPath: () => ipcRenderer.invoke('appConfig:dbPath'),
  cachePath: () => ipcRenderer.invoke('appConfig:cachePath'),
};

// AppInitializer API
export const AppinitializerAPI = {
  status: () => ipcRenderer.invoke('appInitializer:status'),
};

// Database API
export const DbAPI = {
  connect: () => ipcRenderer.invoke('db:connect'),
  disconnect: () => ipcRenderer.invoke('db:disconnect'),
  backup: () => ipcRenderer.invoke('db:backup'),
  status: () => ipcRenderer.invoke('db:status'),
  migrate: () => ipcRenderer.invoke('db:migrate'),
  audio: {
    findAll: (options?: PaginationOptions) => ipcRenderer.invoke('db:audio:findAll', options),
    findById: (id: string) => ipcRenderer.invoke('db:audio:findById', id),
    findByMd5: (md5: string) => ipcRenderer.invoke('db:audio:findByMd5', md5),
    create: (data: Partial<AudioEntity>) => ipcRenderer.invoke('db:audio:create', data),
    update: (id: string, data: Partial<AudioEntity>) => ipcRenderer.invoke('db:audio:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:audio:delete', id),
    count: () => ipcRenderer.invoke('db:audio:count'),
  },
  cacheObject: {
    get: (key: string) => ipcRenderer.invoke('db:cacheObject:get', key),
    set: (key: string, value: any, ttl?: number) => ipcRenderer.invoke('db:cacheObject:set', key, value, ttl),
    delete: (key: string) => ipcRenderer.invoke('db:cacheObject:delete', key),
  },
  chatAgent: {
    findAll: (options?: PaginationOptions) => ipcRenderer.invoke('db:chat_agent:findAll', options),
    findById: (id: string) => ipcRenderer.invoke('db:chat_agent:findById', id),
    create: (data: Partial<ChatAgentEntity>) => ipcRenderer.invoke('db:chat_agent:create', data),
    update: (id: string, data: Partial<ChatAgentEntity>) => ipcRenderer.invoke('db:chat_agent:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:chat_agent:delete', id),
    count: () => ipcRenderer.invoke('db:chat_agent:count'),
  },
  chatMessage: {
    findAll: (options?: ChatMessageFindAllOptions) => ipcRenderer.invoke('db:chat_message:findAll', options),
    findById: (id: string) => ipcRenderer.invoke('db:chat_message:findById', id),
    create: (data: Partial<ChatMessageEntity>) => ipcRenderer.invoke('db:chat_message:create', data),
    update: (id: string, data: Partial<ChatMessageEntity>) => ipcRenderer.invoke('db:chat_message:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:chat_message:delete', id),
    count: () => ipcRenderer.invoke('db:chat_message:count'),
  },
  chatMember: {
    findAll: (options?: ChatMemberFindAllOptions) => ipcRenderer.invoke('db:chat_member:findAll', options),
    findById: (id: string) => ipcRenderer.invoke('db:chat_member:findById', id),
    create: (data: Partial<ChatMemberEntity>) => ipcRenderer.invoke('db:chat_member:create', data),
    update: (id: string, data: Partial<ChatMemberEntity>) => ipcRenderer.invoke('db:chat_member:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:chat_member:delete', id),
    count: () => ipcRenderer.invoke('db:chat_member:count'),
  },
  conversation: {
    findAll: (options?: PaginationOptions) => ipcRenderer.invoke('db:conversation:findAll', options),
    findById: (id: string) => ipcRenderer.invoke('db:conversation:findById', id),
    create: (data: Partial<ConversationEntity>) => ipcRenderer.invoke('db:conversation:create', data),
    update: (id: string, data: Partial<ConversationEntity>) => ipcRenderer.invoke('db:conversation:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:conversation:delete', id),
    count: () => ipcRenderer.invoke('db:conversation:count'),
  },
  document: {
    findAll: (options?: PaginationOptions) => ipcRenderer.invoke('db:document:findAll', options),
    findById: (id: string) => ipcRenderer.invoke('db:document:findById', id),
    create: (data: Partial<DocumentEntity>) => ipcRenderer.invoke('db:document:create', data),
    update: (id: string, data: Partial<DocumentEntity>) => ipcRenderer.invoke('db:document:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:document:delete', id),
  },
  note: {
    findAll: (options?: NoteFindAllOptions) => ipcRenderer.invoke('db:note:findAll', options),
    findById: (id: string) => ipcRenderer.invoke('db:note:findById', id),
    create: (data: Partial<NoteEntity>) => ipcRenderer.invoke('db:note:create', data),
    update: (id: string, data: Partial<NoteEntity>) => ipcRenderer.invoke('db:note:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:note:delete', id),
    count: () => ipcRenderer.invoke('db:note:count'),
  },
  pronunciationAssessment: {
    create: (data: Partial<PronunciationAssessmentEntity>) => ipcRenderer.invoke('db:pronunciationAssessment:create', data),
    update: (id: string, data: Partial<PronunciationAssessmentEntity>) => ipcRenderer.invoke('db:pronunciationAssessment:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:pronunciationAssessment:delete', id),
  },
  recording: {
    findAll: (options?: PaginationOptions) => ipcRenderer.invoke('db:recording:findAll', options),
    findById: (id: string) => ipcRenderer.invoke('db:recording:findById', id),
    findByTarget: (targetId: string, targetType: string) => ipcRenderer.invoke('db:recording:findByTarget', targetId, targetType),
    create: (data: Partial<RecordingEntity>) => ipcRenderer.invoke('db:recording:create', data),
    update: (id: string, data: Partial<RecordingEntity>) => ipcRenderer.invoke('db:recording:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:recording:delete', id),
  },
  segment: {
    findAll: (options?: PaginationOptions) => ipcRenderer.invoke('db:segment:findAll', options),
    findByTarget: (targetId: string, targetType: string, segmentIndex: number) => ipcRenderer.invoke('db:segment:findByTarget', targetId, targetType, segmentIndex),
    create: (data: Partial<SegmentEntity>) => ipcRenderer.invoke('db:segment:create', data),
    update: (id: string, data: Partial<SegmentEntity>) => ipcRenderer.invoke('db:segment:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:segment:delete', id),
  },
  speech: {
    findBySource: (sourceId: string, sourceType: string) => ipcRenderer.invoke('db:speech:findBySource', sourceId, sourceType),
    create: (data: Partial<SpeechEntity>) => ipcRenderer.invoke('db:speech:create', data),
    update: (id: string, data: Partial<SpeechEntity>) => ipcRenderer.invoke('db:speech:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:speech:delete', id),
  },
  transcription: {
    findByTarget: (targetId: string, targetType: string) => ipcRenderer.invoke('db:transcription:findByTarget', targetId, targetType),
    findByTargetMd5: (targetMd5: string) => ipcRenderer.invoke('db:transcription:findByTargetMd5', targetMd5),
    create: (data: Partial<TranscriptionEntity>) => ipcRenderer.invoke('db:transcription:create', data),
    update: (id: string, data: Partial<TranscriptionEntity>) => ipcRenderer.invoke('db:transcription:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:transcription:delete', id),
    count: () => ipcRenderer.invoke('db:transcription:count'),
  },
  userSetting: {
    get: (key: string) => ipcRenderer.invoke('db:userSetting:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('db:userSetting:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('db:userSetting:delete', key),
  },
  video: {
    findAll: (options?: PaginationOptions) => ipcRenderer.invoke('db:video:findAll', options),
    findById: (id: string) => ipcRenderer.invoke('db:video:findById', id),
    findByMd5: (md5: string) => ipcRenderer.invoke('db:video:findByMd5', md5),
    create: (data: Partial<VideoEntity>) => ipcRenderer.invoke('db:video:create', data),
    update: (id: string, data: Partial<VideoEntity>) => ipcRenderer.invoke('db:video:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:video:delete', id),
  },
};

// PluginModule API
export const PluginAPI = {
  getAll: () => ipcRenderer.invoke('plugin:getAll'),
  get: (pluginId: string) => ipcRenderer.invoke('plugin:get', pluginId),
};

// Window API
export const WindowAPI = {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
};

// Shell API
export const ShellAPI = {
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
};

