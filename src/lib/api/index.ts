// Single swap point for the data layer. Pages and hooks import `services` from here;
// replacing the mock adapter with generated OpenAPI clients later must not touch UI code.
export { services } from "./backend-services";
export { authService, DEMO_ACCOUNTS } from "./auth.service";
export type { MockSession } from "../mock/session";
export { clearSessionCookie } from "../mock/session";
export type {
  AdministratorService,
  AllocationService,
  AuditService,
  ClassService,
  CourseService,
  DashboardService,
  InvitationService,
  OrganizationService,
  PlatformServices,
  ReportsService,
  SectionService,
  SettingsService,
  UserLookupService,
  UserService,
} from "./contracts";
export { ApiError, ERROR_CODES, getErrorMessage, isApiError } from "./errors";
export { configureMockApi, getMockFailureRate, setMockFailureRate } from "./delay";
export { resetDb } from "../mock/db";
