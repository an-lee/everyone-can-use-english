import { ILike } from "typeorm";
import { Audio } from "@main/storage/entities/audio";
import { log } from "@main/core";

/**
 * Map from Audio entity to AudioItem interface
 */
function mapAudioToItem(audio: Audio): AudioEntity {
  return {
    id: audio.id,
    name: audio.name,
    description: audio.description,
    language: audio.language,
    source: audio.source,
    md5: audio.md5,
    metadata: audio.metadata,
    coverUrl: audio.coverUrl,
    recordingsCount: audio.recordingsCount,
    recordingsDuration: audio.recordingsDuration,
    syncedAt: audio.syncedAt,
    uploadedAt: audio.uploadedAt,
    createdAt: audio.createdAt,
    updatedAt: audio.updatedAt,
  };
}

/**
 * Simple Audio service for managing audio files
 */
export class AudioService {
  /**
   * Find all audio items with pagination
   */
  async findAll(options?: AudioSearchOptions): Promise<AudioPaginationResult> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const search = options?.search;
    const order = options?.order == "asc" ? "ASC" : "DESC";
    const sort = options?.sort || "updated_at";

    const queryBuilder = Audio.createQueryBuilder("audio");

    if (search) {
      queryBuilder.where([
        { name: ILike(`%${search}%`) },
        { description: ILike(`%${search}%`) },
      ]);
    }

    log.info(
      `Querying audios with search: ${search}, page: ${page}, limit: ${limit}, order: ${order}, sort: ${sort}`
    );

    const [audios, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`audio.${sort}`, order)
      .getManyAndCount();

    return {
      items: audios.map(mapAudioToItem),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find audio item by ID
   */
  async findById(id: string): Promise<AudioEntity | null> {
    const audio = await Audio.findOne({ where: { id } });
    if (!audio) {
      return null;
    }

    return mapAudioToItem(audio);
  }

  /**
   * Find audio item by MD5 hash
   */
  async findByMd5(md5: string): Promise<AudioEntity | null> {
    const audio = await Audio.findOne({ where: { md5 } });
    if (!audio) {
      return null;
    }

    return mapAudioToItem(audio);
  }

  /**
   * Create a new audio item
   */
  async create(data: Partial<AudioEntity>): Promise<AudioEntity> {
    const audio = Audio.create(data as any);
    await audio.save();

    return mapAudioToItem(audio);
  }

  /**
   * Update an existing audio item
   */
  async update(
    id: string,
    data: Partial<AudioEntity>
  ): Promise<AudioEntity | null> {
    const audio = await Audio.findOne({ where: { id } });
    if (!audio) {
      return null;
    }

    Object.assign(audio, data);
    await audio.save();

    return mapAudioToItem(audio);
  }

  /**
   * Delete an audio item
   */
  async delete(id: string): Promise<boolean> {
    const audio = await Audio.findOne({ where: { id } });
    if (!audio) {
      return false;
    }

    await audio.remove();
    return true;
  }

  /**
   * Count audio items
   */
  async count(): Promise<number> {
    return await Audio.count();
  }
}

// Export a singleton instance
export const audioService = new AudioService();
