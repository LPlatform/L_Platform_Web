"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";
import { PageHeader } from "@/components/admin/page-header";
import { UserForm } from "@/components/admin/user-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserRole } from "@/types";

const VALID_ROLES: UserRole[] = [
  "PLATFORM_OWNER",
  "PLATFORM_DEVELOPER",
  "ORGANIZATION_ADMIN",
  "TEACHER",
  "STUDENT",
];

function NewUserForm() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("role") as UserRole | null;
  const defaultRole =
    requested && VALID_ROLES.includes(requested) ? requested : ("STUDENT" as UserRole);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="User management"
        title="Add user"
        description="Create an organization administrator, teacher or student account. An invitation is not required for accounts created here."
      />
      <UserForm mode="create" defaultRole={defaultRole} />
    </div>
  );
}

export default function NewUserPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-56" />
          </div>
          <Skeleton className="h-[520px] w-full max-w-3xl rounded-xl" />
        </div>
      }
    >
      <NewUserForm />
    </React.Suspense>
  );
}
