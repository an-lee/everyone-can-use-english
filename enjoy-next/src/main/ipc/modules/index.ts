/**
 * Barrel file to export all IPC modules
 * This file is used for auto-discovery of IPC modules by the IPC registry
 */

// Export base modules
export * from "./base-ipc-module";
export * from "./base-entity-ipc";

// Export entity IPC modules
export * from "./db-audio-ipc";
export * from "./db-transcription-ipc";

// Export regular IPC modules
export * from "./app-config-ipc";
export * from "./app-initializer-ipc";
export * from "./db-ipc";
export * from "./plugin-ipc";
export * from "./window-ipc";
export * from "./shell-ipc";

import { dbAudioIpcModule } from "./db-audio-ipc";
import { dbTranscriptionIpcModule } from "./db-transcription-ipc";
export const entityIpcModules = [dbAudioIpcModule, dbTranscriptionIpcModule];

import { appConfigIpcModule } from "./app-config-ipc";
import { appInitializerIpcModule } from "./app-initializer-ipc";
import { dbIpcModule } from "./db-ipc";
import { pluginIpcModule } from "./plugin-ipc";
import { windowIpcModule } from "./window-ipc";
import { shellIpcModule } from "./shell-ipc";
export const regularIpcModules = [
  appConfigIpcModule,
  appInitializerIpcModule,
  dbIpcModule,
  pluginIpcModule,
  windowIpcModule,
  shellIpcModule,
];
