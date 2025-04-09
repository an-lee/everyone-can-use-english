import { BrowserWindow } from "electron";

export const VALID_CHANNELS = [
  "plugin:loaded",
  "plugin:activated",
  "plugin:deactivated",
  "command:executed",
  "view:registered",
  "window:onStateChanged",
  "db:onStateChanged",
  "appInitializer:status",
  "db:onTransaction",
  "ipc:onError",
] as const;

export function sendToAllWindows(
  channel: (typeof VALID_CHANNELS)[number],
  ...args: any[]
) {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((window) => {
    sendToWindow(window, channel, ...args);
  });
}

export function sendToMainWindow(
  channel: (typeof VALID_CHANNELS)[number],
  ...args: any[]
) {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow) {
    sendToWindow(mainWindow, channel, ...args);
  }
}

export function sendToWindow(
  window: BrowserWindow,
  channel: (typeof VALID_CHANNELS)[number],
  ...args: any[]
) {
  if (!VALID_CHANNELS.includes(channel)) {
    throw new Error(`Invalid channel: ${channel}`);
  }

  if (window) {
    window.webContents.send(channel, ...args);
  }
}
