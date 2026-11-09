import { UserDirectory } from "@/components/admin/user-directory";

export default function UsersPage() {
  return (
    <UserDirectory
      eyebrow="User management"
      title="All users"
      description="Administrators, teachers and students across every organization. Use CSV import to onboard people in bulk."
      createLabel="Add user"
      createHref="/admin/users/new"
      allowImport
    />
  );
}
