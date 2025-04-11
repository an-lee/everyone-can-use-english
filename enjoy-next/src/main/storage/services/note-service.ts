import { log } from "@main/core";
import { instanceToPlain } from "class-transformer";
import { Note } from "../entities/note";
import { ILike } from "typeorm";

/**
 * Simple Audio service for managing audio files
 */
export class NoteService {
  constructor() {
    log.scope("Storage/NoteService");
  }

  /**
   * Find all chat messages with pagination
   */
  async findAll(
    options?: NoteFindAllOptions
  ): Promise<PaginationResult<NoteEntity>> {
    const targetId = options?.targetId;
    const targetType = options?.targetType;

    const search = options?.search;
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const sort = options?.sort || "updated_at";
    const order = options?.order == "asc" ? "ASC" : "DESC";

    const queryBuilder = Note.createQueryBuilder("note");

    if (targetId) {
      queryBuilder.where([{ targetId: targetId }]);
    }
    if (targetType) {
      queryBuilder.andWhere({ targetType: targetType });
    }

    if (search) {
      queryBuilder.andWhere({ content: ILike(`%${search}%`) });
    }

    queryBuilder.orderBy(`note.${sort}`, order);
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    log.info(
      `Querying notes with target_id: ${targetId}, target_type: ${targetType}`
    );

    const [notes, total] = await queryBuilder.getManyAndCount();

    return {
      items: notes.map((note) => instanceToPlain(note) as NoteEntity),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find chat member by ID
   */
  async findById(id: string): Promise<NoteEntity | null> {
    const note = await Note.findOne({ where: { id } });
    if (!note) {
      return null;
    }

    return instanceToPlain(note) as NoteEntity;
  }

  /**
   * Create a new chat member
   */
  async create(data: Partial<NoteEntity>): Promise<NoteEntity> {
    const note = Note.create(data as any);
    await note.save();

    return instanceToPlain(note) as NoteEntity;
  }

  /**
   * Update an existing chat member
   */
  async update(
    id: string,
    data: Partial<NoteEntity>
  ): Promise<NoteEntity | null> {
    const note = await Note.findOne({ where: { id } });
    if (!note) {
      return null;
    }

    Object.assign(note, data);
    await note.save();

    return instanceToPlain(note) as NoteEntity;
  }

  /**
   * Delete an chat member
   */
  async delete(id: string): Promise<boolean> {
    const note = await Note.findOne({ where: { id } });
    if (!note) {
      return false;
    }

    await note.remove();
    return true;
  }

  /**
   * Count audio items
   */
  async count(): Promise<number> {
    return await Note.count();
  }
}

// Export a singleton instance
export const noteService = new NoteService();
