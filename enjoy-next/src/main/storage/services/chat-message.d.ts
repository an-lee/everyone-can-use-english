/**
 * Chat message item interface that maps to our entity
 */
declare interface ChatMessageEntity {
  id: string;
  chatId: string;
  role: string;
  category: string;
  memberId: string;
  agentId: string;
  mentions: string[];
  content: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

declare interface ChatMessageFindAllOptions extends PaginationOptions {
  chat_id?: string;
  role?: string;
  category?: string;
  member_id?: string;
  agent_id?: string;
  state?: string;
}
