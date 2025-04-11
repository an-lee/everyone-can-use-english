declare interface ChatAgentEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
  avatarUrl?: string;
  source?: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
