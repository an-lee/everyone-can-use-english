/**
 * Note item interface that maps to our entity
 */
declare interface NoteEntity {
  id: string;
  targetId: string;
  targetType: string;
  content: string;
  parameters: Record<string, any>;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

declare interface NoteFindAllOptions extends PaginationOptions {
  targetId?: string;
  targetType?: string;
}
