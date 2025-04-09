import { instanceToPlain } from "class-transformer";
import { Video } from "../entities/video";
import { ILike } from "typeorm";
import { log } from "@main/core";

export class VideoService {
  static async findAll(
    options?: PaginationOptions
  ): Promise<PaginationResult<VideoEntity>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const search = options?.search;
    const order = options?.order == "asc" ? "ASC" : "DESC";
    const sort = options?.sort || "updated_at";

    const queryBuilder = Video.createQueryBuilder("video");

    if (search) {
      queryBuilder.where([
        { name: ILike(`%${search}%`) },
        { description: ILike(`%${search}%`) },
      ]);
    }

    log.info(
      `Querying videos with search: ${search}, page: ${page}, limit: ${limit}, order: ${order}, sort: ${sort}`
    );

    const [videos, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`video.${sort}`, order)
      .getManyAndCount();

    return {
      items: videos.map((video) => instanceToPlain(video) as VideoEntity),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async findById(id: string): Promise<VideoEntity | null> {
    const video = await Video.findOne({ where: { id } });
    return instanceToPlain(video) as VideoEntity | null;
  }

  static async findByLanguage(language: string): Promise<VideoEntity[]> {
    const videos = await Video.find({ where: { language } });
    return instanceToPlain(videos) as VideoEntity[];
  }

  static async create(data: Partial<VideoEntity>): Promise<VideoEntity> {
    const videoEntity = new Video();
    Object.assign(videoEntity, data);
    await videoEntity.save();

    return instanceToPlain(videoEntity) as VideoEntity;
  }

  static async update(
    id: string,
    data: Partial<VideoEntity>
  ): Promise<VideoEntity> {
    const videoEntity = await Video.findOne({ where: { id } });
    if (!videoEntity) {
      throw new Error("Video not found");
    }
    Object.assign(videoEntity, data);
    await videoEntity.save();
    return instanceToPlain(videoEntity) as VideoEntity;
  }

  static async delete(id: string): Promise<boolean> {
    const videoEntity = await Video.findOne({ where: { id } });
    if (!videoEntity) {
      return false;
    }
    await videoEntity.remove();
    return true;
  }
}
