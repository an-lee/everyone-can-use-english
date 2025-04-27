/**
 * Chat message item interface that maps to our entity
 */
declare interface ChatMessageEntity {
  id: string;
  chatId: string;
  role: ChatMessageRoleType;
  category: string;
  memberId: string;
  agentId: string;
  mentions: string[];
  content: string;
  state: ChatMessageStateType;
  createdAt: string;
  updatedAt: string;
}

declare interface ChatMessageFindAllOptions {
  chat_id?: string;
  role?: string;
  category?: string;
  member_id?: string;
  agent_id?: string;
  state?: string;
}

declare type ChatMessageRoleType = "USER" | "AGENT";
declare type ChatMessageStateType = "pending" | "completed";
