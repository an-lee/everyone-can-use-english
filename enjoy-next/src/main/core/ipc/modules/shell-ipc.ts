import { shell } from "electron";
import { BaseIpcModule } from "../base-ipc-module";
import { IpcMethod } from "../base-ipc-module";
import { IpcMainInvokeEvent } from "electron";

export class ShellIpcModule extends BaseIpcModule {
  constructor() {
    super("Shell", "shell");
  }

  @IpcMethod()
  openExternal(_event: IpcMainInvokeEvent, url: string): Promise<void> {
    return shell.openExternal(url);
  }

  @IpcMethod()
  openPath(_event: IpcMainInvokeEvent, path: string): Promise<string> {
    return shell.openPath(path);
  }
}

// Singleton instance
const shellIpcModule = new ShellIpcModule();

export default shellIpcModule;
