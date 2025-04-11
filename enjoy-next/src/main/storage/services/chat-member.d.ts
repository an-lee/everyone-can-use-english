/**
 * Chat member item interface that maps to our entity
 */
declare interface ChatMemberEntity {
  id: string;
  chatId: string;
  userId: string;
  userType: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

declare interface ChatMemberFindAllOptions {
  chat_id?: string;
  user_id?: string;
  user_type?: string;
}
