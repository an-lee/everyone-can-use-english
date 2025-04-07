/**
 * Barrel file to export all IPC modules
 * This file is used for auto-discovery of IPC modules by the IPC registry
 */

// Import and re-export all IPC modules
export * from "./app-initializer-ipc";
export * from "./app-config-ipc";
export * from "./db-ipc";
export * from "./plugin-ipc";
export * from "./window-ipc";
export * from "./shell-ipc";

// Add other IPC modules as they are created
// export * from "./audio-ipc";
// export * from "./bookmark-entity-ipc";
// export * from "./user-ipc";
