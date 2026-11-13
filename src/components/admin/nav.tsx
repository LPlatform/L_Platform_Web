"use client";

import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarClock,
  ChevronDown,
  ClipboardCheck,
  Code2,
  GraduationCap,
  LayoutDashboard,
  LayoutList,
  Mail,
  School,
  ScrollText,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useOptionalSession } from "@/components/admin/session-provider";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  collapsible?: boolean;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/organizations", label: "Organizations", icon: Building2 },
    ],
  },
  {
    label: "Users",
    collapsible: true,
    items: [
      { href: "/admin/users", label: "All Users", icon: Users },
      { href: "/admin/students", label: "Students", icon: UserRound },
      { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
      { href: "/admin/administrators", label: "Administrators", icon: ShieldCheck },
      { href: "/admin/invitations", label: "Invitations", icon: Mail },
    ],
  },
  {
    label: "Academics",
    items: [
      { href: "/admin/classes", label: "Classes", icon: School },
      { href: "/admin/sections", label: "Sections", icon: LayoutList },
      { href: "/admin/courses", label: "Courses", icon: BookOpen },
      { href: "/admin/allocations", label: "Course Allocations", icon: CalendarClock },
      { href: "/admin/assessments", label: "Assessments", icon: ClipboardCheck },
      { href: "/admin/assignments", label: "Assignments", icon: Code2 },
    ],
  },
  {
    label: "Insights & System",
    items: [
      { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/settings", label: "Platform Settings", icon: Settings },
    ],
  },
];

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const DEVELOPER_ALLOWED_HREFS = new Set([
  "/admin/courses",
  "/admin/assessments",
  "/admin/settings",
]);

export function SidebarNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const sessionCtx = useOptionalSession();
  const role = sessionCtx?.session.role;
  const [usersOpen, setUsersOpen] = React.useState(true);

  const visibleGroups = React.useMemo(() => {
    if (role !== "PLATFORM_DEVELOPER") return NAV_GROUPS;
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => DEVELOPER_ALLOWED_HREFS.has(item.href)),
    })).filter((group) => group.items.length > 0);
  }, [role]);

  return (
    <nav
      aria-label="Admin navigation"
      className="flex-1 scrollbar-thin space-y-5 overflow-y-auto px-3 py-4"
    >
      {visibleGroups.map((group) => {
        const isCollapsedGroup = group.collapsible && !usersOpen && !collapsed;

        return (
          <div key={group.label} className="space-y-1">
            {!collapsed &&
              (group.collapsible ? (
                <button
                  type="button"
                  onClick={() => setUsersOpen((prev) => !prev)}
                  className="text-sidebar-muted hover:text-sidebar-foreground flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors"
                  aria-expanded={usersOpen}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-150",
                      usersOpen ? "rotate-0" : "-rotate-90",
                    )}
                    aria-hidden
                  />
                </button>
              ) : (
                <p className="text-sidebar-muted/75 px-3 pb-1 text-[11px] font-semibold tracking-[0.12em] uppercase">
                  {group.label}
                </p>
              ))}

            {!isCollapsedGroup && (
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all",
                          collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                          active
                            ? "lp-gradient-bg text-white shadow-md shadow-violet-950/40"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4 shrink-0 transition-colors",
                            active
                              ? "text-white"
                              : "text-sidebar-muted group-hover:text-sidebar-foreground",
                          )}
                          aria-hidden
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
