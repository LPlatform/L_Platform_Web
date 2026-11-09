import { UserDirectory } from "@/components/admin/user-directory";

export default function TeachersPage() {
  return (
    <UserDirectory
      eyebrow="People"
      title="Teachers"
      description="Teaching accounts and the sections they support. Teachers are assigned to sections from the section roster."
      fixedRole="TEACHER"
      showRole={false}
      createLabel="Add teacher"
      createHref="/admin/users/new?role=TEACHER"
      emptyTitle="No teachers yet"
    />
  );
}
