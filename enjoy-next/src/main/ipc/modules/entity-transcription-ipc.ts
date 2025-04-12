import { EntityBaseIpcModule } from "./entity-base-ipc";
import { transcriptionService } from "@main/storage/services/transcription-service";

/**
 * IPC module for Transcription entity operations
 */
export class EntityTranscriptionIpcModule extends EntityBaseIpcModule<
  typeof transcriptionService
> {
  constructor() {
    super("Transcription", "transcription", transcriptionService);
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
      findByTarget: [
        {
          name: "targetId",
          type: "string",
          required: true,
          description: "Target ID",
        },
        {
          name: "targetType",
          type: "string",
          required: true,
          description: "Target type",
        },
      ],
      findByTargetMd5: [
        {
          name: "targetMd5",
          type: "string",
          required: true,
          description: "MD5 hash of the target",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<TranscriptionEntity>",
          required: true,
          description: "Transcription item data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Transcription item ID",
        },
        {
          name: "data",
          type: "Partial<TranscriptionEntity>",
          required: true,
          description: "Transcription item data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Transcription item ID",
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
      findByTarget: "Promise<TranscriptionEntity | null>",
      findByMd5: "Promise<TranscriptionEntity | null>",
      create: "Promise<TranscriptionEntity>",
      update: "Promise<TranscriptionEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityTranscriptionIpcModule = new EntityTranscriptionIpcModule();
