import { log } from "@main/core";
import { instanceToPlain } from "class-transformer";
import { ChatMember } from "../entities/chat-member";

/**
 * Simple Audio service for managing audio files
 */
export class ChatMemberService {
  constructor() {
    log.scope("Storage/ChatMemberService");
  }

  /**
   * Find all chat members with pagination
   */
  async findAll(
    options?: ChatMemberFindAllOptions
  ): Promise<ChatMemberEntity[]> {
    const chatId = options?.chat_id;
    const userId = options?.user_id;
    const userType = options?.user_type;

    const queryBuilder = ChatMember.createQueryBuilder("chat_member");

    if (chatId) {
      queryBuilder.where([{ chatId: chatId }]);
    }

    if (userId) {
      queryBuilder.andWhere({ userId: userId });
    }

    if (userType) {
      queryBuilder.andWhere({ userType: userType });
    }

    log.info(
      `Querying chat members with chat_id: ${chatId}, user_id: ${userId}, user_type: ${userType}`
    );

    const chatMembers = await queryBuilder.getMany();

    return chatMembers.map(
      (chatMember) => instanceToPlain(chatMember) as ChatMemberEntity
    );
  }

  /**
   * Find chat member by ID
   */
  async findById(id: string): Promise<ChatMemberEntity | null> {
    const chatMember = await ChatMember.findOne({ where: { id } });
    if (!chatMember) {
      return null;
    }

    return instanceToPlain(chatMember) as ChatMemberEntity;
  }

  /**
   * Create a new chat member
   */
  async create(data: Partial<ChatMemberEntity>): Promise<ChatMemberEntity> {
    const chatMember = ChatMember.create(data as any);
    await chatMember.save();

    return instanceToPlain(chatMember) as ChatMemberEntity;
  }

  /**
   * Update an existing chat member
   */
  async update(
    id: string,
    data: Partial<ChatMemberEntity>
  ): Promise<ChatMemberEntity | null> {
    const chatMember = await ChatMember.findOne({ where: { id } });
    if (!chatMember) {
      return null;
    }

    Object.assign(chatMember, data);
    await chatMember.save();

    return instanceToPlain(chatMember) as ChatMemberEntity;
  }

  /**
   * Delete an chat member
   */
  async delete(id: string): Promise<boolean> {
    const chatMember = await ChatMember.findOne({ where: { id } });
    if (!chatMember) {
      return false;
    }

    await chatMember.remove();
    return true;
  }

  /**
   * Count audio items
   */
  async count(): Promise<number> {
    return await ChatMember.count();
  }
}

// Export a singleton instance
export const chatMemberService = new ChatMemberService();
