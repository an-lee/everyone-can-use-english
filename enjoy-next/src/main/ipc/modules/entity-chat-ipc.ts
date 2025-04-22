import { chatService } from "@main/storage/services";
import { EntityBaseIpcModule } from "./entity-base-ipc";

export class EntityChatIpcModule extends EntityBaseIpcModule<
  typeof chatService
> {
  constructor() {
    super("Chat", "chat", chatService);
  }

  protected getMethodParameterMetadata(methodName: string): Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }> {
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
          description: "Chat ID",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<ChatEntity>",
          required: true,
          description: "Chat data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Chat ID",
        },
        {
          name: "data",
          type: "Partial<ChatEntity>",
          required: true,
          description: "Chat data",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Chat ID",
        },
      ],
      count: [],
    };

    return metadataMap[methodName] || [];
  }

  protected getMethodReturnType(methodName: string): string {
    const returnTypeMap: Record<string, string> = {
      findAll: "Promise<PaginationResult<ChatEntity>>",
      findById: "Promise<ChatEntity | null>",
      create: "Promise<ChatEntity>",
      update: "Promise<ChatEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

export const entityChatIpcModule = new EntityChatIpcModule();
