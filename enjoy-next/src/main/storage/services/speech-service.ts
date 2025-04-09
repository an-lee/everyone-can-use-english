import { Speech } from "@main/storage/entities/speech";
import { instanceToPlain } from "class-transformer";
import { log } from "@main/core";

log.scope("Storage/SpeechService");

export class SpeechService {
  static async findBySource(
    sourceId: string,
    sourceType: string
  ): Promise<SpeechEntity | null> {
    const speech = await Speech.findOne({
      where: { sourceId, sourceType },
    });
    return instanceToPlain(speech) as SpeechEntity | null;
  }

  static async create(data: Partial<SpeechEntity>): Promise<SpeechEntity> {
    const speech = new Speech();
    Object.assign(speech, data);
    await speech.save();
    return instanceToPlain(speech) as SpeechEntity;
  }

  static async update(
    id: string,
    data: Partial<SpeechEntity>
  ): Promise<SpeechEntity> {
    const speech = await Speech.findOne({ where: { id } });
    if (!speech) {
      throw new Error("Speech not found");
    }
    Object.assign(speech, data);
    await speech.save();
    return instanceToPlain(speech) as SpeechEntity;
  }

  static async delete(id: string): Promise<boolean> {
    const speech = await Speech.findOne({ where: { id } });
    if (!speech) {
      return false;
    }
    await speech.remove();
    return true;
  }
}
