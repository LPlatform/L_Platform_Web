export type ReportId =
  | "organization-students"
  | "organization-teachers"
  | "class-distribution"
  | "allocation-statistics"
  | "onboarding-statistics"
  | "organization-status";

export interface ReportRow {
  key: string;
  label: string;
  secondary?: string;
  values: Record<string, number | string>;
}

export interface ReportDefinition {
  id: ReportId;
  title: string;
  description: string;
  columns: Array<{ key: string; label: string; align?: "left" | "right" }>;
  rows: ReportRow[];
  generatedAt: string;
}

export interface OnboardingPoint {
  month: string;
  students: number;
  teachers: number;
}

export interface DashboardSummary {
  totalOrganizations: number;
  activeOrganizations: number;
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalCourses: number;
  pendingInvitations: number;
  totalAllocations: number;
  activeAllocations: number;
}

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
}
