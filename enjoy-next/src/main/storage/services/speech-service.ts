import { Speech } from "@main/storage/entities/speech";
import { instanceToPlain } from "class-transformer";
import { appConfig, hashFile, log } from "@main/core";
import { ILike } from "typeorm";
import fs from "fs-extra";
import path from "path";

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

  async create(
    data: Partial<SpeechEntity> & {
      blob: {
        type: string;
        arrayBuffer: ArrayBuffer;
      };
    }
  ): Promise<SpeechEntity> {
    const { blob, ...speechData } = data;

    if (!blob || !blob.arrayBuffer) {
      throw new Error("Blob is required");
    }
    if (blob.arrayBuffer.byteLength === 0) {
      throw new Error("Array buffer is required");
    }

    speechData.sourceId =
      speechData.sourceId || "00000000-0000-0000-0000-000000000000";
    speechData.sourceType = speechData.sourceType || "NONE";

    const tmpFile = path.join(appConfig.cachePath(), `${Date.now()}.mp3`);
    await fs.writeFileSync(tmpFile, new Uint8Array(blob.arrayBuffer));

    // hash file
    const md5 = await hashFile(tmpFile, { algo: "md5" });

    // check if speech already exists
    const existed = await Speech.findOne({ where: { md5 } });
    if (existed) {
      fs.unlinkSync(tmpFile);
      return {
        ...instanceToPlain(existed),
        src: existed.src,
      } as SpeechEntity;
    }

    // create new speech
    const extname = `.` + blob.type.split("/")[1];
    const filename = `${md5}${extname}`;
    const filePath = path.join(appConfig.userDataPath("speeches")!, filename);
    await fs.copyFile(tmpFile, filePath);

    const speech = new Speech();
    Object.assign(speech, {
      ...speechData,
      md5,
      extname,
    });
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
