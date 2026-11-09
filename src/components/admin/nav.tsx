"use client";

import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarClock,
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
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Organization",
    items: [{ href: "/admin/organizations", label: "Organizations", icon: Building2 }],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "All users", icon: Users },
      { href: "/admin/administrators", label: "Administrators", icon: ShieldCheck },
      { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
      { href: "/admin/students", label: "Students", icon: UserRound },
      { href: "/admin/invitations", label: "Invitations", icon: Mail },
    ],
  },
  {
    label: "Academics",
    items: [
      { href: "/admin/classes", label: "Classes", icon: School },
      { href: "/admin/sections", label: "Sections", icon: LayoutList },
      { href: "/admin/courses", label: "Courses", icon: BookOpen },
      { href: "/admin/allocations", label: "Course allocations", icon: CalendarClock },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin/audit-logs", label: "Audit logs", icon: ScrollText },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin navigation"
      className="flex-1 scrollbar-thin space-y-6 overflow-y-auto px-3 py-4"
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-sidebar-muted/70 px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isNavActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="bg-sidebar-primary absolute inset-y-1.5 left-0 w-0.5 rounded-full"
                      />
                    )}
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active
                          ? "text-sidebar-primary"
                          : "text-sidebar-muted group-hover:text-sidebar-foreground",
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
