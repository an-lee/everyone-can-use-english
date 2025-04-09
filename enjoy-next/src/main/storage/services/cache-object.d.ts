declare interface CacheObjectEntity {
  id: string;
  key: string;
  value: object | string;
  ttl: number;
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
}
