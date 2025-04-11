import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("user_settings")
export class UserSetting extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "key", type: "varchar" })
  key!: string;

  @Column({ name: "value", type: "text" })
  value!: string;

  @CreateDateColumn({ name: "created_at", type: "date" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "date" })
  updatedAt!: Date;

  /**
   * Get a value from settings by key path
   * @param keyPath Can be a simple key or a nested path using dot notation (e.g., "theme.colors.primary")
   */
  static async get(keyPath: string): Promise<any> {
    const [rootKey, ...nestedPath] = keyPath.split(".");

    const setting = await UserSetting.findOne({ where: { key: rootKey } });
    if (!setting) {
      return null;
    }

    let result;
    try {
      result = JSON.parse(setting.value);
    } catch {
      result = setting.value;
    }

    // Return the whole value if no nested path
    if (nestedPath.length === 0) {
      return result;
    }

    // Navigate through nested properties
    return nestedPath.reduce((obj, path) => {
      return obj && typeof obj === "object" ? obj[path] : undefined;
    }, result);
  }

  /**
   * Set a value in settings by key path
   * @param keyPath Can be a simple key or a nested path using dot notation (e.g., "theme.colors.primary")
   * @param value Value to set
   */
  static async set(keyPath: string, value: any): Promise<void> {
    const [rootKey, ...nestedPath] = keyPath.split(".");

    let setting = await UserSetting.findOne({ where: { key: rootKey } });
    let valueToStore: any;

    // Simple key case (no nesting)
    if (nestedPath.length === 0) {
      valueToStore = value;
    } else {
      // Handle nested properties
      let existingData = {};
      if (setting) {
        try {
          existingData = JSON.parse(setting.value);
          if (typeof existingData !== "object" || existingData === null) {
            existingData = {};
          }
        } catch {
          existingData = {};
        }
      }

      // Create a deep clone to avoid modifying the original
      const dataToUpdate = JSON.parse(JSON.stringify(existingData));

      // Navigate to the nested property
      let current = dataToUpdate;
      for (let i = 0; i < nestedPath.length - 1; i++) {
        const path = nestedPath[i];
        if (!current[path] || typeof current[path] !== "object") {
          current[path] = {};
        }
        current = current[path];
      }

      // Set the value at the deepest level
      current[nestedPath[nestedPath.length - 1]] = value;
      valueToStore = dataToUpdate;
    }

    // Create or update the setting
    if (!setting) {
      setting = new UserSetting();
      setting.key = rootKey;
    }

    setting.value =
      typeof valueToStore === "string"
        ? valueToStore
        : JSON.stringify(valueToStore);

    await setting.save();
  }
}
