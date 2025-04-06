import { app, BrowserWindow } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import log from "@main/services/logger";
import { setupIpcHandlers } from "@main/core/ipc-handlers";
import { appInitializer } from "@main/core/app-initializer";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const __dirname = import.meta.dirname;

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
    frame: false,
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
};

// Initialize application
const initApp = async () => {
  try {
    logger.info("Initializing application");

    // Set up global IPC handlers
    logger.info("Setting up IPC handlers");
    setupIpcHandlers();

    // Run application initialization using the new AppInitializer
    logger.info("Starting application initialization");
    await appInitializer.initialize();

    // Create main window
    logger.info("Creating application window");
    await createWindow();

    logger.info("Application initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize application", error);
    // Try to show error to user if possible
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows.forEach((window) => {
        if (!window.isDestroyed()) {
          window.webContents.send("app-init-status", {
            currentStep: "starting",
            progress: 0,
            error: error instanceof Error ? error.message : String(error),
            message: "Fatal error initializing application.",
          });
        }
      });
    }
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
