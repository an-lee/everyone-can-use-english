import { app, BrowserWindow, net, protocol } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import log from "@/main/core/utils/logger";
import { mainAppLoader } from "@main/core/main-app-loader";
import { appConfig } from "@main/core";
import fs from "fs-extra";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const __dirname = import.meta.dirname;

// Configure logger
const logger = log.scope("main");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Register protocol handler
protocol.registerSchemesAsPrivileged([
  {
    scheme: "enjoy",
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      stream: true,
      codeCache: true,
      corsEnabled: true,
    },
  },
]);

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

    // Use the MainAppLoader to load the application
    await mainAppLoader.loadApp();

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
          window.webContents.send("appInitializer:status", {
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
app.on("ready", async () => {
  await initApp();

  // Register protocol handler
  protocol.handle("enjoy", (request) => {
    let url = request.url.replace("enjoy://", "");
    let filePath;

    if (
      url.match(
        /library\/(audios|videos|recordings|speeches|segments|documents)/g
      )
    ) {
      url = url.replace("library/", "");
      filePath = path.join(appConfig.userDataPath()!, url);
    } else if (url.startsWith("library")) {
      url = url.replace("library/", "");
      filePath = path.join(appConfig.libraryPath(), url);
    } else {
      logger.error(`Invalid protocol URL format: ${request.url}`);
      return new Response("Invalid URL format", { status: 400 });
    }

    logger.info(`Protocol handler, fetching from ${filePath}`);

    try {
      if (!fs.existsSync(filePath)) {
        logger.error(`File not found: ${filePath}`);
        return new Response("File not found", { status: 404 });
      }

      const stat = fs.statSync(filePath);
      if (!stat.isFile()) {
        logger.error(`Not a file: ${filePath}`);
        return new Response("Not a file", { status: 404 });
      }

      if (stat.size === 0) {
        logger.error(`Empty file: ${filePath}`);
        return new Response("Empty file", { status: 404 });
      }

      // Determine content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".mp3") contentType = "audio/mpeg";
      else if (ext === ".wav") contentType = "audio/wav";
      else if (ext === ".ogg") contentType = "audio/ogg";
      else if (ext === ".mp4") contentType = "video/mp4";
      else if (ext === ".txt") contentType = "text/plain";
      else if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".md") contentType = "text/markdown";
      else if (ext === ".epub") contentType = "application/epub+zip";

      // Read file as a buffer to ensure it's fully available
      const fileContent = fs.readFileSync(filePath);

      return new Response(fileContent, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(stat.size),
        },
      });
    } catch (error) {
      logger.error(`Error accessing file ${filePath}:`, error);
      return new Response(
        `File not found or inaccessible: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          status: 404,
        }
      );
    }
  });
});

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
