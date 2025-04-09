// Auto-generated type declarations for Electron IPC
// DO NOT EDIT DIRECTLY - Generated on 2025-04-09T02:27:56.012Z
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
      findAll: (options?: AudioSearchOptions) => Promise<AudioPaginationResult>;
      findById: (id: string) => Promise<AudioEntity | null>;
      findByMd5: (md5: string) => Promise<AudioEntity | null>;
      create: (data: Partial<AudioEntity>) => Promise<AudioEntity>;
      update: (id: string, data: Partial<AudioEntity>) => Promise<AudioEntity | null>;
      delete: (id: string) => Promise<boolean>;
      count: () => Promise<number>;
    };
    transcription: {
      findByTarget: (targetId: string, targetType: string) => Promise<TranscriptionEntity | null>;
      findByMd5: (targetMd5: string) => Promise<TranscriptionEntity | null>;
      create: (data: Partial<TranscriptionEntity>) => Promise<TranscriptionEntity>;
      update: (id: string, data: Partial<TranscriptionEntity>) => Promise<TranscriptionEntity | null>;
      delete: (id: string) => Promise<boolean>;
      count: () => Promise<number>;
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
