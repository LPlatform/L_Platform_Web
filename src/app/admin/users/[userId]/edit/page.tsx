"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { UserForm } from "@/components/admin/user-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { useUser } from "@/lib/hooks/use-platform-data";

export default function EditUserPage() {
  const params = useParams<{ userId: string }>();
  const user = useUser(params.userId);

  if (user.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[480px] w-full max-w-3xl rounded-xl" />
      </div>
    );
  }

  if (user.isError || !user.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit user" eyebrow="User management" />
        <div className="surface">
          <ErrorState message={getErrorMessage(user.error)} onRetry={() => void user.refetch()} />
        </div>
      </div>
    );
  }

  if (user.data.role === "PLATFORM_ADMIN") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={user.data.publicId}
          title={`Edit ${user.data.firstName} ${user.data.lastName}`}
          description="Platform administrator accounts are managed outside organization administration."
        />
        <div className="surface max-w-3xl p-6">
          <p className="text-muted-foreground text-sm leading-relaxed">
            This demo does not allow editing platform administrator details. The account remains
            active and unchanged.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={`/admin/users/${user.data.id}`}>Back to profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={user.data.publicId}
        title={`Edit ${user.data.firstName} ${user.data.lastName}`}
        description="Update identity, organization assignment and account status."
      />
      <UserForm
        mode="edit"
        user={user.data}
        variant={user.data.role === "ORGANIZATION_ADMIN" ? "administrator" : "user"}
      />
    </div>
  );
}
