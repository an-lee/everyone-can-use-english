import { BaseEntityIpcModule } from "./base-entity-ipc";
import { audioService } from "@main/storage/services/audio-service";
import { getServiceMethodMetadata } from "@main/storage/services/service-decorators";

/**
 * IPC module for Audio entity operations
 */
export class DbAudioIpcModule extends BaseEntityIpcModule<typeof audioService> {
  constructor() {
    super("Audio", "audio", audioService);
  }

  /**
   * Get parameter metadata for a method using the service decorators system
   */
  protected getMethodParameterMetadata(methodName: string): Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }> {
    const metadata = getServiceMethodMetadata(
      audioService.constructor,
      methodName
    );

    if (metadata?.parameters) {
      return metadata.parameters.map((param) => ({
        name: param.name || `param${param.index}`,
        type: param.type || "any",
        required: param.required,
        description: param.description,
      }));
    }

    return [];
  }

  /**
   * Get return type for a method using the service decorators system
   */
  protected getMethodReturnType(methodName: string): string {
    const metadata = getServiceMethodMetadata(
      audioService.constructor,
      methodName
    );
    return metadata?.returnType || "Promise<any>";
  }
}

// Export singleton instance
export const dbAudioIpcModule = new DbAudioIpcModule();
