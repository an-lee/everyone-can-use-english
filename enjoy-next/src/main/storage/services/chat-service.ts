import { Chat } from "../entities/chat";
import { instanceToPlain } from "class-transformer";

export class ChatService {
  async findAll(
    options?: PaginationOptions
  ): Promise<PaginationResult<ChatEntity>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const search = options?.search;
    const sort = options?.sort || "updated_at";
    const order = options?.order == "asc" ? "ASC" : "DESC";

    const query = Chat.createQueryBuilder("chat");

    if (search) {
      query.where("chat.name LIKE :search", {
        search: `%${search}%`,
      });
    }

    const [agents, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`chat.${sort}`, order)
      .getManyAndCount();

    return {
      items: agents.map((agent) => instanceToPlain(agent) as ChatEntity),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ChatEntity | null> {
    const chat = await Chat.findOne({ where: { id } });
    return chat ? (instanceToPlain(chat) as ChatEntity) : null;
  }

  async create(data: Partial<ChatEntity>): Promise<ChatEntity> {
    const chat = Chat.create(data);
    await chat.save();
    return instanceToPlain(chat) as ChatEntity;
  }

  async update(
    id: string,
    data: Partial<ChatAgentEntity>
  ): Promise<ChatAgentEntity | null> {
    const chat = await Chat.findOne({ where: { id } });
    if (!chat) {
      return null;
    }
    await Chat.update(id, data);
    return instanceToPlain(chat) as ChatEntity;
  }

  async delete(id: string): Promise<boolean> {
    const chat = await Chat.findOne({ where: { id } });
    if (!chat) {
      return false;
    }
    await chat.remove();
    return true;
  }

  async count(): Promise<number> {
    return await Chat.count();
  }
}

export const chatService = new ChatService();
