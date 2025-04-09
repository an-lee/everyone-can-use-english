import { BaseEntityIpcModule } from "./base-entity-ipc";
import { userSettingService } from "@main/storage/services/user-setting-service";

/**
 * IPC module for Video entity operations
 */
export class EntityUserSettingIpcModule extends BaseEntityIpcModule<
  typeof userSettingService
> {
  constructor() {
    super("UserSetting", "userSetting", userSettingService);
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
          description: "Key",
        },
      ],
      set: [
        {
          name: "key",
          type: "string",
          required: true,
          description: "Key",
        },
        {
          name: "value",
          type: "string",
          required: true,
          description: "Value",
        },
      ],
      delete: [
        {
          name: "key",
          type: "string",
          required: true,
          description: "Key",
        },
      ],
      count: [],
    };

    return metadataMap[methodName] || [];
  }

  /**
   * Define return types explicitly instead of extracting from decorators
   */
  protected getMethodReturnType(methodName: string): string {
    // Define return types for each method directly
    const returnTypeMap: Record<string, string> = {
      get: "Promise<UserSettingEntity['value'] | null>",
      set: "Promise<UserSettingEntity | null>",
      delete: "Promise<boolean>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityUserSettingIpcModule = new EntityUserSettingIpcModule();
