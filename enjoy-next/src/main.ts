import { app, BrowserWindow } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import log from "./main/services/logger";
import pluginManager from "./main/core/plugin-manager";
import { publishEvent } from "./main/core/plugin-context";
import { setupIpcHandlers } from "./main/core/ipc-handlers";

// Configure logger
const logger = log.scope("main");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Store reference to main window
let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  logger.info("Creating main window");

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Emit window-ready event for plugins
  publishEvent("window:ready", mainWindow);
};

// Initialize application
const initApp = async () => {
  try {
    logger.info("Initializing application");

    // Set up IPC handlers
    setupIpcHandlers();

    // Initialize plugin system
    await pluginManager.init();

    // Activate plugins
    await pluginManager.activatePlugins();

    // Create main window
    await createWindow();

    // Notify plugins that app is ready
    publishEvent("app:ready");

    logger.info("Application initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize application", error);
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on("ready", initApp);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up before quitting
app.on("before-quit", async () => {
  try {
    logger.info("Deactivating plugins before quit");
    await pluginManager.deactivatePlugins();
  } catch (error) {
    logger.error("Error during app shutdown", error);
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
