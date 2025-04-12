import { messageService } from "@main/storage/services/message-service";
import { EntityBaseIpcModule } from "./entity-base-ipc";

/**
 * IPC module for Message entity operations
 */
export class EntityMessageIpcModule extends EntityBaseIpcModule<
  typeof messageService
> {
  constructor() {
    super("Message", "message", messageService);
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
          type: "MessageFindAllOptions",
          required: false,
          description: "Search options",
        },
      ],
      findById: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Message ID",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<MessageEntity>",
          required: true,
          description: "Message data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Message ID",
        },
        {
          name: "data",
          type: "Partial<MessageEntity>",
          required: true,
          description: "Message data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Message ID",
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
      findAll: "Promise<PaginationResult<MessageEntity>>",
      findById: "Promise<MessageEntity | null>",
      create: "Promise<MessageEntity>",
      update: "Promise<MessageEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityMessageIpcModule = new EntityMessageIpcModule();
