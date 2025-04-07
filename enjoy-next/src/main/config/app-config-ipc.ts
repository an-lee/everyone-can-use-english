import { BaseIpcModule, IpcMethod } from "@main/core/ipc/base-ipc-module";
import appConfig from "./app-config";
import log from "@main/services/logger";

const logger = log.scope("AppConfigIpc");

/**
 * AppConfig IPC module provides all app configuration related IPC handlers
 */
export class AppConfigIpcModule extends BaseIpcModule {
  constructor() {
    super("AppConfig", "appConfig");
  }

  @IpcMethod()
  get(_event: any, key: string): any {
    return appConfig.get(key);
  }

  @IpcMethod()
  set(_event: any, key: string, value: any): void {
    appConfig.set(key, value);
  }

  @IpcMethod()
  file(): string {
    return appConfig.file();
  }

  @IpcMethod()
  libraryPath(): string {
    return appConfig.libraryPath();
  }

  @IpcMethod()
  currentUser(): any {
    return appConfig.currentUser();
  }

  @IpcMethod()
  logout(): void {
    return appConfig.logout();
  }

  @IpcMethod()
  userDataPath(_event: any, subPath?: string): string | null {
    return appConfig.userDataPath(subPath);
  }

  @IpcMethod()
  dbPath(): string | null {
    return appConfig.dbPath();
  }

  @IpcMethod()
  cachePath(): string {
    return appConfig.cachePath();
  }
}

// Singleton instance
const appConfigIpcModule = new AppConfigIpcModule();

export default appConfigIpcModule;
