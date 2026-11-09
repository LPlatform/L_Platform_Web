"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PageMeta } from "@/types";

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export interface TablePaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  itemLabel?: string;
  className?: string;
}

export function TablePagination({
  meta,
  onPageChange,
  onPageSizeChange,
  itemLabel = "results",
  className,
}: TablePaginationProps) {
  const first = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const last = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "text-muted-foreground flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p aria-live="polite">
        Showing <span className="text-foreground font-medium">{first}</span>–
        <span className="text-foreground font-medium">{last}</span> of{" "}
        <span className="text-foreground font-medium">{meta.total}</span> {itemLabel}
      </p>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="hidden text-xs sm:inline">Rows</span>
            <Select
              value={String(meta.pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[72px]" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="First page"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          >
            <ChevronLeft />
          </Button>
          <span className="px-2 text-xs">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPageChange(meta.page + 1)}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Last page"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPageChange(meta.totalPages)}
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </nav>
  );
}
