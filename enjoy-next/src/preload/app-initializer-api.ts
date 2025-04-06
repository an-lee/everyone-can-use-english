import { ipcRenderer } from "electron";

export type InitStatus = {
  currentStep: string;
  progress: number;
  error: string | null;
  message: string;
};

export interface AppInitializerAPI {
  getStatus: () => Promise<InitStatus>;
}

// Simple API for accessing initialization status
export const AppInitializerAPI: AppInitializerAPI = {
  getStatus: () => ipcRenderer.invoke("app-initializer:status"),
};

// Expose the API type
export type AppInitializerAPIType = typeof AppInitializerAPI;
