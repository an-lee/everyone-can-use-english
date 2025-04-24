import { Speech } from "@main/storage/entities/speech";
import { instanceToPlain } from "class-transformer";
import { log } from "@main/core";
import { ILike } from "typeorm";

log.scope("Storage/SpeechService");

export class SpeechService {
  async findAll(
    options?: PaginationOptions
  ): Promise<PaginationResult<SpeechEntity>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const search = options?.search;
    const order = options?.order == "asc" ? "ASC" : "DESC";
    const sort = options?.sort || "updated_at";

    const queryBuilder = Speech.createQueryBuilder("speech");

    if (search && search.length > 2) {
      queryBuilder.where([{ text: ILike(`%${search}%`) }]);
    }

    const [speeches, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`speech.${sort}`, order)
      .getManyAndCount();

    return {
      items: speeches.map((speech) => {
        return {
          ...(instanceToPlain(speech) as SpeechEntity),
          src: speech.src,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySource(
    sourceId: string,
    sourceType: string
  ): Promise<SpeechEntity | null> {
    const speech = await Speech.findOne({
      where: { sourceId, sourceType },
    });

    if (!speech) {
      return null;
    }

    return {
      ...instanceToPlain(speech),
      src: speech.src,
    } as SpeechEntity;
  }

  async create(data: Partial<SpeechEntity>): Promise<SpeechEntity> {
    const speech = new Speech();
    Object.assign(speech, data);
    await speech.save();
    return {
      ...instanceToPlain(speech),
      src: speech.src,
    } as SpeechEntity;
  }

  async update(id: string, data: Partial<SpeechEntity>): Promise<SpeechEntity> {
    const speech = await Speech.findOne({ where: { id } });
    if (!speech) {
      throw new Error("Speech not found");
    }
    Object.assign(speech, data);
    await speech.save();
    return {
      ...instanceToPlain(speech),
      src: speech.src,
    } as SpeechEntity;
  }

  async delete(id: string): Promise<boolean> {
    const speech = await Speech.findOne({ where: { id } });
    if (!speech) {
      return false;
    }
    await speech.remove();
    return true;
  }
}

export const speechService = new SpeechService();
