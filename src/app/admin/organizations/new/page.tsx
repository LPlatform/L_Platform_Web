import { PageHeader } from "@/components/admin/page-header";
import { OrganizationForm } from "@/components/admin/organization-form";

export default function NewOrganizationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization management"
        title="New organization"
        description="Register an institution and invite its first administrator. No email is sent in this demo."
      />
      <OrganizationForm mode="create" />
    </div>
  );
}
