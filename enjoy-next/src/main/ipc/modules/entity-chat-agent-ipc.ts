import { chatAgentService } from "@/main/storage/services/chat-agent-service";
import { EntityBaseIpcModule } from "./entity-base-ipc";

export class EntityChatAgentIpcModule extends EntityBaseIpcModule<
  typeof chatAgentService
> {
  constructor() {
    super("ChatAgent", "chat_agent", chatAgentService);
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
          description: "Chat agent ID",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<ChatAgentEntity>",
          required: true,
          description: "Chat agent data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Chat agent ID",
        },
        {
          name: "data",
          type: "Partial<ChatAgentEntity>",
          required: true,
          description: "Chat agent data",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Chat agent ID",
        },
      ],
      count: [],
    };

    return metadataMap[methodName] || [];
  }

  protected getMethodReturnType(methodName: string): string {
    const returnTypeMap: Record<string, string> = {
      findAll: "Promise<PaginationResult<ChatAgentEntity>>",
      findById: "Promise<ChatAgentEntity | null>",
      create: "Promise<ChatAgentEntity>",
      update: "Promise<ChatAgentEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

export const entityChatAgentIpcModule = new EntityChatAgentIpcModule();
