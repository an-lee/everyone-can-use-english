import { UserSetting } from "@main/storage/entities/user-setting";
import { instanceToPlain } from "class-transformer";
import { log } from "@main/core";

log.scope("Storage/UserSettingService");

export class UserSettingService {
  async all(): Promise<{ key: string; value: any }[]> {
    const settings = await UserSetting.find();
    return settings.map((setting) => {
      const key = setting.key;

      let value;
      try {
        value = JSON.parse(setting.value);
      } catch {
        value = setting.value;
      }

      return {
        key,
        value,
      };
    });
  }

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
