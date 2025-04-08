import { ILike } from "typeorm";
import { Audio } from "@main/storage/entities/audio";

/**
 * Audio item interface that maps to our entity
 */
export interface AudioItem {
  id: string;
  name?: string;
  description?: string;
  language?: string;
  source?: string;
  md5: string;
  metadata: Record<string, any>;
  coverUrl?: string;
  recordingsCount: number;
  recordingsDuration: number;
  syncedAt?: Date;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Audio search options
 */
export interface AudioSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
  language?: string;
  source?: string;
}

/**
 * Pagination result for audio items
 */
export interface AudioPaginationResult {
  items: AudioItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Map from Audio entity to AudioItem interface
 */
function mapAudioToItem(audio: Audio): AudioItem {
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

    const queryBuilder = Audio.createQueryBuilder("audio");

    if (search) {
      queryBuilder.where([
        { name: ILike(`%${search}%`) },
        { description: ILike(`%${search}%`) },
      ]);
    }

    const [audios, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("audio.createdAt", "DESC")
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
  async findById(id: string): Promise<AudioItem | null> {
    const audio = await Audio.findOne({ where: { id } });
    if (!audio) {
      return null;
    }

    return mapAudioToItem(audio);
  }

  /**
   * Find audio item by MD5 hash
   */
  async findByMd5(md5: string): Promise<AudioItem | null> {
    const audio = await Audio.findOne({ where: { md5 } });
    if (!audio) {
      return null;
    }

    return mapAudioToItem(audio);
  }

  /**
   * Create a new audio item
   */
  async create(data: Partial<AudioItem>): Promise<AudioItem> {
    const audio = Audio.create(data as any);
    await audio.save();

    return mapAudioToItem(audio);
  }

  /**
   * Update an existing audio item
   */
  async update(
    id: string,
    data: Partial<AudioItem>
  ): Promise<AudioItem | null> {
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
