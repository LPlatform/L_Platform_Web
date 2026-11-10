import type {
  AcademicClass,
  AuditLog,
  Course,
  CourseAllocation,
  Invitation,
  Organization,
  PlatformSettings,
  Section,
  User,
} from "@/types";
import { seedDatabase } from "./seed";

export const MOCK_DB_KEY = "lplatform.mock.database";
export const MOCK_DB_VERSION = 2;

export interface SectionStudentRecord {
  id: string;
  sectionId: string;
  studentId: string;
  assignedAt: string;
}

export interface SectionTeacherRecord {
  id: string;
  sectionId: string;
  teacherId: string;
  assignedAt: string;
}

export interface MockDatabase {
  version: number;
  seededAt: string;
  organizations: Organization[];
  users: User[];
  classes: AcademicClass[];
  sections: Section[];
  sectionStudents: SectionStudentRecord[];
  sectionTeachers: SectionTeacherRecord[];
  courses: Course[];
  allocations: CourseAllocation[];
  invitations: Invitation[];
  auditLogs: AuditLog[];
  settings: PlatformSettings;
  sequences: Record<string, number>;
}

let cache: MockDatabase | null = null;

function readPersisted(): MockDatabase | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MOCK_DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockDatabase;
    return parsed.version === MOCK_DB_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function persistDb(): void {
  if (typeof window === "undefined" || !cache) return;
  try {
    window.localStorage.setItem(MOCK_DB_KEY, JSON.stringify(cache));
  } catch {
    // Storage can be unavailable in private browsing; the in-memory store still works.
  }
}

export function getDb(): MockDatabase {
  if (cache) return cache;
  cache = readPersisted() ?? seedDatabase();
  persistDb();
  return cache;
}

export function mutateDb<T>(mutator: (db: MockDatabase) => T): T {
  const result = mutator(getDb());
  persistDb();
  return result;
}

export function resetDb(): MockDatabase {
  cache = seedDatabase();
  persistDb();
  return cache;
}

export function nextSequence(db: MockDatabase, key: string): number {
  const next = (db.sequences[key] ?? 0) + 1;
  db.sequences[key] = next;
  return next;
}

export function nextPublicId(db: MockDatabase, key: string, prefix: string, digits = 4): string {
  const sequence = nextSequence(db, key);
  return `${prefix}-${new Date().getFullYear()}-${String(sequence).padStart(digits, "0")}`;
}

export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function correlationId(): string {
  return `cor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
