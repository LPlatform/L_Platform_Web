import type { PageQuery, Paginated } from "@/types";

export const DEFAULT_PAGE_SIZE = 10;

export function paginate<T>(items: T[], query: PageQuery = {}): Paginated<T> {
  const pageSize = Math.max(1, Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, 100));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(query.page ?? 1, 1), totalPages);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    meta: { page, pageSize, total, totalPages },
  };
}

export function matchesSearch(
  values: Array<string | null | undefined>,
  search: string | undefined,
): boolean {
  const needle = search?.trim().toLowerCase();
  if (!needle) return true;
  return values.some((value) => value?.toLowerCase().includes(needle));
}

export function sortByKey<T>(
  items: T[],
  sortBy: string | undefined,
  sortDir: PageQuery["sortDir"],
  accessors: (item: T) => Record<string, string | number>,
): T[] {
  if (!sortBy) return items;
  const direction = sortDir === "desc" ? -1 : 1;
  return [...items].sort((a, b) => {
    const left = accessors(a)[sortBy];
    const right = accessors(b)[sortBy];
    if (left === undefined || right === undefined) return 0;
    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * direction;
    }
    return String(left).localeCompare(String(right)) * direction;
  });
}

export function ensureFound<T>(value: T | undefined, entity: string): T {
  if (value === undefined) {
    throw new Error(`${entity} was not found`);
  }
  return value;
}
