import { PermissionList } from "@/components/admin/permission-list";
import { PageHeader } from "@/components/admin/page-header";
import { UserForm } from "@/components/admin/user-form";

export default function NewAdministratorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access management"
        title="Add administrator"
        description="Create an organization administrator. Administrators can manage people, academic structure and course allocations within their own organization."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <UserForm mode="create" variant="administrator" />
        <PermissionList />
      </div>
    </div>
  );
}
