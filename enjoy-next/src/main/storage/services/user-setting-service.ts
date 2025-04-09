import { UserSetting } from "@main/storage/entities/user-setting";
import { instanceToPlain } from "class-transformer";
import { log } from "@main/core";

log.scope("Storage/UserSettingService");

export class UserSettingService {
  async get(key: string): Promise<UserSettingEntity["value"] | null> {
    return UserSetting.get(key);
  }

  async set(key: string, value: object | string): Promise<void> {
    await UserSetting.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await UserSetting.delete(key);
  }
}

export const userSettingService = new UserSettingService();
