import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, BadgeProps["variant"]> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  ARCHIVED: "muted",
  DRAFT: "violet",
  PUBLISHED: "success",
  CLOSED: "muted",
  COMPLETED: "success",
  PENDING: "warning",
  PENDING_REVIEW: "warning",
  EVALUATING: "info",
  GRADED: "success",
  RELEASED: "success",
  IN_PROGRESS: "info",
  SCHEDULED: "info",
  ACCEPTED: "success",
  EXPIRED: "muted",
  REVOKED: "destructive",
  SUCCESS: "success",
  FAILURE: "destructive",
  VALID: "success",
  INVALID: "destructive",
  DUPLICATE: "warning",
  PRIMARY: "violet",
  CO_TEACHER: "info",
  PLATFORM_FREE: "success",
  SCHOOL: "info",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
  COMPLETED: "Completed",
  PENDING: "Pending",
  PENDING_REVIEW: "Pending review",
  EVALUATING: "Evaluating",
  GRADED: "Graded",
  RELEASED: "Released",
  IN_PROGRESS: "In progress",
  SCHEDULED: "Scheduled",
  ACCEPTED: "Accepted",
  EXPIRED: "Expired",
  REVOKED: "Revoked",
  SUCCESS: "Success",
  FAILURE: "Failed",
  VALID: "Valid",
  INVALID: "Invalid",
  DUPLICATE: "Duplicate",
  PRIMARY: "Primary Teacher",
  CO_TEACHER: "Co-Teacher",
  PLATFORM_FREE: "Platform Free",
  SCHOOL: "School",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const safeStatus = status || "UNKNOWN";
  return (
    <Badge
      variant={STATUS_VARIANTS[safeStatus] ?? "secondary"}
      className={cn("capitalize", className)}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {STATUS_LABELS[safeStatus] ?? safeStatus.toLowerCase()}
    </Badge>
  );
}
