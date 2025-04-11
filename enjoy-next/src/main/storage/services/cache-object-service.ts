import { CacheObject } from "@main/storage/entities/cache-object";
import { log } from "@main/core";

log.scope("Storage/CacheObjectService");

export class CacheObjectService {
  async get(key: string): Promise<CacheObjectEntity["value"] | null> {
    return CacheObject.get(key);
  }

  async set(
    key: string,
    value: object | string,
    ttl: number = 0
  ): Promise<void> {
    CacheObject.set(key, value, ttl);
  }

  async delete(key: string): Promise<boolean> {
    const cacheObject = await CacheObject.findOne({ where: { key } });
    if (!cacheObject) {
      return false;
    }
    await cacheObject.remove();
    return true;
  }
}

export const cacheObjectService = new CacheObjectService();
