import { ILike } from "typeorm";
import { Recording } from "../entities/recording";
import { instanceToPlain } from "class-transformer";
import { appConfig, hashFile, log } from "@main/core";
import { executeCommand } from "@main/plugin/core";
import path from "path";
import fs from "fs-extra";

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
    options: RecordingsQueryOptions
  ): Promise<RecordingEntity[]> {
    const { targetId, targetType, referenceId } = options;
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

  async create(
    data: Partial<RecordingEntity> & {
      blob: {
        type: string;
        arrayBuffer: ArrayBuffer;
      };
    }
  ): Promise<RecordingEntity> {
    const { blob, ...recordingData } = data;

    this.logger.info(`Creating recording: ${JSON.stringify(recordingData)}`);

    if (!blob || !blob.arrayBuffer) {
      throw new Error("Blob is required");
    }
    if (blob.arrayBuffer.byteLength === 0) {
      throw new Error("Array buffer is required");
    }

    const tmpFile = path.join(appConfig.cachePath(), `${Date.now()}.wav`);
    await fs.outputFile(tmpFile, new Uint8Array(blob.arrayBuffer));

    // hash file
    const md5 = await hashFile(tmpFile, { algo: "md5" });

    // check if recording already exists
    const existed = await Recording.findOne({ where: { md5 } });
    if (existed) {
      fs.remove(tmpFile);
      return {
        ...instanceToPlain(existed),
        src: existed.src,
      } as RecordingEntity;
    }

    // create new recording
    const filename = `${md5}.mp3`;
    const filePath = path.join(appConfig.userDataPath("recordings")!, filename);
    await executeCommand("ffmpeg-plugin.compressAudio", tmpFile, filePath);

    const recording = new Recording();
    const {
      targetId = "00000000-0000-0000-0000-000000000000",
      targetType = "None",
      referenceId = -1,
      referenceText = "",
      language = "en",
      duration = 0,
    } = recordingData;
    recording.targetId = targetId;
    recording.targetType = targetType;
    recording.referenceId = referenceId;
    recording.referenceText = referenceText;
    recording.language = language;
    recording.duration = duration;
    recording.filename = filename;
    recording.md5 = md5;

    try {
      await recording.save();
    } catch (error) {
      this.logger.error(`Failed to save recording: ${error}`);
      fs.unlink(filePath);
      throw error;
    }

    this.logger.info(`Recording created: ${recording.id}`);
    return {
      ...instanceToPlain(recording),
      src: filePath,
    } as RecordingEntity;
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
