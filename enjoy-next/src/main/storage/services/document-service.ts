import { Document } from "@main/storage/entities/document";
import { instanceToPlain } from "class-transformer";
import { log } from "@main/core";

log.scope("Storage/DocumentService");

export class DocumentService {
  static async findAll(
    options?: PaginationOptions
  ): Promise<PaginationResult<DocumentEntity>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const search = options?.search;
    const order = options?.order == "asc" ? "ASC" : "DESC";
    const sort = options?.sort || "updated_at";

    const queryBuilder = Document.createQueryBuilder("document");

    if (search) {
      queryBuilder.where("document.title LIKE :search", {
        search: `%${search}%`,
      });
    }

    const [documents, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`document.${sort}`, order)
      .getManyAndCount();

    return {
      items: documents.map(
        (document) => instanceToPlain(document) as DocumentEntity
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async findById(id: string): Promise<DocumentEntity | null> {
    const document = await Document.findOne({ where: { id } });
    return document ? (instanceToPlain(document) as DocumentEntity) : null;
  }

  static async create(data: Partial<DocumentEntity>): Promise<DocumentEntity> {
    const document = Document.create(data);
    await document.save();
    return instanceToPlain(document) as DocumentEntity;
  }

  static async update(
    id: string,
    data: Partial<DocumentEntity>
  ): Promise<DocumentEntity> {
    const document = await Document.findOne({ where: { id } });
    if (!document) {
      throw new Error("Document not found");
    }
    Object.assign(document, data);
    await document.save();
    return instanceToPlain(document) as DocumentEntity;
  }

  static async delete(id: string): Promise<boolean> {
    const document = await Document.findOne({ where: { id } });
    if (!document) {
      return false;
    }
    await document.remove();
    return true;
  }
}
