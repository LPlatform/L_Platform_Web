"use client";

import { Download, FileUp, Loader2, Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { UserAvatar } from "@/components/admin/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import {
  useBulkAssignStudents,
  useEligibleStudents,
  useEligibleTeachers,
} from "@/lib/hooks/use-platform-data";
import { downloadCsv } from "@/lib/utils";
import type { UserWithOrganization } from "@/types";

interface AssignDialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  people: UserWithOrganization[];
  loading: boolean;
  error?: unknown;
  currentIds: string[];
  itemLabel: "students" | "teachers";
  emptyDescription: string;
  onAssign: (ids: string[]) => Promise<{ assigned: number; skipped: number }>;
}

function AssignDialogShell({
  open,
  onOpenChange,
  title,
  description,
  people,
  loading,
  error,
  currentIds,
  itemLabel,
  emptyDescription,
  onAssign,
}: AssignDialogShellProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const current = React.useMemo(() => new Set(currentIds), [currentIds]);

  React.useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSearch("");
    setSubmitError(null);
  }, [open]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return people;
    return people.filter((person) =>
      [
        `${person.firstName} ${person.lastName}`,
        person.email,
        person.username,
        person.publicId,
      ].some((value) => value?.toLowerCase().includes(needle)),
    );
  }, [people, search]);

  function toggle(personId: string, checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(personId);
      else next.delete(personId);
      return next;
    });
  }

  async function handleAssign() {
    if (selected.size === 0) return;
    setPending(true);
    setSubmitError(null);
    try {
      const outcome = await onAssign([...selected]);
      toast.success(
        `${outcome.assigned} ${itemLabel} assigned${
          outcome.skipped > 0 ? `, ${outcome.skipped} skipped` : ""
        }.`,
      );
      onOpenChange(false);
    } catch (cause) {
      setSubmitError(getErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email, username or ID…"
          aria-label="Search people"
        />

        {submitError && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
          >
            {submitError}
          </p>
        )}

        <div className="border-border max-h-72 overflow-y-auto rounded-lg border">
          {loading ? (
            <div className="space-y-3 p-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <ErrorState message={getErrorMessage(error)} className="py-8" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={search ? "No matching people" : "No eligible people"}
              description={search ? "Adjust the search and try again." : emptyDescription}
              className="py-10"
            />
          ) : (
            <ul className="divide-border/70 divide-y">
              {filtered.map((person) => {
                const alreadyAssigned = current.has(person.id);
                const checked = alreadyAssigned || selected.has(person.id);
                return (
                  <li key={person.id}>
                    <label className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors has-[:disabled]:cursor-default">
                      <Checkbox
                        checked={checked}
                        disabled={alreadyAssigned}
                        onCheckedChange={(value) => toggle(person.id, value === true)}
                      />
                      <UserAvatar
                        firstName={person.firstName}
                        lastName={person.lastName}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {person.firstName} {person.lastName}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {person.email ??
                            (person.username ? `@${person.username}` : person.publicId)}
                        </span>
                      </span>
                      {alreadyAssigned && <Badge variant="muted">Assigned</Badge>}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => void handleAssign()} disabled={pending || selected.size === 0}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Assign {selected.size > 0 ? selected.size : ""} {itemLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AssignStudentsDialog({
  open,
  onOpenChange,
  organizationId,
  currentIds,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  currentIds: string[];
  onAssign: (ids: string[]) => Promise<{ assigned: number; skipped: number }>;
}) {
  const students = useEligibleStudents({
    organizationId,
    page: 1,
    pageSize: 100,
    sortBy: "name",
    sortDir: "asc",
  });

  return (
    <AssignDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Assign students"
      description="Only active students from this organization can join the section, and each student may belong to one section per class."
      people={students.data?.items ?? []}
      loading={students.isLoading}
      error={students.error}
      currentIds={currentIds}
      itemLabel="students"
      emptyDescription="No active students are available in this organization."
      onAssign={onAssign}
    />
  );
}

export function AssignTeachersDialog({
  open,
  onOpenChange,
  organizationId,
  currentIds,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  currentIds: string[];
  onAssign: (ids: string[]) => Promise<{ assigned: number; skipped: number }>;
}) {
  const teachers = useEligibleTeachers({
    organizationId,
    page: 1,
    pageSize: 100,
    sortBy: "name",
    sortDir: "asc",
  });

  return (
    <AssignDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Assign teachers"
      description="Only active teachers from this organization can be assigned to the section."
      people={teachers.data?.items ?? []}
      loading={teachers.isLoading}
      error={teachers.error}
      currentIds={currentIds}
      itemLabel="teachers"
      emptyDescription="No active teachers are available in this organization."
      onAssign={onAssign}
    />
  );
}

export function BulkStudentImportDialog({
  open,
  onOpenChange,
  sectionId,
  organizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  organizationId: string;
}) {
  const mutation = useBulkAssignStudents(sectionId);
  const [csvText, setCsvText] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    assigned: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setCsvText("");
    setFileName("");
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);
    try {
      setCsvText(await file.text());
    } catch {
      setError("That file could not be read. Choose a UTF-8 CSV file.");
    }
  }

  function loadSample() {
    setFileName("sample-section-students.csv");
    setCsvText(["email,username", "student.one@example.edu,", ",student.two"].join("\n"));
    setResult(null);
    setError(null);
  }

  function downloadTemplate() {
    downloadCsv(
      "section-students-template.csv",
      ["email", "username"],
      [
        ["student.one@example.edu", ""],
        ["", "student.two"],
      ],
    );
  }

  async function handleImport() {
    setError(null);
    setResult(null);
    try {
      const outcome = await mutation.mutateAsync({ csvText, organizationId });
      setResult(outcome);
      if (outcome.errors.length === 0) {
        toast.success(
          `${outcome.assigned} ${outcome.assigned === 1 ? "student" : "students"} assigned${
            outcome.skipped > 0 ? `, ${outcome.skipped} skipped` : ""
          }.`,
        );
      } else {
        toast.warning(
          `${outcome.assigned} assigned, ${outcome.errors.length} ${
            outcome.errors.length === 1 ? "row" : "rows"
          } reported an error.`,
        );
      }
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (mutation.isPending ? undefined : onOpenChange(next))}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk assign students</DialogTitle>
          <DialogDescription>
            Match students by email or username inside this organization. Students already assigned
            to another section of the same class are skipped. No emails are sent.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            id="section-students-file"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => void handleFileChange(event)}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={mutation.isPending}
          >
            <Upload className="size-4" />
            Choose CSV file
          </Button>
          <Button variant="ghost" onClick={loadSample} disabled={mutation.isPending}>
            <FileUp className="size-4" />
            Load sample
          </Button>
          <Button variant="ghost" onClick={downloadTemplate} disabled={mutation.isPending}>
            <Download className="size-4" />
            Download template
          </Button>
          {fileName && <span className="text-muted-foreground text-sm">{fileName}</span>}
        </div>

        <div className="space-y-2">
          <label htmlFor="section-students-csv" className="text-sm font-medium">
            CSV contents
          </label>
          <Textarea
            id="section-students-csv"
            value={csvText}
            onChange={(event) => {
              setCsvText(event.target.value);
              setResult(null);
            }}
            rows={5}
            spellCheck={false}
            className="font-mono text-xs"
            placeholder={"email,username\nstudent.one@example.edu,\n,student.two"}
          />
          <p className="text-muted-foreground text-xs">
            Required header: at least one of <code>email</code> or <code>username</code>.
          </p>
        </div>

        {result && (
          <div className="border-border bg-muted/30 space-y-2 rounded-lg border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{result.assigned} assigned</Badge>
              {result.skipped > 0 && <Badge variant="warning">{result.skipped} skipped</Badge>}
              {result.errors.length > 0 && (
                <Badge variant="destructive">{result.errors.length} errors</Badge>
              )}
            </div>
            {result.errors.length > 0 && (
              <ul className="text-destructive max-h-32 list-inside list-disc space-y-1 overflow-y-auto text-xs">
                {result.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {result ? "Done" : "Cancel"}
          </Button>
          <Button
            onClick={() => void handleImport()}
            disabled={mutation.isPending || csvText.trim().length === 0}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Import students
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
