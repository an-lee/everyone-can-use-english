import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("cache_objects")
export class CacheObject extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  key!: string;

  @Column({ type: "text" })
  value!: string;

  @Column({ type: "integer", default: 0 })
  ttl!: number;

  @CreateDateColumn({ name: "created_at", type: "date" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "date" })
  updatedAt!: Date;

  get isExpired(): boolean {
    return (
      this.ttl > 0 && this.updatedAt.getTime() + this.ttl * 1000 < Date.now()
    );
  }

  static async get(key: string): Promise<CacheObject["value"] | null> {
    const cacheObject = await CacheObject.findOne({ where: { key } });
    if (!cacheObject) return null;

    if (cacheObject.isExpired) {
      await cacheObject.remove();
      return null;
    }

    return cacheObject.value;
  }

  static async set(key: string, value: string, ttl: number): Promise<void> {
    let cacheObject = await CacheObject.findOne({ where: { key } });

    if (typeof value === "object") {
      value = JSON.stringify(value);
    }

    if (cacheObject) {
      cacheObject.value = value;
      cacheObject.ttl = ttl;
    } else {
      cacheObject = new CacheObject();
      cacheObject.key = key;
      cacheObject.value = value;
      cacheObject.ttl = ttl;
    }

    await cacheObject.save();
  }
}
