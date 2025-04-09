import { BaseEntityIpcModule } from "./base-entity-ipc";
import { recordingService } from "@main/storage/services/recording-service";

/**
 * IPC module for Video entity operations
 */
export class EntityRecordingIpcModule extends BaseEntityIpcModule<
  typeof recordingService
> {
  constructor() {
    super("Recording", "recording", recordingService);
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
          description: "Recording item ID",
        },
      ],
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
      create: [
        {
          name: "data",
          type: "Partial<RecordingEntity>",
          required: true,
          description: "Recording item data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Recording item ID",
        },
        {
          name: "data",
          type: "Partial<RecordingEntity>",
          required: true,
          description: "Recording item data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Recording item ID",
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
      findAll: "Promise<PaginationResult<RecordingEntity>>",
      findById: "Promise<RecordingEntity | null>",
      findByTarget: "Promise<RecordingEntity | null>",
      create: "Promise<RecordingEntity>",
      update: "Promise<RecordingEntity | null>",
      delete: "Promise<boolean>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityRecordingIpcModule = new EntityRecordingIpcModule();
