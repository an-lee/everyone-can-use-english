/**
 * Barrel file to export all IPC modules
 * This file is used for auto-discovery of IPC modules by the IPC registry
 */

// Export base modules
export * from "./base-ipc-module";
export * from "./base-entity-ipc";

// Export entity IPC modules
export * from "./entity-audio-ipc";
export * from "./entity-document-ipc";
export * from "./entity-transcription-ipc";
export * from "./entity-video-ipc";

// Export regular IPC modules
export * from "./app-config-ipc";
export * from "./app-initializer-ipc";
export * from "./db-ipc";
export * from "./plugin-ipc";
export * from "./window-ipc";
export * from "./shell-ipc";

import { entityAudioIpcModule } from "./entity-audio-ipc";
import { entityCacheObjectIpcModule } from "./entity-cache-object-ipc";
import { entityConversationIpcModule } from "./entity-conversation-ipc";
import { entityDocumentIpcModule } from "./entity-document-ipc";
import { entityPronunciationAssessmentIpcModule } from "./entity-pronunciation-assessment-ipc";
import { entityRecordingIpcModule } from "./entity-recording-ipc";
import { entitySegmentIpcModule } from "./entity-segment-ipc";
import { entitySpeechIpcModule } from "./entity-speech-ipc";
import { entityTranscriptionIpcModule } from "./entity-transcription-ipc";
import { entityUserSettingIpcModule } from "./entity-user-setting-ipc";
import { entityVideoIpcModule } from "./entity-video-ipc";
export const entityIpcModules = [
  entityAudioIpcModule,
  entityCacheObjectIpcModule,
  entityConversationIpcModule,
  entityDocumentIpcModule,
  entityPronunciationAssessmentIpcModule,
  entityRecordingIpcModule,
  entitySegmentIpcModule,
  entitySpeechIpcModule,
  entityTranscriptionIpcModule,
  entityUserSettingIpcModule,
  entityVideoIpcModule,
];

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
