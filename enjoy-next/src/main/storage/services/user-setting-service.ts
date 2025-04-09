import { UserSetting } from "@main/storage/entities/user-setting";
import { instanceToPlain } from "class-transformer";
import { log } from "@main/core";

log.scope("Storage/UserSettingService");

export class UserSettingService {
  static async get(key: string): Promise<UserSettingEntity | null> {
    return UserSetting.get(key);
  }

  static async set(key: string, value: object | string): Promise<void> {
    await UserSetting.set(key, value);
  }

  static async delete(key: string): Promise<void> {
    await UserSetting.delete(key);
  }
}
