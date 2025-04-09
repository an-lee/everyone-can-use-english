declare interface CacheObjectEntity {
  id: string;
  key: string;
  value: string;
  ttl: number;
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
}
