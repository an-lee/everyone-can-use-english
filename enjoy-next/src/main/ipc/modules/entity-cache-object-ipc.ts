import { EntityBaseIpcModule } from "./entity-base-ipc";
import { cacheObjectService } from "@main/storage/services/cache-object-service";

/**
 * IPC module for Video entity operations
 */
export class EntityCacheObjectIpcModule extends EntityBaseIpcModule<
  typeof cacheObjectService
> {
  constructor() {
    super("CacheObject", "cacheObject", cacheObjectService);
  }

  /**
   * Define parameter metadata explicitly instead of extracting from decorators
   */
  protected getMethodParameterMetadata(methodName: string): Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }> {
    // Define metadata for each method directly
    const metadataMap: Record<
      string,
      Array<{
        name: string;
        type: string;
        required?: boolean;
        description?: string;
      }>
    > = {
      get: [
        {
          name: "key",
          type: "string",
          required: true,
          description: "Key of the cache object",
        },
      ],
      set: [
        {
          name: "key",
          type: "string",
          required: true,
          description: "Key of the cache object",
        },
        {
          name: "value",
          type: "any",
          required: true,
          description: "Value of the cache object",
        },
        {
          name: "ttl",
          type: "number",
          required: false,
          description: "Time to live of the cache object",
        },
      ],
      delete: [
        {
          name: "key",
          type: "string",
          required: true,
          description: "Key of the cache object",
        },
      ],
    };

    return metadataMap[methodName] || [];
  }

  /**
   * Define return types explicitly instead of extracting from decorators
   */
  protected getMethodReturnType(methodName: string): string {
    // Define return types for each method directly
    const returnTypeMap: Record<string, string> = {
      get: "Promise<CacheObjectEntity['value'] | null>",
      set: "Promise<void>",
      delete: "Promise<boolean>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityCacheObjectIpcModule = new EntityCacheObjectIpcModule();
