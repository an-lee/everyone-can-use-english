import { instanceToPlain } from "class-transformer";
import { Video } from "../entities/video";
import { ILike } from "typeorm";
import { log } from "@main/core";

export class VideoService {
  async findAll(
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

  async findById(id: string): Promise<VideoEntity | null> {
    const video = await Video.findOne({ where: { id } });
    return instanceToPlain(video) as VideoEntity | null;
  }

  async findByMd5(md5: string): Promise<VideoEntity | null> {
    const video = await Video.findOne({ where: { md5 } });
    return instanceToPlain(video) as VideoEntity | null;
  }

  async create(data: Partial<VideoEntity>): Promise<VideoEntity> {
    const videoEntity = new Video();
    Object.assign(videoEntity, data);
    await videoEntity.save();

    return instanceToPlain(videoEntity) as VideoEntity;
  }

  async update(id: string, data: Partial<VideoEntity>): Promise<VideoEntity> {
    const videoEntity = await Video.findOne({ where: { id } });
    if (!videoEntity) {
      throw new Error("Video not found");
    }
    Object.assign(videoEntity, data);
    await videoEntity.save();
    return instanceToPlain(videoEntity) as VideoEntity;
  }

  async delete(id: string): Promise<boolean> {
    const videoEntity = await Video.findOne({ where: { id } });
    if (!videoEntity) {
      return false;
    }
    await videoEntity.remove();
    return true;
  }
}

export const videoService = new VideoService();
