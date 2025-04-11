import { ILike } from "typeorm";
import { log } from "@main/core";
import { instanceToPlain } from "class-transformer";
import { ChatMessage } from "../entities/chat-message";

/**
 * Simple Audio service for managing audio files
 */
export class ChatMessageService {
  constructor() {
    log.scope("Storage/ChatMessageService");
  }

  /**
   * Find all chat messages with pagination
   */
  async findAll(
    options?: ChatMessageFindAllOptions
  ): Promise<PaginationResult<ChatMessageEntity>> {
    const chatId = options?.chat_id;
    const role = options?.role;
    const category = options?.category;
    const memberId = options?.member_id;
    const agentId = options?.agent_id;
    const state = options?.state;

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const sort = options?.sort || "updated_at";
    const order = options?.order == "asc" ? "ASC" : "DESC";

    const queryBuilder = ChatMessage.createQueryBuilder("chat_message");

    if (chatId) {
      queryBuilder.where([{ chatId: chatId }]);
    }
    if (role) {
      queryBuilder.andWhere({ role: role });
    }
    if (category) {
      queryBuilder.andWhere({ category: category });
    }
    if (memberId) {
      queryBuilder.andWhere({ memberId: memberId });
    }
    if (agentId) {
      queryBuilder.andWhere({ agentId: agentId });
    }
    if (state) {
      queryBuilder.andWhere({ state: state });
    }

    queryBuilder.orderBy(`chat_message.${sort}`, order);
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    log.info(
      `Querying chat messages with chat_id: ${chatId}, role: ${role}, category: ${category}, member_id: ${memberId}, agent_id: ${agentId}, state: ${state}`
    );

    const [chatMessages, total] = await queryBuilder.getManyAndCount();

    return {
      items: chatMessages.map(
        (chatMessage) => instanceToPlain(chatMessage) as ChatMessageEntity
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find chat member by ID
   */
  async findById(id: string): Promise<ChatMessageEntity | null> {
    const chatMessage = await ChatMessage.findOne({ where: { id } });
    if (!chatMessage) {
      return null;
    }

    return instanceToPlain(chatMessage) as ChatMessageEntity;
  }

  /**
   * Create a new chat member
   */
  async create(data: Partial<ChatMessageEntity>): Promise<ChatMessageEntity> {
    const chatMessage = ChatMessage.create(data as any);
    await chatMessage.save();

    return instanceToPlain(chatMessage) as ChatMessageEntity;
  }

  /**
   * Update an existing chat member
   */
  async update(
    id: string,
    data: Partial<ChatMessageEntity>
  ): Promise<ChatMessageEntity | null> {
    const chatMessage = await ChatMessage.findOne({ where: { id } });
    if (!chatMessage) {
      return null;
    }

    Object.assign(chatMessage, data);
    await chatMessage.save();

    return instanceToPlain(chatMessage) as ChatMessageEntity;
  }

  /**
   * Delete an chat member
   */
  async delete(id: string): Promise<boolean> {
    const chatMessage = await ChatMessage.findOne({ where: { id } });
    if (!chatMessage) {
      return false;
    }

    await chatMessage.remove();
    return true;
  }

  /**
   * Count audio items
   */
  async count(): Promise<number> {
    return await ChatMessage.count();
  }
}

// Export a singleton instance
export const chatMessageService = new ChatMessageService();
