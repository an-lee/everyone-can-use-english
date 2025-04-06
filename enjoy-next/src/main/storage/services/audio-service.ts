import { ILike, IsNull, Not } from "typeorm";
import { Audio } from "../entities/audio";

/**
 * Service for Audio entity
 */
export const AudioService = {
  /**
   * Find all audios with pagination
   */
  findAll: async (options?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const search = options?.search;

    const queryBuilder = Audio.createQueryBuilder("audio");

    if (search) {
      queryBuilder.where([
        { name: ILike(`%${search}%`) },
        { description: ILike(`%${search}%`) },
      ]);
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("audio.createdAt", "DESC")
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Find audio by ID
   */
  findById: async (id: string) => {
    return await Audio.findOne({ where: { id } });
  },

  /**
   * Find audio by MD5
   */
  findByMd5: async (md5: string) => {
    return await Audio.findOne({ where: { md5 } });
  },

  /**
   * Create new audio
   */
  create: async (data: Partial<Audio>) => {
    const audio = Audio.create(data);
    return await audio.save();
  },

  /**
   * Update audio
   */
  update: async (id: string, data: Partial<Audio>) => {
    const audio = await Audio.findOne({ where: { id } });
    if (!audio) {
      throw new Error("Audio not found");
    }

    Object.assign(audio, data);
    return await audio.save();
  },

  /**
   * Delete audio
   */
  delete: async (id: string) => {
    const audio = await Audio.findOne({ where: { id } });
    if (!audio) {
      throw new Error("Audio not found");
    }

    await audio.remove();
    return true;
  },
};
