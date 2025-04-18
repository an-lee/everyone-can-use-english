import { systemPreferences } from "electron";
import { BaseIpcModule, IpcMethod } from "@/main/ipc/modules/base-ipc-module";
import { IpcMainInvokeEvent } from "electron";

export class SystemIpcModule extends BaseIpcModule {
  constructor() {
    super("System", "system");
  }

  @IpcMethod({
    description: "Requests media access permission",
    errorHandling: "standard",
    parameters: [
      {
        name: "mediaType",
        type: "string",
        description: "The media type to request access for",
        required: true,
      },
    ],
    returns: {
      type: "boolean",
      description:
        "Promise that resolves when the media access permission has been granted",
    },
  })
  async requestMediaAccess(
    _event: IpcMainInvokeEvent,
    mediaType: "microphone" | "camera"
  ): Promise<boolean> {
    if (process.platform === "linux") return true;
    if (process.platform === "win32")
      return systemPreferences.getMediaAccessStatus(mediaType) === "granted";

    if (process.platform === "darwin") {
      const status = systemPreferences.getMediaAccessStatus(mediaType);
      this.logger.debug("current status:", status);
      if (status !== "granted") {
        const result = await systemPreferences.askForMediaAccess(mediaType);
        this.logger.debug("new status after asking:", result);
        return result;
      } else {
        return true;
      }
    }

    return false;
  }
}

// Singleton instance
export const systemIpcModule = new SystemIpcModule();
