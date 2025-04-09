import { Segment } from "@main/storage/entities/segment";
import { instanceToPlain } from "class-transformer";
import { log } from "@main/core";
import { ILike } from "typeorm";

log.scope("Storage/SegmentService");

export class SegmentService {
  static async findAll(
    options?: SegmentSearchOptions
  ): Promise<SegmentPaginationResult> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const search = options?.search;
    const order = options?.order == "asc" ? "ASC" : "DESC";
    const sort = options?.sort || "updated_at";

    const queryBuilder = Segment.createQueryBuilder("segment");

    if (search) {
      queryBuilder.where([{ text: ILike(`%${search}%`) }]);
    }

    log.info(
      `Querying segments with search: ${search}, page: ${page}, limit: ${limit}, order: ${order}, sort: ${sort}`
    );

    const [segments, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`segment.${sort}`, order)
      .getManyAndCount();

    return {
      items: segments.map(
        (segment) => instanceToPlain(segment) as SegmentEntity
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async findByTarget(
    targetId: string,
    targetType: string,
    segmentIndex: number
  ): Promise<SegmentEntity | null> {
    const segment = await Segment.findOne({
      where: { targetId, targetType, segmentIndex },
    });
    return instanceToPlain(segment) as SegmentEntity | null;
  }

  static async create(data: Partial<SegmentEntity>): Promise<SegmentEntity> {
    const segment = new Segment();
    Object.assign(segment, data);
    await segment.save();
    return instanceToPlain(segment) as SegmentEntity;
  }

  static async update(
    id: string,
    data: Partial<SegmentEntity>
  ): Promise<SegmentEntity> {
    const segment = await Segment.findOne({ where: { id } });
    if (!segment) {
      throw new Error("Segment not found");
    }
    Object.assign(segment, data);
    await segment.save();
    return instanceToPlain(segment) as SegmentEntity;
  }

  static async delete(id: string): Promise<boolean> {
    const segment = await Segment.findOne({ where: { id } });
    if (!segment) {
      return false;
    }
    await segment.remove();
    return true;
  }
}
