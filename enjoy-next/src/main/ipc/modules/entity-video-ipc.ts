import { EntityBaseIpcModule } from "./entity-base-ipc";
import { videoService } from "@main/storage/services/video-service";

/**
 * IPC module for Video entity operations
 */
export class EntityVideoIpcModule extends EntityBaseIpcModule<
  typeof videoService
> {
  constructor() {
    super("Video", "video", videoService);
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
          description: "Video item ID",
        },
      ],
      findByMd5: [
        {
          name: "md5",
          type: "string",
          required: true,
          description: "MD5 hash of the video file",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<VideoEntity>",
          required: true,
          description: "Video item data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Video item ID",
        },
        {
          name: "data",
          type: "Partial<VideoEntity>",
          required: true,
          description: "Video item data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Video item ID",
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
      findAll: "Promise<PaginationResult<VideoEntity>>",
      findById: "Promise<VideoEntity | null>",
      findByMd5: "Promise<VideoEntity | null>",
      create: "Promise<VideoEntity>",
      update: "Promise<VideoEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityVideoIpcModule = new EntityVideoIpcModule();
