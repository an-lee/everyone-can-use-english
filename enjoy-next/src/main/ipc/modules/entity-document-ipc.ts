import { EntityBaseIpcModule } from "./entity-base-ipc";
import { documentService } from "@main/storage/services/document-service";

/**
 * IPC module for Video entity operations
 */
export class EntityDocumentIpcModule extends EntityBaseIpcModule<
  typeof documentService
> {
  constructor() {
    super("Document", "document", documentService);
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
          description: "Document item ID",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<DocumentEntity>",
          required: true,
          description: "Document item data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Document item ID",
        },
        {
          name: "data",
          type: "Partial<DocumentEntity>",
          required: true,
          description: "Document item data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Document item ID",
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
      findAll: "Promise<PaginationResult<DocumentEntity>>",
      findById: "Promise<DocumentEntity | null>",
      create: "Promise<DocumentEntity>",
      update: "Promise<DocumentEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityDocumentIpcModule = new EntityDocumentIpcModule();
