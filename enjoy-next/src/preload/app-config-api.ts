import { ipcRenderer } from "electron";

export interface AppConfigAPI {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  file: () => Promise<string>;
  libraryPath: () => Promise<string>;
  currentUser: () => Promise<any>;
  rememberUser: (user: UserType) => Promise<void>;
  userDataPath: (subPath?: string) => Promise<string>;
  dbPath: () => Promise<string>;
  cachePath: () => Promise<string>;
}

export const AppConfigAPI: AppConfigAPI = {
  get: (key: string) => ipcRenderer.invoke("appConfig:get", key),
  set: (key: string, value: any) =>
    ipcRenderer.invoke("appConfig:set", key, value),
  file: () => ipcRenderer.invoke("appConfig:file"),
  libraryPath: () => ipcRenderer.invoke("appConfig:libraryPath"),
  currentUser: () => ipcRenderer.invoke("appConfig:currentUser"),
  rememberUser: (user: UserType) =>
    ipcRenderer.invoke("appConfig:rememberUser", user),
  userDataPath: (subPath?: string) =>
    ipcRenderer.invoke("appConfig:userDataPath", subPath),
  dbPath: () => ipcRenderer.invoke("appConfig:dbPath"),
  cachePath: () => ipcRenderer.invoke("appConfig:cachePath"),
};
