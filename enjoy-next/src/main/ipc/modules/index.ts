/**
 * Barrel file to export all IPC modules
 * This file is used for auto-discovery of IPC modules by the IPC registry
 */

export * from "./base-ipc-module";

// Import and re-export all IPC modules
export * from "./app-initializer-ipc";
export * from "./app-config-ipc";
export * from "./db-ipc";
export * from "./plugin-ipc";
export * from "./window-ipc";
export * from "./shell-ipc";
