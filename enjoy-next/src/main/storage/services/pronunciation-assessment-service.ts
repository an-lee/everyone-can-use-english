import { PronunciationAssessment } from "@main/storage/entities/pronunciation-assessment";
import { instanceToPlain } from "class-transformer";
import { log } from "@main/core";

log.scope("Storage/PronunciationAssessmentService");

export class PronunciationAssessmentService {
  static async create(
    data: Partial<PronunciationAssessmentEntity>
  ): Promise<PronunciationAssessmentEntity> {
    const pronunciationAssessment = new PronunciationAssessment();
    Object.assign(pronunciationAssessment, data);
    await pronunciationAssessment.save();
    return instanceToPlain(
      pronunciationAssessment
    ) as PronunciationAssessmentEntity;
  }

  static async update(
    id: string,
    data: Partial<PronunciationAssessmentEntity>
  ): Promise<PronunciationAssessmentEntity> {
    const pronunciationAssessment = await PronunciationAssessment.findOne({
      where: { id },
    });
    if (!pronunciationAssessment) {
      throw new Error("Pronunciation assessment not found");
    }
    Object.assign(pronunciationAssessment, data);
    await pronunciationAssessment.save();
    return instanceToPlain(
      pronunciationAssessment
    ) as PronunciationAssessmentEntity;
  }

  static async delete(id: string): Promise<boolean> {
    const pronunciationAssessment = await PronunciationAssessment.findOne({
      where: { id },
    });
    if (!pronunciationAssessment) {
      return false;
    }
    await pronunciationAssessment.remove();
    return true;
  }
}
