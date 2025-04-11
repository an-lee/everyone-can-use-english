/**
 * Message item interface that maps to our entity
 */
declare interface MessageEntity {
  id: string;
  conversationId: string;
  content: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

declare interface MessageFindAllOptions extends PaginationOptions {
  conversationId?: string;
  role?: string;
}
