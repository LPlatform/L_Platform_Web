"use client";

import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  GraduationCap,
  Layers,
  Users,
} from "lucide-react";
import Link from "next/link";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/dates";
import { useReports } from "@/lib/hooks/use-platform-data";
import type { ReportDefinition, ReportId } from "@/types";

const REPORT_ICONS: Record<ReportId, typeof BarChart3> = {
  "organization-students": Users,
  "organization-teachers": GraduationCap,
  "class-distribution": Layers,
  "allocation-statistics": BookOpen,
  "onboarding-statistics": Activity,
  "organization-status": Building2,
};

export default function ReportsPage() {
  const reports = useReports();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Generated snapshots of organization, class, course and onboarding activity. Reports are computed from the mock dataset on request and can be exported as CSV."
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/audit-logs">
              <Activity className="size-4" />
              Audit log
            </Link>
          </Button>
        }
      />

      {reports.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports.error ? (
        <Card>
          <ErrorState
            title="Reports could not be generated"
            message={getErrorMessage(reports.error)}
            onRetry={() => void reports.refetch()}
          />
        </Card>
      ) : (reports.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            No reports are available.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(reports.data ?? []).map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report }: { report: ReportDefinition }) {
  const Icon = REPORT_ICONS[report.id] ?? BarChart3;
  return (
    <Link
      href={`/admin/reports/${report.id}`}
      className="group border-border bg-card hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-ring/40 block rounded-xl border p-5 shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-base leading-tight font-semibold">{report.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{report.description}</p>
        </div>
      </div>
      <div className="border-border/70 mt-4 flex items-center justify-between gap-2 border-t pt-3">
        <Badge variant="outline">{report.rows.length} rows</Badge>
        <span className="text-muted-foreground text-xs">
          Generated {formatDateTime(report.generatedAt)}
        </span>
      </div>
    </Link>
  );
}
