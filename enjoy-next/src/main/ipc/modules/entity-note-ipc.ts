import { noteService } from "@main/storage/services/note-service";
import { BaseEntityIpcModule } from "./base-entity-ipc";

/**
 * IPC module for Message entity operations
 */
export class EntityNoteIpcModule extends BaseEntityIpcModule<
  typeof noteService
> {
  constructor() {
    super("Note", "note", noteService);
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
      findAll: [
        {
          name: "options",
          type: "NoteFindAllOptions",
          required: false,
          description: "Search options",
        },
      ],
      findById: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Note ID",
        },
      ],
      create: [
        {
          name: "data",
          type: "Partial<NoteEntity>",
          required: true,
          description: "Note data",
        },
      ],
      update: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Note ID",
        },
        {
          name: "data",
          type: "Partial<NoteEntity>",
          required: true,
          description: "Note data to update",
        },
      ],
      delete: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Note ID",
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
      findAll: "Promise<PaginationResult<NoteEntity>>",
      findById: "Promise<NoteEntity | null>",
      create: "Promise<NoteEntity>",
      update: "Promise<NoteEntity | null>",
      delete: "Promise<boolean>",
      count: "Promise<number>",
    };

    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const entityNoteIpcModule = new EntityNoteIpcModule();
