import { ipcMain } from "electron";
import { AudioService } from "../services/audio-service";
import log from "@main/services/logger";

const logger = log.scope("AudioHandler");

/**
 * Register IPC handlers for Audio entity
 */
export const registerAudioHandlers = () => {
  ipcMain.handle(
    "audio:findAll",
    async (_, options?: { page?: number; limit?: number; search?: string }) => {
      try {
        return await AudioService.findAll(options);
      } catch (error) {
        logger.error("Error finding audios", error);
        throw error;
      }
    }
  );

  ipcMain.handle("audio:findById", async (_, id: string) => {
    try {
      return await AudioService.findById(id);
    } catch (error) {
      logger.error(`Error finding audio with ID ${id}`, error);
      throw error;
    }
  });

  ipcMain.handle("audio:findByMd5", async (_, md5: string) => {
    try {
      return await AudioService.findByMd5(md5);
    } catch (error) {
      logger.error(`Error finding audio with MD5 ${md5}`, error);
      throw error;
    }
  });

  ipcMain.handle("audio:create", async (_, data: any) => {
    try {
      return await AudioService.create(data);
    } catch (error) {
      logger.error("Error creating audio", error);
      throw error;
    }
  });

  ipcMain.handle("audio:update", async (_, id: string, data: any) => {
    try {
      return await AudioService.update(id, data);
    } catch (error) {
      logger.error(`Error updating audio with ID ${id}`, error);
      throw error;
    }
  });

  ipcMain.handle("audio:delete", async (_, id: string) => {
    try {
      return await AudioService.delete(id);
    } catch (error) {
      logger.error(`Error deleting audio with ID ${id}`, error);
      throw error;
    }
  });
};

/**
 * Unregister IPC handlers for Audio entity
 */
export const unregisterAudioHandlers = () => {
  ipcMain.removeHandler("audio:findAll");
  ipcMain.removeHandler("audio:findById");
  ipcMain.removeHandler("audio:findByMd5");
  ipcMain.removeHandler("audio:create");
  ipcMain.removeHandler("audio:update");
  ipcMain.removeHandler("audio:delete");
};
