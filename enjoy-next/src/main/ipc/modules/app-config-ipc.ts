import { BaseIpcModule, IpcMethod } from "@main/ipc/modules/base-ipc-module";
import appConfig, { AppConfigState } from "@main/core/app/config";

/**
 * AppConfig IPC module provides all app configuration related IPC handlers
 */
export class AppConfigIpcModule extends BaseIpcModule {
  constructor() {
    super("AppConfig", "appConfig");
  }

  @IpcMethod({
    description: "Gets a configuration value by key",
    parameters: [
      {
        name: "key",
        type: "string",
        description: "Configuration key to retrieve",
        required: true,
      },
    ],
    returns: {
      type: "any",
      description: "The configuration value",
    },
  })
  get(_event: any, key: string): any {
    return appConfig.get(key as keyof AppConfigState);
  }

  @IpcMethod({
    description: "Sets a configuration value",
    parameters: [
      {
        name: "key",
        type: "string",
        description: "Configuration key to set",
        required: true,
      },
      {
        name: "value",
        type: "any",
        description: "Value to set",
        required: true,
      },
    ],
    returns: {
      type: "void",
      description: "No return value",
    },
  })
  set(_event: any, key: string, value: any): void {
    appConfig.set(key as keyof AppConfigState, value);
  }

  @IpcMethod({
    description: "Gets the config file path",
    returns: {
      type: "string",
      description: "The config file path",
    },
  })
  file(): string {
    return appConfig.file();
  }

  @IpcMethod({
    description: "Gets the library path",
    returns: {
      type: "string",
      description: "The library path",
    },
  })
  libraryPath(): string {
    return appConfig.libraryPath();
  }

  @IpcMethod({
    description: "Gets the current user",
    returns: {
      type: "any",
      description: "The current user object",
    },
  })
  currentUser(): any {
    return appConfig.currentUser();
  }

  @IpcMethod({
    description: "Logs out the current user",
    returns: {
      type: "void",
      description: "No return value",
    },
  })
  logout(): void {
    return appConfig.logout();
  }

  @IpcMethod({
    description: "Gets a path within the user data directory",
    parameters: [
      {
        name: "subPath",
        type: "string",
        description: "Optional sub-path within the user data directory",
        required: false,
      },
    ],
    returns: {
      type: "string | null",
      description: "The requested path or null if unavailable",
    },
  })
  userDataPath(_event: any, subPath?: string): string | null {
    return appConfig.userDataPath(subPath);
  }

  @IpcMethod({
    description: "Gets the database path",
    returns: {
      type: "string | null",
      description: "The database path or null if unavailable",
    },
  })
  dbPath(): string | null {
    return appConfig.dbPath();
  }

  @IpcMethod({
    description: "Gets the cache path",
    returns: {
      type: "string",
      description: "The cache path",
    },
  })
  cachePath(): string {
    return appConfig.cachePath();
  }
}

// Singleton instance
export const appConfigIpcModule = new AppConfigIpcModule();
