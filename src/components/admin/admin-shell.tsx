"use client";

import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { SidebarNav } from "@/components/admin/nav";
import { useSession } from "@/components/admin/session-provider";
import { Topbar } from "@/components/admin/topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/types";

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/admin/dashboard"
      className={cn(
        "focus-visible:ring-sidebar-primary/60 flex items-center gap-3 rounded-xl py-1 transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:outline-none",
        collapsed ? "justify-center px-0" : "px-1",
      )}
    >
      <span className="lp-gradient-bg flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-tight text-white shadow-md shadow-violet-950/40">
        LP
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="text-sidebar-foreground block truncate text-sm font-bold tracking-tight">
            L_Platform
          </span>
          <span className="text-sidebar-muted block text-[11px] font-medium">Admin Portal</span>
        </span>
      )}
    </Link>
  );
}

function SidebarContent({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const { session } = useSession();

  return (
    <>
      <div
        className={cn(
          "border-sidebar-border flex h-16 shrink-0 items-center border-b",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <Brand collapsed={collapsed} />
      </div>

      <SidebarNav onNavigate={onNavigate} collapsed={collapsed} />

      <div className="border-sidebar-border shrink-0 space-y-2 border-t p-3">
        <Link
          href="/admin/settings"
          onClick={onNavigate}
          title={collapsed ? `${session.name} (${ROLE_LABELS[session.role]})` : undefined}
          className={cn(
            "border-sidebar-border bg-sidebar-accent/70 hover:bg-sidebar-accent flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
            collapsed && "justify-center p-2",
          )}
        >
          <span className="lp-gradient-bg flex size-8 shrink-0 items-center justify-center rounded-lg text-white">
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="text-sidebar-foreground block truncate text-xs font-semibold">
                {ROLE_LABELS[session.role]}
              </span>
              <span className="text-sidebar-muted block truncate text-[11px]">
                {session.role === "PLATFORM_OWNER" ||
                session.role === "PLATFORM_DEVELOPER" ||
                session.role === "PLATFORM_ADMIN"
                  ? "Global administration"
                  : session.email}
              </span>
            </span>
          )}
        </Link>

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

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="bg-background min-h-dvh">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-lg px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <aside
        className={cn(
          "border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col border-r transition-[width] duration-200 lg:flex",
          collapsed ? "w-[76px]" : "w-[260px]",
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent className="flex flex-col">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding-left] duration-200",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]",
        )}
      >
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main
          id="main-content"
          className="page-container w-full min-w-0 flex-1 overflow-x-hidden py-6 lg:py-8"
        >
          {children}
        </main>
        <footer className="page-container pt-2 pb-6">
          <p className="text-muted-foreground text-xs">
            L_Platform · Multi-Tenant Educational Learning & Programming Platform
          </p>
        </footer>
      </div>
    </div>
  );
}
