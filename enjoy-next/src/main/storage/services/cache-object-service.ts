import { CacheObject } from "@main/storage/entities/cache-object";
import { instanceToPlain } from "class-transformer";
import { log } from "@main/core";

log.scope("Storage/CacheObjectService");

export class CacheObjectService {
  static async get(key: string): Promise<CacheObjectEntity | null> {
    const cacheObject = await CacheObject.findOne({ where: { key } });
    return instanceToPlain(cacheObject) as CacheObjectEntity | null;
  }

  static async set(
    key: string,
    value: object | string,
    ttl: number = 0
  ): Promise<void> {
    CacheObject.set(key, value, ttl);
  }

  static async delete(key: string): Promise<boolean> {
    const cacheObject = await CacheObject.findOne({ where: { key } });
    if (!cacheObject) {
      return false;
    }
    await cacheObject.remove();
    return true;
  }
}
