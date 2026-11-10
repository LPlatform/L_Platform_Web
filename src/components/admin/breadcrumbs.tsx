"use client";

import { ChevronRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  organizations: "Organizations",
  users: "Users",
  administrators: "Administrators",
  teachers: "Teachers",
  students: "Students",
  invitations: "Invitations",
  classes: "Classes",
  sections: "Sections",
  courses: "Courses",
  allocations: "Course allocations",
  reports: "Reports",
  "audit-logs": "Audit logs",
  settings: "Settings",
  search: "Search",
  new: "New",
  edit: "Edit",
  import: "Import",
};

const DETAIL_PARENTS = new Set([
  "organizations",
  "users",
  "administrators",
  "teachers",
  "students",
  "classes",
  "sections",
  "courses",
]);

function titleCase(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function labelFor(segment: string, parent: string | undefined): string {
  if (LABELS[segment]) return LABELS[segment];
  if (parent && DETAIL_PARENTS.has(parent)) return "Details";
  return titleCase(segment);
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = React.useMemo(() => pathname.split("/").filter(Boolean).slice(1), [pathname]);

  if (segments.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <li>
          <Link
            href="/admin/dashboard"
            className="hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors"
          >
            <LayoutDashboard className="size-3.5" aria-hidden />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/admin/${segments.slice(0, index + 1).join("/")}`;
          const label = labelFor(segment, segments[index - 1]);

          return (
            <li key={href} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />
              {isLast ? (
                <span aria-current="page" className="text-foreground truncate font-medium">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="hover:text-foreground truncate rounded-md px-1 py-0.5 transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
