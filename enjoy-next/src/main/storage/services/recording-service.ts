import { ILike } from "typeorm";
import { Recording } from "../entities/recording";
import { instanceToPlain } from "class-transformer";
import { log } from "@main/core";

export class RecordingService {
  private logger: any;

  constructor() {
    this.logger = log.scope("Storage/RecordingService");
  }

  async findAll(
    options?: PaginationOptions
  ): Promise<PaginationResult<RecordingEntity>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const search = options?.search;
    const order = options?.order == "asc" ? "ASC" : "DESC";
    const sort = options?.sort || "updated_at";

    const queryBuilder = Recording.createQueryBuilder("recording");

    if (search) {
      queryBuilder.where([
        { filename: ILike(`%${search}%`) },
        { referenceText: ILike(`%${search}%`) },
      ]);
    }

    log.info(
      `Querying recordings with search: ${search}, page: ${page}, limit: ${limit}, order: ${order}, sort: ${sort}`
    );

    const [recordings, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`recording.${sort}`, order)
      .getManyAndCount();

    return {
      items: recordings.map(
        (recording) =>
          ({
            ...instanceToPlain(recording),
            src: recording.src,
          }) as RecordingEntity
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<RecordingEntity | null> {
    const recording = await Recording.findOne({ where: { id } });
    return instanceToPlain(recording) as RecordingEntity | null;
  }

  async findByTarget(
    targetId: string,
    targetType: RecordingEntity["targetType"],
    referenceId?: number
  ): Promise<RecordingEntity[]> {
    const queryBuilder = Recording.createQueryBuilder("recording");

    this.logger.info(
      `Finding recordings by target: ${targetId}, targetType: ${targetType}, referenceId: ${referenceId}`
    );

    queryBuilder.where({ targetId, targetType });

    if (referenceId !== undefined) {
      queryBuilder.andWhere({ referenceId });
    }

    const recordings = await queryBuilder
      .orderBy({ created_at: "DESC" })
      .getMany();
    const items = recordings.map(
      (recording) =>
        ({
          ...instanceToPlain(recording),
          src: recording.src,
        }) as RecordingEntity
    );

    return items;
  }

  async create(data: Partial<RecordingEntity>): Promise<RecordingEntity> {
    const recording = new Recording();
    Object.assign(recording, data);
    await recording.save();
    return instanceToPlain(recording) as RecordingEntity;
  }

  async update(
    id: string,
    data: Partial<RecordingEntity>
  ): Promise<RecordingEntity> {
    const recording = await Recording.findOne({ where: { id } });
    if (!recording) {
      throw new Error("Recording not found");
    }
    Object.assign(recording, data);
    await recording.save();
    return instanceToPlain(recording) as RecordingEntity;
  }

  async delete(id: string): Promise<boolean> {
    const recording = await Recording.findOne({ where: { id } });
    if (!recording) {
      return false;
    }
    await recording.remove();
    return true;
  }
}

export const recordingService = new RecordingService();
