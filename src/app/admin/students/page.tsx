import { UserDirectory } from "@/components/admin/user-directory";

export default function StudentsPage() {
  return (
    <UserDirectory
      eyebrow="People"
      title="Students"
      description="Student accounts across all organizations. Students are assigned to exactly one section per class."
      fixedRole="STUDENT"
      showRole={false}
      createLabel="Add student"
      createHref="/admin/users/new?role=STUDENT"
      emptyTitle="No students yet"
    />
  );
}
