import { chatMessageService } from "@main/storage/services/chat-message-service";
import { BaseEntityIpcModule } from "./base-entity-ipc";

/**
 * IPC module for ChatMessage entity operations
 */
export class EntityChatMessageIpcModule extends BaseEntityIpcModule<
  typeof chatMessageService
> {
  constructor() {
    super("ChatMessage", "chat_message", chatMessageService);
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
          type: "ChatMessageFindAllOptions",
          required: false,
          description: "Search options",
        },
      ],
      findById: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Chat message ID",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<ChatMessageEntity>",
          required: true,
          description: "Chat message data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Chat message ID",
        },
        {
          name: "data",
          type: "Partial<ChatMessageEntity>",
          required: true,
          description: "Chat message data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Chat message ID",
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
      findAll: "Promise<PaginationResult<ChatMessageEntity>>",
      findById: "Promise<ChatMessageEntity | null>",
      create: "Promise<ChatMessageEntity>",
      update: "Promise<ChatMessageEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityChatMessageIpcModule = new EntityChatMessageIpcModule();
