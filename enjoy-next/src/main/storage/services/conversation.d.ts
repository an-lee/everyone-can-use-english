declare interface ConversationEntity {
  id: string;
  name: string;
  engine: string;
  configuration: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  model: string;
  roleDefinition: string;
}
