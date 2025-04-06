import { ipcRenderer } from "electron";

export type DbConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type DbState = {
  state: DbConnectionState;
  path: string | null;
  error: string | null;
  autoConnected?: boolean;
};

export const DbAPI = {
  connect: (): Promise<DbState> => ipcRenderer.invoke("db-connect"),
  disconnect: (): Promise<{ state: "disconnected" }> =>
    ipcRenderer.invoke("db-disconnect"),
  backup: (): Promise<{ state: "backup-completed" }> =>
    ipcRenderer.invoke("db-backup"),
  status: (): Promise<DbState> => ipcRenderer.invoke("db-status"),
};
