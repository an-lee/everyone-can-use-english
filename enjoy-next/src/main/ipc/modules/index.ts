/**
 * Barrel file to export all IPC modules
 * This file is used for auto-discovery of IPC modules by the IPC registry
 */

// Export base modules
export * from "./base-ipc-module";
export * from "./base-entity-ipc";

// Export entity IPC modules
export * from "./db-audio-ipc";

// Export regular IPC modules
export * from "./app-config-ipc";
export * from "./app-initializer-ipc";
export * from "./db-ipc";
export * from "./plugin-ipc";
export * from "./window-ipc";
export * from "./shell-ipc";
