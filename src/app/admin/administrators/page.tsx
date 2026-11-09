import { UserDirectory } from "@/components/admin/user-directory";

export default function AdministratorsPage() {
  return (
    <UserDirectory
      eyebrow="Access management"
      title="Administrators"
      description="Organization administrators manage people, academic structure and course allocation within their own institution."
      fixedRole="ORGANIZATION_ADMIN"
      showRole={false}
      createLabel="Add administrator"
      createHref="/admin/administrators/new"
    />
  );
}
