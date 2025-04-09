import { ILike } from "typeorm";
import { Conversation } from "@main/storage/entities/conversation";
import { log } from "@main/core";
import { instanceToPlain } from "class-transformer";

/**
 * Simple Conversation service for managing conversations
 */
export class ConversationService {
  /**
   * Find all conversations with pagination
   */
  async findAll(
    options?: PaginationOptions
  ): Promise<PaginationResult<ConversationEntity>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const search = options?.search;
    const order = options?.order == "asc" ? "ASC" : "DESC";
    const sort = options?.sort || "updated_at";

    const queryBuilder = Conversation.createQueryBuilder("conversation");

    if (search) {
      queryBuilder.where([
        { name: ILike(`%${search}%`) },
        { description: ILike(`%${search}%`) },
      ]);
    }

    log.info(
      `Querying conversations with search: ${search}, page: ${page}, limit: ${limit}, order: ${order}, sort: ${sort}`
    );

    const [conversations, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`conversation.${sort}`, order)
      .getManyAndCount();

    return {
      items: conversations.map(
        (conversation) => instanceToPlain(conversation) as ConversationEntity
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find conversation by ID
   */
  async findById(id: string): Promise<ConversationEntity | null> {
    const conversation = await Conversation.findOne({ where: { id } });
    if (!conversation) {
      return null;
    }

    return instanceToPlain(conversation) as ConversationEntity;
  }

  /**
   * Create a new conversation
   */
  async create(data: Partial<ConversationEntity>): Promise<ConversationEntity> {
    const conversation = Conversation.create(data as any);
    await conversation.save();

    return instanceToPlain(conversation) as ConversationEntity;
  }

  /**
   * Update an existing conversation
   */
  async update(
    id: string,
    data: Partial<ConversationEntity>
  ): Promise<ConversationEntity | null> {
    const conversation = await Conversation.findOne({ where: { id } });
    if (!conversation) {
      return null;
    }

    Object.assign(conversation, data);
    await conversation.save();

    return instanceToPlain(conversation) as ConversationEntity;
  }

  /**
   * Delete a conversation
   */
  async delete(id: string): Promise<boolean> {
    const conversation = await Conversation.findOne({ where: { id } });
    if (!conversation) {
      return false;
    }

    await conversation.remove();
    return true;
  }

  /**
   * Count conversations
   */
  async count(): Promise<number> {
    return await Conversation.count();
  }
}

// Export a singleton instance
export const conversationService = new ConversationService();
