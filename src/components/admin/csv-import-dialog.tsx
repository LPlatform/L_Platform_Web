"use client";

import { AlertTriangle, CheckCircle2, Download, FileUp, Loader2, Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/api";
import {
  useImportConfirm,
  useImportPreview,
  useOrganizationOptions,
} from "@/lib/hooks/use-platform-data";
import { downloadCsv } from "@/lib/utils";
import type { CsvImportPreview } from "@/types";

export function CsvImportDialog({
  open,
  onOpenChange,
  defaultOrganizationPublicId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOrganizationPublicId?: string;
}) {
  const organizations = useOrganizationOptions();
  const previewMutation = useImportPreview();
  const confirmMutation = useImportConfirm();
  const [fileName, setFileName] = React.useState("");
  const [csvText, setCsvText] = React.useState("");
  const [preview, setPreview] = React.useState<CsvImportPreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const sampleOrganizationId =
    defaultOrganizationPublicId ?? organizations.data?.[0]?.publicId ?? "ORG-2026-0001";

  function reset() {
    setFileName("");
    setCsvText("");
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPreview(null);
    setError(null);
    try {
      setCsvText(await file.text());
    } catch {
      setError("That file could not be read. Choose a UTF-8 CSV file.");
    }
  }

  function loadSample() {
    const sample = [
      "firstName,lastName,email,username,role,organizationPublicId",
      `Isha,Verma,isha.verma@example.edu,,STUDENT,${sampleOrganizationId}`,
      `Kabir,Shah,,kabir.shah,STUDENT,${sampleOrganizationId}`,
      `Meera,Nair,meera.nair@example.edu,,TEACHER,${sampleOrganizationId}`,
    ].join("\n");
    setFileName("sample-import.csv");
    setCsvText(sample);
    setPreview(null);
    setError(null);
  }

  function downloadTemplate() {
    downloadCsv(
      "user-import-template.csv",
      ["firstName", "lastName", "email", "username", "role", "organizationPublicId"],
      [["Riya", "Kapoor", "riya.kapoor@example.edu", "", "STUDENT", sampleOrganizationId]],
    );
  }

  async function handleValidate() {
    setError(null);
    try {
      const result = await previewMutation.mutateAsync({
        fileName: fileName || "pasted-import.csv",
        csvText,
      });
      setPreview(result);
    } catch (cause) {
      setPreview(null);
      setError(getErrorMessage(cause));
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setError(null);
    try {
      const result = await confirmMutation.mutateAsync(preview);
      toast.success(
        `${result.imported} ${result.imported === 1 ? "user" : "users"} imported${
          result.skipped > 0 ? `, ${result.skipped} skipped` : ""
        }.`,
      );
      handleOpenChange(false);
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }

  const pending = previewMutation.isPending || confirmMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import users from CSV</DialogTitle>
          <DialogDescription>
            Rows are validated against organizations and existing identities before anything is
            written. Invalid rows are skipped and reported. No emails are sent.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => void handleFileChange(event)}
              className="sr-only"
              id="csv-file-input"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
            >
              <Upload className="size-4" />
              Choose CSV file
            </Button>
            <Button variant="ghost" onClick={loadSample} disabled={pending}>
              <FileUp className="size-4" />
              Load sample
            </Button>
            <Button variant="ghost" onClick={downloadTemplate} disabled={pending}>
              <Download className="size-4" />
              Download template
            </Button>
            {fileName && <span className="text-muted-foreground text-sm">{fileName}</span>}
          </div>

          <div className="space-y-2">
            <label htmlFor="csv-text" className="text-sm font-medium">
              CSV contents
            </label>
            <Textarea
              id="csv-text"
              value={csvText}
              onChange={(event) => {
                setCsvText(event.target.value);
                setPreview(null);
              }}
              rows={5}
              spellCheck={false}
              placeholder={`firstName,lastName,email,username,role,organizationPublicId\nRiya,Kapoor,riya.kapoor@example.edu,,STUDENT,${sampleOrganizationId}`}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => void handleValidate()}
              disabled={pending || csvText.trim().length === 0}
            >
              {previewMutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Validate rows
            </Button>
            <p className="text-muted-foreground text-xs">
              Required headers: firstName, lastName, role and an organization identifier. Provide an
              email, a username, or both.
            </p>
          </div>
        </div>

        {preview && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">{preview.summary.total} rows</Badge>
              <Badge variant="success">
                <CheckCircle2 className="size-3" aria-hidden /> {preview.summary.valid} valid
              </Badge>
              {preview.summary.invalid > 0 && (
                <Badge variant="destructive">{preview.summary.invalid} invalid</Badge>
              )}
              {preview.summary.duplicate > 0 && (
                <Badge variant="warning">{preview.summary.duplicate} duplicate</Badge>
              )}
            </div>

            <div className="border-border max-h-72 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Identity</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) => (
                    <TableRow key={row.row}>
                      <TableCell className="text-muted-foreground">{row.row}</TableCell>
                      <TableCell className="font-medium">
                        {row.firstName} {row.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {row.email ?? row.username ?? "—"}
                      </TableCell>
                      <TableCell>{row.role === "TEACHER" ? "Teacher" : "Student"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.organizationPublicId}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                        {row.errors.length > 0 && (
                          <p className="text-destructive mt-1 max-w-[240px] text-xs">
                            {row.errors.join(" ")}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          {preview ? (
            <>
              <Button variant="ghost" onClick={() => setPreview(null)} disabled={pending}>
                Edit CSV
              </Button>
              <Button
                onClick={() => void handleConfirm()}
                disabled={pending || preview.summary.valid === 0}
              >
                {confirmMutation.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                )}
                Import {preview.summary.valid} valid{" "}
                {preview.summary.valid === 1 ? "user" : "users"}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => void handleValidate()}
              disabled={pending || csvText.trim().length === 0}
            >
              {previewMutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Validate rows
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
