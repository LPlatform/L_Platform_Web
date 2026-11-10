"use client";

import { Download } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { FilterSelect, ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { TablePagination } from "@/components/admin/table-pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { services, getErrorMessage } from "@/lib/api";
import { formatDateTime, formatRelative } from "@/lib/dates";
import {
  useAuditLogs,
  useDebouncedValue,
  useOrganizationOptions,
} from "@/lib/hooks/use-platform-data";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS } from "@/lib/labels";
import { downloadCsv } from "@/lib/utils";
import type { AuditEntityType, AuditLog, SelectOption, SortDirection } from "@/types";

const ACTION_OPTIONS: SelectOption[] = Object.entries(AUDIT_ACTION_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const ENTITY_OPTIONS: SelectOption[] = Object.entries(AUDIT_ENTITY_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export default function AuditLogsPage() {
  const organizations = useOrganizationOptions();
  const [search, setSearch] = React.useState("");
  const [organizationId, setOrganizationId] = React.useState("");
  const [action, setAction] = React.useState("");
  const [entityType, setEntityType] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);
  const [sortBy, setSortBy] = React.useState<string | undefined>("createdAt");
  const [sortDir, setSortDir] = React.useState<SortDirection>("desc");
  const [selected, setSelected] = React.useState<AuditLog | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search);

  React.useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("organizationId");
    if (value) setOrganizationId(value);
  }, []);

  const query = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      action: action || "ALL",
      organizationId: (organizationId || "ALL") as string,
      entityType: (entityType || "ALL") as AuditEntityType | "ALL",
      page,
      pageSize,
      sortBy,
      sortDir,
    }),
    [debouncedSearch, action, organizationId, entityType, page, pageSize, sortBy, sortDir],
  );

  const logs = useAuditLogs(query);

  const organizationOptions: SelectOption[] = React.useMemo(
    () =>
      (organizations.data ?? []).map((organization) => ({
        value: organization.id,
        label: organization.name,
      })),
    [organizations.data],
  );

  const columns = React.useMemo<DataTableColumn<AuditLog>[]>(
    () => [
      {
        id: "createdAt",
        header: "When",
        meta: { sortKey: "createdAt", headerClassName: "min-w-[150px]" },
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <p className="text-sm">{formatRelative(row.original.createdAt)}</p>
            <p className="text-muted-foreground text-xs">
              {formatDateTime(row.original.createdAt)}
            </p>
          </div>
        ),
      },
      {
        id: "actor",
        header: "Actor",
        meta: { sortKey: "actor", headerClassName: "min-w-[150px]" },
        cell: ({ row }) => <span className="text-sm">{row.original.actorName}</span>,
      },
      {
        id: "action",
        header: "Action",
        meta: { sortKey: "action", headerClassName: "min-w-[180px]" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="text-sm font-medium">{AUDIT_ACTION_LABELS[row.original.action]}</p>
            <p className="text-muted-foreground text-xs">
              {AUDIT_ENTITY_LABELS[row.original.entityType]}
            </p>
          </div>
        ),
      },
      {
        id: "entity",
        header: "Entity",
        meta: { sortKey: "entity", headerClassName: "min-w-[180px]" },
        cell: ({ row }) => (
          <span className="block max-w-[240px] truncate text-sm">{row.original.entityLabel}</span>
        ),
      },
      {
        id: "organization",
        header: "Organization",
        meta: { sortKey: "organization" },
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.organizationName ?? "Platform-wide"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Result",
        meta: { sortKey: "status" },
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [],
  );

  function handleSort(nextSortBy: string, nextSortDir: SortDirection) {
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const result = await services.audit.list({ ...query, page: 1, pageSize: 100 });
      downloadCsv(
        `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Timestamp",
          "Actor",
          "Action",
          "Entity type",
          "Entity",
          "Organization",
          "Result",
          "Correlation ID",
        ],
        result.items.map((log) => [
          log.createdAt,
          log.actorName,
          AUDIT_ACTION_LABELS[log.action],
          AUDIT_ENTITY_LABELS[log.entityType],
          log.entityLabel,
          log.organizationName ?? "",
          log.status,
          log.correlationId,
        ]),
      );
      toast.success(`Exported ${result.items.length} audit events.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = Boolean(search || organizationId || action || entityType);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Audit log"
        description="Every mock mutation records who did what, to which entity and organization. Newest events appear first. Use filters to trace a specific change."
        actions={
          <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
            <Download className="size-4" />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        }
      />

      <ListToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search actor, action, entity, organization or correlation ID…"
      >
        <FilterSelect
          label="Organization"
          value={organizationId}
          onChange={(value) => {
            setOrganizationId(value);
            setPage(1);
          }}
          options={organizationOptions}
          allLabel="All organizations"
        />
        <FilterSelect
          label="Action"
          value={action}
          onChange={(value) => {
            setAction(value);
            setPage(1);
          }}
          options={ACTION_OPTIONS}
          allLabel="All actions"
          className="sm:min-w-[190px]"
        />
        <FilterSelect
          label="Entity"
          value={entityType}
          onChange={(value) => {
            setEntityType(value);
            setPage(1);
          }}
          options={ENTITY_OPTIONS}
          allLabel="All entities"
        />
      </ListToolbar>

      <DataTable
        columns={columns}
        data={logs.data?.items ?? []}
        loading={logs.isLoading}
        error={logs.error}
        onRetry={() => void logs.refetch()}
        sort={{ sortBy, sortDir }}
        onSortChange={handleSort}
        onRowClick={setSelected}
        getRowId={(log) => log.id}
        emptyTitle={hasFilters ? "No matching audit events" : "No audit events yet"}
        emptyDescription={
          hasFilters
            ? "Adjust the search terms or filters and try again."
            : "Create or update a record to generate the first audit event."
        }
        footer={
          logs.data ? (
            <TablePagination
              meta={logs.data.meta}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="events"
            />
          ) : undefined
        }
      />

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{AUDIT_ACTION_LABELS[selected.action]}</DialogTitle>
                <DialogDescription>{formatDateTime(selected.createdAt)}</DialogDescription>
              </DialogHeader>

              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Detail label="Actor">{selected.actorName}</Detail>
                <Detail label="Result">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={
                        selected.status === "SUCCESS"
                          ? "size-2 rounded-full bg-emerald-500"
                          : "bg-destructive size-2 rounded-full"
                      }
                      aria-hidden
                    />
                    {selected.status === "SUCCESS" ? "Success" : "Failed"}
                  </span>
                </Detail>
                <Detail label="Entity type">{AUDIT_ENTITY_LABELS[selected.entityType]}</Detail>
                <Detail label="Organization">{selected.organizationName ?? "Platform-wide"}</Detail>
                <Detail label="Entity" className="sm:col-span-2">
                  {selected.entityLabel}
                  <span className="text-muted-foreground mt-0.5 block font-mono text-xs">
                    {selected.entityId}
                  </span>
                </Detail>
                <Detail label="Correlation ID" className="sm:col-span-2">
                  <span className="font-mono text-xs break-all">{selected.correlationId}</span>
                </Detail>
              </dl>

              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Metadata
                </p>
                {Object.keys(selected.metadata).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No additional metadata.</p>
                ) : (
                  <pre className="border-border bg-muted/50 overflow-x-auto rounded-lg border p-3 text-xs">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="mt-0.5 break-words">{children}</dd>
    </div>
  );
}
