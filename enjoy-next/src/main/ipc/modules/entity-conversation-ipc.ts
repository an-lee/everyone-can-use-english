import { BaseEntityIpcModule } from "./base-entity-ipc";
import { conversationService } from "@main/storage/services/conversation-service";

/**
 * IPC module for Conversation entity operations
 */
export class EntityConversationIpcModule extends BaseEntityIpcModule<
  typeof conversationService
> {
  constructor() {
    super("Conversation", "conversation", conversationService);
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
          description: "Conversation ID",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<ConversationEntity>",
          required: true,
          description: "Conversation data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Conversation ID",
        },
        {
          name: "data",
          type: "Partial<ConversationEntity>",
          required: true,
          description: "Conversation data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Conversation ID",
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
      findAll: "Promise<PaginationResult<ConversationEntity>>",
      findById: "Promise<ConversationEntity | null>",
      create: "Promise<ConversationEntity>",
      update: "Promise<ConversationEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityConversationIpcModule = new EntityConversationIpcModule();
