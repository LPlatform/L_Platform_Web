import type { PlatformServices } from "../../api/contracts";
import { administratorService } from "./administrator.service";
import { allocationService } from "./allocations.service";
import { auditService } from "./audit.service";
import { classService } from "./classes.service";
import { courseService } from "./courses.service";
import { dashboardService } from "./dashboard.service";
import { invitationService } from "./invitations.service";
import { organizationService } from "./organization.service";
import { reportsService } from "./reports.service";
import { sectionService } from "./sections.service";
import { settingsService } from "./settings.service";
import { userLookupService, userService } from "./users.service";

export const services: PlatformServices = {
  organizations: organizationService,
  users: userService,
  administrators: administratorService,
  classes: classService,
  sections: sectionService,
  courses: courseService,
  allocations: allocationService,
  invitations: invitationService,
  reports: reportsService,
  audit: auditService,
  dashboard: dashboardService,
  settings: settingsService,
  lookups: userLookupService,
};

export { authService, DEMO_ACCOUNTS } from "../../api/auth.service";
export type { MockSession } from "../session";
