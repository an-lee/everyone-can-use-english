declare interface ChatEntity {
  id: string;
  name: string;
  type: string;
  digest: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
