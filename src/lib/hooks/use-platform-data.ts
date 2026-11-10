"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import * as React from "react";
import { services, type MockSession } from "@/lib/api";
import type {
  AllocationInput,
  AllocationQuery,
  AllocationUpdateInput,
  AuditQuery,
  ClassInput,
  ClassQuery,
  CourseInput,
  CourseQuery,
  CsvImportPreview,
  EntityStatus,
  InvitationInput,
  InvitationQuery,
  OrganizationInput,
  OrganizationQuery,
  OrganizationUpdateInput,
  PlatformSettings,
  ReportId,
  SectionInput,
  SectionQuery,
  UserInput,
  UserQuery,
  UserRole,
} from "@/types";

function useInvalidateAll() {
  const queryClient = useQueryClient();
  return React.useCallback(() => queryClient.invalidateQueries(), [queryClient]);
}

function useServiceMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  options?: { invalidate?: boolean },
) {
  const invalidateAll = useInvalidateAll();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (options?.invalidate !== false) void invalidateAll();
    },
  });
}

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export const queryKeys = {
  organizations: (query: OrganizationQuery) => ["organizations", query] as const,
  organization: (id: string) => ["organization", id] as const,
  organizationOptions: () => ["organization-options"] as const,
  users: (query: UserQuery) => ["users", query] as const,
  user: (id: string) => ["user", id] as const,
  administrators: (query: UserQuery) => ["administrators", query] as const,
  administrator: (id: string) => ["administrator", id] as const,
  permissions: () => ["permissions"] as const,
  classes: (query: ClassQuery) => ["classes", query] as const,
  class: (id: string) => ["class", id] as const,
  classOptions: (organizationId: string) => ["class-options", organizationId] as const,
  sections: (query: SectionQuery) => ["sections", query] as const,
  section: (id: string) => ["section", id] as const,
  roster: (id: string) => ["section-roster", id] as const,
  courses: (query: CourseQuery) => ["courses", query] as const,
  course: (id: string) => ["course", id] as const,
  courseOptions: () => ["course-options"] as const,
  allocations: (query: AllocationQuery) => ["allocations", query] as const,
  allocation: (id: string) => ["allocation", id] as const,
  invitations: (query: InvitationQuery) => ["invitations", query] as const,
  audit: (query: AuditQuery) => ["audit", query] as const,
  reports: () => ["reports"] as const,
  report: (id: ReportId) => ["report", id] as const,
  dashboardSummary: () => ["dashboard-summary"] as const,
  dashboardGrowth: () => ["dashboard-growth"] as const,
  dashboardDistribution: () => ["dashboard-distribution"] as const,
  dashboardOrganizations: () => ["dashboard-organizations"] as const,
  dashboardInvitations: () => ["dashboard-invitations"] as const,
  dashboardActivity: () => ["dashboard-activity"] as const,
  settings: () => ["settings"] as const,
  eligibleStudents: (query: UserQuery) => ["eligible-students", query] as const,
  eligibleTeachers: (query: UserQuery) => ["eligible-teachers", query] as const,
};

export function useOrganizations(query: OrganizationQuery) {
  return useQuery({
    queryKey: queryKeys.organizations(query),
    queryFn: () => services.organizations.list(query),
  });
}

export function useOrganization(organizationId: string) {
  return useQuery({
    queryKey: queryKeys.organization(organizationId),
    queryFn: () => services.organizations.getById(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useOrganizationOptions() {
  return useQuery({
    queryKey: queryKeys.organizationOptions(),
    queryFn: () => services.organizations.listOptions(),
    staleTime: 60_000,
  });
}

export function useCreateOrganization() {
  return useServiceMutation((input: OrganizationInput) => services.organizations.create(input));
}

export function useUpdateOrganization(organizationId: string) {
  return useServiceMutation((input: OrganizationUpdateInput) =>
    services.organizations.update(organizationId, input),
  );
}

export function useSetOrganizationStatus() {
  return useServiceMutation(({ id, status }: { id: string; status: EntityStatus }) =>
    services.organizations.setStatus(id, status),
  );
}

export function useUsers(query: UserQuery) {
  return useQuery({ queryKey: queryKeys.users(query), queryFn: () => services.users.list(query) });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => services.users.getById(userId),
    enabled: Boolean(userId),
  });
}

export function useCreateUser() {
  return useServiceMutation((input: UserInput) => services.users.create(input));
}

export function useUpdateUser(userId: string) {
  return useServiceMutation((input: Omit<UserInput, "role">) =>
    services.users.update(userId, input),
  );
}

export function useSetUserStatus() {
  return useServiceMutation(({ id, status }: { id: string; status: EntityStatus }) =>
    services.users.setStatus(id, status),
  );
}

export function useImportPreview() {
  return useServiceMutation(
    ({ fileName, csvText }: { fileName: string; csvText: string }) =>
      services.users.importPreview(fileName, csvText),
    { invalidate: false },
  );
}

export function useImportConfirm() {
  return useServiceMutation((preview: CsvImportPreview) => services.users.importConfirm(preview));
}

export function useAdministrators(query: UserQuery) {
  return useQuery({
    queryKey: queryKeys.administrators(query),
    queryFn: () => services.administrators.list(query),
  });
}

export function useAdministrator(administratorId: string) {
  return useQuery({
    queryKey: queryKeys.administrator(administratorId),
    queryFn: () => services.administrators.getById(administratorId),
    enabled: Boolean(administratorId),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.permissions(),
    queryFn: () => services.administrators.listPermissions(),
    staleTime: Infinity,
  });
}

export function useCreateAdministrator() {
  return useServiceMutation((input: UserInput) => services.administrators.create(input));
}

export function useUpdateAdministrator(administratorId: string) {
  return useServiceMutation((input: Omit<UserInput, "role">) =>
    services.administrators.update(administratorId, input),
  );
}

export function useSetAdministratorStatus() {
  return useServiceMutation(({ id, status }: { id: string; status: EntityStatus }) =>
    services.administrators.setStatus(id, status),
  );
}

export function useClasses(query: ClassQuery) {
  return useQuery({
    queryKey: queryKeys.classes(query),
    queryFn: () => services.classes.list(query),
  });
}

export function useClass(classId: string) {
  return useQuery({
    queryKey: queryKeys.class(classId),
    queryFn: () => services.classes.getById(classId),
    enabled: Boolean(classId),
  });
}

export function useClassOptions(organizationId: string) {
  return useQuery({
    queryKey: queryKeys.classOptions(organizationId),
    queryFn: () => services.classes.listOptions(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useCreateClass() {
  return useServiceMutation((input: ClassInput) => services.classes.create(input));
}

export function useUpdateClass(classId: string) {
  return useServiceMutation((input: Omit<ClassInput, "organizationId">) =>
    services.classes.update(classId, input),
  );
}

export function useSetClassStatus() {
  return useServiceMutation(({ id, status }: { id: string; status: EntityStatus }) =>
    services.classes.setStatus(id, status),
  );
}

export function useSections(query: SectionQuery) {
  return useQuery({
    queryKey: queryKeys.sections(query),
    queryFn: () => services.sections.list(query),
  });
}

export function useSection(sectionId: string) {
  return useQuery({
    queryKey: queryKeys.section(sectionId),
    queryFn: () => services.sections.getById(sectionId),
    enabled: Boolean(sectionId),
  });
}

export function useSectionRoster(sectionId: string) {
  return useQuery({
    queryKey: queryKeys.roster(sectionId),
    queryFn: () => services.sections.getRoster(sectionId),
    enabled: Boolean(sectionId),
  });
}

export function useCreateSection(classId: string) {
  return useServiceMutation((input: SectionInput) => services.sections.create(classId, input));
}

export function useUpdateSection(sectionId: string) {
  return useServiceMutation((input: Omit<SectionInput, "classId">) =>
    services.sections.update(sectionId, input),
  );
}

export function useSetSectionStatus() {
  return useServiceMutation(({ id, status }: { id: string; status: "ACTIVE" | "ARCHIVED" }) =>
    services.sections.setStatus(id, status),
  );
}

export function useAssignStudents(sectionId: string) {
  return useServiceMutation((studentIds: string[]) =>
    services.sections.assignStudents(sectionId, studentIds),
  );
}

export function useRemoveStudent(sectionId: string) {
  return useServiceMutation((studentId: string) =>
    services.sections.removeStudent(sectionId, studentId),
  );
}

export function useAssignTeachers(sectionId: string) {
  return useServiceMutation((teacherIds: string[]) =>
    services.sections.assignTeachers(sectionId, teacherIds),
  );
}

export function useRemoveTeacher(sectionId: string) {
  return useServiceMutation((teacherId: string) =>
    services.sections.removeTeacher(sectionId, teacherId),
  );
}

export function useBulkAssignStudents(sectionId: string) {
  return useServiceMutation(
    ({ csvText, organizationId }: { csvText: string; organizationId: string }) =>
      services.sections.bulkAssignStudents(sectionId, csvText, organizationId),
  );
}

export function useCourses(query: CourseQuery) {
  return useQuery({
    queryKey: queryKeys.courses(query),
    queryFn: () => services.courses.list(query),
  });
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: queryKeys.course(courseId),
    queryFn: () => services.courses.getById(courseId),
    enabled: Boolean(courseId),
  });
}

export function useCourseOptions() {
  return useQuery({
    queryKey: queryKeys.courseOptions(),
    queryFn: () => services.courses.listOptions(),
    staleTime: 60_000,
  });
}

export function useCreateCourse() {
  return useServiceMutation((input: CourseInput) => services.courses.create(input));
}

export function useUpdateCourse(courseId: string) {
  return useServiceMutation((input: CourseInput) => services.courses.update(courseId, input));
}

export function useSetCourseStatus() {
  return useServiceMutation(
    ({ id, status }: { id: string; status: "DRAFT" | "ACTIVE" | "ARCHIVED" }) =>
      services.courses.setStatus(id, status),
  );
}

export function useAllocations(query: AllocationQuery) {
  return useQuery({
    queryKey: queryKeys.allocations(query),
    queryFn: () => services.allocations.list(query),
  });
}

export function useAllocation(allocationId: string) {
  return useQuery({
    queryKey: queryKeys.allocation(allocationId),
    queryFn: () => services.allocations.getById(allocationId),
    enabled: Boolean(allocationId),
  });
}

export function useCreateAllocation() {
  return useServiceMutation((input: AllocationInput) => services.allocations.create(input));
}

export function useUpdateAllocation(allocationId: string) {
  return useServiceMutation((input: AllocationUpdateInput) =>
    services.allocations.update(allocationId, input),
  );
}

export function useRevokeAllocation() {
  return useServiceMutation((allocationId: string) => services.allocations.revoke(allocationId));
}

export function useInvitations(query: InvitationQuery) {
  return useQuery({
    queryKey: queryKeys.invitations(query),
    queryFn: () => services.invitations.list(query),
  });
}

export function useCreateInvitation() {
  return useServiceMutation((input: InvitationInput) => services.invitations.create(input));
}

export function useResendInvitation() {
  return useServiceMutation((invitationId: string) => services.invitations.resend(invitationId));
}

export function useRevokeInvitation() {
  return useServiceMutation((invitationId: string) => services.invitations.revoke(invitationId));
}

export function useAuditLogs(query: AuditQuery) {
  return useQuery({ queryKey: queryKeys.audit(query), queryFn: () => services.audit.list(query) });
}

export function useReports() {
  return useQuery({ queryKey: queryKeys.reports(), queryFn: () => services.reports.list() });
}

export function useReport(reportId: ReportId) {
  return useQuery({
    queryKey: queryKeys.report(reportId),
    queryFn: () => services.reports.getById(reportId),
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(),
    queryFn: () => services.dashboard.getSummary(),
  });
}

export function useStudentGrowth() {
  return useQuery({
    queryKey: queryKeys.dashboardGrowth(),
    queryFn: () => services.dashboard.getStudentGrowth(),
  });
}

export function useOrganizationDistribution() {
  return useQuery({
    queryKey: queryKeys.dashboardDistribution(),
    queryFn: () => services.dashboard.getOrganizationDistribution(),
  });
}

export function useRecentOrganizations() {
  return useQuery({
    queryKey: queryKeys.dashboardOrganizations(),
    queryFn: () => services.dashboard.getRecentOrganizations(5),
  });
}

export function useRecentInvitations() {
  return useQuery({
    queryKey: queryKeys.dashboardInvitations(),
    queryFn: () => services.dashboard.getRecentInvitations(5),
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.dashboardActivity(),
    queryFn: () => services.dashboard.getRecentActivity(8),
  });
}

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings(), queryFn: () => services.settings.get() });
}

export function useUpdateSettings() {
  return useServiceMutation((input: PlatformSettings) => services.settings.update(input));
}

export function useResetDemoData() {
  return useServiceMutation(() => services.settings.resetDemoData());
}

export function useEligibleStudents(query: UserQuery) {
  return useQuery({
    queryKey: queryKeys.eligibleStudents(query),
    queryFn: () => services.lookups.listEligibleStudents(query),
  });
}

export function useEligibleTeachers(query: UserQuery) {
  return useQuery({
    queryKey: queryKeys.eligibleTeachers(query),
    queryFn: () => services.lookups.listEligibleTeachers(query),
  });
}

export function useCurrentSession(initial: MockSession | null) {
  return React.useMemo(() => initial, [initial]);
}

export type { QueryClient };
export type { UserRole };
