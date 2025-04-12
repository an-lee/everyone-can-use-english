import { EntityBaseIpcModule } from "./entity-base-ipc";
import { pronunciationAssessmentService } from "@main/storage/services/pronunciation-assessment-service";

/**
 * IPC module for Video entity operations
 */
export class EntityPronunciationAssessmentIpcModule extends EntityBaseIpcModule<
  typeof pronunciationAssessmentService
> {
  constructor() {
    super(
      "PronunciationAssessment",
      "pronunciationAssessment",
      pronunciationAssessmentService
    );
  }

  /**
   * Define parameter metadata explicitly instead of extracting from decorators
   */
  protected getMethodParameterMetadata(methodName: string): Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }> {
    // Define metadata for each method directly
    const metadataMap: Record<
      string,
      Array<{
        name: string;
        type: string;
        required?: boolean;
        description?: string;
      }>
    > = {
      create: [
        {
          name: "data",
          type: "Partial<PronunciationAssessmentEntity>",
          required: true,
          description: "Pronunciation assessment item data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Pronunciation assessment item ID",
        },
        {
          name: "data",
          type: "Partial<PronunciationAssessmentEntity>",
          required: true,
          description: "Pronunciation assessment item data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Pronunciation assessment item ID",
        },
      ],
      count: [],
    };

    return metadataMap[methodName] || [];
  }

  /**
   * Define return types explicitly instead of extracting from decorators
   */
  protected getMethodReturnType(methodName: string): string {
    // Define return types for each method directly
    const returnTypeMap: Record<string, string> = {
      create: "Promise<PronunciationAssessmentEntity>",
      update: "Promise<PronunciationAssessmentEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityPronunciationAssessmentIpcModule =
  new EntityPronunciationAssessmentIpcModule();
