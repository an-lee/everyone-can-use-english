import { app, BrowserWindow, protocol, net, dialog } from "electron";
import path from "path";
import fs from "fs-extra";
import log from "@/main/services/logger";
import mainWindow from "@/main/ipc/window";
import ElectronSquirrelStartup from "electron-squirrel-startup";
import contextMenu from "electron-context-menu";
import Bugsnag from "@bugsnag/electron";
import { t } from "i18next";
import { Client } from "./shared/api";
import { config } from "@main/config";
import db from "@main/db";
import { i18n } from "@main/services/i18n";

const logger = log.scope("main");

const initBugsnag = async () => {
  if (!app.isPackaged) return;
  const webApi = new Client({
    baseUrl: config.apiUrl(),
    logger,
  });
  try {
    const apiKey = await webApi.config("bugsnag_api_key");
    if (!apiKey) return;

    Bugsnag.start({ apiKey: apiKey.bugsnagApiKey });
  } catch (err) {
    logger.error(err);
  }
};

app.commandLine.appendSwitch("enable-features", "SharedArrayBuffer");

if (!app.isPackaged) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("disable-software-rasterizer");
}

initBugsnag();

// Add context menu
contextMenu({
  showSearchWithGoogle: false,
  showInspectElement: false,
  showLookUpSelection: false,
  showLearnSpelling: false,
  showSelectAll: false,
  labels: {
    copy: t("copy"),
    cut: t("cut"),
    paste: t("paste"),
    selectAll: t("selectAll"),
  },
  shouldShowMenu: (_event, params) => {
    return params.isEditable || !!params.selectionText;
  },
  prepend: (
    _defaultActions,
    parameters,
    browserWindow: BrowserWindow,
    _event
  ) => [
    {
      label: t("lookup"),
      visible:
        parameters.selectionText.trim().length > 0 &&
        !parameters.selectionText.trim().includes(" "),
      click: () => {
        const { x, y, selectionText } = parameters;
        browserWindow.webContents.send("on-lookup", selectionText, "", {
          x,
          y,
        });
      },
    },
    {
      label: t("aiTranslate"),
      visible: parameters.selectionText.trim().length > 0,
      click: () => {
        const { x, y, selectionText } = parameters;
        browserWindow.webContents.send("on-translate", selectionText, { x, y });
      },
    },
  ],
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (ElectronSquirrelStartup) {
  app.quit();
}

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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (!app.isPackaged) {
    import("electron-devtools-installer")
      .then((mymodule: any) => {
        const installExtension = mymodule.default.default; // Default export
        installExtension(mymodule.default.REACT_DEVELOPER_TOOLS, {
          loadExtensionOptions: {
            allowFileAccess: true,
          },
        }); // replace param with the ext ID of your choice
      })
      .catch((err) => console.log("An error occurred: ", err));
  }

  // Register protocol handler
  protocol.handle("enjoy", (request) => {
    let url = request.url.replace("enjoy://", "");
    if (
      url.match(
        /library\/(audios|videos|recordings|speeches|segments|documents)/g
      )
    ) {
      url = url.replace("library/", "");
      url = path.join(config.userDataPath(), url);
    } else if (url.startsWith("library")) {
      url = url.replace("library/", "");
      url = path.join(config.libraryPath(), url);
    }

    return net.fetch(`file:///${url}`);
  });

  try {
    // Initialize database with basic config (no user settings yet)
    await db.connect();

    // Initialize i18n with user language preference
    try {
      const language = (await config.getUserSetting("language")).value;
      await i18n(language);
    } catch (error) {
      logger.warn(
        "Failed to load user language preference, using default",
        error
      );
      await i18n("zh-CN"); // Default language
    }

    // Initialize main window
    mainWindow.init();
  } catch (error) {
    logger.error("Failed to initialize application", error);
    // Show error dialog to user
    dialog.showErrorBox(
      "Initialization Error",
      `Failed to initialize the application: ${error.message}`
    );
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow.init();
  }
});

// Clean up cache folder before quit
app.on("before-quit", () => {
  try {
    fs.emptyDirSync(config.cachePath());
  } catch (err) {}
});
