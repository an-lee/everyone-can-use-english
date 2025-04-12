import { Repository } from "typeorm";
import { Transcription } from "../entities/transcription";
import { ILike } from "typeorm";
import { instanceToPlain } from "class-transformer";

export class TranscriptionService {
  async findByTarget(
    targetId: string,
    targetType: string
  ): Promise<TranscriptionEntity | null> {
    const transcription = await Transcription.findOne({
      where: { targetId, targetType },
    });
    return transcription
      ? (instanceToPlain(transcription) as TranscriptionEntity)
      : null;
  }

  async findByTargetMd5(
    targetMd5: string
  ): Promise<TranscriptionEntity | null> {
    const transcription = await Transcription.findOne({
      where: { targetMd5 },
    });
    return transcription
      ? (instanceToPlain(transcription) as TranscriptionEntity)
      : null;
  }

  async create(
    data: Partial<TranscriptionEntity>
  ): Promise<TranscriptionEntity> {
    const transcription = Transcription.create(data as any);
    await transcription.save();
    return instanceToPlain(transcription) as TranscriptionEntity;
  }

  async update(
    id: string,
    data: Partial<TranscriptionEntity>
  ): Promise<TranscriptionEntity | null> {
    const transcription = await Transcription.findOne({ where: { id } });
    if (!transcription) {
      return null;
    }
    Object.assign(transcription, data);
    await transcription.save();
    return instanceToPlain(transcription) as TranscriptionEntity;
  }

  async delete(id: string): Promise<boolean> {
    const transcription = await Transcription.findOne({ where: { id } });
    if (!transcription) {
      return false;
    }
    await transcription.remove();
    return true;
  }

  async count(): Promise<number> {
    return await Transcription.count();
  }
}

export const transcriptionService = new TranscriptionService();
