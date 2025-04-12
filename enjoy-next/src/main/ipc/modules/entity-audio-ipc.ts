import { EntityBaseIpcModule } from "./entity-base-ipc";
import { audioService } from "@main/storage/services/audio-service";

/**
 * IPC module for Audio entity operations
 */
export class EntityAudioIpcModule extends EntityBaseIpcModule<
  typeof audioService
> {
  constructor() {
    super("Audio", "audio", audioService);
  }

  /**
   * Define parameter metadata explicitly instead of extracting from decorators
   */
  protected getMethodParameterMetadata(methodName: string): Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }> {
    // Define metadata for each method directly
    const metadataMap: Record<
      string,
      Array<{
        name: string;
        type: string;
        required?: boolean;
        description?: string;
      }>
    > = {
      findAll: [
        {
          name: "options",
          type: "PaginationOptions",
          required: false,
          description: "Search and pagination options",
        },
      ],
      findById: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Audio item ID",
        },
      ],
      findByMd5: [
        {
          name: "md5",
          type: "string",
          required: true,
          description: "MD5 hash of the audio file",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<AudioEntity>",
          required: true,
          description: "Audio item data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Audio item ID",
        },
        {
          name: "data",
          type: "Partial<AudioEntity>",
          required: true,
          description: "Audio item data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Audio item ID",
        },
      ],
      count: [],
    };

    return metadataMap[methodName] || [];
  }

  /**
   * Define return types explicitly instead of extracting from decorators
   */
  protected getMethodReturnType(methodName: string): string {
    // Define return types for each method directly
    const returnTypeMap: Record<string, string> = {
      findAll: "Promise<PaginationResult<AudioEntity>>",
      findById: "Promise<AudioEntity | null>",
      findByMd5: "Promise<AudioEntity | null>",
      create: "Promise<AudioEntity>",
      update: "Promise<AudioEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityAudioIpcModule = new EntityAudioIpcModule();
