import { ipcRenderer } from "electron";

// Audio type definition
export interface AudioType {
  id: string;
  md5: string;
  name?: string;
  description?: string;
  language?: string;
  source?: string;
  coverUrl?: string;
  metadata: Record<string, any>;
  recordingsCount: number;
  recordingsDuration: number;
  syncedAt?: Date;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Pagination result type
export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Audio API
export const AudioAPI = {
  findAll: (options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginationResult<AudioType>> => {
    return ipcRenderer.invoke("audio:findAll", options);
  },

  findById: (id: string): Promise<AudioType | null> => {
    return ipcRenderer.invoke("audio:findById", id);
  },

  findByMd5: (md5: string): Promise<AudioType | null> => {
    return ipcRenderer.invoke("audio:findByMd5", md5);
  },

  create: (data: Partial<AudioType>): Promise<AudioType> => {
    return ipcRenderer.invoke("audio:create", data);
  },

  update: (id: string, data: Partial<AudioType>): Promise<AudioType> => {
    return ipcRenderer.invoke("audio:update", id, data);
  },

  delete: (id: string): Promise<boolean> => {
    return ipcRenderer.invoke("audio:delete", id);
  },
};
