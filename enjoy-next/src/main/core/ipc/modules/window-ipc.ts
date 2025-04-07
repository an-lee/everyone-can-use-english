import { BrowserWindow, IpcMainInvokeEvent, app } from "electron";
import { BaseIpcModule, IpcMethod } from "../base-ipc-module";
import { IpcChannels } from "@shared/ipc/ipc-channels";

/**
 * Window IPC module handles all window-related IPC commands
 */
export class WindowIpcModule extends BaseIpcModule {
  constructor() {
    super("Window", "window");
  }

  @IpcMethod()
  minimize(event: IpcMainInvokeEvent): void {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) window.minimize();
  }

  @IpcMethod()
  maximize(event: IpcMainInvokeEvent): void {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }

      // Notify renderer about window state change
      setTimeout(() => {
        if (window && !window.isDestroyed()) {
          window.webContents.send(
            IpcChannels.WINDOW.STATE_CHANGED,
            window.isMaximized()
          );
        }
      }, 100);
    }
  }

  @IpcMethod()
  close(event: IpcMainInvokeEvent): void {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) window.close();
  }

  @IpcMethod()
  isMaximized(event: IpcMainInvokeEvent): boolean {
    const window = BrowserWindow.fromWebContents(event.sender);
    return window ? window.isMaximized() : false;
  }

  /**
   * Set up window state change listeners for all windows
   */
  setupWindowStateListeners(): void {
    this.logger.info("Setting up window state listeners");

    // Get existing windows
    BrowserWindow.getAllWindows().forEach(this.setupWindowListeners.bind(this));

    // Listen for new windows being created
    app.on("browser-window-created", (_event, window) => {
      if (window instanceof BrowserWindow) {
        this.setupWindowListeners(window);
      }
    });
  }

  /**
   * Set up state change listeners for a specific window
   */
  private setupWindowListeners(window: BrowserWindow): void {
    window.on("maximize", () => {
      if (!window.isDestroyed()) {
        window.webContents.send(IpcChannels.WINDOW.STATE_CHANGED, true);
      }
    });

    window.on("unmaximize", () => {
      if (!window.isDestroyed()) {
        window.webContents.send(IpcChannels.WINDOW.STATE_CHANGED, false);
      }
    });

    this.logger.debug(`Set up listeners for window ${window.id}`);
  }
}

// Singleton instance
const windowIpcModule = new WindowIpcModule();

export default windowIpcModule;
