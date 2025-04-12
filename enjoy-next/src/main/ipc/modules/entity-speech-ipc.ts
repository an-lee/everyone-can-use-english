import { EntityBaseIpcModule } from "./entity-base-ipc";
import { speechService } from "@main/storage/services/speech-service";

/**
 * IPC module for Video entity operations
 */
export class EntitySpeechIpcModule extends EntityBaseIpcModule<
  typeof speechService
> {
  constructor() {
    super("Speech", "speech", speechService);
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
      findBySource: [
        {
          name: "sourceId",
          type: "string",
          required: true,
          description: "Source ID",
        },
        {
          name: "sourceType",
          type: "string",
          required: true,
          description: "Source type",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<SpeechEntity>",
          required: true,
          description: "Speech item data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Speech item ID",
        },
        {
          name: "data",
          type: "Partial<SpeechEntity>",
          required: true,
          description: "Speech item data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Speech item ID",
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
      findBySource: "Promise<SpeechEntity | null>",
      create: "Promise<SpeechEntity>",
      update: "Promise<SpeechEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entitySpeechIpcModule = new EntitySpeechIpcModule();
