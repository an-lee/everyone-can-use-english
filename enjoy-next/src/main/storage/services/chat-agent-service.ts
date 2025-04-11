import { ChatAgent } from "../entities/chat-agent";
import { instanceToPlain } from "class-transformer";

export class ChatAgentService {
  async findAll(
    options?: PaginationOptions
  ): Promise<PaginationResult<ChatAgentEntity>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const sort = options?.sort || "updated_at";
    const order = options?.order == "asc" ? "ASC" : "DESC";

    const query = ChatAgent.createQueryBuilder("chat_agent");

    if (sort) {
      query.orderBy(`chat_agent.${sort}`, order);
    }

    const [agents, total] = await query.getManyAndCount();

    return {
      items: agents.map((agent) => instanceToPlain(agent) as ChatAgentEntity),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ChatAgentEntity | null> {
    const agent = await ChatAgent.findOne({ where: { id } });
    return agent ? (instanceToPlain(agent) as ChatAgentEntity) : null;
  }

  async create(data: Partial<ChatAgentEntity>): Promise<ChatAgentEntity> {
    const agent = ChatAgent.create(data);
    await agent.save();
    return instanceToPlain(agent) as ChatAgentEntity;
  }

  async update(
    id: string,
    data: Partial<ChatAgentEntity>
  ): Promise<ChatAgentEntity | null> {
    const agent = await ChatAgent.findOne({ where: { id } });
    if (!agent) {
      return null;
    }
    await ChatAgent.update(id, data);
    return instanceToPlain(agent) as ChatAgentEntity;
  }

  async delete(id: string): Promise<boolean> {
    const agent = await ChatAgent.findOne({ where: { id } });
    if (!agent) {
      return false;
    }
    await agent.remove();
    return true;
  }

  async count(): Promise<number> {
    return await ChatAgent.count();
  }
}

export const chatAgentService = new ChatAgentService();
