import type {
  AcademicClass,
  AcademicClassWithStats,
  AllocationInput,
  AllocationQuery,
  AllocationUpdateInput,
  AuditLog,
  AuditQuery,
  ChartPoint,
  ClassInput,
  ClassQuery,
  Course,
  CourseAllocationSummary,
  CourseDetails,
  CourseInput,
  CourseQuery,
  CsvImportPreview,
  CsvImportResult,
  DashboardSummary,
  EntityStatus,
  Invitation,
  InvitationInput,
  InvitationQuery,
  OnboardingPoint,
  Organization,
  OrganizationInput,
  OrganizationQuery,
  OrganizationUpdateInput,
  OrganizationWithStats,
  PageQuery,
  Paginated,
  PlatformPermission,
  PlatformSettings,
  ReportDefinition,
  ReportId,
  Section,
  SectionInput,
  SectionQuery,
  SectionRoster,
  SectionWithStats,
  User,
  UserInput,
  UserQuery,
  UserRole,
  UserWithOrganization,
} from "@/types";

export interface OrganizationService {
  list(query?: OrganizationQuery): Promise<Paginated<OrganizationWithStats>>;
  getById(organizationId: string): Promise<OrganizationWithStats>;
  listOptions(): Promise<Organization[]>;
  create(input: OrganizationInput): Promise<Organization>;
  update(organizationId: string, input: OrganizationUpdateInput): Promise<Organization>;
  setStatus(organizationId: string, status: EntityStatus): Promise<Organization>;
}

export interface UserService {
  list(query?: UserQuery): Promise<Paginated<UserWithOrganization>>;
  getById(userId: string): Promise<UserWithOrganization>;
  create(input: UserInput): Promise<User>;
  update(userId: string, input: Omit<UserInput, "role">): Promise<User>;
  setStatus(userId: string, status: EntityStatus): Promise<User>;
  importPreview(fileName: string, csvText: string): Promise<CsvImportPreview>;
  importConfirm(preview: CsvImportPreview): Promise<CsvImportResult>;
}

export interface AdministratorService {
  list(query?: UserQuery): Promise<Paginated<UserWithOrganization>>;
  getById(administratorId: string): Promise<UserWithOrganization>;
  create(input: UserInput): Promise<User>;
  update(administratorId: string, input: Omit<UserInput, "role">): Promise<User>;
  setStatus(administratorId: string, status: EntityStatus): Promise<User>;
  listPermissions(): Promise<PlatformPermission[]>;
}

export interface ClassService {
  list(query?: ClassQuery): Promise<Paginated<AcademicClassWithStats>>;
  getById(classId: string): Promise<AcademicClassWithStats>;
  listOptions(organizationId: string): Promise<AcademicClass[]>;
  create(input: ClassInput): Promise<AcademicClass>;
  update(classId: string, input: Omit<ClassInput, "organizationId">): Promise<AcademicClass>;
  setStatus(classId: string, status: EntityStatus): Promise<AcademicClass>;
}

export interface SectionService {
  list(query?: SectionQuery): Promise<Paginated<SectionWithStats>>;
  getById(sectionId: string): Promise<SectionWithStats>;
  getRoster(sectionId: string): Promise<SectionRoster>;
  create(classId: string, input: SectionInput): Promise<Section>;
  update(sectionId: string, input: Omit<SectionInput, "classId">): Promise<Section>;
  setStatus(sectionId: string, status: "ACTIVE" | "ARCHIVED"): Promise<Section>;
  assignStudents(
    sectionId: string,
    studentIds: string[],
  ): Promise<{ assigned: number; skipped: number }>;
  removeStudent(sectionId: string, studentId: string): Promise<void>;
  assignTeachers(
    sectionId: string,
    teacherIds: string[],
  ): Promise<{ assigned: number; skipped: number }>;
  removeTeacher(sectionId: string, teacherId: string): Promise<void>;
  bulkAssignStudents(
    sectionId: string,
    csvText: string,
    organizationId: string,
  ): Promise<{ assigned: number; skipped: number; errors: string[] }>;
}

export interface CourseService {
  list(query?: CourseQuery): Promise<Paginated<Course>>;
  getById(courseId: string): Promise<CourseDetails>;
  listOptions(): Promise<Course[]>;
  create(input: CourseInput): Promise<Course>;
  update(courseId: string, input: CourseInput): Promise<Course>;
  setStatus(courseId: string, status: Course["status"]): Promise<Course>;
}

export interface AllocationService {
  list(query?: AllocationQuery): Promise<Paginated<CourseAllocationSummary>>;
  getById(allocationId: string): Promise<CourseAllocationSummary>;
  create(input: AllocationInput): Promise<CourseAllocationSummary>;
  update(allocationId: string, input: AllocationUpdateInput): Promise<CourseAllocationSummary>;
  revoke(allocationId: string): Promise<CourseAllocationSummary>;
}

export interface InvitationService {
  list(query?: InvitationQuery): Promise<Paginated<Invitation>>;
  create(input: InvitationInput): Promise<Invitation>;
  resend(invitationId: string): Promise<Invitation>;
  revoke(invitationId: string): Promise<Invitation>;
}

export interface AuditService {
  list(query?: AuditQuery): Promise<Paginated<AuditLog>>;
}

export interface ReportsService {
  list(): Promise<ReportDefinition[]>;
  getById(reportId: ReportId): Promise<ReportDefinition>;
  getOnboardingSeries(): Promise<OnboardingPoint[]>;
}

export interface DashboardService {
  getSummary(): Promise<DashboardSummary>;
  getStudentGrowth(): Promise<ChartPoint[]>;
  getOrganizationDistribution(): Promise<ChartPoint[]>;
  getRecentOrganizations(limit?: number): Promise<Organization[]>;
  getRecentInvitations(limit?: number): Promise<Invitation[]>;
  getRecentActivity(limit?: number): Promise<AuditLog[]>;
}

export interface SettingsService {
  get(): Promise<PlatformSettings>;
  update(input: PlatformSettings): Promise<PlatformSettings>;
  resetDemoData(): Promise<void>;
}

export interface UserLookupService {
  listEligibleStudents(query?: UserQuery): Promise<Paginated<UserWithOrganization>>;
  listEligibleTeachers(query?: UserQuery): Promise<Paginated<UserWithOrganization>>;
  listByOrganization(
    organizationId: string,
    role: UserRole,
    query?: PageQuery,
  ): Promise<Paginated<UserWithOrganization>>;
}

export interface PlatformServices {
  organizations: OrganizationService;
  users: UserService;
  administrators: AdministratorService;
  classes: ClassService;
  sections: SectionService;
  courses: CourseService;
  allocations: AllocationService;
  invitations: InvitationService;
  reports: ReportsService;
  audit: AuditService;
  dashboard: DashboardService;
  settings: SettingsService;
  lookups: UserLookupService;
}
