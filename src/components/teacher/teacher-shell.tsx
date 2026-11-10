"use client";

import {
  BookOpen,
  CheckCircle2,
  Code2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useSession } from "@/components/admin/session-provider";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import { UserAvatar } from "@/components/admin/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TEACHER_NAV = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/sections", label: "My Sections", icon: Users },
  { href: "/teacher/questions", label: "Question Bank", icon: Code2 },
  { href: "/teacher/assignments", label: "Assignments", icon: BookOpen },
  { href: "/teacher/submissions", label: "Submissions", icon: CheckCircle2 },
];

export function TeacherShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, signOut } = useSession();

  const [firstName = "", ...restName] = session.name.split(" ");
  const lastName = restName.join(" ");

  return (
    <div className="bg-background flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-64 shrink-0 flex-col border-r md:flex">
        {/* Brand */}
        <div className="border-sidebar-border flex h-16 shrink-0 items-center border-b px-4">
          <Link href="/teacher/dashboard" className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <span className="text-sidebar-foreground block truncate text-sm font-semibold tracking-tight">
                L_Platform
              </span>
              <span className="block text-[11px] font-medium tracking-[0.16em] text-emerald-500 uppercase">
                Teacher portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {TEACHER_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-emerald-500" : "text-sidebar-muted",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & logout */}
        <div className="border-sidebar-border border-t p-3">
          <div className="flex items-center justify-between rounded-lg px-2 py-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <UserAvatar firstName={firstName} lastName={lastName} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{session.name}</p>
                <p className="text-muted-foreground truncate text-[11px]">{session.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={signOut}
              title="Sign out"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="border-border bg-background/80 flex h-16 shrink-0 items-center justify-between border-b px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold md:text-lg">Teacher Workspace</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
