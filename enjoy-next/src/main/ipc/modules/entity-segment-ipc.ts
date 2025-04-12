import { EntityBaseIpcModule } from "./entity-base-ipc";
import { segmentService } from "@main/storage/services/segment-service";

/**
 * IPC module for Video entity operations
 */
export class EntitySegmentIpcModule extends EntityBaseIpcModule<
  typeof segmentService
> {
  constructor() {
    super("Segment", "segment", segmentService);
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
        {
          name: "segmentIndex",
          type: "number",
          required: true,
          description: "Segment index",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<SegmentEntity>",
          required: true,
          description: "Segment item data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Segment item ID",
        },
        {
          name: "data",
          type: "Partial<SegmentEntity>",
          required: true,
          description: "Segment item data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Segment item ID",
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
      findAll: "Promise<PaginationResult<SegmentEntity>>",
      findByTarget: "Promise<SegmentEntity | null>",
      create: "Promise<SegmentEntity>",
      update: "Promise<SegmentEntity | null>",
      delete: "Promise<boolean>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entitySegmentIpcModule = new EntitySegmentIpcModule();
