"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SortDirection } from "@/types";

declare module "@tanstack/react-table" {
  // The generic parameter names must match the upstream declaration for module merging.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    sortKey?: string;
    className?: string;
    headerClassName?: string;
  }
}

export type DataTableColumn<TData> = ColumnDef<TData, unknown>;

export interface DataTableSort {
  sortBy?: string;
  sortDir?: SortDirection;
}

export interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  sort?: DataTableSort;
  onSortChange?: (sortBy: string, sortDir: SortDirection) => void;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
  footer?: React.ReactNode;
  skeletonRows?: number;
  className?: string;
}

export function DataTable<TData>({
  columns,
  data,
  loading = false,
  error,
  onRetry,
  emptyTitle = "No results",
  emptyDescription = "Try adjusting the search or filters.",
  emptyAction,
  sort,
  onSortChange,
  onRowClick,
  getRowId,
  footer,
  skeletonRows = 6,
  className,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const columnCount = table.getAllLeafColumns().length;

  return (
    <div
      className={cn("border-border bg-card overflow-hidden rounded-xl border shadow-xs", className)}
    >
      <Table aria-busy={loading}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta;
                const sortKey = meta?.sortKey;
                const isActive = Boolean(sortKey && sort?.sortBy === sortKey);
                const headerContent = header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext());

                return (
                  <TableHead
                    key={header.id}
                    className={cn(meta?.headerClassName)}
                    aria-sort={
                      isActive ? (sort?.sortDir === "desc" ? "descending" : "ascending") : undefined
                    }
                  >
                    {sortKey && onSortChange ? (
                      <button
                        type="button"
                        onClick={() =>
                          onSortChange(
                            sortKey,
                            isActive && sort?.sortDir !== "desc" ? "desc" : "asc",
                          )
                        }
                        className={cn(
                          "hover:text-foreground -mx-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold tracking-wide uppercase transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {headerContent}
                        {isActive ? (
                          sort?.sortDir === "desc" ? (
                            <ArrowDown className="size-3.5" aria-hidden />
                          ) : (
                            <ArrowUp className="size-3.5" aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden />
                        )}
                      </button>
                    ) : (
                      headerContent
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
                {Array.from({ length: columnCount }).map((__, cellIndex) => (
                  <TableCell key={`skeleton-${rowIndex}-${cellIndex}`}>
                    <Skeleton className="h-4 w-full max-w-40" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : error ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columnCount} className="p-0">
                <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columnCount} className="p-0">
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  action={emptyAction}
                />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-clickable={onRowClick ? "true" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onRowClick(row.original);
                        }
                      }
                    : undefined
                }
                className={cn(
                  onRowClick &&
                    "focus-visible:ring-ring/40 cursor-pointer focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cn(cell.column.columnDef.meta?.className)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {footer && <div className="border-border/70 border-t px-4 py-3">{footer}</div>}
    </div>
  );
}
