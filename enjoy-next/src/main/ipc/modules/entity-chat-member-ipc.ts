import { BaseEntityIpcModule } from "./base-entity-ipc";
import { chatMemberService } from "@main/storage/services/chat-member-service";

/**
 * IPC module for Audio entity operations
 */
export class EntityChatMemberIpcModule extends BaseEntityIpcModule<
  typeof chatMemberService
> {
  constructor() {
    super("ChatMember", "chat_member", chatMemberService);
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
          type: "ChatMemberFindAllOptions",
          required: false,
          description: "Search options",
        },
      ],
      findById: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Chat member ID",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<ChatMemberEntity>",
          required: true,
          description: "Chat member data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Chat member ID",
        },
        {
          name: "data",
          type: "Partial<ChatMemberEntity>",
          required: true,
          description: "Chat member data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Chat member ID",
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
      findAll: "Promise<ChatMemberEntity[]>",
      findById: "Promise<ChatMemberEntity | null>",
      create: "Promise<ChatMemberEntity>",
      update: "Promise<ChatMemberEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityChatMemberIpcModule = new EntityChatMemberIpcModule();
