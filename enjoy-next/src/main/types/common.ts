declare interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

declare interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: string;
}
