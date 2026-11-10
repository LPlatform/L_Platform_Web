import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, BadgeProps["variant"]> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  ARCHIVED: "muted",
  DRAFT: "violet",
  PENDING: "warning",
  SCHEDULED: "info",
  ACCEPTED: "success",
  EXPIRED: "muted",
  REVOKED: "destructive",
  SUCCESS: "success",
  FAILURE: "destructive",
  VALID: "success",
  INVALID: "destructive",
  DUPLICATE: "warning",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
  DRAFT: "Draft",
  PENDING: "Pending",
  SCHEDULED: "Scheduled",
  ACCEPTED: "Accepted",
  EXPIRED: "Expired",
  REVOKED: "Revoked",
  SUCCESS: "Success",
  FAILURE: "Failed",
  VALID: "Valid",
  INVALID: "Invalid",
  DUPLICATE: "Duplicate",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? "secondary"} className={cn("capitalize", className)}>
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {STATUS_LABELS[status] ?? status.toLowerCase()}
    </Badge>
  );
}
