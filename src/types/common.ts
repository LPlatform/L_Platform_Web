export type SortDirection = "asc" | "desc";

export type EntityStatus = "ACTIVE" | "INACTIVE";

export interface PageQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: SortDirection;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface SelectOption {
  value: string;
  label: string;
}

export type ThemePreference = "light" | "dark" | "system";

export interface Auditable {
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorShape {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type ActionState = "idle" | "loading" | "success" | "error";
