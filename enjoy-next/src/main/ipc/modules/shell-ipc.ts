import { shell } from "electron";
import { BaseIpcModule, IpcMethod } from "@main/ipc/base-ipc-module";
import { IpcMainInvokeEvent } from "electron";

export class ShellIpcModule extends BaseIpcModule {
  constructor() {
    super("Shell", "shell");
  }

  @IpcMethod({
    description: "Opens a URL in the default external browser",
    errorHandling: "standard",
    parameters: [
      {
        name: "url",
        type: "string",
        description: "The URL to open",
        required: true,
      },
    ],
    returns: {
      type: "void",
      description: "Promise that resolves when the URL has been opened",
    },
  })
  openExternal(_event: IpcMainInvokeEvent, url: string): Promise<void> {
    return shell.openExternal(url);
  }

  @IpcMethod({
    description:
      "Opens a file or directory in the system's default application",
    errorHandling: "standard",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "The file or directory path to open",
        required: true,
      },
    ],
    returns: {
      type: "string",
      description:
        "Promise that resolves with a string indicating the error status of opening the path",
    },
  })
  openPath(_event: IpcMainInvokeEvent, path: string): Promise<string> {
    return shell.openPath(path);
  }
}

// Singleton instance
export const shellIpcModule = new ShellIpcModule();
