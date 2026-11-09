"use client";

import { useParams } from "next/navigation";
import { ErrorState } from "@/components/admin/error-state";
import { OrganizationForm } from "@/components/admin/organization-form";
import { PageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { useOrganization } from "@/lib/hooks/use-platform-data";

export default function EditOrganizationPage() {
  const params = useParams<{ organizationId: string }>();
  const organization = useOrganization(params.organizationId);

  if (organization.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[560px] w-full max-w-4xl rounded-xl" />
      </div>
    );
  }

  if (organization.isError || !organization.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit organization" eyebrow="Organization management" />
        <div className="surface">
          <ErrorState
            message={getErrorMessage(organization.error)}
            onRetry={() => void organization.refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={organization.data.publicId}
        title={`Edit ${organization.data.name}`}
        description="Update organization identity, contact details and status."
      />
      <OrganizationForm mode="edit" organization={organization.data} />
    </div>
  );
}
