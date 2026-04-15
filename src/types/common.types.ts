export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type Status = "idle" | "loading" | "success" | "error";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
