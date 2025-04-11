import { log } from "@main/core";
import { instanceToPlain } from "class-transformer";
import { Message } from "../entities/message";

/**
 * Simple Audio service for managing audio files
 */
export class MessageService {
  constructor() {
    log.scope("Storage/MessageService");
  }

  /**
   * Find all chat messages with pagination
   */
  async findAll(
    options?: MessageFindAllOptions
  ): Promise<PaginationResult<MessageEntity>> {
    const conversationId = options?.conversationId;
    const role = options?.role;

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const sort = options?.sort || "updated_at";
    const order = options?.order == "asc" ? "ASC" : "DESC";

    const queryBuilder = Message.createQueryBuilder("message");

    if (conversationId) {
      queryBuilder.where([{ conversationId: conversationId }]);
    }
    if (role) {
      queryBuilder.andWhere({ role: role });
    }

    queryBuilder.orderBy(`message.${sort}`, order);
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    log.info(
      `Querying messages with conversation_id: ${conversationId}, role: ${role}`
    );

    const [messages, total] = await queryBuilder.getManyAndCount();

    return {
      items: messages.map(
        (message) => instanceToPlain(message) as MessageEntity
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
  async findById(id: string): Promise<MessageEntity | null> {
    const message = await Message.findOne({ where: { id } });
    if (!message) {
      return null;
    }

    return instanceToPlain(message) as MessageEntity;
  }

  /**
   * Create a new chat member
   */
  async create(data: Partial<MessageEntity>): Promise<MessageEntity> {
    const message = Message.create(data as any);
    await message.save();

    return instanceToPlain(message) as MessageEntity;
  }

  /**
   * Update an existing chat member
   */
  async update(
    id: string,
    data: Partial<MessageEntity>
  ): Promise<MessageEntity | null> {
    const message = await Message.findOne({ where: { id } });
    if (!message) {
      return null;
    }

    Object.assign(message, data);
    await message.save();

    return instanceToPlain(message) as MessageEntity;
  }

  /**
   * Delete an chat member
   */
  async delete(id: string): Promise<boolean> {
    const message = await Message.findOne({ where: { id } });
    if (!message) {
      return false;
    }

    await message.remove();
    return true;
  }

  /**
   * Count audio items
   */
  async count(): Promise<number> {
    return await Message.count();
  }
}

// Export a singleton instance
export const messageService = new MessageService();
