"use client";

import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatDateTime } from "@/lib/dates";
import { useReport } from "@/lib/hooks/use-platform-data";
import { cn, downloadCsv } from "@/lib/utils";
import type { ReportId } from "@/types";

export default function ReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const reportId = String(params.reportId);
  const report = useReport(reportId as ReportId);

  function handleExport() {
    if (!report.data) return;
    const definition = report.data;
    try {
      downloadCsv(
        `report-${definition.id}-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Row", ...definition.columns.map((column) => column.label)],
        definition.rows.map((row) => [
          row.secondary ? `${row.label} (${row.secondary})` : row.label,
          ...definition.columns.map((column) => row.values[column.key] ?? ""),
        ]),
      );
      toast.success(`Exported ${definition.rows.length} rows.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/admin/reports">
            <ArrowLeft className="size-4" />
            All reports
          </Link>
        </Button>
        <PageHeader
          eyebrow="Report"
          title={report.data?.title ?? "Report"}
          description={report.data?.description}
          actions={
            report.data ? (
              <Button variant="outline" onClick={handleExport}>
                <Download className="size-4" />
                Export CSV
              </Button>
            ) : undefined
          }
        />
      </div>

      {report.isLoading ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-4 w-1/3" />
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : report.error ? (
        <Card>
          <ErrorState
            title="Report not found"
            message={getErrorMessage(report.error)}
            onRetry={() => void report.refetch()}
          />
        </Card>
      ) : report.data ? (
        <>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">{report.data.rows.length} rows</Badge>
            <span>Generated {formatDateTime(report.data.generatedAt)}</span>
            <span>·</span>
            <span>Snapshot of the current mock dataset</span>
          </div>

          <div className="border-border bg-card overflow-hidden rounded-xl border shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[220px]">Row</TableHead>
                  {report.data.columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={cn(column.align === "right" && "text-right")}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.data.rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={report.data.columns.length + 1}
                      className="text-muted-foreground py-10 text-center text-sm"
                    >
                      This report has no rows yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.data.rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>
                        <p className="font-medium">{row.label}</p>
                        {row.secondary && (
                          <p className="text-muted-foreground text-xs">{row.secondary}</p>
                        )}
                      </TableCell>
                      {report.data?.columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={cn("tabular-nums", column.align === "right" && "text-right")}
                        >
                          {row.values[column.key] ?? "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}
    </div>
  );
}
