"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Code2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { useSession } from "@/components/admin/session-provider";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import { UserAvatar } from "@/components/admin/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { backendRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/types";

interface TeacherNavGroup {
  label: string;
  items: Array<{ href: string; label: string; icon: LucideIcon }>;
}

const TEACHER_NAV_GROUPS: TeacherNavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Classroom",
    items: [
      { href: "/teacher/sections", label: "My Classes", icon: Users },
      { href: "/teacher/students", label: "Students", icon: UserRound },
      { href: "/teacher/courses", label: "Courses", icon: BookOpen },
      { href: "/teacher/ai-readiness", label: "Lesson Manager", icon: Sparkles },
    ],
  },
  {
    label: "Authoring & Grading",
    items: [
      { href: "/teacher/questions", label: "Question Bank", icon: Code2 },
      { href: "/teacher/assessments", label: "Assessments", icon: ClipboardCheck },
      { href: "/teacher/assignments", label: "Assignments", icon: GraduationCap },
      { href: "/teacher/submissions", label: "Submissions", icon: CheckCircle2 },
    ],
  },
  {
    label: "Insights",
    items: [{ href: "/teacher/reports", label: "Reports", icon: BarChart3 }],
  },
];

function TeacherBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/teacher/dashboard"
      className={cn(
        "flex items-center gap-3 rounded-md py-1 transition-opacity hover:opacity-95",
        collapsed ? "justify-center px-0" : "px-1",
      )}
    >
      <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-bold tracking-tight">
        LP
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="text-sidebar-foreground block truncate text-sm font-bold tracking-tight">
            L Platform
          </span>
          <span className="text-sidebar-muted block text-[11px] font-medium">Teacher Portal</span>
        </span>
      )}
    </Link>
  );
}

function TeacherSidebarContent({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
  onSignOut,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  onSignOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const { session } = useSession();

  return (
    <>
      <div
        className={cn(
          "border-sidebar-border flex h-16 shrink-0 items-center border-b",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <TeacherBrand collapsed={collapsed} />
      </div>

      <nav
        aria-label="Teacher navigation"
        className="flex-1 scrollbar-thin space-y-5 overflow-y-auto px-3 py-4"
      >
        {TEACHER_NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p className="text-sidebar-muted/75 px-3 pb-1 text-[11px] font-semibold tracking-[0.12em] uppercase">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-md text-sm font-medium transition-all",
                        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                        active
                          ? "bg-sidebar-accent before:bg-sidebar-primary text-white before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active
                            ? "text-sidebar-primary"
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
          </div>
        ))}
      </nav>

      <div className="border-sidebar-border shrink-0 space-y-2 border-t p-3">
        <div
          className={cn(
            "border-sidebar-border bg-sidebar-accent/70 flex items-center gap-2.5 rounded-md border p-2.5",
            collapsed && "justify-center p-2",
          )}
        >
          <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
            <GraduationCap className="size-4" aria-hidden />
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sidebar-foreground truncate text-xs font-semibold">
                {session.name}
              </p>
              <p className="text-sidebar-muted truncate text-[11px]">{ROLE_LABELS[session.role]}</p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void onSignOut()}
              title="Sign out"
              className="text-sidebar-muted hover:text-sidebar-foreground shrink-0"
            >
              <LogOut className="size-4" />
            </Button>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              collapsed && "justify-center px-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="size-4" aria-hidden />
            ) : (
              <>
                <ChevronLeft className="size-4" aria-hidden />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
}

export function TeacherShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, signOut } = useSession();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [pendingReviews, setPendingReviews] = React.useState<
    Array<{ attemptId: string; assessmentTitle: string; answerId: string }>
  >([]);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    let active = true;
    backendRequest<Array<{ attemptId: string; assessmentTitle: string; answerId: string }>>(
      "/api/teacher/assessment-reviews",
    )
      .then((rows) => {
        if (active && Array.isArray(rows)) setPendingReviews(rows);
      })
      .catch(() => {
        /* ignore when not TEACHER role or unauthenticated */
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out.");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/teacher/students?q=${encodeURIComponent(q)}` : "/teacher/students");
  }

  const [firstName = "", ...restName] = session.name.split(" ");
  const lastName = restName.join(" ");

  return (
    <div className="bg-background min-h-dvh">
      <aside
        className={cn(
          "border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col border-r transition-[width] duration-200 lg:flex",
          collapsed ? "w-[76px]" : "w-[260px]",
        )}
      >
        <TeacherSidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onSignOut={handleSignOut}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent className="flex flex-col">
          <TeacherSidebarContent
            onNavigate={() => setMobileOpen(false)}
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding-left] duration-200",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]",
        )}
      >
        <header className="border-border/80 bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="border-primary/30 bg-primary/10 text-primary rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                Teacher Portal
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <form onSubmit={handleSearch} className="relative hidden md:block" role="search">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students..."
                  aria-label="Search students"
                  className="bg-secondary/70 border-border/80 h-9 w-56 pr-16 pl-9 text-xs lg:w-72"
                />
                <kbd className="border-border bg-card text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded-md border px-1.5 py-0.5 text-[10px] font-medium">
                  Ctrl K
                </kbd>
              </form>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Notifications"
                  >
                    <Bell className="size-4" />
                    {pendingReviews.length > 0 && (
                      <span
                        aria-hidden
                        className="bg-primary ring-background absolute top-2 right-2 size-1.5 rounded-full ring-2"
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="border-border flex items-center justify-between border-b px-4 py-3">
                    <p className="text-sm font-semibold">Pending Assessment Reviews</p>
                    <span className="text-muted-foreground text-xs">{pendingReviews.length}</span>
                  </div>
                  {pendingReviews.length === 0 ? (
                    <div className="text-muted-foreground px-4 py-5 text-xs">
                      No written answers awaiting rubric grading.
                    </div>
                  ) : (
                    <ul className="divide-border divide-y">
                      {pendingReviews.slice(0, 5).map((item) => (
                        <li key={item.answerId} className="px-4 py-2.5 text-xs">
                          <p className="text-foreground font-medium">{item.assessmentTitle}</p>
                          <p className="text-muted-foreground">Attempt {item.attemptId}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="border-border border-t px-4 py-2.5">
                    <Link
                      href="/teacher/assessments"
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      Open assessments →
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>

              <ThemeToggle />

              <div className="bg-border mx-1 hidden h-6 w-px sm:block" aria-hidden />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="hover:bg-accent flex items-center gap-2 rounded-md p-1 pr-2 text-left transition-colors"
                    aria-label="Account menu"
                  >
                    <UserAvatar firstName={firstName} lastName={lastName || firstName} size="sm" />
                    <span className="hidden min-w-0 sm:block">
                      <span className="block max-w-[140px] truncate text-sm font-medium">
                        {session.name}
                      </span>
                      <span className="text-muted-foreground block text-[11px]">
                        {ROLE_LABELS[session.role]}
                      </span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <span className="block text-sm font-medium">{session.name}</span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {session.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push("/teacher/reports")}>
                    <BarChart3 />
                    Reports
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={() => void handleSignOut()}>
                    <LogOut />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="page-container w-full flex-1 py-6 lg:py-8">{children}</main>
        <footer className="page-container pt-2 pb-6">
          <p className="text-muted-foreground text-xs">L Platform · Teacher console</p>
        </footer>
      </div>
    </div>
  );
}
